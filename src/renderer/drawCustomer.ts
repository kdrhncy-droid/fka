import { Customer, TABLE_Y, EAT_TICKS } from '../types/game';

type CustomerRenderState = {
    lastX: number;
    lastY: number;
    faceRight: boolean;
    bobPhase: number;
    bobAmount: number;
};

const customerRenderState = new Map<string, CustomerRenderState>();

function getRenderState(id: string, x: number, y: number) {
    if (!customerRenderState.has(id)) {
        customerRenderState.set(id, {
            lastX: x,
            lastY: y,
            faceRight: true,
            bobPhase: 0,
            bobAmount: 0,
        });
    }

    return customerRenderState.get(id)!;
}

export function drawCustomer(ctx: CanvasRenderingContext2D, customer: Customer) {
    const { id, x, y, seatY, wants, patience, maxPatience, isSeated, isEating, eatTimer } = customer;
    const facingUp = seatY > TABLE_Y;
    const state = getRenderState(id, x, y);

    const dx = x - state.lastX;
    const dy = y - state.lastY;
    const distance = Math.hypot(dx, dy);
    const isMoving = !isSeated && distance > 0.9;

    if (isMoving) {
        state.bobPhase += 0.28;
        state.bobAmount = Math.min(1, state.bobAmount + 0.18);
        if (Math.abs(dx) > 0.25) state.faceRight = dx > 0;
    } else {
        state.bobAmount = Math.max(0, state.bobAmount - 0.22);
        if (state.bobAmount > 0) state.bobPhase += 0.18;
        else state.bobPhase = 0;
    }

    state.lastX = x;
    state.lastY = y;

    const bobbingY = Math.abs(Math.sin(state.bobPhase)) * 3.5 * state.bobAmount;
    const tilt = Math.sin(state.bobPhase) * 0.05 * state.bobAmount;
    const eatProgress = isEating ? eatTimer / EAT_TICKS : 0;

    ctx.save();
    ctx.translate(x, y);

    if (!isSeated) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    if (isSeated) {
        ctx.fillStyle = '#8b5a2b';
        ctx.beginPath();
        ctx.roundRect(-14, facingUp ? 8 : -14, 28, 6, 3);
        ctx.fill();
    }

    ctx.translate(0, -bobbingY);
    ctx.rotate(tilt);
    if (!isSeated) ctx.scale(state.faceRight ? 1 : -1, 1);

    const bodyY = isSeated ? 2 : 0;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-12, bodyY + 2, 24, 12, [0, 0, 12, 12]);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-12, bodyY - 10, 24, 14, [12, 12, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#f5d0a9';
    if (isSeated) {
        const handY = facingUp ? bodyY - 1 : bodyY + 4;
        ctx.beginPath();
        ctx.arc(-9, handY, 4.5, 0, Math.PI * 2);
        ctx.arc(9, handY, 4.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const swing = Math.sin(state.bobPhase) * 3.5 * state.bobAmount;
        ctx.beginPath();
        ctx.arc(-13 + swing, 5, 4.5, 0, Math.PI * 2);
        ctx.arc(13 - swing, 5, 4.5, 0, Math.PI * 2);
        ctx.fill();
    }

    const headY = isSeated ? (facingUp ? -12 : 2) : -22;
    const eatingHeadOffset = isEating ? Math.sin((1 - eatProgress) * Math.PI * 8) * 1.8 : 0;

    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(0, headY + 10, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.arc(0, headY + eatingHeadOffset, 12, 0, Math.PI * 2);
    ctx.fill();

    const showFace = !isSeated || !facingUp;
    if (showFace) {
        const eyeY = headY - 1 + eatingHeadOffset;
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.ellipse(-4, eyeY, 2.2, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(4, eyeY, 2.2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (isEating) {
            ctx.arc(0, headY + 4 + eatingHeadOffset, 2.4, 0, Math.PI * 2);
            ctx.fillStyle = '#7c2d12';
            ctx.fill();
        } else {
            ctx.arc(0, headY + 4 + eatingHeadOffset, 3, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(0, headY - 3, 10, Math.PI, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    if (isEating) {
        const iconY = facingUp ? y + 30 + (1 - eatProgress) * 10 : y - 30 - (1 - eatProgress) * 10;
        ctx.globalAlpha = eatProgress;
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍽️', x, iconY);
        ctx.globalAlpha = 1;
    }

    if (!isSeated) return;

    if (isEating) {
        const barY = facingUp ? y - 24 : y + 22;
        ctx.fillStyle = 'rgba(226,232,240,0.72)';
        ctx.beginPath();
        ctx.roundRect(x - 20, barY, 40, 5, 3);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.roundRect(x - 20, barY, 40 * eatProgress, 5, 3);
        ctx.fill();
        return;
    }

    const patiencePct = Math.max(0, patience / maxPatience);
    const barColor = patiencePct > 0.5 ? '#22c55e' : patiencePct > 0.25 ? '#f59e0b' : '#ef4444';
    const bubbleX = x + 30;
    const bubbleY = facingUp ? y + 40 : y - 40;
    const patienceY = facingUp ? y - 28 : y + 24;

    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.roundRect(bubbleX - 16, bubbleY - 14, 38, 28, 7);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(bubbleX - 18, bubbleY - 16, 38, 28, 7);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    if (facingUp) {
        ctx.moveTo(bubbleX - 8, bubbleY - 16);
        ctx.lineTo(x + 14, y + 6);
        ctx.lineTo(bubbleX + 4, bubbleY - 16);
    } else {
        ctx.moveTo(bubbleX - 8, bubbleY + 12);
        ctx.lineTo(x + 14, y - 6);
        ctx.lineTo(bubbleX + 4, bubbleY + 12);
    }
    ctx.fill();

    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(wants || '?', bubbleX + 1, bubbleY - 2);

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(x - 20, patienceY, 40, 5, 3);
    ctx.fill();
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(x - 20, patienceY, 40 * patiencePct, 5, 3);
    ctx.fill();
}
