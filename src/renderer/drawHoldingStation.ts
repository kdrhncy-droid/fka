import { HoldingStation } from '../types/game';

export function drawHoldingStation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    station: HoldingStation | undefined
) {
    // ── Zemin / Tezgah Parçası (İsteğe Bağlı Altlık) ─────────────────────────
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath();
    ctx.roundRect(x - 35, y - 25, 70, 50, 6);
    ctx.fill();
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Tabak ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#f8fafc'; // Beyaz porselen
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tabak iç gölgesi / derinliği
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 16, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dış kenarlık
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    // ── İçindeki Yemek (Varsa) ─────────────────────────────────────────────
    if (station && station.item) {
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Yemeğin biraz yukarıda durması için y-6 offseti
        ctx.fillText(station.item, x, y - 6);
    }
}
