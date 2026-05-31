const TYPE_LABELS: Record<string, string> = {
  serviceWindow:    'Servis',
  sink:             'Lavabo',
  trash:            'Çöp',
  trayStation:      'Tepsi',
  dirtyTrayBasket:  'Kirli Tepsi',
  dirtyTable:       'Kirli Masa',
  plateStack:       'Tabaklar',
  choppingBoard:    'Kesme Tahtası',
  fryer:            'Fritöz',
  fridge:           'Buzdolabı',
  cakeBaker:        'Pasta Fırını',
  coffeeMachine:    'Kahve Makinesi',
  cookStation:      'Fırın',
  customer:         'Müşteri',
  ingredient:       'Malzeme',
};

export function drawInteractionRing(
  ctx: CanvasRenderingContext2D,
  nearest: { x: number; y: number; type?: string } | null,
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

  // İstasyon etiketi
  if (nearest.type) {
    const label = TYPE_LABELS[nearest.type] ?? nearest.type;
    const labelY = nearest.y - 48;

    ctx.font = 'bold 11px sans-serif';
    const textWidth = ctx.measureText(label).width;
    const padX = 6;
    const padY = 4;
    const boxW = textWidth + padX * 2;
    const boxH = 18;
    const boxX = nearest.x - boxW / 2;
    const boxY = labelY - boxH / 2;

    // Arkaplan
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 4);
    ctx.fill();

    // Metin
    ctx.fillStyle = 'rgba(34, 197, 94, 1)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, nearest.x, labelY);
  }

  ctx.restore();
}
