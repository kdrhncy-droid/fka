import React, { useEffect, useRef } from 'react';
import { CHARACTER_TYPES } from '../types/game';
import { stk, adjustColor } from '../renderer/rendererUtils';

interface CharacterPreviewProps {
    charType: number;
    size?: number;
    hairColor?: string;
    hairStyle?: string;
    outfitStyle?: string;
    clothingColor?: string;
    faceShape?: number;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ charType, size = 120, hairColor, hairStyle = 'default', outfitStyle = 'default', clothingColor, faceShape = 0 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const typeId = Math.min(charType, CHARACTER_TYPES.length - 1);
    const charDef = CHARACTER_TYPES[typeId];
    const bodyColor = clothingColor || charDef.bodyColor;
    const accentColor = charDef.accent;
    const hairCol = hairColor || '#4b2c20';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvas temizle
        ctx.fillStyle = 'transparent';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Karakterin merkez konumu
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // ── AYAKLAR ──────────────────────────────────────────────────────────
        const footY = 22;
        const footX = 8;
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(-footX, footY, 6, 0, Math.PI * 2); ctx.fill();
        stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.arc(footX, footY, 6, 0, Math.PI * 2); ctx.fill();
        stk(ctx, '#000', 1.5);

        // ── GÖVDE ────────────────────────────────────────────────────────────
        const bodyW = 28;
        const bodyH = 22;
        const bodyY = 2;
        ctx.beginPath(); ctx.roundRect(-bodyW/2, bodyY, bodyW, bodyH, 12);
        const bodyG = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
        bodyG.addColorStop(0, adjustColor(bodyColor, 20));
        bodyG.addColorStop(1, bodyColor);
        ctx.fillStyle = bodyG; ctx.fill(); stk(ctx, '#000', 2);

        // Kıyafet detayı
        if (outfitStyle === 'chef') {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath(); ctx.roundRect(-bodyW/2 + 4, bodyY + 1, bodyW - 8, bodyH - 2, 8); ctx.fill();
            ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#aaa';
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, bodyY + 5 + i * 5, 1.5, 0, Math.PI * 2); ctx.fill(); }
        } else if (outfitStyle === 'waiter') {
            ctx.fillStyle = 'rgba(20,20,20,0.9)';
            ctx.beginPath(); ctx.roundRect(-bodyW/2 + 5, bodyY + 1, bodyW - 10, bodyH - 2, 6); ctx.fill();
            ctx.fillStyle = 'rgba(240,240,240,0.9)';
            ctx.beginPath(); ctx.roundRect(-3, bodyY + 2, 6, bodyH - 4, 3); ctx.fill();
            ctx.fillStyle = '#cc0000';
            ctx.beginPath(); ctx.ellipse(-4, bodyY + 3, 4, 2.5, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(4, bodyY + 3, 4, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#aa0000';
            ctx.beginPath(); ctx.arc(0, bodyY + 3, 2.5, 0, Math.PI * 2); ctx.fill();
        } else if (outfitStyle === 'hoodie') {
            ctx.fillStyle = adjustColor(bodyColor, -15);
            ctx.beginPath(); ctx.roundRect(-bodyW/2 + 3, bodyY + 1, bodyW - 6, bodyH - 2, 9); ctx.fill();
            stk(ctx, adjustColor(bodyColor, -30), 1);
            ctx.fillStyle = adjustColor(bodyColor, -25);
            ctx.beginPath(); ctx.roundRect(-8, bodyY + 10, 16, 9, 4); ctx.fill();
        } else if (outfitStyle === 'suit') {
            ctx.fillStyle = adjustColor(bodyColor, -30);
            ctx.beginPath(); ctx.roundRect(-bodyW/2 + 2, bodyY + 1, bodyW - 4, bodyH - 2, 8); ctx.fill();
            stk(ctx, '#000', 1);
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath(); ctx.roundRect(-4, bodyY + 2, 8, bodyH - 4, 3); ctx.fill();
            ctx.fillStyle = '#1a3a8f';
            ctx.beginPath();
            ctx.moveTo(-2, bodyY + 3); ctx.lineTo(2, bodyY + 3);
            ctx.lineTo(3, bodyY + 14); ctx.lineTo(0, bodyY + 17); ctx.lineTo(-3, bodyY + 14);
            ctx.closePath(); ctx.fill();
        } else if (outfitStyle === 'apron') {
            ctx.fillStyle = adjustColor(bodyColor, 30);
            ctx.beginPath(); ctx.roundRect(-9, bodyY + 3, 18, bodyH - 4, 4); ctx.fill();
            stk(ctx, adjustColor(bodyColor, -10), 1);
            ctx.strokeStyle = adjustColor(bodyColor, 30); ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(-6, bodyY + 3); ctx.lineTo(-8, bodyY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(6, bodyY + 3); ctx.lineTo(8, bodyY); ctx.stroke();
        } else {
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.roundRect(-bodyW/2 + 4, bodyY + 2, bodyW - 8, 6, 4); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // ── ELLER ────────────────────────────────────────────────────────────
        const handY = 12;
        const handX = 16;
        const skinTone = '#f5c090';
        ctx.fillStyle = skinTone;
        ctx.beginPath(); ctx.arc(-handX, handY, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.arc(handX, handY, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);

        // ── KAFA ──────────────────────────────────────────────────────────────
        const headR = 18.7;
        const headY = -15;

        // Yüz Şekli Uygulama
        ctx.beginPath();
        if (faceShape === 1) { // Karemsi
            ctx.roundRect(-headR, headY - headR, headR * 2, headR * 2, 8);
        } else if (faceShape === 2) { // Sivri
            ctx.moveTo(0, headY + headR + 2);
            ctx.lineTo(-headR, headY - headR / 2);
            ctx.lineTo(-headR / 2, headY - headR);
            ctx.lineTo(headR / 2, headY - headR);
            ctx.lineTo(headR, headY - headR / 2);
            ctx.closePath();
        } else { // Normal (Yuvarlak)
            ctx.arc(0, headY, headR, 0, Math.PI * 2);
        }
        
        const headG = ctx.createRadialGradient(-4, headY - 4, 2, 0, headY, headR);
        headG.addColorStop(0, '#fff1e0'); headG.addColorStop(1, '#f5c090');
        ctx.fillStyle = headG; ctx.fill(); stk(ctx, '#000', 2);

        // ── SAÇ ──────────────────────────────────────────────────────────────
        ctx.fillStyle = hairCol;
        ctx.strokeStyle = adjustColor(hairCol, -20);
        ctx.lineWidth = 1;

        if (hairStyle === 'short') {
            ctx.beginPath();
            ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
            ctx.lineTo(headR + 1, headY + 1);
            ctx.lineTo(headR - 5, headY + 1);
            ctx.lineTo(-headR + 5, headY + 1);
            ctx.lineTo(-headR - 1, headY + 1);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        } else if (hairStyle === 'long') {
            ctx.beginPath();
            ctx.arc(0, headY - 5, headR + 1, Math.PI, 0);
            ctx.lineTo(headR + 1, headY + 2);
            ctx.lineTo(headR + 3, headY + 18);
            ctx.lineTo(headR - 2, headY + 20);
            ctx.lineTo(headR - 6, headY + 14);
            ctx.lineTo(-headR + 6, headY + 14);
            ctx.lineTo(-headR + 2, headY + 20);
            ctx.lineTo(-headR - 3, headY + 18);
            ctx.lineTo(-headR - 1, headY + 2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.strokeStyle = adjustColor(hairCol, -30); ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(0, headY - headR); ctx.lineTo(0, headY + 14); ctx.stroke();
        } else if (hairStyle === 'wavy') {
            ctx.beginPath();
            ctx.arc(0, headY - 5, headR + 1, Math.PI, 0);
            ctx.lineTo(headR + 1, headY + 2);
            ctx.bezierCurveTo(headR + 5, headY + 6, headR + 1, headY + 10, headR + 4, headY + 14);
            ctx.bezierCurveTo(headR + 6, headY + 18, headR + 1, headY + 20, headR - 2, headY + 22);
            ctx.lineTo(headR - 6, headY + 14);
            ctx.lineTo(-headR + 6, headY + 14);
            ctx.lineTo(-headR + 2, headY + 22);
            ctx.bezierCurveTo(-headR - 1, headY + 20, -headR - 6, headY + 18, -headR - 4, headY + 14);
            ctx.bezierCurveTo(-headR - 1, headY + 10, -headR - 5, headY + 6, -headR - 1, headY + 2);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        } else if (hairStyle === 'afro') {
            ctx.beginPath();
            ctx.arc(0, headY - 4, headR + 8, Math.PI * 0.85, Math.PI * 2.15);
            ctx.arc(0, headY + 2, headR + 1, 0, Math.PI);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = adjustColor(hairCol, -15);
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const r = headR + 4;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r * 0.6, headY - 4 + Math.sin(a) * r * 0.5, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (hairStyle === 'bun') {
            ctx.beginPath();
            ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
            ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
            ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = hairCol;
            ctx.beginPath(); ctx.arc(0, headY - headR - 5, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = adjustColor(hairCol, -25); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, headY - headR - 5, 5, 0.3, Math.PI - 0.3); ctx.stroke();
        } else if (hairStyle === 'spiky') {
            ctx.beginPath();
            ctx.arc(0, headY - 3, headR + 1, Math.PI * 0.75, Math.PI * 0.25);
            ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
            ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            const spikes = [[-12], [-6], [0], [6], [12]];
            spikes.forEach(([sx]) => {
                const baseY = headY - headR + 1;
                ctx.beginPath();
                ctx.moveTo(sx - 5, baseY + 2);
                ctx.lineTo(sx, baseY - 10 - Math.abs(sx) * 0.2);
                ctx.lineTo(sx + 5, baseY + 2);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            });
        } else if (hairStyle === 'ponytail') {
            ctx.beginPath();
            ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
            ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
            ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(headR - 2, headY - 4);
            ctx.bezierCurveTo(headR + 10, headY, headR + 12, headY + 10, headR + 6, headY + 22);
            ctx.bezierCurveTo(headR + 10, headY + 22, headR + 14, headY + 10, headR + 8, headY - 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = adjustColor(hairCol, -40);
            ctx.beginPath(); ctx.arc(headR + 2, headY - 2, 3, 0, Math.PI * 2); ctx.fill();
        } else if (hairStyle === 'mohawk') {
            ctx.beginPath();
            ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
            ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
            ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-5, headY - headR + 2);
            ctx.lineTo(-7, headY - headR - 18);
            ctx.lineTo(0, headY - headR - 22);
            ctx.lineTo(7, headY - headR - 18);
            ctx.lineTo(5, headY - headR + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
            // default
            ctx.beginPath();
            ctx.arc(0, headY - 5, headR + 1, Math.PI, 0);
            ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
            ctx.lineTo(headR - 8, headY - 2); ctx.lineTo(-headR + 8, headY - 2);
            ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // Yanaklar
        ctx.fillStyle = 'rgba(255,182,193,0.5)';
        ctx.beginPath(); ctx.arc(-10, headY + 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, headY + 5, 4, 0, Math.PI * 2); ctx.fill();

        // Gözler
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.ellipse(-7, headY + 2, 3, 4.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(7, headY + 2, 3, 4.2, 0, 0, Math.PI * 2); ctx.fill();
        
        // Göz parıltısı
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-6, headY, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, headY, 1.2, 0, Math.PI * 2); ctx.fill();

        // Ağız
        ctx.strokeStyle = '#844'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, headY + 7, 3.5, 0.2, Math.PI - 0.2); ctx.stroke();

        // ── ŞAPKA (kaldırıldı — emoji artık çizilmiyor) ────────────────────────

        ctx.restore();
    }, [charType, hairColor, hairStyle, outfitStyle, clothingColor, faceShape]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="w-full h-full"
        />
    );
};
