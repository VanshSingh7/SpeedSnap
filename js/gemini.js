// SpeedSnap - Gemini AI Diagnostic Module
const SpeedSnapAI = (() => {
  let currentResult = null;

  // Converts plain text and markdown from Gemini into clean HTML
  function formatMarkdown(text) {
    if (!text) return '';
    return `<div class="ai-diagnostic-rendered">${text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^###\s*(.+)$/gm, '<h4 class="ai-h3">$1</h4>')
      .replace(/^[-*]\s+(.+)$/gm, '<li class="ai-li">$1</li>')
      .split(/\n+/)
      .map(l => {
        const s = l.trim();
        if (!s) return '';
        return s.startsWith('<h4') || s.startsWith('<li') ? s : `<p class="ai-p">${s}</p>`;
      })
      .filter(Boolean)
      .join('')}</div>`;
  }

  // Prompts user to enter Gemini API key when none is saved
  function renderKeyPrompt(result) {
    const content = document.getElementById('aiModalContent');
    if (!content) return;
    content.innerHTML = `
      <div class="ai-error-box key-prompt-box">
        <h4>🔑 Enter Gemini API Key</h4>
        <p>SpeedSnap sends speed metrics to Google Gemini for network optimization tips. Enter your API key below:</p>
        <div class="ai-key-input-row">
          <input type="password" id="promptKeyInput" class="ai-key-input" placeholder="Paste API Key (AIzaSy...)" autocomplete="off" />
          <button id="promptSaveBtn" class="action-button primary-action">Save & Analyze</button>
        </div>
        <div class="ai-key-hint">
          <span>Saved locally in browser.</span> · 
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get free API key &rarr;</a>
        </div>
      </div>`;

    const save = () => {
      const key = document.getElementById('promptKeyInput')?.value.trim();
      if (!key) return alert('Please enter your Gemini API key.');
      SPEEDSNAP_CONFIG.setApiKey(key);
      runAiAnalysis(result);
    };
    document.getElementById('promptSaveBtn')?.addEventListener('click', save);
    document.getElementById('promptKeyInput')?.addEventListener('keydown', e => e.key === 'Enter' && save());
  }

  // Calls Google Gemini REST API with speed test metrics
  async function runAiAnalysis(result) {
    const content = document.getElementById('aiModalContent');
    if (!content) return;

    const apiKey = await SPEEDSNAP_CONFIG.getApiKey();
    if (!apiKey) return renderKeyPrompt(result);

    // Simple loading spinner
    content.innerHTML = `
      <div class="ai-loading-state">
        <div class="ai-spinner"></div>
        <p>Analyzing network telemetry with Gemini AI...</p>
      </div>`;

    const model = SPEEDSNAP_CONFIG.ai?.model || 'gemini-3.1-flash-lite';
    const prompt = `Act as an expert network engineer. Analyze this internet speed test result:\n- Download: ${result.downloadSpeed} Mbps\n- Upload: ${result.uploadSpeed} Mbps\n- Idle Latency: ${result.latency} ms\n- Jitter: ${result.jitter} ms\n- Bufferbloat: ${result.bufferbloat}\n\nProvide 3 concise, practical tips to improve connection stability, Wi-Fi performance, and bufferbloat. Format each tip as:\n### [Number]. [Title]\n[Explanation]`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      content.innerHTML = text ? formatMarkdown(text) : '<p>No suggestions returned.</p>';
    } catch (err) {
      content.innerHTML = `
        <div class="ai-error-box">
          <h4>Diagnosis Failed</h4>
          <p>${err.message}</p>
          <button id="retryKeyBtn" class="action-button primary-action" style="margin-top:8px;">Change API Key</button>
        </div>`;
      document.getElementById('retryKeyBtn')?.addEventListener('click', () => renderKeyPrompt(result));
    }
  }

  // Opens the modal and displays test metrics snapshot
  async function openDiagnosis(result) {
    currentResult = result;
    const backdrop = document.getElementById('aiModalBackdrop');
    const strip = document.getElementById('aiTelemetryStrip');
    if (!backdrop) return;
    backdrop.classList.add('active');

    if (strip && result) {
      const metrics = [
        ['DL', `${result.downloadSpeed || 0} Mbps`, 'chip-down'],
        ['UL', `${result.uploadSpeed || 0} Mbps`, 'chip-up'],
        ['Ping', `${result.latency || 0} ms`, 'chip-ping'],
        ['Jitter', `${result.jitter || 0} ms`, 'chip-jitter'],
        ['Bloat', result.bufferbloat || '—', 'chip-bloat']
      ];
      strip.innerHTML = metrics.map(([label, val, cls]) =>
        `<span class="snapshot-chip ${cls}"><span class="chip-label">${label}</span><strong>${val}</strong></span>`
      ).join('');
    }

    (await SPEEDSNAP_CONFIG.getApiKey()) ? runAiAnalysis(result) : renderKeyPrompt(result);
  }

  // Setup modal close, copy and key configuration buttons
  function init() {
    const backdrop = document.getElementById('aiModalBackdrop');
    const configBar = document.getElementById('aiKeyConfigBar');

    document.getElementById('closeAiModalBtn')?.addEventListener('click', () => backdrop?.classList.remove('active'));
    backdrop?.addEventListener('click', e => { if (e.target === backdrop) backdrop.classList.remove('active'); });

    document.getElementById('copyAiAdviceBtn')?.addEventListener('click', function() {
      const text = document.getElementById('aiModalContent')?.innerText;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const prev = this.textContent;
        this.textContent = 'Copied!';
        setTimeout(() => (this.textContent = prev), 1500);
      });
    });

    document.getElementById('configAiKeyBtn')?.addEventListener('click', () => {
      if (!configBar) return;
      configBar.style.display = configBar.style.display === 'none' || !configBar.style.display ? 'flex' : 'none';
    });

    document.getElementById('saveAiKeyBtn')?.addEventListener('click', () => {
      const key = document.getElementById('geminiApiKeyInput')?.value.trim();
      if (!key) return alert('Please enter a valid Gemini API key.');
      SPEEDSNAP_CONFIG.setApiKey(key);
      if (configBar) configBar.style.display = 'none';
      if (currentResult) runAiAnalysis(currentResult);
    });
  }

  return { init, openDiagnosis };
})();

document.addEventListener('DOMContentLoaded', SpeedSnapAI.init);
