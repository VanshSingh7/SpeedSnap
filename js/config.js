// configuration and endpoints for speed test
const SPEEDSNAP_CONFIG = {
  endpoints: {
    download: 'https://speed.cloudflare.com/__down',
    upload: 'https://speed.cloudflare.com/__up'
  },
  latency: {
    probeCount: 18,
    probeIntervalMs: 30,
    probeTimeoutMs: 1500
  },
  downloadTests: [
    { bytes: 500_000, label: '500 KB' },
    { bytes: 1_000_000, label: '1 MB' },
    { bytes: 2_000_000, label: '2 MB' },
    { bytes: 4_000_000, label: '4 MB' },
    { bytes: 8_000_000, label: '8 MB' },
    { bytes: 12_000_000, label: '12 MB' },
    { bytes: 16_000_000, label: '16 MB' },
    { bytes: 20_000_000, label: '20 MB' }
  ],
  uploadTests: [
    { bytes: 200_000, label: '200 KB' },
    { bytes: 500_000, label: '500 KB' },
    { bytes: 1_000_000, label: '1 MB' },
    { bytes: 2_000_000, label: '2 MB' },
    { bytes: 3_500_000, label: '3.5 MB' },
    { bytes: 5_000_000, label: '5 MB' },
    { bytes: 7_500_000, label: '7.5 MB' }
  ],
  thresholds: {
    streaming4K: 25,
    streaming1080p: 10,
    gamingGreatLatency: 35,
    gamingGoodLatency: 75,
    gamingGreatJitter: 8,
    videoChatUpload: 5,
    videoChatLatency: 60
  }
};
