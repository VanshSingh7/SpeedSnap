// Configuration and endpoints for speed test
const SPEEDSNAP_CONFIG = {
  endpoints: {
    download: 'https://speed.cloudflare.com/__down',
    upload: 'https://speed.cloudflare.com/__up'
  },
  latency: {
    probeCount: 6,
    probeIntervalMs: 40,
    bufferbloatProbeCount: 4,
    bufferbloatIntervalMs: 30
  },
  downloadTests: [
    { bytes: 1_000_000, label: '1 MB' },
    { bytes: 3_000_000, label: '3 MB' },
    { bytes: 7_000_000, label: '7 MB' }
  ],
  uploadTests: [
    { bytes: 500_000, label: '500 KB' },
    { bytes: 2_000_000, label: '2 MB' },
    { bytes: 5_000_000, label: '5 MB' }
  ],
  thresholds: {
    streaming4K: 25,
    streaming1080p: 10,
    gamingGreatLatency: 35,
    gamingGoodLatency: 75,
    gamingGreatJitter: 8,
    videoChatUpload: 5,
    videoChatLatency: 60
  },
  ai: {
    geminiApiKey: '',
    model: 'gemini-3.1-flash-lite'
  },
  async getApiKey() {
    // 1. Check user key stored in browser localStorage
    try {
      const localKey = localStorage.getItem('speedsnap_gemini_api_key');
      if (localKey && localKey.trim()) {
        this.ai.geminiApiKey = localKey.trim();
        return this.ai.geminiApiKey;
      }
    } catch (_) {}

    // 2. Return in-memory key if already set
    if (this.ai.geminiApiKey) return this.ai.geminiApiKey;

    // 3. Fallback: try fetching .env if accessible via HTTP server
    if (typeof fetch === 'function') {
      try {
        const res = await fetch('.env');
        if (res.ok) {
          const text = await res.text();
          const match = text.match(/GEMINI_API_KEY\s*=\s*(.+)/);
          if (match && match[1].trim()) {
            this.ai.geminiApiKey = match[1].trim();
            return this.ai.geminiApiKey;
          }
        }
      } catch (_) {}
    }
    return '';
  },
  setApiKey(key) {
    this.ai.geminiApiKey = (key || '').trim();
    try {
      if (this.ai.geminiApiKey) {
        localStorage.setItem('speedsnap_gemini_api_key', this.ai.geminiApiKey);
      } else {
        localStorage.removeItem('speedsnap_gemini_api_key');
      }
    } catch (_) {}
  },
  setModel(model) {
    if (model) {
      this.ai.model = model;
      try {
        localStorage.setItem('speedsnap_gemini_model', model);
      } catch (_) {}
    }
  }
};

// Pre-load Gemini configuration in window context
if (typeof window !== 'undefined') {
  try {
    const savedModel = localStorage.getItem('speedsnap_gemini_model');
    if (savedModel) SPEEDSNAP_CONFIG.ai.model = savedModel;
  } catch (_) {}
  SPEEDSNAP_CONFIG.getApiKey().catch(() => {});
}


