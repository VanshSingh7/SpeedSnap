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

// run download test with increasing payload sizes and concurrent pings
const runDownloadTest = async abortSignal => {
  const { downloadTests } = SPEEDSNAP_CONFIG;
  const speedSamples = [];
  const loadedPingSamples = [];

  for (let i = 0; i < downloadTests.length; i++) {
    if (abortSignal.aborted) break;
    const test = downloadTests[i];

    // measure loaded latency concurrently during download transfer
    const pingPromise = (async () => {
      try {
        await sleep(50);
        if (!abortSignal.aborted) {
          const rtt = await measurePing(abortSignal);
          loadedPingSamples.push(Number(rtt.toFixed(1)));
        }
      } catch (error) {
        // probe dropped under heavy load
      }
    })();

    const startTime = performance.now();
    const url = `${SPEEDSNAP_CONFIG.endpoints.download}?bytes=${test.bytes}&cacheBust=${Math.random()}`;
    const response = await fetch(url, {
      cache: 'no-store',
      signal: abortSignal
    });
    await response.arrayBuffer();
    const durationSec = (performance.now() - startTime) / 1000;

    await pingPromise;

    // calculate speed in Mbps
    const speedMbps = Number(((test.bytes * 8) / (durationSec * 1e6)).toFixed(1));
    speedSamples.push(speedMbps);

    // progress covers 20% to 60%
    const progress = 20 + ((i + 1) / downloadTests.length) * 40;

    self.postMessage({
      type: 'downloadUpdate',
      speed: speedMbps,
      progress,
      statusText: `Testing Download · ${test.label} (${i + 1}/${downloadTests.length})`
    });
  }

  // 90th percentile download throughput
  const sorted = [...speedSamples].sort((a, b) => a - b);
  const p90Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9));
  const p90Speed = sorted[p90Index] || 0;

  return {
    speed: p90Speed,
    samples: speedSamples,
    loadedPings: loadedPingSamples
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

      self.postMessage({ type: 'statusUpdate', statusText: 'Testing Download Speed' });
      const downloadStats = await runDownloadTest(abortSignal);

      self.postMessage({
        type: 'downloadFinal',
        ...downloadStats
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
