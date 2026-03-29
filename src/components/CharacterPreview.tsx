import React, { useEffect, useRef } from 'react';
import { CHARACTER_TYPES } from '../types/game';
import { stk, adjustColor } from '../renderer/rendererUtils';

interface CharacterPreviewProps {
    charType: number;
    size?: number;
    hairColor?: string;
    clothingColor?: string;
    faceShape?: number;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ charType, size = 120, hairColor, clothingColor, faceShape = 0 }) => {
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

        // Kıyafet detayı (Yaka/Önlük)
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.roundRect(-bodyW/2 + 4, bodyY + 2, bodyW - 8, 6, 4); ctx.fill();
        ctx.globalAlpha = 1;

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
        ctx.beginPath();
        ctx.arc(0, headY - 5, headR + 1, Math.PI, 0); // Üst saç
        ctx.lineTo(headR + 1, headY + 2);
        ctx.lineTo(headR - 4, headY + 2);
        ctx.lineTo(headR - 8, headY - 2);
        ctx.lineTo(-headR + 8, headY - 2);
        ctx.lineTo(-headR + 4, headY + 2);
        ctx.lineTo(-headR - 1, headY + 2);
        ctx.closePath();
        ctx.fill();
        stk(ctx, adjustColor(hairCol, -20), 1);

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

        // ── ŞAPKA ────────────────────────────────────────────────────────────
        ctx.font = '18px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(charDef.hat as string, 0, headY - headR - 4);

        ctx.restore();
    }, [charType, hairColor, clothingColor, faceShape]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="w-full h-full"
        />
    );
};
