import { COUNTER_POSITIONS, CLEAN_PLATE, DIRTY_PLATE, isChopped, getChoppedSource } from '../../shared/types';

// Tüm pişmiş yemekler tabakla servis edilir
const PLATED_DISHES = ['🍕', '🍔', '🥗', '🍜', '🌯'];

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
        const item = station.items[0];
        const displayItem = item && isChopped(item) ? getChoppedSource(item) : item;

        ctx.save();
        ctx.translate(x, y);

        // ═══ 3D BLOK — PlateUp tarzı tezgah ═══
        const frontH = 10; // ön yüz kalınlığı

        // Zemin gölgesi
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(-width / 2 + 3, height / 2 + frontH, width, 5);

        // ── Ön yüz (front face — daha koyu, derinlik verir) ───────────────────
        const frontGrad = ctx.createLinearGradient(0, height / 2, 0, height / 2 + frontH);
        frontGrad.addColorStop(0, '#7a5820');
        frontGrad.addColorStop(1, '#4e3410');
        ctx.fillStyle = frontGrad;
        ctx.beginPath();
        ctx.roundRect(-width / 2, height / 2, width, frontH, [0, 0, 4, 4]);
        ctx.fill();
        ctx.strokeStyle = '#3d2808';
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── Üst yüzey (top surface — açık ahşap, item burada durur) ──────────
        const topGrad = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
        topGrad.addColorStop(0, '#d4a96a');
        topGrad.addColorStop(0.5, '#c08040');
        topGrad.addColorStop(1, '#a86830');
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.roundRect(-width / 2, -height / 2, width, height, [4, 4, 0, 0]);
        ctx.fill();

        ctx.strokeStyle = '#8b6014';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-width / 2, -height / 2, width, height, [4, 4, 0, 0]);
        ctx.stroke();

        // Üst yüzey parlaması
        const shineGradient = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 + 12);
        shineGradient.addColorStop(0, 'rgba(255,255,255,0.30)');
        shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shineGradient;
        ctx.fillRect(-width / 2 + 3, -height / 2 + 2, width - 6, 12);

        // Ön/üst kenar ayırıcı çizgi (kalın, 3D illüzyon güçlendirir)
        ctx.strokeStyle = 'rgba(0,0,0,0.30)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-width / 2, height / 2);
        ctx.lineTo(width / 2, height / 2);
        ctx.stroke();

        // ═══ BLOK ÜZERİNDEKİ ITEM ═══

        if (item) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();

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

                ctx.strokeStyle = item === DIRTY_PLATE ? '#94a3b8' : '#e2e8f0';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(0, -5, 11, 4, 0, 0.2, Math.PI - 0.2);
                ctx.stroke();

                if (item === DIRTY_PLATE) {
                    ctx.fillStyle = 'rgba(146, 64, 14, 0.5)';
                    ctx.beginPath();
                    ctx.arc(-4, -5, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(3, -4, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (PLATED_DISHES.includes(item as string)) {
                // ─── YEMEKLİ TABAK ÇİZİMİ (🍕 🍔 🥗 🍜 🌯 hepsi) ───

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

                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(0, -1, 11, 4, 0, 0.2, Math.PI - 0.2);
                ctx.stroke();

                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillText(displayItem!, 1, -7);
                ctx.fillText(displayItem!, 0, -8);
            } else {
                // ─── SADECE ÇİĞ MALZEME (tabak çizilmez) ───
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillText(displayItem!, 1, 1);
                ctx.fillText(displayItem!, 0, 0);
            }
        }

        ctx.restore();
    }
}
