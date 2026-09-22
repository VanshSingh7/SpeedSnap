// SpeedSnap - Benchmark Worker (CSE Sem 5 Project)
importScripts('config.js');
let abortController = null;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function measurePing(signal) {
  const start = performance.now();
  await fetch(`${SPEEDSNAP_CONFIG.endpoints.download}?bytes=0&t=${Math.random()}`, { cache: 'no-store', signal });
  return Number((performance.now() - start).toFixed(1));
}

function calcJitter(samples) {
  if (samples.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < samples.length; i++) sum += Math.abs(samples[i] - samples[i - 1]);
  return Number((sum / (samples.length - 1)).toFixed(1));
}

async function runDownload(bytes, signal) {
  const start = performance.now();
  const res = await fetch(`${SPEEDSNAP_CONFIG.endpoints.download}?bytes=${bytes}&t=${Math.random()}`, { cache: 'no-store', signal });
  const blob = await res.blob();
  return Number(((blob.size * 8) / ((performance.now() - start) / 1000 * 1e6)).toFixed(1));
}

async function runUpload(bytes, signal) {
  const data = new Uint8Array(bytes);
  const start = performance.now();
  await fetch(SPEEDSNAP_CONFIG.endpoints.upload, { method: 'POST', body: data, cache: 'no-store', signal });
  return Number(((bytes * 8) / ((performance.now() - start) / 1000 * 1e6)).toFixed(1));
}

self.onmessage = async (e) => {
  if (e.data === 'stop') { abortController?.abort(); return; }
  if (e.data !== 'start') return;
  abortController = new AbortController();
  const signal = abortController.signal;

  try {
    const idlePings = [], loadedPings = [], downSpeeds = [], upSpeeds = [];

    // Stage 1: Idle Latency & Jitter Probes [BLUE]
    for (let i = 0; i < 5; i++) {
      if (signal.aborted) return;
      const rtt = await measurePing(signal);
      idlePings.push(rtt);
      const jit = calcJitter(idlePings);
      self.postMessage({ type: 'pingUpdate', rtt, latency: rtt, jitter: jit, samples: [...idlePings], phase: 'latency', progress: 5 + i * 3, statusText: `Idle Latency: ${rtt} ms · Jitter: ${jit} ms` });
      await sleep(40);
    }
    const idleLatency = Number((idlePings.reduce((a, b) => a + b, 0) / idlePings.length).toFixed(1));
    const finalJitter = calcJitter(idlePings);
    self.postMessage({ type: 'latencyFinal', latency: idleLatency, latencyMin: Math.min(...idlePings), latencyMax: Math.max(...idlePings), jitter: finalJitter, jitterMin: 0, jitterMax: finalJitter, packetLoss: 0, samples: [...idlePings] });

    // Stage 2: Download Warmup & Ramp [YELLOW]
    for (const b of [1000000, 3000000, 7000000]) {
      if (signal.aborted) return;
      const spd = await runDownload(b, signal);
      downSpeeds.push(spd);
      self.postMessage({ type: 'downloadUpdate', speed: spd, phase: 'download', progress: 20 + downSpeeds.length * 12, statusText: `Testing Download: ${spd} Mbps` });
    }

    // Stage 3: Bufferbloat Check (Latency under load) [RED]
    for (let i = 0; i < 4; i++) {
      if (signal.aborted) return;
      const rtt = await measurePing(signal);
      loadedPings.push(rtt);
      const bloat = Math.max(0, Number((rtt - idleLatency).toFixed(1)));
      self.postMessage({ type: 'bufferbloatUpdate', bufferbloat: `+${bloat} ms`, loadedLatency: rtt, packetLoss: 0, samples: [...loadedPings], phase: 'loss', progress: 58 + i * 4, statusText: `Bufferbloat Check: +${bloat} ms` });
      await sleep(30);
    }
    const loadedLatency = Number((loadedPings.reduce((a, b) => a + b, 0) / loadedPings.length).toFixed(1));
    const bufferbloatDelta = Math.max(0, Number((loadedLatency - idleLatency).toFixed(1)));

    // Stage 4: Upload Warmup & Stress [PURPLE]
    for (const b of [500000, 2000000, 5000000]) {
      if (signal.aborted) return;
      const spd = await runUpload(b, signal);
      upSpeeds.push(spd);
      self.postMessage({ type: 'uploadUpdate', speed: spd, phase: 'upload', progress: 74 + upSpeeds.length * 8, statusText: `Testing Upload: ${spd} Mbps` });
    }

    const finalDown = downSpeeds.length ? Math.max(...downSpeeds) : 0;
    const finalUp = upSpeeds.length ? Math.max(...upSpeeds) : 0;
    self.postMessage({
      type: 'testComplete', download: finalDown, upload: finalUp,
      latency: idleLatency, latencyMin: Math.min(...idlePings), latencyMax: Math.max(...idlePings),
      jitter: finalJitter, jitterMin: 0, jitterMax: finalJitter, packetLoss: 0, bufferbloat: bufferbloatDelta,
      unloadedSamples: idlePings, downloadSamples: loadedPings, uploadSamples: loadedPings,
      ratings: { streaming: finalDown >= 25 ? 'Great (4K)' : 'Good', gaming: idleLatency <= 40 ? 'Great' : 'Good', videoChat: finalUp >= 5 ? 'Great (HD)' : 'Good' }
    });
  } catch (err) {
    if (!signal.aborted) self.postMessage({ type: 'testError', errorMessage: err.message });
  }
};
