// SpeedSnap - Main Controller
const getEl = id => document.getElementById(id);
const progressBar = getEl('progressBar');
let worker = null, latestResult = null, downPoints = [], upPoints = [];

// Determine badge style according to test score
function getBadgeClass(rating) {
  if (!rating || rating === '—') return 'badge-idle';
  const r = rating.toLowerCase();
  if (r.includes('great')) return 'badge-great';
  if (r.includes('good')) return 'badge-good';
  if (r.includes('fair')) return 'badge-fair';
  return 'badge-poor';
}

// Update linear progress bar
function updateProgress(pct) {
  if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

// Reset metric displays and charts
function resetUI() {
  downPoints = []; upPoints = [];
  if (progressBar) progressBar.style.width = '0%';
  ['downloadSpeed', 'uploadSpeed'].forEach(id => getEl(id).textContent = '0.0');
  ['latencyValue', 'jitterValue', 'latencyMin', 'latencyMax', 'jitterMin', 'jitterMax'].forEach(id => getEl(id).textContent = '—');
  getEl('packetLossValue').textContent = '0.0';
  getEl('bufferbloatSummary').textContent = 'Bufferbloat: —';
  ['downloadCanvas', 'uploadCanvas'].forEach(id => {
    const cvs = getEl(id);
    if (cvs) {
      const ctx = cvs.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
  });
  ['streamingBadge', 'gamingBadge', 'videoChatBadge'].forEach(id => {
    const el = getEl(id);
    if (el) { el.textContent = '—'; el.className = 'quality-badge badge-idle'; }
  });
}

// Start test benchmark
getEl('startButton').onclick = () => {
  resetUI();
  getEl('startButton').disabled = true;
  getEl('stopButton').disabled = false;
  getEl('statusPulseDot').classList.add('active');

  worker = new Worker('js/worker.js');
  worker.postMessage('start');

  worker.onmessage = (e) => {
    const d = e.data;
    if (d.progress !== undefined) updateProgress(d.progress, d.phase);
    if (d.statusText) getEl('statusPhaseText').textContent = d.statusText;

    if (d.type === 'pingUpdate') {
      getEl('latencyValue').textContent = d.rtt.toFixed(1);
      if (d.jitter !== undefined) getEl('jitterValue').textContent = d.jitter.toFixed(1);
    } else if (d.type === 'latencyFinal') {
      getEl('latencyValue').textContent = d.latency.toFixed(1);
      getEl('latencyMin').textContent = `↓ ${d.latencyMin} ms`;
      getEl('latencyMax').textContent = `↑ ${d.latencyMax} ms`;
      getEl('jitterValue').textContent = d.jitter.toFixed(1);
    } else if (d.type === 'downloadUpdate') {
      getEl('downloadSpeed').textContent = d.speed.toFixed(1);
      downPoints.push(d.speed);
      SpeedSnapCharts.drawSpeedChart(getEl('downloadCanvas'), downPoints, '#f6821f', 'rgba(246,130,31,0.25)');
    } else if (d.type === 'bufferbloatUpdate') {
      getEl('bufferbloatSummary').textContent = `Bufferbloat: ${d.bufferbloat}`;
    } else if (d.type === 'uploadUpdate') {
      getEl('uploadSpeed').textContent = d.speed.toFixed(1);
      upPoints.push(d.speed);
      SpeedSnapCharts.drawSpeedChart(getEl('uploadCanvas'), upPoints, '#b877f7', 'rgba(184,119,247,0.25)');
    } else if (d.type === 'testComplete') {
      getEl('startButton').disabled = false;
      getEl('stopButton').disabled = true;
      getEl('statusPulseDot').classList.remove('active');
      getEl('statusPhaseText').textContent = 'Completed';
      getEl('packetLossValue').textContent = (d.packetLoss || 0).toFixed(1);
      updateProgress(100);
      latestResult = { downloadSpeed: d.download, uploadSpeed: d.upload, latency: d.latency, jitter: d.jitter, bufferbloat: `+${d.bufferbloat} ms` };
      SpeedSnapDB.saveResult(latestResult).then(updateNav);
      if (d.ratings) {
        ['streaming', 'gaming', 'videoChat'].forEach(k => {
          const el = getEl(k + 'Badge');
          if (el && d.ratings[k]) {
            el.textContent = d.ratings[k];
            el.className = `quality-badge ${getBadgeClass(d.ratings[k])}`;
          }
        });
      }
    } else if (d.type === 'testError') {
      getEl('startButton').disabled = false;
      getEl('stopButton').disabled = true;
      getEl('statusPulseDot').classList.remove('active');
      getEl('statusPhaseText').textContent = `Error: ${d.errorMessage || 'Test failed'}`;
    }
  };
};

getEl('stopButton').onclick = () => {
  if (worker) worker.postMessage('stop');
  getEl('startButton').disabled = false;
  getEl('stopButton').disabled = true;
  getEl('statusPulseDot').classList.remove('active');
  getEl('statusPhaseText').textContent = 'Stopped';
};

getEl('aiSuggestButton').onclick = () => {
  if (latestResult) SpeedSnapAI.openDiagnosis(latestResult);
  else alert('Please run a speed test first to get AI optimization advice.');
};

const updateNav = () => SpeedSnapDB.getStats().then(s => { const el = getEl('navHistoryCount'); if (el) el.textContent = s.count; });
updateNav();
