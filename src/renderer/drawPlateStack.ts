import { GameState } from "../types/game";

export function drawPlateStack(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  movingId?: string | null,
  defaultPos?: { x: number; y: number }
) {
  if (!state.plateStack || !defaultPos) return;

  const platePos = state.stationLayout?.['plate_stack'] ?? defaultPos;
  const sx = platePos.x, sy = platePos.y;

  if (movingId === 'plate_stack') return;

  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.ellipse(sx, sy + 4, 25, 12, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < state.plateStack.count; i++) {
    const oy = sy - i * 4;
    const rimGrad = ctx.createRadialGradient(sx, oy, 12, sx, oy, 24);
    rimGrad.addColorStop(0, "#f1f5f9"); rimGrad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = rimGrad;
    ctx.beginPath(); ctx.ellipse(sx, oy, 23, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fefefe";
    ctx.beginPath(); ctx.ellipse(sx, oy + 1, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(sx, oy + 1, 16, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(sx, oy, 23, 11, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = "white"; ctx.font = "bold 13px Arial";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 4;
  ctx.fillText(`${state.plateStack.count}/${state.plateStack.maxCount}`, sx, sy - state.plateStack.count * 4 - 15);
  ctx.shadowBlur = 0;
}
