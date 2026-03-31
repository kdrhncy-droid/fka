import { SPICE_RACK_POS, SPICE_RACK_R } from '../types/game';

export function drawSpiceRack(ctx: CanvasRenderingContext2D) {
    const { x, y } = SPICE_RACK_POS;
    const r = SPICE_RACK_R;

    // Ana platform - ahşap rengi
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - r/2, y - r/2, r, r);
    
    // Kenar çerçevesi
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - r/2, y - r/2, r, r);

    // Baharat kavanozları (3x2 grid)
    const jarSize = 12;
    const spacing = 20;
    const colors = ['#ff4444', '#ff8800', '#ffaa00', '#cc4400', '#aa2200', '#ff6600'];
    
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            const jarX = x - 25 + col * spacing;
            const jarY = y - 15 + row * 25;
            
            // Kavanoz gövdesi
            ctx.fillStyle = colors[row * 3 + col];
            ctx.fillRect(jarX - jarSize/2, jarY - jarSize/2, jarSize, jarSize);
            
            // Kavanoz kapağı
            ctx.fillStyle = '#666';
            ctx.fillRect(jarX - jarSize/2, jarY - jarSize/2, jarSize, 4);
        }
    }

    // Ana ikon - büyük biber
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌶️', x, y + 15);

    // Etiket
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('BAHARAT', x, y + 35);
}