/** Bir ürün/servis istasyonu kutusu çizer — kompakt ve şık tasarım */
export function drawStation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    icon: string,
    label: string,
    stock?: number,
) {
    const w = 60, h = 56;

    ctx.save();

    // Yumuşak gölge
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2 + 3, y - h / 2 + 4, w, h, 10);
    ctx.fill();

    // Ana kutu — sıcak ahşap tezgah tonu
    const grad = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
    grad.addColorStop(0, '#e8ddd0');
    grad.addColorStop(1, '#d4c4b0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 10);
    ctx.fill();

    // İnce kenar
    ctx.strokeStyle = '#c4b49e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Üst renk bandı (malzeme kategorisi)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, 8, [10, 10, 0, 0]);
    ctx.fill();

    // İç cam parlama
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2 + 4, y - h / 2 + 10, w - 8, h / 3, 6);
    ctx.fill();

    // İkon (emoji)
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y - 4);

    // Etiket (kutunun altında)
    ctx.fillStyle = '#78716c';
    ctx.font = 'bold 10px Arial';
    ctx.fillText(label, x, y + 18);

    // Stok Badge (sağ üst köşe)
    if (stock !== undefined) {
        const badgeColor = stock > 5 ? '#22c55e' : stock > 0 ? '#f59e0b' : '#ef4444';
        const badgeX = x + w / 2 - 6;
        const badgeY = y - h / 2 + 6;

        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px Arial';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(stock), badgeX, badgeY);
    }

    ctx.restore();
}
