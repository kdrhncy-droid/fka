export function drawDirtyTable(ctx: CanvasRenderingContext2D, seatX: number, seatY: number, tableLayout?: Record<string, { x: number; y: number }>) {
  // seatY ve seatX üzerinden ilgili masanın Y koordinatını bul
  let isTopSeat = true;
  if (tableLayout && Object.keys(tableLayout).length > 0) {
    // Müşterinin oturduğu koltuğun x eksenindeki en yakın masayı bul
    const closestTable = Object.values(tableLayout).reduce((prev, curr) => 
       Math.abs(curr.x - seatX) < Math.abs(prev.x - seatX) ? curr : prev
    );
    isTopSeat = seatY < closestTable.y;
  } else {
    // Güvenli fallback (Layout Editor bozuksa vs)
    isTopSeat = seatY < 570; // Eskisi 500'dü
  }
  
  const plateY = isTopSeat ? seatY + 27 : seatY - 27;

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(seatX + 1, plateY + 3, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath(); ctx.ellipse(seatX, plateY, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(seatX, plateY, 18, 8, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(seatX - 4, plateY - 1, 2.5, 0, Math.PI * 2);
  ctx.arc(seatX + 3, plateY + 1, 2, 0, Math.PI * 2);
  ctx.arc(seatX + 8, plateY - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
