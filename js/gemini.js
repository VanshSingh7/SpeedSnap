// SpeedSnap - Gemini AI Diagnostic Module
const SpeedSnapAI = (() => {
  let currentResult = null;

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^###\s*(.+)$/gm, '<h4 class="ai-h3">$1</h4>')
      .replace(/^[-*]\s+(.+)$/gm, '<li class="ai-li">$1</li>')
      .split(/\n+/)
      .map(l => (l.startsWith('<h4') || l.startsWith('<li') ? l : `<p class="ai-p">${l}</p>`))
      .join('');
  }

  // Resolve API key: Personal key > Free trial (.env) > Quota check
  async function resolveKey() {
    const userKey = (localStorage.getItem('speedsnap_gemini_api_key') || '').trim();
    if (userKey) return { key: userKey, isFree: false };

    const used = parseInt(localStorage.getItem('speedsnap_free_ai_used') || '0', 10);
    if (used >= 3) return { key: '', isFree: false, quotaExceeded: true };

    const envKey = await SPEEDSNAP_CONFIG.getEnvKey();
    if (envKey) return { key: envKey, isFree: true, remaining: 3 - used };

    return { key: '', isFree: false };
  }

  function renderKeyPrompt(result, quotaExceeded = false) {
    const content = document.getElementById('aiModalContent');
    if (!content) return;

    content.innerHTML = `
      <div class="ai-error-box key-prompt-box">
        <h4>${quotaExceeded ? '🔒 Free Trial Complete (3/3 Used)' : '🔑 Enter Gemini API Key'}</h4>
        <p>${quotaExceeded ? 'You have used all 3 free suggestions. Enter your personal Gemini API key to continue:' : 'Enter your Gemini API key below:'}</p>
        <div class="ai-key-input-row">
          <input type="password" id="promptKeyInput" class="ai-key-input" placeholder="Paste Gemini API key (AIzaSy...)" autocomplete="off" />
          <button id="promptSaveBtn" class="action-button primary-action">Save & Analyze</button>
        </div>
        <div class="ai-key-hint">
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get free API key from Google AI Studio &rarr;</a>
        </div>
      </div>`;

    const save = () => {
      const key = document.getElementById('promptKeyInput')?.value.trim();
      if (!key) return alert('Please enter your Gemini API key.');
      localStorage.setItem('speedsnap_gemini_api_key', key);
      runAiAnalysis(result);
    };
    document.getElementById('promptSaveBtn')?.addEventListener('click', save);
    document.getElementById('promptKeyInput')?.addEventListener('keydown', e => e.key === 'Enter' && save());
    document.getElementById('promptKeyInput')?.focus();
  }

  async function runAiAnalysis(result) {
    const content = document.getElementById('aiModalContent');
    if (!content) return;

    const auth = await resolveKey();
    if (auth.quotaExceeded || !auth.key) return renderKeyPrompt(result, auth.quotaExceeded);

    content.innerHTML = `
      <div class="ai-loading-state">
        <div class="ai-spinner"></div>
        <p>Analyzing network telemetry with Gemini AI... ${auth.isFree ? `(Free: ${auth.remaining} left)` : ''}</p>
      </div>`;

    const prompt = `Act as an expert network engineer. Analyze this internet speed test result:\n- Download: ${result.downloadSpeed} Mbps\n- Upload: ${result.uploadSpeed} Mbps\n- Idle Latency: ${result.latency} ms\n- Jitter: ${result.jitter} ms\n- Bufferbloat: ${result.bufferbloat}\n\nProvide 3 concise, practical tips to improve connection stability, Wi-Fi performance, and bufferbloat. Format each tip as:\n### [Number]. [Title]\n[Explanation]`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${SPEEDSNAP_CONFIG.ai.model}:generateContent?key=${auth.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');

      let remaining = auth.remaining;
      if (auth.isFree) {
        const used = parseInt(localStorage.getItem('speedsnap_free_ai_used') || '0', 10) + 1;
        localStorage.setItem('speedsnap_free_ai_used', used);
        remaining = Math.max(0, 3 - used);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const quotaBadge = auth.isFree
        ? `<div class="ai-quota-badge">🎁 Free trial: <strong>${remaining} of 3 free suggestions remaining</strong></div>`
        : `<div class="ai-quota-badge">⚡ Personal API Key active</div>`;

      content.innerHTML = (text ? formatMarkdown(text) : '<p>No suggestions returned.</p>') + quotaBadge;
    } catch (err) {
      content.innerHTML = `
        <div class="ai-error-box">
          <h4>Diagnosis Failed</h4>
          <p>${err.message}</p>
          <button id="retryKeyBtn" class="action-button primary-action">Enter / Update Key</button>
        </div>`;
      document.getElementById('retryKeyBtn')?.addEventListener('click', () => renderKeyPrompt(result, false));
    }
  }

  async function openDiagnosis(result) {
    currentResult = result;
    const backdrop = document.getElementById('aiModalBackdrop');
    const strip = document.getElementById('aiTelemetryStrip');
    if (!backdrop) return;
    backdrop.classList.add('active');

    if (strip && result) {
      strip.innerHTML = [
        ['DL', `${result.downloadSpeed || 0} Mbps`, 'chip-down'],
        ['UL', `${result.uploadSpeed || 0} Mbps`, 'chip-up'],
        ['Ping', `${result.latency || 0} ms`, 'chip-ping'],
        ['Jitter', `${result.jitter || 0} ms`, 'chip-jitter'],
        ['Bloat', result.bufferbloat || '—', 'chip-bloat']
      ].map(([label, val, cls]) => `<span class="snapshot-chip ${cls}"><span class="chip-label">${label}</span><strong>${val}</strong></span>`).join('');
    }

    runAiAnalysis(result);
  }

  function init() {
    const backdrop = document.getElementById('aiModalBackdrop');
    const configBar = document.getElementById('aiKeyConfigBar');

    document.getElementById('closeAiModalBtn')?.addEventListener('click', () => backdrop?.classList.remove('active'));
    backdrop?.addEventListener('click', e => { if (e.target === backdrop) backdrop.classList.remove('active'); });

    document.getElementById('copyAiAdviceBtn')?.addEventListener('click', function() {
      const text = document.getElementById('aiModalContent')?.innerText;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => (this.textContent = 'Copy'), 1500);
      });
    });

    document.getElementById('configAiKeyBtn')?.addEventListener('click', () => {
      if (!configBar) return;
      configBar.style.display = configBar.style.display === 'flex' ? 'none' : 'flex';
      const keyInput = document.getElementById('geminiApiKeyInput');
      if (keyInput) keyInput.value = localStorage.getItem('speedsnap_gemini_api_key') || '';
    });

    document.getElementById('saveAiKeyBtn')?.addEventListener('click', () => {
      const key = document.getElementById('geminiApiKeyInput')?.value.trim();
      if (key) localStorage.setItem('speedsnap_gemini_api_key', key);
      else localStorage.removeItem('speedsnap_gemini_api_key');
      if (configBar) configBar.style.display = 'none';
      if (currentResult) runAiAnalysis(currentResult);
    });
  }

  return { init, openDiagnosis };
})();

document.addEventListener('DOMContentLoaded', SpeedSnapAI.init);
