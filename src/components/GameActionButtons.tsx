import React, { useRef } from 'react';
import { Joystick } from './Joystick';
import { playSound } from '../utils/audio';
import type { GameState } from '../types/game';
import type { Settings } from '../hooks/useSettings';
import type { Socket } from 'socket.io-client';

// ── Joystick Panel — sürükle-bırak konumlandırma ─────────────────────────────
interface JoystickPanelProps {
    panelWidth: number;
    joystickSize: number;
    offset: { x: number; y: number };
    onOffsetChange: (offset: { x: number; y: number }) => void;
    onMove: (x: number, y: number) => void;
}

export const JoystickPanel: React.FC<JoystickPanelProps> = ({ panelWidth, joystickSize, offset, onOffsetChange, onMove }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isDraggingPos, setIsDraggingPos] = React.useState(false);
    const isDraggingPosRef = useRef(false);

    const startLongPress = (clientX: number, clientY: number) => {
        longPressRef.current = setTimeout(() => {
            isDraggingPosRef.current = true;
            setIsDraggingPos(true);
        }, 500);
    };

    const cancelLongPress = () => {
        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    };

    const updatePos = (clientX: number, clientY: number) => {
        if (!isDraggingPosRef.current || !panelRef.current) return;
        const rect = panelRef.current.getBoundingClientRect();
        const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
        onOffsetChange({ x, y });
    };

    const endDragPos = () => {
        isDraggingPosRef.current = false;
        setIsDraggingPos(false);
        cancelLongPress();
    };

    return (
        <div ref={panelRef} className="flex-none relative"
            style={{ width: `${panelWidth}%`, background: 'rgba(0,0,0,0.15)' }}
            onPointerUp={endDragPos} onPointerLeave={endDragPos}>
            {isDraggingPos && (
                <div className="absolute inset-0 border-2 border-dashed border-amber-400/50 rounded pointer-events-none z-20" />
            )}
            <div className="absolute touch-none"
                style={{
                    left: `${offset.x}%`, top: `${offset.y}%`,
                    transform: 'translate(-50%, -50%)',
                    transition: isDraggingPos ? 'none' : 'left 0.15s, top 0.15s',
                    zIndex: isDraggingPos ? 30 : 10,
                    filter: isDraggingPos ? 'drop-shadow(0 0 8px rgba(251,191,36,0.8))' : 'none',
                }}
                onPointerDown={(e) => { if (isDraggingPosRef.current) return; startLongPress(e.clientX, e.clientY); }}
                onPointerMove={(e) => { if (!isDraggingPosRef.current) cancelLongPress(); else updatePos(e.clientX, e.clientY); }}
                onPointerUp={() => { cancelLongPress(); if (isDraggingPosRef.current) endDragPos(); }}>
                <Joystick size={joystickSize} onMove={onMove} />
            </div>
            {!isDraggingPos && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-white/20 font-bold uppercase tracking-wider pointer-events-none">
                    Uzun bas → taşı
                </div>
            )}
        </div>
    );
};

// ── Touch Sağ Panel ───────────────────────────────────────────────────────────
interface TouchButtonsProps {
    dayPhase: 'prep' | 'day' | 'night';
    bs: number;
    musicOn: boolean;
    socket: Socket | null;
    gameStateRef: React.MutableRefObject<GameState>;
    localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
    lastPunchTimeRef: React.MutableRefObject<number>;
    chopTouchIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
    handleInteract: () => void;
    onEmit: (event: string, data?: unknown) => void;
    toggleMusic: () => void;
}

export const TouchActionButtons: React.FC<TouchButtonsProps> = ({
    dayPhase, bs, musicOn, socket, gameStateRef, localPlayerRef,
    lastPunchTimeRef, chopTouchIntervalRef, handleInteract, onEmit, toggleMusic,
}) => (
    <div className="flex-none flex flex-col items-center justify-center gap-3"
        style={{ width: '17%', background: 'rgba(0,0,0,0.15)' }}>
        {/* AL/VER */}
        <button
            onPointerDown={(e) => { e.preventDefault(); if (dayPhase === 'prep') handleInteract(); else onEmit('interact'); }}
            style={{ width: bs, height: bs, touchAction: 'none' }}
            className="bg-blue-600/85 active:scale-90 text-white rounded-2xl shadow-lg font-black text-xs flex items-center justify-center border border-blue-400/30 backdrop-blur-sm transition-all">
            <span className="text-[10px] uppercase tracking-wider">Al/Ver</span>
        </button>
        {/* DOĞRA */}
        {dayPhase === 'day' && (
            <button
                onPointerDown={(e) => {
                    e.preventDefault();
                    const gs = gameStateRef.current; const lp = localPlayerRef.current;
                    const board = gs.choppingBoards?.find(b => Math.hypot(b.x - lp.x, b.y - lp.y) < 90);
                    if (board) {
                        socket?.emit('chop_start', board.id);
                        playSound(null, 'chop');
                        if (chopTouchIntervalRef.current) clearInterval(chopTouchIntervalRef.current);
                        chopTouchIntervalRef.current = setInterval(() => playSound(null, 'chop'), 300);
                    }
                }}
                onPointerUp={(e) => {
                    e.preventDefault();
                    if (chopTouchIntervalRef.current) { clearInterval(chopTouchIntervalRef.current); chopTouchIntervalRef.current = null; }
                    const gs = gameStateRef.current; const lp = localPlayerRef.current;
                    const board = gs.choppingBoards?.find(b => Math.hypot(b.x - lp.x, b.y - lp.y) < 90);
                    if (board) socket?.emit('chop_stop', board.id);
                }}
                onPointerLeave={(e) => {
                    e.preventDefault();
                    if (chopTouchIntervalRef.current) { clearInterval(chopTouchIntervalRef.current); chopTouchIntervalRef.current = null; }
                    gameStateRef.current.choppingBoards?.forEach(b => socket?.emit('chop_stop', b.id));
                }}
                style={{ width: Math.round(bs * 0.8), height: Math.round(bs * 0.8), touchAction: 'none' }}
                className="bg-amber-600/85 active:scale-90 text-white rounded-2xl shadow-lg font-black text-xs flex items-center justify-center border border-amber-400/30 backdrop-blur-sm transition-all">
                <span className="text-[10px] uppercase tracking-wider">Doğra</span>
            </button>
        )}
        {/* DÖV */}
        <button
            onPointerDown={(e) => {
                e.preventDefault();
                const now = Date.now();
                if (now - lastPunchTimeRef.current < 250) return;
                lastPunchTimeRef.current = now;
                const gs = gameStateRef.current; const lp = localPlayerRef.current;
                const punchTarget = gs.customers.find(c => {
                    if (c.isLeaving) return false;
                    const visualY = c.isSeated ? c.seatY + 20 : c.y;
                    return Math.hypot(c.x - lp.x, visualY - lp.y) <= 120 && (c.personality === 'rude' || c.personality === 'recep' || c.personality === 'thug');
                });
                if (punchTarget) socket?.emit('punchCustomer', punchTarget.id);
            }}
            style={{ width: Math.round(bs * 0.8), height: Math.round(bs * 0.8), touchAction: 'none' }}
            className="bg-red-600/85 active:scale-90 text-white rounded-2xl shadow-lg font-black text-xs flex items-center justify-center border border-red-400/30 backdrop-blur-sm transition-all">
            <span className="text-[10px] uppercase tracking-wider">Döv</span>
        </button>
        {/* Müzik */}
        <button onClick={toggleMusic}
            style={{ width: Math.round(bs * 0.6), height: Math.round(bs * 0.6), touchAction: 'none' }}
            className={`rounded-xl shadow text-base flex items-center justify-center transition-all border backdrop-blur-sm ${musicOn ? 'bg-violet-600/80 border-violet-400/30 text-white' : 'bg-stone-700/70 border-stone-600/30 text-stone-400'}`}>
            {musicOn ? '🎵' : '🔇'}
        </button>
    </div>
);
