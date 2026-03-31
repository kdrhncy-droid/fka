import { SPICE_RACK_POS } from '../types/game';

export function drawSpiceRack(ctx: CanvasRenderingContext2D) {
    const { x, y } = SPICE_RACK_POS;
    const W = 70, H = 60;

    ctx.save();

    // ── Gölge ────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y + H / 2 + 6, W / 2 + 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Ana platform (ahşap raf) ──────────────────────────────────────────────
    const grad = ctx.createLinearGradient(x - W/2, y - H/2, x - W/2, y + H/2);
    grad.addColorStop(0, '#c8874a');
    grad.addColorStop(1, '#8b5e3c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x - W/2, y - H/2, W, H, 8);
    ctx.fill();
    ctx.strokeStyle = '#6b3f1e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── Raf çizgisi (dekoratif) ───────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - W/2 + 6, y - 2);
    ctx.lineTo(x + W/2 - 6, y - 2);
    ctx.stroke();

    // ── Baharat kavanozları (2 sıra x 3 sütun) ───────────────────────────────
    const jarW = 14, jarH = 16;
    const cols = 3, rows = 2;
    const startX = x - (cols - 1) * 18 / 2;
    const startY = y - 14;
    const jarColors = [
        ['#e53e3e', '#dd6b20', '#d69e2e'],
        ['#c05621', '#9b2335', '#e53e3e'],
    ];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const jx = startX + col * 18;
            const jy = startY + row * 20;

            // Kavanoz gövdesi
            ctx.fillStyle = jarColors[row][col];
            ctx.beginPath();
            ctx.roundRect(jx - jarW/2, jy - jarH/2, jarW, jarH, 3);
            ctx.fill();

            // Kavanoz kapağı (metalik)
            const capGrad = ctx.createLinearGradient(jx - jarW/2, jy - jarH/2, jx + jarW/2, jy - jarH/2);
            capGrad.addColorStop(0, '#a0aec0');
            capGrad.addColorStop(0.5, '#e2e8f0');
            capGrad.addColorStop(1, '#a0aec0');
            ctx.fillStyle = capGrad;
            ctx.fillRect(jx - jarW/2, jy - jarH/2, jarW, 5);

            // Kavanoz parlaklık
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(jx - jarW/2 + 2, jy - jarH/2 + 6, 4, jarH - 8);
        }
    }

    // ── Ana 🌶️ ikonu ──────────────────────────────────────────────────────────
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌶️', x + 22, y + 8);

    // ── Etiket ────────────────────────────────────────────────────────────────
    ctx.font = 'bold 8px Arial';
    ctx.fillStyle = '#fff8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BAHARAT', x, y + H/2 - 6);

    ctx.restore();
}
