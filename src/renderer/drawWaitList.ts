import { WaitingGuest } from '../types/game';
import { stk, lighten } from './rendererUtils';
import { DOOR_X } from '../../shared/constants';
import { PERS_COLORS } from '../../shared/customerColors';
const QUEUE_START_Y = 755; // Kapının hemen önü (kaldırım)
const SLOT_SPACING = 52;   // Her müşteri arası mesafe
const GROUP_GAP = 14;      // Grup arası ekstra boşluk

// Kişiliğe göre renk — shared/customerColors.ts'ten import edilir

function chibiBodyProps(shape: 1 | 2 | 3 | 4) {
    switch (shape) {
        case 2: return { bw: 28, bh: 19, hr: 17 };
        case 3: return { bw: 19, bh: 22, hr: 15 };
        case 4: return { bw: 24, bh: 16, hr: 16 };
        default:return { bw: 22, bh: 19, hr: 16 };
    }
}

function drawQueueCustomer(ctx: CanvasRenderingContext2D, guest: WaitingGuest, x: number, y: number) {
    const pers = guest.personality ?? 'polite';
    const shape = (guest.bodyShape ?? 1) as 1 | 2 | 3 | 4;
    const pc = PERS_COLORS[pers] ?? PERS_COLORS.polite;
    const bodyColor = pc.body;
    const skinColor = pc.skin;
    const hairCol   = pc.hair;
    const { bw, bh, hr } = chibiBodyProps(shape);

    ctx.save();
    ctx.translate(x, y);

    // Gölge
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 20, 14, 6, 0, 0, Math.PI * 2); ctx.fill();

    // Ayaklar
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(-7, 19, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);
    ctx.beginPath(); ctx.ellipse(7, 19, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);

    // Gövde
    const bodyY = -bh / 2 + 2;
    ctx.beginPath(); ctx.roundRect(-bw / 2, bodyY, bw, bh, 8);
    const bg = ctx.createLinearGradient(0, bodyY, 0, bodyY + bh);
    bg.addColorStop(0, lighten(bodyColor, 20));
    bg.addColorStop(1, bodyColor);
    ctx.fillStyle = bg; ctx.fill(); stk(ctx, '#000', 1.5);

    // Recep çizgili gömlek
    if (pers === 'recep') {
        ctx.strokeStyle = '#ff6633'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const lx = -bw / 2 + 4 + i * (bw / 3);
            ctx.beginPath(); ctx.moveTo(lx, bodyY + 3); ctx.lineTo(lx, bodyY + bh - 3); ctx.stroke();
        }
    }

    // Eller
    const handY = bodyY + bh / 2;
    const handX = bw / 2 + 3;
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(-handX, handY, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);
    ctx.beginPath(); ctx.arc(handX, handY, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);

    // Kafa
    const headY = bodyY - hr + 3;
    ctx.beginPath(); ctx.arc(0, headY, hr, 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(-3, headY - 3, 1, 0, headY, hr);
    hg.addColorStop(0, lighten(skinColor, 15)); hg.addColorStop(1, skinColor);
    ctx.fillStyle = hg; ctx.fill(); stk(ctx, '#000', 1.5);

    // Saç
    ctx.fillStyle = hairCol;
    if (pers === 'recep') {
        ctx.beginPath(); ctx.roundRect(-hr * 0.85, headY - hr * 0.95, hr * 1.7, hr * 0.45, [4, 4, 0, 0]); ctx.fill();
    } else if (pers !== 'thug') {
        ctx.beginPath(); ctx.arc(0, headY, hr, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.arc(0, headY - hr + 4, hr * 0.8, Math.PI, 0); ctx.fill();
    }

    // Yüz
    const eyeY = headY + 2;
    const eyeX = hr * 0.35;

    if (pers === 'thug') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath(); ctx.roundRect(-hr * 0.75, eyeY - 4, hr * 1.5, 8, 2); ctx.fill();
        ctx.fillStyle = '#cc0000';
        ctx.beginPath(); ctx.arc(-eyeX, eyeY, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX, eyeY, 2, 0, Math.PI * 2); ctx.fill();
        // Şapka
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.ellipse(0, headY - hr + 3, hr * 1.1, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(-hr * 0.8, headY - hr * 1.65, hr * 1.6, hr * 0.8, [3, 3, 0, 0]); ctx.fill();
        stk(ctx, '#333', 1);
    } else if (pers === 'drunk') {
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        [[-eyeX, eyeY], [eyeX, eyeY]].forEach(([ex, ey]) => {
            ctx.beginPath(); ctx.moveTo(ex - 3, ey - 3); ctx.lineTo(ex + 3, ey + 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ex + 3, ey - 3); ctx.lineTo(ex - 3, ey + 3); ctx.stroke();
        });
        ctx.fillStyle = 'rgba(255,100,120,0.5)';
        ctx.beginPath(); ctx.ellipse(-hr * 0.55, headY + 4, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hr * 0.55, headY + 4, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.ellipse(-eyeX, eyeY, 2.2, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 2.2, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-eyeX + 0.8, eyeY - 1.2, 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX + 0.8, eyeY - 1.2, 0.9, 0, Math.PI * 2); ctx.fill();

        if (pers === 'rude') {
            ctx.fillStyle = '#111';
            ctx.save(); ctx.translate(-eyeX, eyeY - 6); ctx.rotate(-0.35); ctx.fillRect(-4, -1.5, 8, 2.5); ctx.restore();
            ctx.save(); ctx.translate(eyeX, eyeY - 6); ctx.rotate(0.35); ctx.fillRect(-4, -1.5, 8, 2.5); ctx.restore();
        } else if (pers === 'vip') {
            // Taç
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-hr * 0.65, headY - hr + 2);
            ctx.lineTo(-hr * 0.45, headY - hr - 8);
            ctx.lineTo(-hr * 0.1, headY - hr - 3);
            ctx.lineTo(0, headY - hr - 11);
            ctx.lineTo(hr * 0.1, headY - hr - 3);
            ctx.lineTo(hr * 0.45, headY - hr - 8);
            ctx.lineTo(hr * 0.65, headY - hr + 2);
            ctx.closePath(); ctx.fill(); stk(ctx, '#b8860b', 1.2);
        } else if (pers === 'inspector') {
            ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(-eyeX, eyeY, 4.5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(eyeX, eyeY, 4.5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-eyeX + 4.5, eyeY); ctx.lineTo(eyeX - 4.5, eyeY); ctx.stroke();
        }

        // Ağız
        const mouthY = headY + hr * 0.45;
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (pers === 'polite') ctx.arc(0, mouthY - 2, 5, 0.15 * Math.PI, 0.85 * Math.PI);
        else if (pers === 'rude') ctx.arc(0, mouthY + 2, 5, 1.15 * Math.PI, 1.85 * Math.PI);
        else ctx.arc(0, mouthY - 1, 3.5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }

    // Yemek balonu (ne istediği)
    if (guest.wants) {
        const headTopExtra = (pers === 'vip') ? 14 : (pers === 'thug') ? 12 : 0;
        const bubbleY = headY - hr - 10 - headTopExtra;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, bubbleY, 12, 0, Math.PI * 2); ctx.fill();
        stk(ctx, bodyColor, 1.5);
        ctx.font = '13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(guest.wants, 0, bubbleY);
    }

    ctx.restore();
}

const CANVAS_HEIGHT = 870; // GAME_HEIGHT
const MAX_VISIBLE_Y = CANVAS_HEIGHT + 30; // biraz taşmaya izin ver, sonra kes

export function drawWaitList(ctx: CanvasRenderingContext2D, list: WaitingGuest[]) {
    if (list.length === 0) return;

    let currentY = QUEUE_START_Y;
    let prevGroupId: string | undefined = undefined;
    let visibleCount = 0;

    for (let i = 0; i < list.length; i++) {
        const guest = list[i];

        // Yeni grup başlıyorsa ekstra boşluk ekle
        if (i > 0 && guest.groupId !== prevGroupId) {
            currentY += GROUP_GAP;
        }

        // Canvas dışına taşıyorsa çizme, sayacı göster
        if (currentY > MAX_VISIBLE_Y) {
            const remaining = list.length - visibleCount;
            const labelX = DOOR_X;
            const labelY = MAX_VISIBLE_Y - 10;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath(); ctx.roundRect(labelX - 24, labelY - 10, 48, 20, 6); ctx.fill();
            ctx.fillStyle = '#fde68a'; ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`+${remaining} daha`, labelX, labelY);
            break;
        }

        drawQueueCustomer(ctx, guest, DOOR_X, currentY);
        visibleCount++;
        currentY += SLOT_SPACING;
        prevGroupId = guest.groupId;
    }

    // Kaç kişi beklediğini gösteren etiket (kapı yanı)
    const labelX = DOOR_X + 55;
    const labelY = QUEUE_START_Y - 10;
    ctx.fillStyle = 'rgba(120, 53, 15, 0.85)';
    ctx.beginPath(); ctx.roundRect(labelX - 28, labelY - 10, 56, 20, 6); ctx.fill();
    ctx.fillStyle = '#fde68a'; ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`👥 ${list.length}`, labelX, labelY);
}
