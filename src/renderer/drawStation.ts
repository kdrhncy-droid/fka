/** PlateUp tarzı 3D servis istasyonu — SVG preview kalitesinde */
export function drawStation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    icon: string,
    label: string,
    _stock?: number,
    locked?: boolean,
) {
    const w = 62;
    const bodyH = 30;
    const topDepth = 22;
    const bodyY = y - bodyH / 2 + 10;
    const topY = bodyY - topDepth;

    ctx.save();
    if (locked) ctx.globalAlpha = 0.38;

    // ── Zemin gölgesi ─────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 4, bodyY + bodyH + 6, w * 0.48, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Ön yüz ───────────────────────────────────────────────────────────────
    const frontGrad = ctx.createLinearGradient(x, bodyY, x, bodyY + bodyH);
    frontGrad.addColorStop(0, '#7a6245');
    frontGrad.addColorStop(1, '#4a3010');
    ctx.fillStyle = frontGrad;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, bodyY, w, bodyH, [0, 0, 9, 9]);
    ctx.fill();
    ctx.strokeStyle = '#3d2a0e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ön yüz alt vurgu çizgisi
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 6, bodyY + bodyH - 7);
    ctx.lineTo(x + w / 2 - 6, bodyY + bodyH - 7);
    ctx.stroke();

    // ── Üst yüz (trapez) ─────────────────────────────────────────────────────
    const topColor = locked ? '#78716c' : color;
    // üst yüz gradient
    const topGrad = ctx.createLinearGradient(x, topY, x, bodyY);
    topGrad.addColorStop(0, locked ? '#6b6560' : lighten(topColor, 18));
    topGrad.addColorStop(1, topColor);
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, bodyY);
    ctx.lineTo(x - w / 2 + 11, topY);
    ctx.lineTo(x + w / 2 - 11, topY);
    ctx.lineTo(x + w / 2, bodyY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // üst yüz parlama (sol köşe)
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 11, topY);
    ctx.lineTo(x - w / 2 + 30, topY);
    ctx.lineTo(x - w / 2 + 20, topY + topDepth * 0.45);
    ctx.lineTo(x - w / 2 + 1, topY + topDepth * 0.45);
    ctx.closePath();
    ctx.fill();

    // üst/ön ayırıcı çizgi
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, bodyY);
    ctx.lineTo(x + w / 2, bodyY);
    ctx.stroke();

    // ── İkon ─────────────────────────────────────────────────────────────────
    const iconY = topY + topDepth / 2 + 1;
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // gölge
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillText(locked ? '🔒' : icon, x + 1, iconY + 1);
    ctx.fillStyle = 'rgba(0,0,0,0)'; // reset
    ctx.fillText(locked ? '🔒' : icon, x, iconY);

    // ── Etiket ────────────────────────────────────────────────────────────────
    ctx.fillStyle = locked ? '#a8a29e' : '#f0ddb8';
    ctx.font = 'bold 9px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText(locked ? 'Kilitli' : label, x, bodyY + bodyH / 2 + 1);

    ctx.globalAlpha = 1;
    ctx.restore();
}

/** Rengi belirli miktarda açar (hex → hex) */
function lighten(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
}
