// SpeedSnap - History Page Controller
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('historyListContainer');
  const emptyState = document.getElementById('emptyStateContainer');
  const sortSelect = document.getElementById('historySortSelect');
  const clearAllBtn = document.getElementById('clearAllHistoryBtn');
  const globalAiBtn = document.getElementById('globalAiSuggestBtn');

  let allRecords = [];

  function sortRecords(records, sortBy = 'newest') {
    const list = [...records];
    if (sortBy === 'download') return list.sort((a, b) => (b.downloadSpeed || 0) - (a.downloadSpeed || 0));
    if (sortBy === 'upload') return list.sort((a, b) => (b.uploadSpeed || 0) - (a.uploadSpeed || 0));
    if (sortBy === 'latency') return list.sort((a, b) => (a.latency || 9999) - (b.latency || 9999));
    return list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }

  // Update summary stats cards
  async function updateStats() {
    const s = await SpeedSnapDB.getStats();
    ['statTotalTests', 'statAvgDownload', 'statAvgUpload', 'statAvgLatency', 'statPeakDownload'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'statTotalTests') el.textContent = s.count;
      else if (id === 'statAvgDownload') el.textContent = s.count ? s.avgDownload + ' Mbps' : '—';
      else if (id === 'statAvgUpload') el.textContent = s.count ? s.avgUpload + ' Mbps' : '—';
      else if (id === 'statAvgLatency') el.textContent = s.count ? s.avgLatency + ' ms' : '—';
      else if (id === 'statPeakDownload') el.textContent = s.count ? s.maxDownload + ' Mbps' : '—';
    });
    const navCount = document.getElementById('navHistoryCount');
    if (navCount) navCount.textContent = s.count;
    if (globalAiBtn) globalAiBtn.disabled = s.count === 0;
  }

  // Render cards in the history list
  function renderList(records) {
    if (!container) return;
    if (!records || records.length === 0) {
      container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }
    container.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = records.map(item => `
      <div class="history-card" data-id="${item.id}">
        <div class="history-card-header">
          <span class="history-badge-time">${new Date(item.timestamp).toLocaleString()}</span>
          <div class="history-card-actions">
            <button class="nav-action-btn ai-btn" onclick='SpeedSnapAI.openDiagnosis(${JSON.stringify(item)})'>AI Tips</button>
            <button class="history-delete-btn" onclick="deleteItem(${item.id})">Delete</button>
          </div>
        </div>
        <div class="history-metrics-row">
          <div class="history-metric-box metric-box-down"><span class="history-metric-label">Download</span><span class="history-metric-val"><b class="val-num">${item.downloadSpeed || 0}</b> <span class="val-unit">Mbps</span></span></div>
          <div class="history-metric-box metric-box-up"><span class="history-metric-label">Upload</span><span class="history-metric-val"><b class="val-num">${item.uploadSpeed || 0}</b> <span class="val-unit">Mbps</span></span></div>
          <div class="history-metric-box metric-box-ping"><span class="history-metric-label">Latency</span><span class="history-metric-val"><b class="val-num">${item.latency || 0}</b> <span class="val-unit">ms</span></span></div>
          <div class="history-metric-box metric-box-bloat"><span class="history-metric-label">Bufferbloat</span><span class="history-metric-val"><b class="val-num">${item.bufferbloat || '—'}</b></span></div>
        </div>
      </div>
    `).join('');
  }

  // Load and refresh history data
  async function loadHistory() {
    allRecords = await SpeedSnapDB.getAllResults();
    const sortBy = sortSelect ? sortSelect.value : 'newest';
    renderList(sortRecords(allRecords, sortBy));
    updateStats();
  }

  window.deleteItem = async (id) => {
    await SpeedSnapDB.deleteResult(id);
    loadHistory();
  };

  if (clearAllBtn) {
    clearAllBtn.onclick = async () => {
      if (confirm('Clear all test history?')) {
        await SpeedSnapDB.clearAll();
        loadHistory();
      }
    };
  }

  if (sortSelect) {
    sortSelect.onchange = () => {
      renderList(sortRecords(allRecords, sortSelect.value));
    };
  }

  if (globalAiBtn) {
    globalAiBtn.onclick = () => { if (allRecords[0]) SpeedSnapAI.openDiagnosis(allRecords[0]); };
  }

  loadHistory();
});
