// SpeedSnap - Simple Canvas Chart Module (CSE Sem 5 Project)
const SpeedSnapCharts = (() => {
  // Setup canvas resolution
  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 300, h = rect.height || 100;
    canvas.width = w;
    canvas.height = h;
    return { ctx: canvas.getContext('2d'), w, h };
  }

  // Draw smooth speed curve on canvas
  function drawSpeedChart(canvas, data, strokeColor, fillColor) {
    if (!canvas || !data || data.length === 0) return;
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...data, 10) * 1.15;
    const step = (w - 20) / Math.max(1, data.length - 1);

    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(10, h - 5);
    data.forEach((val, i) => {
      const x = 10 + i * step;
      const y = h - 10 - (val / max) * (h - 20);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(10 + (data.length - 1) * step, h - 5);
    ctx.fillStyle = fillColor || 'rgba(246, 130, 31, 0.2)';
    ctx.fill();

    // Draw line stroke
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = 10 + i * step;
      const y = h - 10 - (val / max) * (h - 20);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = strokeColor || '#f6821f';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw simple latency min/median/max box plot
  function drawLatencyBoxPlot(canvas, samples, color) {
    if (!canvas || !samples || samples.length === 0) return;
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const sorted = [...samples].sort((a, b) => a - b);
    const min = sorted[0];
    const max = Math.max(sorted[sorted.length - 1], min + 1);
    const mid = sorted[Math.floor(sorted.length / 2)];

    const scale = (val) => 15 + ((val - min) / (max - min || 1)) * (w - 30);
    const y = h / 2;

    // Range line (min to max)
    ctx.beginPath();
    ctx.moveTo(scale(min), y);
    ctx.lineTo(scale(max), y);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Median marker
    ctx.beginPath();
    ctx.arc(scale(mid), y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color || '#38bdf8';
    ctx.fill();
  }

  // Draw packet loss indicator bar
  function drawLossBar(container, textElement, lossPercent) {
    if (textElement) textElement.textContent = lossPercent.toFixed(1) + '%';
    if (!container) return;
    container.innerHTML = `<div style="height:100%;width:${Math.max(4, Math.min(100, lossPercent))}%;background:${lossPercent > 0 ? '#f87171' : '#4ade80'};border-radius:3px;"></div>`;
  }

  return { drawSpeedChart, drawLatencyBoxPlot, drawLossBar };
})();
