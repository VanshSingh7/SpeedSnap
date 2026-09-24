// canvas charting module for network metrics
const SpeedSnapCharts = (() => {
  // setup canvas with high-dpi screen support
  const initCanvas = (canvas, defaultWidth = 360, defaultHeight = 120) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || defaultWidth;
    const height = rect.height || defaultHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    return { ctx, width, height };
  };

  // calculate percentile value from sorted array
  const getPercentile = (sortedArray, p) => {
    if (!sortedArray.length) return 0;
    const index = (sortedArray.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sortedArray[lower];
    return sortedArray[lower] + (sortedArray[upper] - sortedArray[lower]) * (index - lower);
  };

  // draw throughput speed curve with gradient
  const drawSpeedChart = (canvas, dataArray, strokeColor, fillColor) => {
    if (!dataArray || !dataArray.length) return;
    const { ctx, width, height } = initCanvas(canvas, 360, 120);
    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...dataArray, 5) * 1.2;
    const sorted = [...dataArray].sort((a, b) => a - b);
    const p90 = getPercentile(sorted, 0.9);
    const p90Y = height - (p90 / maxVal) * (height - 24) - 12;

    // draw 90th percentile dashed reference line
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, p90Y);
    ctx.lineTo(width, p90Y);
    ctx.stroke();
    ctx.restore();

    // calculate curve points
    const points = dataArray.map((val, idx) => {
      const x =
        dataArray.length === 1
          ? width * 0.1
          : (idx / (dataArray.length - 1)) * (width - 16) + 8;
      const y = height - (val / maxVal) * (height - 24) - 12;
      return { x, y };
    });

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // smooth curve using quadratic curves
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      ctx.quadraticCurveTo(current.x, current.y, midX, (current.y + next.y) / 2);
    }

    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;
    ctx.stroke();

    // fill area under curve
    ctx.shadowBlur = 0;
    ctx.lineTo(last.x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, 'rgba(18, 18, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // endpoint glowing dot
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // draw statistical box plot for latency samples
  const drawLatencyBoxPlot = (canvas, samples, themeColor, maxScale = 800) => {
    if (!canvas) return;
    const { ctx, width, height } = initCanvas(canvas, 480, 56);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 10;
    const padRight = 10;
    const chartWidth = width - padLeft - padRight;
    const axisY = height - 14;

    // draw scale ticks
    const ticks = [0, 200, 400, 600, 800];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#666666';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';

    ticks.forEach(tick => {
      const x = padLeft + (tick / maxScale) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.lineTo(x, axisY);
      ctx.stroke();
      ctx.fillText(tick, x, height - 2);
    });

    if (!samples || !samples.length) return;

    // calculate box plot values
    const sorted = [...samples].sort((a, b) => a - b);
    const minVal = sorted[0];
    const maxVal = sorted[sorted.length - 1];
    const q1 = getPercentile(sorted, 0.25);
    const median = getPercentile(sorted, 0.5);
    const q3 = getPercentile(sorted, 0.75);

    const scaleX = val => padLeft + (Math.min(val, maxScale) / maxScale) * chartWidth;

    const boxTop = 8;
    const boxHeight = 14;
    const boxCenterY = boxTop + boxHeight / 2;

    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;

    // draw min and max whiskers
    ctx.beginPath();
    ctx.moveTo(scaleX(minVal), boxCenterY);
    ctx.lineTo(scaleX(q1), boxCenterY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(scaleX(q3), boxCenterY);
    ctx.lineTo(scaleX(maxVal), boxCenterY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(scaleX(minVal), boxTop + 2);
    ctx.lineTo(scaleX(minVal), boxTop + boxHeight - 2);
    ctx.moveTo(scaleX(maxVal), boxTop + 2);
    ctx.lineTo(scaleX(maxVal), boxTop + boxHeight - 2);
    ctx.stroke();

    // draw IQR box
    const boxX = scaleX(q1);
    const boxW = Math.max(scaleX(q3) - boxX, 2);
    ctx.fillStyle = themeColor + '33';
    ctx.fillRect(boxX, boxTop, boxW, boxHeight);
    ctx.strokeRect(boxX, boxTop, boxW, boxHeight);

    // draw median line
    ctx.beginPath();
    ctx.moveTo(scaleX(median), boxTop);
    ctx.lineTo(scaleX(median), boxTop + boxHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // draw individual sample dots
    const dotY = boxTop + boxHeight + 7;
    samples.forEach(val => {
      const dotX = scaleX(val);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = themeColor + 'cc';
      ctx.fill();
    });
  };

  // draw packet loss meter bar
  const drawLossBar = (barElement, textElement, lossPercent) => {
    if (!barElement) return;
    const receivedPercent = Math.max(0, Math.min(100, 100 - lossPercent));
    barElement.innerHTML = `
      <div style="width: ${receivedPercent}%; height: 100%; background: #22c55e; border-radius: 4px 0 0 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #0b2e13;">
        ${receivedPercent >= 70 ? `Received ${receivedPercent.toFixed(1)}%` : ''}
      </div>
      <div style="width: ${lossPercent}%; height: 100%; background: #ef4444; border-radius: 0 4px 4px 0;"></div>
    `;
    if (textElement) {
      textElement.textContent = `Received: ${receivedPercent.toFixed(1)}% | Loss: ${lossPercent.toFixed(1)}%`;
    }
  };

  return {
    initCanvas,
    getPercentile,
    drawSpeedChart,
    drawLatencyBoxPlot,
    drawLossBar,
    // backwards compatible aliases
    renderThroughputCurve: drawSpeedChart,
    renderDistributionPlot: drawLatencyBoxPlot,
    renderPacketLossMeter: drawLossBar
  };
})();
