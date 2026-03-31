export function drawInteractionRing(
  ctx: CanvasRenderingContext2D,
  nearest: { x: number; y: number } | null,
  isEditing: boolean
) {
  if (!nearest || isEditing) return;

  ctx.save();

  // Dış parlama
  const glow = ctx.createRadialGradient(nearest.x, nearest.y, 20, nearest.x, nearest.y, 50);
  glow.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
  glow.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(nearest.x, nearest.y, 50, 0, Math.PI * 2);
  ctx.fill();

  // İç dolgu
  ctx.beginPath();
  ctx.arc(nearest.x, nearest.y, 38, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
  ctx.fill();

  // Çerçeve — kesik çizgi efekti
  ctx.beginPath();
  ctx.arc(nearest.x, nearest.y, 38, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}
