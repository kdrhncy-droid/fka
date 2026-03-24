import { SERVICE_WINDOW_SLOTS, ServiceWindowSlot, DISH_ITEMS, CLEAN_PLATE, DIRTY_PLATE } from '../../shared/types';

/**
 * Duvar üzerindeki servis penceresi — mutfak/salon arası yemek geçiş noktası
 */
export function drawServiceWindow(
    ctx: CanvasRenderingContext2D,
    serviceWindow: ServiceWindowSlot[]
) {
    if (!serviceWindow?.length) return;

    const slotW = 52;
    const slotH = 36;

    // Pencere çerçevesi — tüm slotları kapsayan tek bir çerçeve
    const first = SERVICE_WINDOW_SLOTS[0];
    const last = SERVICE_WINDOW_SLOTS[SERVICE_WINDOW_SLOTS.length - 1];
    const frameX = first.x - slotW / 2 - 8;
    const frameY = first.y - slotH / 2 - 10;
    const frameW = (last.x - first.x) + slotW + 16;
    const frameH = slotH + 20;

    ctx.save();

    // Çerçeve gölgesi
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(frameX + 4, frameY + 4, frameW, frameH);

    // Çerçeve arka planı (koyu ahşap)
    const frameGrad = ctx.createLinearGradient(frameX, frameY, frameX, frameY + frameH);
    frameGrad.addColorStop(0, '#5c3d1e');
    frameGrad.addColorStop(1, '#3b2410');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 8);
    ctx.fill();
    ctx.strokeStyle = '#2a1a08';
    ctx.lineWidth = 2;
    ctx.stroke();

    // "SERVİS" etiketi
    ctx.fillStyle = '#f0ddb8';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🍽️ SERVİS PENCERESİ', frameX + frameW / 2, frameY + 2);

    // Her slot
    for (const slotDef of SERVICE_WINDOW_SLOTS) {
        const slot = serviceWindow.find(s => s.id === slotDef.id);
        const item = slot?.item ?? null;
        const { x, y } = slotDef;

        ctx.save();
        ctx.translate(x, y);

        // Slot arka planı
        const slotGrad = ctx.createLinearGradient(0, -slotH / 2, 0, slotH / 2);
        slotGrad.addColorStop(0, item ? '#fef3c7' : '#292524');
        slotGrad.addColorStop(1, item ? '#fde68a' : '#1c1917');
        ctx.fillStyle = slotGrad;
        ctx.beginPath();
        ctx.roundRect(-slotW / 2, -slotH / 2, slotW, slotH, 5);
        ctx.fill();
        ctx.strokeStyle = item ? '#d97706' : '#44403c';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (item) {
            // Item emoji
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillText(item === CLEAN_PLATE ? '🍽️' : item === DIRTY_PLATE ? '🍽️' : item, 1, 1);
            ctx.fillStyle = '#000';
            ctx.fillText(item === CLEAN_PLATE ? '🍽️' : item === DIRTY_PLATE ? '🍽️' : item, 0, 0);
        } else {
            // Boş slot göstergesi
            ctx.strokeStyle = '#57534e';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.roundRect(-slotW / 2 + 4, -slotH / 2 + 4, slotW - 8, slotH - 8, 3);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    ctx.restore();
}
