// web worker for network speed and quality testing
importScripts('config.js');

let testAbortController = null;

// pause execution for given milliseconds
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// find median value of an array of numbers
const getMedian = numbers => {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

// measure round-trip time for a single 0-byte ping
const measurePing = async abortSignal => {
  const start = performance.now();
  const url = `${SPEEDSNAP_CONFIG.endpoints.download}?bytes=0&cacheBust=${Math.random()}`;
  await fetch(url, {
    cache: 'no-store',
    signal: abortSignal
  });
  return performance.now() - start;
};

// test unloaded latency, jitter and packet loss
const runPingTest = async abortSignal => {
  const { probeCount, probeIntervalMs, probeTimeoutMs } = SPEEDSNAP_CONFIG.latency;
  const pingSamples = [];
  let lostPackets = 0;

  for (let i = 0; i < probeCount; i++) {
    if (abortSignal.aborted) break;
    try {
      const probeController = new AbortController();
      const timeoutId = setTimeout(() => probeController.abort(), probeTimeoutMs);

      const rtt = await measurePing(probeController.signal);
      clearTimeout(timeoutId);

      const roundedRtt = Number(rtt.toFixed(1));
      pingSamples.push(roundedRtt);

      self.postMessage({
        type: 'pingUpdate',
        rtt: roundedRtt,
        samples: [...pingSamples],
        progress: ((i + 1) / probeCount) * 20,
        statusText: `Measuring Latency · #${i + 1} of ${probeCount}`
      });
    } catch (error) {
      if (abortSignal.aborted) throw error;
      lostPackets++;
    }
    await sleep(probeIntervalMs);
  }

  const medianPing = getMedian(pingSamples);
  const minPing = pingSamples.length ? Math.min(...pingSamples) : 0;
  const maxPing = pingSamples.length ? Math.max(...pingSamples) : 0;

  // calculate jitter from consecutive ping differences
  const jitterDiffs = [];
  for (let i = 1; i < pingSamples.length; i++) {
    jitterDiffs.push(Math.abs(pingSamples[i] - pingSamples[i - 1]));
  }
  const avgJitter = jitterDiffs.length
    ? jitterDiffs.reduce((sum, val) => sum + val, 0) / jitterDiffs.length
    : 0;
  const minJitter = jitterDiffs.length ? Math.min(...jitterDiffs) : 0;
  const maxJitter = jitterDiffs.length ? Math.max(...jitterDiffs) : 0;

  const lossPercent = Number(
    ((lostPackets / probeCount) * 100).toFixed(1)
  );

  return {
    latency: Number(medianPing.toFixed(1)),
    latencyMin: Number(minPing.toFixed(1)),
    latencyMax: Number(maxPing.toFixed(1)),
    jitter: Number(avgJitter.toFixed(1)),
    jitterMin: Number(minJitter.toFixed(1)),
    jitterMax: Number(maxJitter.toFixed(1)),
    packetLoss: lossPercent,
    samples: pingSamples
  };
};

// worker message handler
self.onmessage = async event => {
  if (event.data === 'stop') {
    testAbortController?.abort();
    return;
  }

  if (event.data === 'start') {
    testAbortController = new AbortController();
    const { signal: abortSignal } = testAbortController;

    try {
      self.postMessage({ type: 'statusUpdate', statusText: 'Measuring Latency & Packet Loss' });
      const latencyStats = await runPingTest(abortSignal);

      self.postMessage({
        type: 'latencyFinal',
        ...latencyStats
      });
    } catch (error) {
      if (!abortSignal.aborted) {
        self.postMessage({
          type: 'testError',
          errorMessage: error.message
        });
      }
    }
  }
};
