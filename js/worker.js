// web worker for network speed and quality testing
importScripts('config.js');

let testAbortController = null;

// pause execution for given milliseconds
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

// test unloaded latency by sending ping probes
const runPingTest = async abortSignal => {
  const { probeCount, probeIntervalMs } = SPEEDSNAP_CONFIG.latency;
  const pingSamples = [];

  for (let i = 0; i < probeCount; i++) {
    if (abortSignal.aborted) break;
    try {
      const rtt = await measurePing(abortSignal);
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
    }
    await sleep(probeIntervalMs);
  }

  return {
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
      self.postMessage({ type: 'statusUpdate', statusText: 'Measuring Latency' });
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
