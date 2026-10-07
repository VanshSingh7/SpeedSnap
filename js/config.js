// SpeedSnap - Configuration
const SPEEDSNAP_CONFIG = {
  endpoints: {
    download: 'https://speed.cloudflare.com/__down',
    upload: 'https://speed.cloudflare.com/__up'
  },
  latency: { probeCount: 6, probeIntervalMs: 40, bufferbloatProbeCount: 4, bufferbloatIntervalMs: 30 },
  downloadTests: [
    { bytes: 1e6, label: '1 MB' },
    { bytes: 5e6, label: '5 MB' },
    { bytes: 10e6, label: '10 MB' },
    { bytes: 25e6, label: '25 MB' },
    { bytes: 50e6, label: '50 MB' }
  ],
  uploadTests: [
    { bytes: 1e6, label: '1 MB' },
    { bytes: 5e6, label: '5 MB' },
    { bytes: 10e6, label: '10 MB' },
    { bytes: 20e6, label: '20 MB' },
    { bytes: 35e6, label: '35 MB' }
  ],
  thresholds: {
    streaming4K: 25, streaming1080p: 10,
    gamingGreatLatency: 35, gamingGoodLatency: 75, gamingGreatJitter: 8,
    videoChatUpload: 5, videoChatLatency: 60
  },
  ai: { model: 'gemini-3.1-flash-lite' },

  // Read API key: 1. Vercel Serverless Function, 2. Local .env file
  async getEnvKey() {
    // 1. Production / Vercel Serverless Function (reads Vercel Dashboard env variable)
    try {
      const res = await fetch('/api/key');
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey && data.apiKey.trim()) return data.apiKey.trim();
      }
    } catch (_) {}

    // 2. Local Development (.env file if served over HTTP)
    try {
      const res = await fetch('.env');
      if (res.ok) {
        const match = (await res.text()).match(/GEMINI_API_KEY\s*=\s*(.+)/);
        if (match && match[1].trim()) return match[1].trim();
      }
    } catch (_) {}

    return '';
  }
};
