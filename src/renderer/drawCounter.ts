import { COUNTER_POSITIONS, CLEAN_PLATE, DIRTY_PLATE } from '../../shared/types';

/**
 * Servis bloklarını çizer (Plate Up tarzı - duvar üzerinde)
 * Her blok sadece 1 item tutar
 */
export function drawCounters(
    ctx: CanvasRenderingContext2D,
    holdingStations: Array<{ id: string; items: string[]; type: 'plate' | 'counter'; maxItems: number }>
) {
    for (const counter of COUNTER_POSITIONS) {
        const station = holdingStations.find(s => s.id === counter.id);
        if (!station) continue;

        const { x, y, width, height } = counter;
        const item = station.items[0]; // Sadece 1 item

        ctx.save();
        ctx.translate(x, y);

        // ═══ BLOK GÖVDE (Plate Up tarzı kare blok) ═══

        // Blok gölgesi (yumuşak)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(-width / 2 + 2, height / 2 + 2, width, 4);

        // Blok ana gövde (sıcak ahşap — duvarla uyumlu)
        const blockGradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
        blockGradient.addColorStop(0, '#c9a06c');
        blockGradient.addColorStop(0.5, '#b8864e');
        blockGradient.addColorStop(1, '#a07038');
        ctx.fillStyle = blockGradient;
        ctx.beginPath();
        ctx.roundRect(-width / 2, -height / 2, width, height, 4);
        ctx.fill();

        // Blok kenarı (ahşap çerçeve)
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-width / 2, -height / 2, width, height, 4);
        ctx.stroke();

        // İç kenar (detay — hafif çizgi)
        ctx.strokeStyle = 'rgba(139,105,20,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6);

        // Üst yüzey parlama (ahşap parlaması)
        const shineGradient = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 + 10);
        shineGradient.addColorStop(0, 'rgba(255,255,255,0.25)');
        shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shineGradient;
        ctx.fillRect(-width / 2 + 3, -height / 2 + 3, width - 6, 10);

        // ═══ BLOK ÜZERİNDEKİ ITEM (Sadece 1 tane) ═══

        if (item) {
            // Item gölgesi
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tabak mı yoksa yemek mi?
            if (item === CLEAN_PLATE || item === DIRTY_PLATE) {
                // ─── TABAK ÇİZİMİ ───
                const plateGradient = ctx.createRadialGradient(0, -6, 2, 0, -4, 14);
                if (item === DIRTY_PLATE) {
                    plateGradient.addColorStop(0, '#f8fafc');
                    plateGradient.addColorStop(1, '#cbd5e1');
                } else {
                    plateGradient.addColorStop(0, '#ffffff');
                    plateGradient.addColorStop(1, '#f1f5f9');
                }
                ctx.fillStyle = plateGradient;
                ctx.beginPath();
                ctx.ellipse(0, -4, 14, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tabak kenarı
                ctx.strokeStyle = item === DIRTY_PLATE ? '#94a3b8' : '#e2e8f0';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Tabak iç kenarı (3D efekt)
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(0, -5, 11, 4, 0, 0.2, Math.PI - 0.2);
                ctx.stroke();

                // Kirli tabakta leke
                if (item === DIRTY_PLATE) {
                    ctx.fillStyle = 'rgba(146, 64, 14, 0.5)';
                    ctx.beginPath();
                    ctx.arc(-4, -5, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(3, -4, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (['🍕', '🍔', '🥗'].includes(item as string)) {
                // ─── YEMEKLİ TABAK ÇİZİMİ ───

                // Önce tabak
                const plateGradient = ctx.createRadialGradient(0, -2, 2, 0, 0, 14);
                plateGradient.addColorStop(0, '#ffffff');
                plateGradient.addColorStop(1, '#f1f5f9');
                ctx.fillStyle = plateGradient;
                ctx.beginPath();
                ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Tabak iç kenarı
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(0, -1, 11, 4, 0, 0.2, Math.PI - 0.2);
                ctx.stroke();

                // Yemek emoji (tabağın üstünde)
                const icon = item;
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Emoji gölgesi
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillText(icon, 1, -7);

                // Emoji
                ctx.fillText(icon, 0, -8);
            } else {
                // ─── SADECE ÇİĞ MALZEME ───
                const icon = item;
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Sadece gölge + kendi
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillText(icon, 1, 1);
                ctx.fillText(icon, 0, 0);
            }
        }

        ctx.restore();
    }
}
