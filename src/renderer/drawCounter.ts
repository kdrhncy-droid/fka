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
        
        // Blok gölgesi
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-width / 2 + 2, height / 2 + 2, width, 6);

        // Blok ana gövde (koyu gri metal)
        const blockGradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
        blockGradient.addColorStop(0, '#52525b');
        blockGradient.addColorStop(0.5, '#3f3f46');
        blockGradient.addColorStop(1, '#27272a');
        ctx.fillStyle = blockGradient;
        ctx.fillRect(-width / 2, -height / 2, width, height);

        // Blok kenarı (metal çerçeve)
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 3;
        ctx.strokeRect(-width / 2, -height / 2, width, height);

        // İç kenar (detay)
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 1;
        ctx.strokeRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4);

        // Üst yüzey parlama (metal parlaması)
        const shineGradient = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 + 8);
        shineGradient.addColorStop(0, 'rgba(255,255,255,0.2)');
        shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shineGradient;
        ctx.fillRect(-width / 2 + 3, -height / 2 + 3, width - 6, 8);

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
            } else {
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
            }
        }

        ctx.restore();
    }
}
