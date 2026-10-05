// SpeedSnap - Canvas Chart Module (CSE Sem 5 Project)
const SpeedSnapCharts = (() => {
  // Setup crisp canvas resolution with high DPI support
  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 300;
    const h = rect.height || 100;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w, h };
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

  return { drawSpeedChart };
})();

