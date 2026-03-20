/** PlateUp tarzı 3D servis istasyonu — ön yüz + üst yüz perspektif illüzyonu */
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

    // ── Zemin gölgesi (ellips) ────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath();
    ctx.ellipse(x + 4, bodyY + bodyH + 6, w * 0.48, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Ön yüz (front face — alt koyu panel) ─────────────────────────────────
    const frontGrad = ctx.createLinearGradient(x, bodyY, x, bodyY + bodyH);
    frontGrad.addColorStop(0, '#7a6245');
    frontGrad.addColorStop(1, '#503c20');
    ctx.fillStyle = frontGrad;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, bodyY, w, bodyH, [0, 0, 9, 9]);
    ctx.fill();

    ctx.strokeStyle = '#3d2a0e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Ön yüz alt kenar vurgusu ──────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 5, bodyY + bodyH - 6);
    ctx.lineTo(x + w / 2 - 5, bodyY + bodyH - 6);
    ctx.stroke();

    // ── Üst yüz (top face — renk, perspektif trapez) ─────────────────────────
    const topColor = locked ? '#78716c' : color;
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, bodyY);
    ctx.lineTo(x - w / 2 + 11, topY);
    ctx.lineTo(x + w / 2 - 11, topY);
    ctx.lineTo(x + w / 2, bodyY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Üst yüz parlama (sol üst köşe) ───────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 11, topY);
    ctx.lineTo(x - w / 2 + 28, topY);
    ctx.lineTo(x - w / 2 + 18, topY + topDepth * 0.45);
    ctx.lineTo(x - w / 2 + 1, topY + topDepth * 0.45);
    ctx.closePath();
    ctx.fill();

    // ── Üst yüz ön kenar ayırıcı çizgi ───────────────────────────────────────
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, bodyY);
    ctx.lineTo(x + w / 2, bodyY);
    ctx.stroke();

    // ── İkon (üst yüz ortası) ────────────────────────────────────────────────
    const iconY = topY + topDepth / 2 + 1;
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillText(locked ? '🔒' : icon, x + 1, iconY + 1);
    ctx.fillText(locked ? '🔒' : icon, x, iconY);

    // ── Etiket (ön yüz ortası) ────────────────────────────────────────────────
    ctx.fillStyle = locked ? '#a8a29e' : '#f0ddb8';
    ctx.font = 'bold 9px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText(locked ? 'Kilitli' : label, x, bodyY + bodyH / 2 + 1);

    ctx.globalAlpha = 1;
    ctx.restore();
}
