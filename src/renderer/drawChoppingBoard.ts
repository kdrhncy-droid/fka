import { ChoppingBoard, CHOP_TICKS, isChopped, getChoppedSource } from '../types/game';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Doğranmış malzeme görseli — küçük parçalar halinde
function drawChoppedVisual(ctx: CanvasRenderingContext2D, emoji: string, cx: number, cy: number) {
  // 4 küçük parça, farklı açılarda
  const pieces = [
    { dx: -9, dy: -7, angle: -0.4, scale: 0.55 },
    { dx:  8, dy: -8, angle:  0.3, scale: 0.55 },
    { dx: -8, dy:  6, angle:  0.5, scale: 0.55 },
    { dx:  7, dy:  7, angle: -0.3, scale: 0.55 },
  ];

  pieces.forEach(({ dx, dy, angle, scale }) => {
    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  });

  // Kesik çizgiler efekti
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  // Yatay kesik
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 1);
  ctx.lineTo(cx + 12, cy - 1);
  ctx.stroke();
  // Dikey kesik
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy - 10);
  ctx.lineTo(cx - 1, cy + 10);
  ctx.stroke();

  // Yeşil ✓ rozeti
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(cx + 14, cy - 12, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', cx + 14, cy - 12);
}

export function drawChoppingBoard(
  ctx: CanvasRenderingContext2D,
  board: ChoppingBoard,
  time: number,
) {
  const { x, y, input, progress, isChopping } = board;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 20, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ahşap tahta gövdesi — SVG preview kalitesinde
  const woodGrad = ctx.createLinearGradient(x - 34, y - 12, x + 34, y + 16);
  woodGrad.addColorStop(0, '#c8956c');
  woodGrad.addColorStop(0.5, '#a0522d');
  woodGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = woodGrad;
  roundRect(ctx, x - 34, y - 12, 68, 32, 5);
  ctx.fill();

  // Ahşap lif çizgileri
  ctx.strokeStyle = 'rgba(120,53,15,0.45)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 28, y - 6 + i * 7);
    ctx.quadraticCurveTo(x, y - 4 + i * 7, x + 28, y - 6 + i * 7);
    ctx.stroke();
  }

  // Bıçak izleri (dikey)
  ctx.strokeStyle = 'rgba(69,26,3,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const lx = x - 18 + i * 12;
    ctx.beginPath();
    ctx.moveTo(lx, y - 10);
    ctx.lineTo(lx, y + 18);
    ctx.stroke();
  }

  // Tahta kenar
  ctx.strokeStyle = isChopped(input ?? '') ? '#16a34a' : '#451a03';
  ctx.lineWidth = isChopped(input ?? '') ? 2.5 : 2;
  roundRect(ctx, x - 34, y - 12, 68, 32, 5);
  ctx.stroke();

  // Yüzey parlaması
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(x - 10, y - 6, 14, 5, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Tutma kolu — daha kaliteli
  const kolGrad = ctx.createLinearGradient(x + 30, y - 4, x + 44, y + 14);
  kolGrad.addColorStop(0, '#92400e');
  kolGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = kolGrad;
  roundRect(ctx, x + 30, y - 4, 14, 18, 4);
  ctx.fill();
  ctx.strokeStyle = '#2c0f00';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 30, y - 4, 14, 18, 4);
  ctx.stroke();
  // kol parlama
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(x + 31, y - 3, 4, 10, 2);
  ctx.fill();

  // Üzerindeki malzeme
  if (input) {
    if (isChopped(input)) {
      // Doğranmış görsel — parçalar halinde
      drawChoppedVisual(ctx, getChoppedSource(input), x - 4, y - 2);
      // "Al" ipucu (tahtanın altında)
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E ile al', x - 4, y + 30);
    } else {
      // Ham malzeme
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(input, x - 4, y - 2);

      // Progress bar
      const barW = 50;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = y + 12;
      const pct = Math.min(1, progress / CHOP_TICKS);

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, barX - 1, barY - 1, barW + 2, barH + 2, 3);
      ctx.fill();

      const barColor = pct < 0.5 ? '#22c55e' : pct < 0.85 ? '#eab308' : '#f97316';
      ctx.fillStyle = barColor;
      if (pct > 0) {
        roundRect(ctx, barX, barY, barW * pct, barH, 3);
        ctx.fill();
      }

      if (isChopping && pct > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        roundRect(ctx, barX, barY, barW * pct, barH / 2, 3);
        ctx.fill();
      }
    }
  } else {
    // Boş tahta — etiket (tahtanın altında)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔪 Kesme Tahtası', x - 4, y + 30);
  }

  // Bıçak animasyonu (aktif kesme)
  if (isChopping && input && !isChopped(input)) {
    const chopAnim = Math.sin(time * 0.02) * 0.5 + 0.5;
    const knifeY = y - 30 - chopAnim * 10;

    ctx.save();
    ctx.translate(x - 4, knifeY);
    ctx.rotate(-0.2 + chopAnim * 0.25);
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔪', 0, 0);
    ctx.restore();
  }
}
