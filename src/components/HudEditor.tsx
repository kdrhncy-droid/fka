import React, { useRef, useCallback } from 'react';
import { HudLayout, HudElementLayout, DEFAULT_HUD_LAYOUT } from '../hooks/useSettings';

interface Props {
    layout: HudLayout;
    onChange: (layout: HudLayout) => void;
    onClose: () => void;
}

interface DraggableHudItemProps {
    id: keyof HudLayout;
    layout: HudElementLayout;
    containerRef: React.RefObject<HTMLDivElement>;
    onUpdate: (id: keyof HudLayout, patch: Partial<HudElementLayout>) => void;
    children: React.ReactNode;
    label: string;
}

const DraggableHudItem: React.FC<DraggableHudItemProps> = ({ id, layout, containerRef, onUpdate, children, label }) => {
    const isDragging = useRef(false);
    const startPos = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });

    const startDrag = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        isDragging.current = true;
        startPos.current = { mx: clientX, my: clientY, ex: layout.x, ey: layout.y };
    }, [layout.x, layout.y, containerRef]);

    const onMouseDown = (e: React.MouseEvent) => {
        // Resize handle'a tıklandıysa drag başlatma
        if ((e.target as HTMLElement).dataset.resize) return;
        e.preventDefault();
        startDrag(e.clientX, e.clientY);

        const onMove = (me: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const dx = ((me.clientX - startPos.current.mx) / rect.width) * 100;
            const dy = ((me.clientY - startPos.current.my) / rect.height) * 100;
            onUpdate(id, {
                x: Math.max(0, Math.min(95, startPos.current.ex + dx)),
                y: Math.max(0, Math.min(95, startPos.current.ey + dy)),
            });
        };
        const onUp = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).dataset.resize) return;
        e.stopPropagation();
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY);

        const onMove = (te: TouchEvent) => {
            if (!isDragging.current || !containerRef.current || !te.touches[0]) return;
            te.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const dx = ((te.touches[0].clientX - startPos.current.mx) / rect.width) * 100;
            const dy = ((te.touches[0].clientY - startPos.current.my) / rect.height) * 100;
            onUpdate(id, {
                x: Math.max(0, Math.min(95, startPos.current.ex + dx)),
                y: Math.max(0, Math.min(95, startPos.current.ey + dy)),
            });
        };
        const onEnd = () => {
            isDragging.current = false;
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    };

    // Resize: köşe handle
    const onResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startScale = layout.scale;
        const startX = e.clientX;

        const onMove = (me: MouseEvent) => {
            const delta = (me.clientX - startX) / 80;
            onUpdate(id, { scale: Math.max(0.4, Math.min(2.0, startScale + delta)) });
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const onResizeTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startScale = layout.scale;
        const startX = e.touches[0].clientX;

        const onMove = (te: TouchEvent) => {
            if (!te.touches[0]) return;
            te.preventDefault();
            const delta = (te.touches[0].clientX - startX) / 80;
            onUpdate(id, { scale: Math.max(0.4, Math.min(2.0, startScale + delta)) });
        };
        const onEnd = () => {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    };

    return (
        <div
            className="absolute touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ left: `${layout.x}%`, top: `${layout.y}%`, transform: `scale(${layout.scale})`, transformOrigin: 'top left' }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* Seçim çerçevesi */}
            <div className="relative">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-400 pointer-events-none z-10" />
                {/* Label */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-600 whitespace-nowrap pointer-events-none z-10 bg-white/80 px-1 rounded">
                    {label}
                </div>
                {/* Resize handle — sağ alt köşe */}
                <div
                    data-resize="1"
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-gray-700 rounded-full z-20 cursor-se-resize flex items-center justify-center shadow-lg"
                    onMouseDown={onResizeMouseDown}
                    onTouchStart={onResizeTouchStart}
                >
                    <svg width="8" height="8" viewBox="0 0 8 8" className="pointer-events-none">
                        <path d="M1 7L7 1M4 7L7 4M7 7L7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </div>
                {children}
            </div>
        </div>
    );
};

export const HudEditor: React.FC<Props> = ({ layout, onChange, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null!);

    const updateElement = useCallback((id: keyof HudLayout, patch: Partial<HudElementLayout>) => {
        onChange({ ...layout, [id]: { ...layout[id], ...patch } });
    }, [layout, onChange]);

    const joystickSize = 128;
    const actionBtnSize = 80;
    const punchBtnSize = 72;
    const musicBtnSize = Math.round(actionBtnSize * 0.55);

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.45)' }}>
            {/* Üst bar — sade beyaz */}
            <div className="flex-none flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                <div>
                    <span className="text-gray-800 font-bold text-sm">🎮 Arayüz Düzenle</span>
                    <p className="text-gray-400 text-[11px] mt-0.5">Sürükle: taşı · Köşe tutacağı: boyutlandır</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onChange(DEFAULT_HUD_LAYOUT)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold border border-gray-300 transition-colors"
                    >
                        ↺ Sıfırla
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        ✓ Kaydet
                    </button>
                </div>
            </div>

            {/* Düzenleme alanı */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden">
                {/* Izgara arka plan */}
                <div className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '5% 5%' }}
                />

                <DraggableHudItem id="joystick" layout={layout.joystick} containerRef={containerRef} onUpdate={updateElement} label="Joystick">
                    <div className="rounded-full border-2 border-slate-400/30 flex items-center justify-center shadow-lg"
                        style={{
                            width: joystickSize,
                            height: joystickSize,
                            background: `linear-gradient(135deg, rgba(148, 163, 184, 0.6) 0%, rgba(71, 85, 105, 0.6) 100%)`,
                        }}>
                        <div className="rounded-full" style={{
                            width: joystickSize / 2,
                            height: joystickSize / 2,
                            background: `linear-gradient(135deg, rgba(100, 116, 139, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%)`,
                        }} />
                    </div>
                </DraggableHudItem>

                <DraggableHudItem id="punchBtn" layout={layout.punchBtn} containerRef={containerRef} onUpdate={updateElement} label="Döv">
                    <div className="text-white rounded-full shadow-lg font-black text-sm border-2 border-red-400/50 flex items-center justify-center"
                        style={{
                            width: punchBtnSize,
                            height: punchBtnSize,
                            background: `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)`,
                        }}>
                        DÖV<br />👊
                    </div>
                </DraggableHudItem>

                <DraggableHudItem id="actionBtn" layout={layout.actionBtn} containerRef={containerRef} onUpdate={updateElement} label="AL/VER">
                    <div className="text-white rounded-full shadow-lg font-black text-sm border-2 border-blue-400/50 flex items-center justify-center"
                        style={{
                            width: actionBtnSize,
                            height: actionBtnSize,
                            background: `linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)`,
                        }}>
                        AL<br />VER
                    </div>
                </DraggableHudItem>

                <DraggableHudItem id="musicBtn" layout={layout.musicBtn} containerRef={containerRef} onUpdate={updateElement} label="Müzik">
                    <div className="rounded-full shadow-lg text-base border-2 border-slate-500/50 flex items-center justify-center text-slate-300"
                        style={{
                            width: musicBtnSize,
                            height: musicBtnSize,
                            background: `linear-gradient(135deg, rgba(87, 83, 82, 0.7) 0%, rgba(64, 63, 63, 0.7) 100%)`,
                        }}>
                        🔇
                    </div>
                </DraggableHudItem>

                <DraggableHudItem id="chopBtn" layout={layout.chopBtn} containerRef={containerRef} onUpdate={updateElement} label="Doğra">
                    <div className="text-white rounded-full shadow-lg font-black text-xs border-2 border-amber-400/50 flex items-center justify-center"
                        style={{
                            width: Math.round(actionBtnSize * 0.7),
                            height: Math.round(actionBtnSize * 0.7),
                            background: `linear-gradient(135deg, rgba(217, 119, 6, 0.9) 0%, rgba(180, 83, 9, 0.9) 100%)`,
                        }}>
                        🔪<br />DOĞRA
                    </div>
                </DraggableHudItem>
            </div>
        </div>
    );
};
