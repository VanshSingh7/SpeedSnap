// SpeedSnap - Benchmark Worker (CSE Sem 5 Project)
importScripts('config.js');
let abortController = null;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function measurePing(signal) {
  const start = performance.now();
  await fetch(${SPEEDSNAP_CONFIG.endpoints.download}?bytes=0&t=, { cache: 'no-store', signal });
  return Number((performance.now() - start).toFixed(1));
}

self.onmessage = async (e) => {
  if (e.data === 'start') {
    abortController = new AbortController();
    const signal = abortController.signal;
    try {
      for (let i = 0; i < SPEEDSNAP_CONFIG.latency.probeCount; i++) {
        const ping = await measurePing(signal);
        self.postMessage({ type: 'pingUpdate', rtt: ping, progress: ((i + 1) / SPEEDSNAP_CONFIG.latency.probeCount) * 20 });
        await sleep(SPEEDSNAP_CONFIG.latency.probeIntervalMs);
      }
    } catch (err) {}
  } else if (e.data === 'stop' && abortController) {
    abortController.abort();
  }
};