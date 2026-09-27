// SpeedSnap - Gemini AI Network Diagnostic Module (CSE Sem 5 Project)
const SpeedSnapAI = (() => {
  // Convert markdown and numbered responses to clean structured HTML
  function formatMarkdown(text) {
    if (!text) return '';
    let t = text
      .replace(/([.\?!])\s*(\d+)\.\s*(?=[A-Z])/g, '$1\n\n### $2. ')
      .replace(/(?:^|\n)\s*(\d+)\.\s*\n+/g, '\n\n### $1. ')
      .replace(/(?:^|\n)\s*(\d+)\.\s+([A-Z])/g, '\n\n### $1. $2')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;">$1</strong>')
      .replace(/^\*\s*(.*$)/gim, '<li style="margin-left:20px;color:#e5e5e5;line-height:1.6;">$1</li>')
      .replace(/^-\s*(.*$)/gim, '<li style="margin-left:20px;color:#e5e5e5;line-height:1.6;">$1</li>');

    const blocks = t.split(/\n\s*\n/).filter(Boolean);
    return blocks.map(b => {
      const s = b.trim();
      if (s.startsWith('###')) {
        const m = s.match(/^###\s*(.*?)(\n+[\s\S]*)?$/);
        if (m) {
          const h = `<h4 style="margin:16px 0 6px;color:#60a5fa;font-size:1.02rem;font-weight:600;">${m[1].trim()}</h4>`;
          const body = m[2] ? `<p style="margin:0 0 12px;line-height:1.65;color:#d1d5db;">${m[2].trim().replace(/\n/g, '<br>')}</p>` : '';
          return h + body;
        }
      }
      if (s.startsWith('<li')) return s;
      return `<p style="margin:0 0 12px;line-height:1.65;color:#d1d5db;">${s.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  // Open modal and fetch AI suggestion
  async function openDiagnosis(result) {
    const backdrop = document.getElementById('aiModalBackdrop');
    const content = document.getElementById('aiModalContent');
    const telemetry = document.getElementById('aiTelemetryStrip');
    if (!backdrop || !content) return;

    backdrop.classList.add('active');
    content.innerHTML = '<div style="padding:32px;text-align:center;color:#888;">Analyzing network metrics...</div>';

    if (telemetry && result) {
      telemetry.innerHTML = `<span>DL: <b>${result.downloadSpeed || 0} Mbps</b></span> · <span>UL: <b>${result.uploadSpeed || 0} Mbps</b></span> · <span>Ping: <b>${result.latency || 0} ms</b></span> · <span>Jitter: <b>${result.jitter || 0} ms</b></span>`;
    }

    let apiKey = SPEEDSNAP_CONFIG.ai?.geminiApiKey;
    if (!apiKey) {
      try {
        const res = await fetch('.env');
        if (res.ok) {
          const match = (await res.text()).match(/GEMINI_API_KEY\s*=\s*(.+)/);
          if (match) apiKey = SPEEDSNAP_CONFIG.ai.geminiApiKey = match[1].trim();
        }
      } catch (e) {}
    }
    if (!apiKey) {
      content.innerHTML = '<p style="color:#f87171;">Gemini API key is not configured in .env.</p>';
      return;
    }

    const prompt = `Act as a network engineer. Analyze this internet speed test: Download: ${result.downloadSpeed} Mbps, Upload: ${result.uploadSpeed} Mbps, Latency: ${result.latency} ms, Jitter: ${result.jitter} ms, Bufferbloat: ${result.bufferbloat}. Provide 3 concise, practical tips to improve connection stability and speed. Format each tip as:\n### [Number]. [Title]\n[Explanation]`;
    const model = SPEEDSNAP_CONFIG.ai?.model || 'gemini-3.1-flash-lite';

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      const parts = data.candidates?.[0]?.content?.parts || [];
      const answer = parts.map(p => p.text || '').join('');
      content.innerHTML = answer ? formatMarkdown(answer) : '<p style="color:#f87171;">No suggestions returned from AI.</p>';
    } catch (err) {
      content.innerHTML = `<p style="color:#f87171;">Failed to connect to Gemini API: ${err.message}</p>`;
    }
  }

  // Setup modal close and copy handlers
  function init() {
    const backdrop = document.getElementById('aiModalBackdrop');
    const closeBtn = document.getElementById('closeAiModalBtn');
    const copyBtn = document.getElementById('copyAiAdviceBtn');
    if (closeBtn) closeBtn.onclick = () => backdrop.classList.remove('active');
    if (backdrop) backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.classList.remove('active'); };
    if (copyBtn) copyBtn.onclick = () => {
      const text = document.getElementById('aiModalContent')?.innerText;
      if (text) navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
    };
  }

  return { init, openDiagnosis };
})();

document.addEventListener('DOMContentLoaded', SpeedSnapAI.init);
