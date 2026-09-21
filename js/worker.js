// SpeedSnap - Benchmark Worker (CSE Sem 5 Project)
importScripts('config.js');
let abortController = null;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function measurePing(signal) {
  const start = performance.now();
  await fetch(${SPEEDSNAP_CONFIG.endpoints.download}?bytes=0&t=, { cache: 'no-store', signal });
  return Number((performance.now() - start).toFixed(1));
}

function calcJitter(samples) {
  if (samples.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < samples.length; i++) sum += Math.abs(samples[i] - samples[i - 1]);
  return Number((sum / (samples.length - 1)).toFixed(1));
}

self.onmessage = async (e) => {
  if (e.data === 'start') {
    abortController = new AbortController();
    const signal = abortController.signal;
    const pings = [];
    try {
      for (let i = 0; i < SPEEDSNAP_CONFIG.latency.probeCount; i++) {
        const ping = await measurePing(signal);
        pings.push(ping);
        self.postMessage({ type: 'pingUpdate', rtt: ping, progress: ((i + 1) / SPEEDSNAP_CONFIG.latency.probeCount) * 20 });
        await sleep(SPEEDSNAP_CONFIG.latency.probeIntervalMs);
      }
      const sorted = [...pings].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const jitter = calcJitter(pings);
      self.postMessage({ type: 'latencyFinal', latency: median, latencyMin: sorted[0], latencyMax: sorted[sorted.length - 1], jitter, jitterMin: 0, jitterMax: jitter * 1.5, packetLoss: 0 });
    } catch (err) {}
  } else if (e.data === 'stop' && abortController) {
    abortController.abort();
  }
};