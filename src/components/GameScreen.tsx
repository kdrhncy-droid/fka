import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, GAME_WIDTH, GAME_HEIGHT, NIGHT_TICKS, DAY_TICKS } from '../types/game';
import { Joystick } from './Joystick';
import { UpgradeShop } from './UpgradeShop';
import { SettingsPanel } from './SettingsPanel';
import { SettingsModal } from './SettingsModal';
import { PatchNotesModal } from './PatchNotesModal';
import { CosmeticsModal } from './CosmeticsModal';
import { HudEditor } from './HudEditor';
import { MARKET_NAME } from '../constants';
import { useGameLoop } from '../hooks/useGameLoop';
import { Settings } from '../hooks/useSettings';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useGameState } from '../hooks/useGameState';
import { useLayoutEditor } from '../hooks/useLayoutEditor';
import { playSound } from '../utils/audio';
import { stopBgm } from '../utils/bgm';
import { ChatPanel } from './ChatPanel';
import { DayEndModal } from './DayEndModal';
import { LeaveModal } from './LeaveModal';
import { saveStats, loadStats } from './StatsModal';



// Yemek isim haritası
const DISH_NAMES: Record<string, string> = {
    '🍕': 'Pizza',
    '🍔': 'Burger',
    '🥗': 'Salata',
    '🍜': 'Çorba',
    '🌯': 'Dürüm',
    '🍟': 'Patates',
    '🥤': 'İçecek',
};

const DISH_INFO: Record<string, { ingredient: string; time: string; color: string }> = {
    '🍕': { ingredient: '🍞 Hamur',        time: '3 sn',   color: 'from-orange-600 to-red-600' },
    '🍔': { ingredient: '🥩 Et (doğra)',   time: '1.2 sn', color: 'from-amber-600 to-yellow-600' },
    '🥗': { ingredient: '🥬 Sebze (doğra)',time: '0.5 sn', color: 'from-green-600 to-emerald-600' },
    '🍜': { ingredient: '🥘 Çorba',        time: '4 sn',   color: 'from-yellow-600 to-amber-600' },
    '🌯': { ingredient: '🍢 Kebap (doğra)',time: '2 sn',   color: 'from-stone-600 to-amber-800' },
    '🍟': { ingredient: '🥔 Patates',      time: '1 sn',   color: 'from-yellow-500 to-amber-500' },
    '🥤': { ingredient: '🧊 Buzdolabı',    time: 'Anında', color: 'from-sky-500 to-blue-600' },
};

interface Props {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isJoined: boolean;
    myId: string;
    socket: Socket | null;
    gameStateRef: React.MutableRefObject<GameState>;
    localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
    keysRef: React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
    audioCtxRef: React.MutableRefObject<AudioContext | null>;
    settings: Settings;
    updateSettings: (patch: Partial<Settings>) => void;
    roomId: string;
    onLeaveGame?: () => void;
    interactOverrideRef?: React.MutableRefObject<(() => void) | null>;
    ping?: number;
    onOpenStats?: () => void;
    chatMessages: import('../hooks/useSocket').ChatMessage[];
    dayEndSummary: import('../hooks/useSocket').DayEndSummary | null;
    onClearDayEnd: () => void;
}

export const GameScreen: React.FC<Props> = ({
    canvasRef, isJoined, myId, socket,
    gameStateRef, localPlayerRef, keysRef, audioCtxRef, settings, updateSettings, roomId, onLeaveGame,
    interactOverrideRef, ping = 0, onOpenStats, chatMessages, dayEndSummary, onClearDayEnd
}) => {
    const joystickVectorRef = useRef({ x: 0, y: 0 });
    const lastPunchTimeRef = useRef<number>(0);
    const chopTouchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [musicOn, setMusicOn] = useState(settings.bgmOn);
    const [showSettings, setShowSettings] = useState(false);
    const [showLeave, setShowLeave] = useState(false);
    const [showCosmetics, setShowCosmetics] = useState(false);
    const [showHudEditor, setShowHudEditor] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [globalVoiceVol, setGlobalVoiceVol] = useState(1.0);
    const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

    const { score, dayPhase, dayTimer, upgrades, day, ovenCount, queueLen, lives, isGameOver, menuChoices, unlockedDishes } = useGameState(gameStateRef);

    const { editorState, editorStateRef, handleInteract, handleCancel, handleCycleSeats, updatePreview } = useLayoutEditor({
        socket,
        gameStateRef,
        localPlayerRef,
        dayPhase,
    });

    // E/Boşluk tuşunu prep fazında layout editor'a yönlendir
    useEffect(() => {
        if (!interactOverrideRef) return;
        interactOverrideRef.current = dayPhase === 'prep'
            ? handleInteract
            : () => { socket?.emit('interact'); };
    }, [dayPhase, handleInteract, socket, interactOverrideRef]);

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Escape → taşıma modunu iptal et
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && (editorStateRef.current.isMoving || editorStateRef.current.isMovingTable)) handleCancel();
            if ((e.key === 'r' || e.key === 'R') && editorStateRef.current.isMovingTable) handleCycleSeats();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleCancel, editorStateRef]);

    // Gün bittiğinde touch doğrama sesini durdur
    useEffect(() => {
        if (dayPhase !== 'day' && chopTouchIntervalRef.current) {
            clearInterval(chopTouchIntervalRef.current);
            chopTouchIntervalRef.current = null;
        }
    }, [dayPhase]);

    // BGM: App.tsx'te join anında başlatılıyor, burada sadece unmount'ta durdur
    useEffect(() => {
        return () => stopBgm();
    }, []);

    // WakeLock — oyun açıkken ekran kapanmasın
    useEffect(() => {
        let lock: WakeLockSentinel | null = null;
        const request = async () => {
            if ('wakeLock' in navigator) {
                try { lock = await (navigator as any).wakeLock.request('screen'); } catch {}
            }
        };
        request();
        const onForeground = () => request();
        window.addEventListener('app-foreground', onForeground);
        const startTime = Date.now();
        return () => {
            lock?.release().catch(() => {});
            window.removeEventListener('app-foreground', onForeground);
            // Oyun süresi kaydet
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const s = loadStats();
            saveStats({ totalPlayTime: s.totalPlayTime + elapsed, lastPlayed: Date.now(), gamesPlayed: s.gamesPlayed + 1 });
        };
    }, []);

    const { isMuted, toggleMute, audioStreams } = useVoiceChat({
        isJoined: voiceActive && isJoined,
        myId,
        socket
    });

    useEffect(() => {
        Object.entries(audioStreams).forEach(([id, s]) => {
            const stream = s as MediaStream;
            if (!audioElementsRef.current[id]) {
                const audio = new Audio();
                audio.srcObject = stream;
                audio.autoplay = true;
                audio.volume = 0;
                audioElementsRef.current[id] = audio;
            } else if (audioElementsRef.current[id].srcObject !== stream) {
                audioElementsRef.current[id].srcObject = stream;
            }
        });

        Object.keys(audioElementsRef.current).forEach(id => {
            if (!audioStreams[id]) {
                audioElementsRef.current[id].pause();
                audioElementsRef.current[id].srcObject = null;
                delete audioElementsRef.current[id];
            }
        });
    }, [audioStreams]);

    useGameLoop({
        canvasRef, isJoined, myId, socket, gameStateRef, localPlayerRef, keysRef, joystickVectorRef,
        audioElementsRef, globalVolume: globalVoiceVol, editorStateRef,
        showPerfStats: settings.showPerfStats,
        onPreviewUpdate: updatePreview,
    });

    // Müzik butonu BGM toggle'ına bağlı
    const toggleMusic = () => {
        const next = !musicOn;
        setMusicOn(next);
        updateSettings({ bgmOn: next });
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

    const bs = 80;
    const joystickSize = 128;
    const punchButtonSize = 72;

    return (
        <div className="game-screen w-full flex flex-col select-none safe-top safe-bottom" style={{ background: '#545250' }}>

            {/* ── Üst Bar ──────────────────────────────────────────────────────── */}
            <div className="flex-none h-11 px-3 flex items-center justify-between gap-2 bg-stone-950/95 border-b border-stone-800">
                {/* Sol: Market adı + oda kodu */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <h1 className="text-sm font-black text-white leading-none select-none truncate max-w-[120px]">
                        {gameStateRef.current.marketName || MARKET_NAME}
                    </h1>
                    <button
                        onClick={() => { navigator.clipboard.writeText(roomId); }}
                        className="bg-stone-800 hover:bg-stone-700 active:bg-emerald-800 text-stone-400 font-mono text-[10px] px-2 py-0.5 rounded-md transition-colors border border-stone-700"
                        title="Oda kodunu kopyala"
                    >
                        #{roomId}
                    </button>
                </div>

                <div className="flex-1 max-w-xs flex flex-col items-center gap-0.5">
                    {dayPhase !== 'prep' || (!editorState.isMoving && !editorState.isMovingTable) ? (
                        <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: dayPhase === 'prep' ? '#a78bfa' : dayPhase === 'day' ? '#fbbf24' : '#818cf8' }}>
                            <span>{dayPhase === 'prep' ? `Hazırlık · Gün ${day}` : dayPhase === 'day' ? `Gün ${day}` : `Gece ${day}`}
                                {queueLen > 0 && dayPhase === 'day' ? ` · ${queueLen} bekliyor` : ''}</span>
                            <span className="flex gap-0.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <span key={i} className="text-xs">{i < lives ? '❤️' : '🖤'}</span>
                                ))}
                            </span>
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-purple-400">Düzenleme Modu</span>
                    )}
                    <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: barColor }} />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {dayPhase === 'prep' && (
                        <button
                            onClick={() => emit('openShop')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg font-black text-xs transition-all whitespace-nowrap"
                        >
                            Dükkânı Aç
                        </button>
                    )}
                    <div className="bg-stone-800 border border-stone-700 text-white px-2.5 py-1 rounded-lg text-center min-w-[52px]">
                        <div className="text-[8px] font-bold text-stone-500 uppercase tracking-widest leading-none">Ciro</div>
                        <div className="text-sm font-black leading-tight text-emerald-400">${score}</div>
                    </div>
                    <button onClick={() => setShowVoiceSettings(true)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors border ${voiceActive && !isMuted ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'}`}
                    >🎙️</button>
                    <button onClick={() => setShowCosmetics(true)}
                        className="w-8 h-8 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-lg flex items-center justify-center text-sm transition-colors"
                    >👕</button>
                    <button onClick={() => setShowSettings(true)}
                        className="w-8 h-8 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-lg flex items-center justify-center text-sm transition-colors"
                    >⚙️</button>
                    {dayPhase === 'night' && dayEndSummary && (
                        <DayEndModal summary={dayEndSummary} onClose={onClearDayEnd} />
                    )}
                </div>
            </div>

            {/* ── Canvas ────────────────────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 relative flex items-center justify-center" style={{ background: '#9a7858' }}>
                <div className="relative" style={{ aspectRatio: '1280/870', maxWidth: '100vw', maxHeight: '100%', width: '100%' }}>

                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full block touch-none select-none"
                />



                {/* GAME OVER Overlay */}
                {isGameOver && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-red-950/90 backdrop-blur-md">
                        <div className="text-center animate-bounce">
                            <div className="text-6xl mb-4">🤬</div>
                            <h2 className="text-red-500 font-black text-5xl tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">GAME OVER</h2>
                            <p className="text-red-200 text-lg mt-2 font-bold">Müşterileri çıldırttın ve restoranı terk ettiler!</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full max-w-sm">
                            <button
                                onClick={() => emit('resetDay')}
                                className="px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl font-black text-2xl border-2 border-amber-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(217,119,6,0.4)]"
                            >
                                🔄 TEKRAR DENE
                            </button>
                            <button
                                onClick={() => onLeaveGame?.()}
                                className="px-10 py-5 bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 text-stone-100 rounded-2xl font-black text-2xl border-2 border-stone-500 transition-all active:scale-95 shadow-[0_0_30px_rgba(0,0,0,0.4)]"
                            >
                                🏠 ANA MENÜ
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Gece: Yeni Yemek Seçimi (Plate Up tarzı) ── */}
                {dayPhase === 'night' && !isGameOver && menuChoices && menuChoices.length > 0 && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-indigo-950/85 backdrop-blur-sm p-4">
                        <div className="text-center">
                            <div className="text-5xl mb-2">⭐</div>
                            <h2 className="text-white font-black text-2xl">Yeni Yemek Seç!</h2>
                            <p className="text-indigo-200 text-sm mt-1">
                                Menüye eklemek için bir yemek seç. Gün {day + 1}'den itibaren müşteriler bu yemeği sipariş edebilecek.
                            </p>
                            <div className="mt-2 flex flex-wrap justify-center gap-2">
                                <span className="text-indigo-300 text-xs">Mevcut menün:</span>
                                {unlockedDishes.map(d => (
                                    <span key={d} className="text-base" title={DISH_NAMES[d]}>{d}</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                            {menuChoices.map(dish => {
                                const info = DISH_INFO[dish];
                                return (
                                    <button
                                        key={dish}
                                        onClick={() => emit('selectMenu', dish)}
                                        className={`flex-1 bg-gradient-to-b ${info?.color ?? 'from-stone-600 to-stone-700'} hover:brightness-110 active:scale-95 text-white rounded-2xl p-5 border-2 border-white/20 transition-all shadow-xl flex flex-col items-center gap-2`}
                                    >
                                        <span className="text-5xl">{dish}</span>
                                        <span className="font-black text-xl">{DISH_NAMES[dish] ?? dish}</span>
                                        {info && (
                                            <div className="text-white/80 text-xs text-center space-y-0.5">
                                                <div>Malzeme: {info.ingredient}</div>
                                                <div>Pişirme: ~{info.time}</div>
                                            </div>
                                        )}
                                        <span className="mt-1 px-3 py-1 bg-white/20 rounded-full text-sm font-bold">Seç →</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Gece: Upgrade Shop (menü seçimi yoksa veya bittiyse) */}
                {dayPhase === 'night' && !isGameOver && (!menuChoices || menuChoices.length === 0) && (
                    <UpgradeShop
                        score={score} upgrades={upgrades} day={day}
                        lives={lives}
                        ovenCount={ovenCount}
                        unlockedDishes={unlockedDishes}
                        menuChoices={menuChoices}
                        onUpgrade={id => emit('upgrade', id)}
                        onBuyOven={() => emit('buyOven')}
                        onBuyLife={() => emit('buyLife')}
                        onOrder={() => emit('order')}
                        onNextDay={() => emit('nextDay')}
                    />
                )}
                </div> {/* inner aspect-ratio wrapper */}

                {/* ── HUD Butonları — outer wrapper'da, tüm ekrana serbestçe konumlanabilir ── */}
                {/* Joystick */}
                {!showHudEditor && (
                <div className="absolute z-10 touch-none" style={{ left: `${settings.hudLayout.joystick.x}%`, top: `${settings.hudLayout.joystick.y}%`, transform: `scale(${settings.hudLayout.joystick.scale})`, transformOrigin: 'top left' }}>
                    <Joystick size={joystickSize} onMove={(x, y) => { joystickVectorRef.current = { x, y }; }} />
                </div>
                )}
                {/* Döv */}
                {!showHudEditor && (
                <div className="absolute z-10" style={{ left: `${settings.hudLayout.punchBtn.x}%`, top: `${settings.hudLayout.punchBtn.y}%`, transform: `scale(${settings.hudLayout.punchBtn.scale})`, transformOrigin: 'top left' }}>
                    <button
                        onPointerDown={(e) => {
                            e.preventDefault();
                            const now = Date.now();
                            if (now - lastPunchTimeRef.current < 250) return;
                            lastPunchTimeRef.current = now;
                            const gs = gameStateRef.current;
                            const lp = localPlayerRef.current;
                            const punchTarget = gs.customers.find(c => {
                                if (c.isLeaving) return false;
                                const visualY = c.isSeated ? c.seatY + 20 : c.y;
                                return Math.hypot(c.x - lp.x, visualY - lp.y) <= 120 && (c.personality === 'rude' || c.personality === 'recep' || c.personality === 'thug');
                            });
                            if (punchTarget) socket?.emit('punchCustomer', punchTarget.id);
                        }}
                        style={{ width: punchButtonSize, height: punchButtonSize, touchAction: 'none' }}
                        className="bg-red-600/85 hover:bg-red-500/90 active:scale-90 text-white rounded-2xl shadow-lg font-black text-xs flex flex-col items-center justify-center gap-0.5 border border-red-400/30 backdrop-blur-sm transition-all"
                    >
                        <span className="text-lg leading-none">👊</span>
                        <span className="text-[9px] uppercase tracking-wider">Döv</span>
                    </button>
                </div>
                )}
                {/* AL/VER */}
                {!showHudEditor && (
                <div className="absolute z-10" style={{ left: `${settings.hudLayout.actionBtn.x}%`, top: `${settings.hudLayout.actionBtn.y}%`, transform: `scale(${settings.hudLayout.actionBtn.scale})`, transformOrigin: 'top left' }}>
                    <button
                        onPointerDown={(e) => { e.preventDefault(); if (dayPhase === 'prep') handleInteract(); else emit('interact'); }}
                        style={{ width: bs, height: bs, touchAction: 'none' }}
                        className="bg-blue-600/85 hover:bg-blue-500/90 active:scale-90 text-white rounded-2xl shadow-lg font-black text-xs flex flex-col items-center justify-center gap-0.5 border border-blue-400/30 backdrop-blur-sm transition-all"
                    >
                        <span className="text-lg leading-none">🤲</span>
                        <span className="text-[9px] uppercase tracking-wider">Al/Ver</span>
                    </button>
                </div>
                )}
                {/* DOĞRA */}
                {!showHudEditor && dayPhase === 'day' && (
                <div className="absolute z-10" style={{ left: `${settings.hudLayout.chopBtn.x}%`, top: `${settings.hudLayout.chopBtn.y}%`, transform: `scale(${settings.hudLayout.chopBtn.scale})`, transformOrigin: 'top left' }}>
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
                        style={{ width: Math.round(bs * 0.7), height: Math.round(bs * 0.7), touchAction: 'none' }}
                        className="bg-amber-600/85 hover:bg-amber-500/90 active:scale-90 text-white rounded-2xl shadow-lg font-black text-xs flex flex-col items-center justify-center gap-0.5 border border-amber-400/30 backdrop-blur-sm transition-all"
                    >
                        <span className="text-base leading-none">🔪</span>
                        <span className="text-[9px] uppercase tracking-wider">Doğra</span>
                    </button>
                </div>
                )}
                {/* Müzik */}
                {!showHudEditor && (
                <div className="absolute z-10" style={{ left: `${settings.hudLayout.musicBtn.x}%`, top: `${settings.hudLayout.musicBtn.y}%`, transform: `scale(${settings.hudLayout.musicBtn.scale})`, transformOrigin: 'top left' }}>
                    <button onClick={toggleMusic}
                        style={{ width: Math.round(bs * 0.55), height: Math.round(bs * 0.55) }}
                        className={`rounded-xl shadow text-base flex items-center justify-center transition-all border backdrop-blur-sm ${
                            musicOn ? 'bg-violet-600/80 border-violet-400/30 text-white' : 'bg-stone-700/70 border-stone-600/30 text-stone-400'
                        }`}
                    >{musicOn ? '🎵' : '🔇'}</button>
                </div>
                )}

                {/* Ping göstergesi */}
                {settings.showPerfStats && (
                <div className="absolute top-2 right-2 z-20 pointer-events-none">
                    <div className="bg-black/60 rounded-lg px-2 py-1 font-mono text-xs leading-tight">
                        <div style={{ color: ping < 80 ? '#4ade80' : ping < 150 ? '#facc15' : '#f87171' }}>
                            PING: {ping}ms
                        </div>
                    </div>
                </div>
                )}

                {/* Chat */}
                <ChatPanel socket={socket} myId={myId} messages={chatMessages} />

            </div>

            {/* ── Düzenleme Modu Bar ── */}
            {dayPhase === 'prep' && (editorState.isMoving || editorState.isMovingTable) && (
                <div className="flex-none flex items-center justify-between gap-2 px-3 py-2 bg-stone-950 border-t border-purple-600/40">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-[11px] uppercase tracking-wider text-purple-300">
                            {editorState.isMoving ? '📦 İstasyon' : '🪑 Masa'}
                        </span>
                        {/* Masa sayısı — sadece masa taşırken */}
                        {editorState.isMovingTable && (
                            <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-md">
                                {Object.keys(gameStateRef.current.tableLayout ?? {}).length} masa
                            </span>
                        )}
                        {editorState.isMovingTable && (() => {
                            const seats = editorState.movingTableId
                                ? (gameStateRef.current.tableLayout[editorState.movingTableId]?.seats ?? 4)
                                : 4;
                            return (
                                <button onClick={handleCycleSeats}
                                    className="flex items-center gap-1 bg-violet-700 hover:bg-violet-600 active:scale-95 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all">
                                    🔁 {seats} kişilik → değiştir
                                </button>
                            );
                        })()}
                    </div>
                    <span className="text-[10px] text-stone-500 hidden sm:block">
                        {isTouchDevice ? 'Konuma git → AL/VER' : 'Konuma git → E'}
                    </span>
                    <button onClick={handleCancel}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-600 active:scale-95 text-white rounded-lg font-bold text-[11px] transition-all flex-shrink-0">
                        ✕ İptal
                    </button>
                </div>
            )}

            {/* PC İpuçları */}
            {!isTouchDevice && (
                <div className="flex-none h-6 hidden md:flex items-center justify-center gap-4 text-stone-500 text-[11px] font-medium bg-stone-950">
                    <span>Hareket: <kbd className="bg-stone-800 text-stone-300 px-1 rounded">WASD</kbd></span>
                    <span>·</span>
                    <span>Etkileşim: <kbd className="bg-stone-800 text-stone-300 px-1 rounded">E</kbd> / <kbd className="bg-stone-800 text-stone-300 px-1 rounded">BOŞLUK</kbd></span>
                    <span>·</span>
                    <span>Doğra: <kbd className="bg-stone-800 text-amber-300 px-1 rounded">R</kbd> (basılı tut)</span>
                    <span>·</span>
                    <span className={dayPhase === 'night' ? 'text-indigo-400 font-bold' : dayPhase === 'prep' ? 'text-purple-400 font-bold' : ''}>
                        {dayPhase === 'prep'
                            ? (editorState.isMoving ? '📦 Yeni konuma git → E | İptal: Esc'
                              : editorState.isMovingTable ? '🪑 Masayı taşı → E | İptal: Esc'
                              : '🔧 Hazırlık — E: İstasyon/Masa taşı | Dükkanı aç!')
                            : dayPhase === 'night' ? '🌙 Upgrade al!'
                            : '☀️ Müşterilere servis yap'}
                    </span>
                </div>
            )}

            {showSettings && (
                <SettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setShowSettings(false)}
                    onLeaveGame={() => { setShowSettings(false); setShowLeave(true); }}
                    isJoined={isJoined}
                    onOpenHudEditor={() => { setShowSettings(false); setShowHudEditor(true); }}
                />
            )}

            {showLeave && (
                <LeaveModal
                    score={score}
                    day={day}
                    onConfirm={() => { setShowLeave(false); onLeaveGame?.(); }}
                    onCancel={() => setShowLeave(false)}
                />
            )}

            {showHudEditor && (
                <HudEditor
                    layout={settings.hudLayout}
                    onChange={(layout) => updateSettings({ hudLayout: layout })}
                    onClose={() => setShowHudEditor(false)}
                />
            )}

            {showCosmetics && (
                <CosmeticsModal
                    onClose={() => setShowCosmetics(false)}
                    socket={socket}
                    myCharType={gameStateRef.current?.players?.[myId]?.charType}
                />
            )}

            {showVoiceSettings && (
                <SettingsModal
                    onClose={() => setShowVoiceSettings(false)}
                    globalVolume={globalVoiceVol}
                    setGlobalVolume={setGlobalVoiceVol}
                    isMuted={isMuted}
                    toggleMute={toggleMute}
                    startVoiceChat={() => { setVoiceActive(true); }}
                    isVoiceActive={voiceActive}
                />
            )}
        </div>
    );
};
