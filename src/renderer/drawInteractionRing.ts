export function drawInteractionRing(
  ctx: CanvasRenderingContext2D,
  nearest: { x: number; y: number } | null,
  isEditing: boolean
) {
  if (nearest && !isEditing) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(nearest.x, nearest.y, 45, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(34, 197, 94, 0.25)"; // Soft Yeşil
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}
