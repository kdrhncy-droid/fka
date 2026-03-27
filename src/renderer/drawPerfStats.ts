export function drawPerfStats(
  ctx: CanvasRenderingContext2D,
  perfFps: number
) {
  const pad = 8;
  const bw = 80, bh = 28;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(pad, pad, bw, bh, 6);
  ctx.fill();
  ctx.font = 'bold 13px monospace';
  ctx.textBaseline = 'top';
  const fpsColor = perfFps >= 50 ? '#4ade80' : perfFps >= 30 ? '#facc15' : '#f87171';
  ctx.fillStyle = fpsColor;
  ctx.fillText(`FPS: ${perfFps}`, pad + 8, pad + 8);
  ctx.restore();
}
