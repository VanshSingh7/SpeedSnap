const getElement = id => document.getElementById(id);

const downloadSpeedElement = getElement('downloadSpeed');
const uploadSpeedElement = getElement('uploadSpeed');
const latencyValueElement = getElement('latencyValue');
const latencyMinElement = getElement('latencyMin');
const latencyMaxElement = getElement('latencyMax');
const jitterValueElement = getElement('jitterValue');
const jitterMinElement = getElement('jitterMin');
const jitterMaxElement = getElement('jitterMax');
const packetLossValueElement = getElement('packetLossValue');
const bufferbloatSummaryElement = getElement('bufferbloatSummary');

const startButton = getElement('startButton');
const stopButton = getElement('stopButton');
const statusPulseDot = getElement('statusPulseDot');
const statusPhaseText = getElement('statusPhaseText');
const chevronProgressBar = getElement('chevronProgressBar');


const downloadCanvas = getElement('downloadCanvas');
const uploadCanvas = getElement('uploadCanvas');


let downloadDataPoints = [];
let uploadDataPoints = [];

let speedTestWorker = null;

const TOTAL_CHEVRON_SEGMENTS = 48;
if (chevronProgressBar) {
  for (let i = 0; i < TOTAL_CHEVRON_SEGMENTS; i++) {
    const segment = document.createElement('div');
    segment.className = 'chevron-segment';
    chevronProgressBar.appendChild(segment);
  }
}

const updateChevronProgress = progressPercentage => {
  if (!chevronProgressBar) return;
  const filledCount = Math.round((progressPercentage / 100) * TOTAL_CHEVRON_SEGMENTS);
  const segments = chevronProgressBar.children;

  for (let i = 0; i < TOTAL_CHEVRON_SEGMENTS; i++) {
    if (i < filledCount) {
      if (i < Math.round(TOTAL_CHEVRON_SEGMENTS * 0.2)) {
        segments[i].className = 'chevron-segment segment-blue';
      } else if (i < Math.round(TOTAL_CHEVRON_SEGMENTS * 0.6)) {
        segments[i].className = 'chevron-segment segment-orange';
      } else {
        segments[i].className = 'chevron-segment segment-purple';
      }
    } else {
      segments[i].className = 'chevron-segment';
    }
  }
};

const resetInterfaceState = () => {
  downloadSpeedElement.textContent = '0.0';
  uploadSpeedElement.textContent = '0.0';
  latencyValueElement.textContent = '—';
  latencyMinElement.textContent = '↓ — ms';
  latencyMaxElement.textContent = '↑ — ms';
  jitterValueElement.textContent = '—';
  jitterMinElement.textContent = '↓ — ms';
  jitterMaxElement.textContent = '↑ — ms';
  packetLossValueElement.textContent = '0.0';
  bufferbloatSummaryElement.textContent = 'Bufferbloat: —';



  downloadDataPoints = [];
  uploadDataPoints = [];


  [downloadCanvas, uploadCanvas].forEach(canvas => {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });


  updateChevronProgress(0);
};

const setTestExecutionState = isRunning => {
  startButton.disabled = isRunning;
  stopButton.disabled = !isRunning;
  statusPulseDot.className = isRunning ? 'pulse-dot active' : 'pulse-dot';
};

const startDiagnostics = () => {
  resetInterfaceState();
  setTestExecutionState(true);
  statusPhaseText.textContent = 'Initializing diagnostics';

  speedTestWorker = new Worker('worker.js');

  speedTestWorker.onmessage = event => {
    const {
      type,
      speed,
      rtt,
      latency,
      latencyMin,
      latencyMax,
      jitter,
      jitterMin,
      jitterMax,
      packetLoss,
      bufferbloat,
      progress,
      statusText,
      errorMessage
    } = event.data;

    if (progress !== undefined) updateChevronProgress(progress);
    if (statusText) statusPhaseText.textContent = statusText;

    switch (type) {
      case 'pingUpdate':
        latencyValueElement.textContent = rtt.toFixed(1);
        break;

      case 'latencyFinal':
        latencyValueElement.textContent = latency.toFixed(1);
        latencyMinElement.textContent = `↓ ${latencyMin.toFixed(1)} ms`;
        latencyMaxElement.textContent = `↑ ${latencyMax.toFixed(1)} ms`;
        jitterValueElement.textContent = jitter.toFixed(1);
        jitterMinElement.textContent = `↓ ${jitterMin.toFixed(1)} ms`;
        jitterMaxElement.textContent = `↑ ${jitterMax.toFixed(1)} ms`;
        packetLossValueElement.textContent = packetLoss.toFixed(1);

        break;

      case 'downloadUpdate':
        downloadSpeedElement.textContent = speed.toFixed(1);
        downloadDataPoints.push(speed);
        SpeedSnapCharts.renderThroughputCurve(
          downloadCanvas,
          downloadDataPoints,
          '#f6821f',
          'rgba(246, 130, 31, 0.28)'
        );
        break;

      case 'bufferbloatUpdate':
        bufferbloatSummaryElement.textContent = `Bufferbloat: ${bufferbloat}`;
        break;

      case 'uploadUpdate':
        uploadSpeedElement.textContent = speed.toFixed(1);
        uploadDataPoints.push(speed);
        SpeedSnapCharts.renderThroughputCurve(
          uploadCanvas,
          uploadDataPoints,
          '#b877f7',
          'rgba(184, 119, 247, 0.28)'
        );
        break;

      case 'testComplete':
        setTestExecutionState(false);
        statusPhaseText.textContent = 'Completed';
        updateChevronProgress(100);

        speedTestWorker.terminate();
        speedTestWorker = null;
        break;

      case 'testError':
        setTestExecutionState(false);
        statusPhaseText.textContent = errorMessage || 'Test failed';
        speedTestWorker.terminate();
        speedTestWorker = null;
        break;
    }
  };

  speedTestWorker.onerror = () => {
    setTestExecutionState(false);
    statusPhaseText.textContent = 'Worker execution error';
  };

  speedTestWorker.postMessage('start');
};

const stopDiagnostics = () => {
  if (!speedTestWorker) return;
  speedTestWorker.postMessage('stop');
  speedTestWorker.terminate();
  speedTestWorker = null;
  setTestExecutionState(false);
  statusPhaseText.textContent = 'Test paused';
};

startButton.addEventListener('click', startDiagnostics);
stopButton.addEventListener('click', stopDiagnostics);

window.addEventListener('resize', () => {
  if (downloadDataPoints.length) {
    SpeedSnapCharts.renderThroughputCurve(
      downloadCanvas,
      downloadDataPoints,
      '#f6821f',
      'rgba(246, 130, 31, 0.28)'
    );
  }
  if (uploadDataPoints.length) {
    SpeedSnapCharts.renderThroughputCurve(
      uploadCanvas,
      uploadDataPoints,
      '#b877f7',
      'rgba(184, 119, 247, 0.28)'
    );
  }
});