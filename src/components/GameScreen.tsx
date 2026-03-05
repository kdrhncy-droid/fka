import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, GAME_WIDTH, GAME_HEIGHT, DAY_TICKS, NIGHT_TICKS, Upgrades } from '../types/game';
import { Joystick } from './Joystick';
import { UpgradeShop } from './UpgradeShop';
import { SettingsPanel } from './SettingsPanel';
import { MARKET_NAME } from '../constants';
import { useGameLoop } from '../hooks/useGameLoop';
import { useSettings } from '../hooks/useSettings';

const MUSIC_URL = 'https://cdn.jsdelivr.net/gh/effacestudios/Royalty-Free-Music-Pack@main/Light%20Hearted%20-%20Jeremy%20Blake.mp3';

interface Props {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isJoined: boolean;
    myId: string;
    socket: Socket | null;
    gameStateRef: React.MutableRefObject<GameState>;
    localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
    keysRef: React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
    audioCtxRef: React.MutableRefObject<AudioContext | null>;
}

export const GameScreen: React.FC<Props> = ({
    canvasRef, isJoined, myId, socket,
    gameStateRef, localPlayerRef, keysRef, audioCtxRef,
}) => {
    const joystickVectorRef = useRef({ x: 0, y: 0 });
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { settings, update: updateSettings } = useSettings();

    const [musicOn, setMusicOn] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [score, setScore] = useState(0);
    const [dayPhase, setDayPhase] = useState<'prep' | 'day' | 'night'>('prep');
    const [dayTimer, setDayTimer] = useState(DAY_TICKS);
    const [upgrades, setUpgrades] = useState<Upgrades>({ patience: 0, earnings: 0, stockMax: 0 });
    const [day, setDay] = useState(1);
    const [queueLen, setQueueLen] = useState(0);

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    useGameLoop({ canvasRef, isJoined, myId, socket, gameStateRef, localPlayerRef, keysRef, joystickVectorRef });

    // State poll
    useEffect(() => {
        const id = setInterval(() => {
            const s = gameStateRef.current;
            setScore(s.score);
            setDayPhase(s.dayPhase);
            setDayTimer(s.dayTimer);
            setUpgrades({ ...s.upgrades });
            setDay(s.day);
            setQueueLen(s.waitList?.length ?? 0);
        }, 200);
        return () => clearInterval(id);
    }, []);

    // Müzik
    useEffect(() => {
        const a = new Audio(MUSIC_URL);
        a.loop = true; a.volume = settings.masterVolume;
        audioRef.current = a;
        return () => { a.pause(); };
    }, []);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = settings.masterVolume;
    }, [settings.masterVolume]);

    const toggleMusic = () => {
        const a = audioRef.current; if (!a) return;
        if (musicOn) { a.pause(); setMusicOn(false); }
        else { a.play().catch(() => { }); setMusicOn(true); }
    };

    const emit = (event: string, data?: unknown) => {
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
        socket?.emit(event, data);
    };

    // Progress bar
    const total = dayPhase === 'day' ? DAY_TICKS : NIGHT_TICKS;
    const progress = dayPhase === 'prep' ? 0 : 1 - dayTimer / total;
    const barColor = dayPhase === 'day'
        ? `hsl(${45 - progress * 30}, 90%, 55%)`
        : dayPhase === 'night'
            ? `hsl(${220 + progress * 20}, 70%, 40%)`
            : '#a78bfa';

    const bs = settings.buttonSize;

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col overflow-hidden touch-none select-none safe-top safe-bottom">

            {/* ── Üst Bar ──────────────────────────────────────────────────────── */}
            <div className="flex-none h-12 px-2 flex items-center justify-between gap-2 bg-stone-950/90 border-b border-stone-800">
                <div className="bg-white/95 px-2 py-0.5 rounded-lg border border-white/40 flex-shrink-0">
                    <h1 className="text-sm font-black text-stone-800 leading-none">
                        {gameStateRef.current.marketName || MARKET_NAME} 🏪
                    </h1>
                </div>

                <div className="flex-1 max-w-xs flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold" style={{ color: dayPhase === 'prep' ? '#a78bfa' : dayPhase === 'day' ? '#fbbf24' : '#818cf8' }}>
                        {dayPhase === 'prep' ? `🔧 Hazırlık — Gün ${day}` : dayPhase === 'day' ? `☀️ Gün ${day}` : `🌙 Gece ${day}`}
                        {queueLen > 0 && dayPhase === 'day' ? ` · ⏳${queueLen}` : ''}
                    </span>
                    <div className="w-full h-1.5 bg-stone-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: barColor }} />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-center">
                        <div className="text-[8px] font-bold opacity-70 uppercase tracking-widest">Ciro</div>
                        <div className="text-base font-black leading-none">${score}</div>
                    </div>
                    <button onClick={() => setShowSettings(true)}
                        className="w-8 h-8 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg flex items-center justify-center text-sm"
                    >⚙️</button>
                </div>
            </div>

            {/* ── Canvas — tam ekran, siyah bar yok ────────────────────────────── */}
            <div className="flex-1 min-h-0 relative">
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    className="w-full h-full object-contain block"
                />

                {/* Joystick */}
                <div
                    className={`absolute z-10 ${settings.joystickSide === 'left' ? 'left-4' : 'right-4'}`}
                    style={{ bottom: `${settings.joystickOffset}px` }}
                >
                    <Joystick
                        size={settings.joystickSize}
                        onMove={(x, y) => { joystickVectorRef.current = { x, y }; }}
                    />
                </div>

                {/* Kontrol butonları */}
                <div
                    className={`absolute z-10 flex flex-col gap-2 items-end ${settings.joystickSide === 'left' ? 'right-4' : 'left-4'}`}
                    style={{ bottom: `${settings.buttonOffset}px` }}
                >
                    <button
                        onPointerDown={(e) => {
                            e.preventDefault(); // Varsayılan dokunmatik gecikmeyi (300ms) engelle
                            emit('interact');
                        }}
                        style={{ width: bs, height: bs, touchAction: 'none' }}
                        className="bg-blue-500 active:bg-blue-700 text-white rounded-full shadow-xl font-black text-sm border-4 border-blue-300 flex items-center justify-center active:scale-95"
                    >
                        AL<br />VER
                    </button>
                    <button
                        onClick={toggleMusic}
                        style={{ width: Math.round(bs * 0.55), height: Math.round(bs * 0.55) }}
                        className={`rounded-full shadow-md text-base border-2 flex items-center justify-center ${musicOn ? 'bg-purple-500 border-purple-400 text-white' : 'bg-stone-700 border-stone-600 text-stone-400'
                            }`}
                    >{musicOn ? '🎵' : '🔇'}</button>
                </div>

                {/* Hazırlık: Dükkanı Aç */}
                {dayPhase === 'prep' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="text-5xl mb-2">🔧</div>
                            <h2 className="text-white font-black text-2xl">Gün {day} — Hazırlık</h2>
                            <p className="text-stone-300 text-sm mt-1">Malzemeleri hazırla, fırınları yak!</p>
                        </div>
                        <button
                            onClick={() => emit('openShop')}
                            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-2xl font-black text-xl border-2 border-green-300 transition-all active:scale-95 shadow-2xl animate-pulse"
                        >
                            ☀️ DÜKKANI AÇ
                        </button>
                    </div>
                )}

                {/* Gece: Upgrade Shop */}
                {dayPhase === 'night' && (
                    <UpgradeShop
                        score={score} upgrades={upgrades} day={day}
                        onUpgrade={id => emit('upgrade', id)}
                        onOrder={() => emit('order')}
                        onNextDay={() => emit('nextDay')}
                    />
                )}
            </div>

            {/* PC İpuçları (Sadece Dokunmatik OLMAYAN cihazlarda) */}
            {!isTouchDevice && (
                <div className="flex-none h-6 hidden md:flex items-center justify-center gap-4 text-stone-500 text-[11px] font-medium bg-stone-950">
                    <span>Hareket: <kbd className="bg-stone-800 text-stone-300 px-1 rounded">WASD</kbd></span>
                    <span>·</span>
                    <span>Etkileşim: <kbd className="bg-stone-800 text-stone-300 px-1 rounded">E</kbd> / <kbd className="bg-stone-800 text-stone-300 px-1 rounded">BOŞLUK</kbd></span>
                    <span>·</span>
                    <span className={dayPhase === 'night' ? 'text-indigo-400 font-bold' : dayPhase === 'prep' ? 'text-purple-400 font-bold' : ''}>
                        {dayPhase === 'prep' ? '🔧 Hazırlık — Dükkanı aç!' : dayPhase === 'night' ? '🌙 Upgrade al!' : '☀️ Müşterilere servis yap'}
                    </span>
                </div>
            )}

            {showSettings && (
                <SettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
};
