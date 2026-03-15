import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, GAME_WIDTH, GAME_HEIGHT, DAY_TICKS, NIGHT_TICKS, Upgrades } from '../types/game';
import { Joystick } from './Joystick';
import { UpgradeShop } from './UpgradeShop';
import { SettingsPanel } from './SettingsPanel';
import { SettingsModal } from './SettingsModal';
import { PatchNotesModal } from './PatchNotesModal';
import { CosmeticsModal } from './CosmeticsModal';
import { MARKET_NAME } from '../constants';
import { useGameLoop } from '../hooks/useGameLoop';
import { Settings } from '../hooks/useSettings';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { writeSave, loadSave, SaveData } from '../hooks/useSaveGame';

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
    settings: Settings;
    updateSettings: (patch: Partial<Settings>) => void;
    roomId: string;
    onLeaveGame?: () => void;
}

export const GameScreen: React.FC<Props> = ({
    canvasRef, isJoined, myId, socket,
    gameStateRef, localPlayerRef, keysRef, audioCtxRef, settings, updateSettings, roomId, onLeaveGame
}) => {
    const joystickVectorRef = useRef({ x: 0, y: 0 });
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastPunchTimeRef = useRef<number>(0);

    const [musicOn, setMusicOn] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [score, setScore] = useState(0);
    const [dayPhase, setDayPhase] = useState<'prep' | 'day' | 'night'>('prep');
    const [dayTimer, setDayTimer] = useState(DAY_TICKS);
    const [upgrades, setUpgrades] = useState<Upgrades>({ patience: 0, earnings: 0 });
    const [day, setDay] = useState(1);
    const [ovenCount, setOvenCount] = useState(1);
    const [queueLen, setQueueLen] = useState(0);
    const [lives, setLives] = useState(3);
    const [isGameOver, setIsGameOver] = useState(false);
    const [saveData, setSaveData] = useState<SaveData>(() => loadSave());
    const gameSavedRef = useRef(false);

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // --- Voice Chat ---
    const [voiceActive, setVoiceActive] = useState(false);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [globalVoiceVol, setGlobalVoiceVol] = useState(1.0);

    const [showCosmetics, setShowCosmetics] = useState(false);
    const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

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
                audio.volume = 0; // ilk aşamada 0 verilir, game loop'ta mesafe bazlı hesaplanır
                audioElementsRef.current[id] = audio;
            } else if (audioElementsRef.current[id].srcObject !== stream) {
                audioElementsRef.current[id].srcObject = stream;
            }
        });

        // Kopan / silinen streamleri temizle
        Object.keys(audioElementsRef.current).forEach(id => {
            if (!audioStreams[id]) {
                audioElementsRef.current[id].pause();
                audioElementsRef.current[id].srcObject = null;
                delete audioElementsRef.current[id];
            }
        });
    }, [audioStreams]);

    // Oyun döngüsü
    useGameLoop({
        canvasRef, isJoined, myId, socket, gameStateRef, localPlayerRef, keysRef, joystickVectorRef,
        audioElementsRef, globalVolume: globalVoiceVol
    });

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
            setOvenCount(s.cookStations?.length ?? 1);
            setLives(s.lives ?? 3);
            setIsGameOver(s.isGameOver ?? false);
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

    // Game over olunca skoru kaydet
    useEffect(() => {
        if (isGameOver && !gameSavedRef.current) {
            gameSavedRef.current = true;
            const saved = writeSave(score, day);
            setSaveData(saved);
        }
        if (!isGameOver) {
            gameSavedRef.current = false;
        }
    }, [isGameOver, score, day]);

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
        <div className="game-screen w-full bg-stone-950 flex flex-col select-none safe-top safe-bottom">

            {/* ── Üst Bar ──────────────────────────────────────────────────────── */}
            <div className="flex-none h-12 px-2 flex items-center justify-between gap-2 bg-stone-950/90 border-b border-stone-800">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="bg-white/95 px-2 py-0.5 rounded-lg border border-white/40">
                        <h1 className="text-sm font-black text-stone-800 leading-none">
                            {gameStateRef.current.marketName || MARKET_NAME} 🏪
                        </h1>
                    </div>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(roomId);
                            // Optik feedback yapılabilir buraya, ama mobilde basit tutalım
                        }}
                        className="bg-stone-800 hover:bg-stone-700 active:bg-green-700 text-stone-300 font-mono text-[10px] font-bold px-2 py-1 rounded transition-colors"
                        title="Oda kodunu kopyala"
                    >
                        Oda: <span className="text-white">{roomId}</span> 📋
                    </button>
                </div>

                <div className="flex-1 max-w-xs flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold flex items-center gap-2" style={{ color: dayPhase === 'prep' ? '#a78bfa' : dayPhase === 'day' ? '#fbbf24' : '#818cf8' }}>
                        <span>{dayPhase === 'prep' ? `🔧 Hazırlık — Gün ${day} ` : dayPhase === 'day' ? `☀️ Gün ${day} ` : `🌙 Gece ${day} `}
                            {queueLen > 0 && dayPhase === 'day' ? ` · ⏳${queueLen} ` : ''}</span>
                        <span className="flex gap-0.5 text-sm drop-shadow-md">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} className="transition-transform duration-300">
                                    {i < lives ? '❤️' : '🖤'}
                                </span>
                            ))}
                        </span>
                    </span>
                    <div className="w-full h-1.5 bg-stone-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}% `, backgroundColor: barColor }} />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-center">
                        <div className="text-[8px] font-bold opacity-70 uppercase tracking-widest">Ciro</div>
                        <div className="text-base font-black leading-none">${score}</div>
                    </div>
                    <button onClick={() => setShowVoiceSettings(true)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${voiceActive && !isMuted ? 'bg-green-600 hover:bg-green-500' : 'bg-stone-700 hover:bg-stone-600 text-stone-300'}`}
                    >🎙️</button>
                    <button onClick={() => setShowCosmetics(true)}
                        className="w-8 h-8 bg-stone-700 hover:bg-sky-700 text-emerald-400 rounded-lg flex items-center justify-center text-sm shadow-[0_0_10px_rgba(52,211,153,0.2)] transition-colors"
                    >👕</button>

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
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-contain block touch-none select-none"
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
                            e.preventDefault();
                            const now = Date.now();
                            const PUNCH_RADIUS = 120; // Vuruş mesafesini artırdım (80 -> 120)
                            const PUNCH_COOLDOWN_MS = 250; // Cooldown'u daha da indirdim (300 -> 250)
                            
                            // Cooldown kontrolü — çok hızlı art arda vurmayı engelle
                            if (now - lastPunchTimeRef.current < PUNCH_COOLDOWN_MS) {
                                return; // Cooldown içindeyse işlem yapma
                            }
                            
                            lastPunchTimeRef.current = now;
                            const gs = gameStateRef.current;
                            const lp = localPlayerRef.current;

                            const punchTarget = gs.customers.find(c => {
                                // isBeatUp kontrolünü kaldırdım: sarsıntı halindeyken de vurulabilir
                                if (c.isLeaving) return false;
                                const visualY = c.isSeated ? c.seatY + 20 : c.y;
                                const dist = Math.hypot(c.x - lp.x, visualY - lp.y);
                                return dist <= PUNCH_RADIUS && (c.personality === 'rude' || c.personality === 'recep' || c.personality === 'thug');
                            });

                            if (punchTarget) {
                                socket?.emit('punchCustomer', punchTarget.id);
                            }
                        }}
                        style={{ width: settings.punchButtonSize, height: settings.punchButtonSize, touchAction: 'none' }}
                        className="bg-red-500 active:bg-red-700 text-white rounded-full shadow-xl font-black text-sm border-4 border-red-300 flex items-center justify-center active:scale-95"
                    >
                        DÖV<br />👊
                    </button>
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
                        className={`rounded-full shadow-md text-base border-2 flex items-center justify-center ${musicOn ? 'bg-purple-500 border-purple-400 text-white' : 'bg-stone-700 border-stone-600 text-stone-400'}`}
                    >{musicOn ? '🎵' : '🔇'}</button>
                </div>

                {/* Hazırlık: Dükkanı Aç */}
                {dayPhase === 'prep' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/40">
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

                {/* GAME OVER Overlay */}
                {isGameOver && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-red-950/90 backdrop-blur-md">
                        <div className="text-center animate-bounce">
                            <div className="text-6xl mb-4">🤬</div>
                            <h2 className="text-red-500 font-black text-5xl tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">GAME OVER</h2>
                            <p className="text-red-200 text-lg mt-2 font-bold">Müşterileri çıldırttın ve restoranı terk ettiler!</p>
                        </div>
                        {/* Skor Özeti */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-sm px-4">
                            <div className="bg-black/40 rounded-2xl p-3 text-center border border-white/10">
                                <div className="text-2xl font-black text-amber-300">${score}</div>
                                <div className="text-xs text-stone-400 mt-1">Bu oyun</div>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-3 text-center border border-white/10">
                                <div className="text-2xl font-black text-yellow-400">${saveData.highScore}</div>
                                <div className="text-xs text-stone-400 mt-1">🏆 En yüksek</div>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-3 text-center border border-white/10">
                                <div className="text-2xl font-black text-blue-300">{day}. Gün</div>
                                <div className="text-xs text-stone-400 mt-1">Bu oyun</div>
                            </div>
                            <div className="bg-black/40 rounded-2xl p-3 text-center border border-white/10">
                                <div className="text-2xl font-black text-purple-400">{saveData.bestDay}. Gün</div>
                                <div className="text-xs text-stone-400 mt-1">🏆 En iyi</div>
                            </div>
                        </div>
                        {score >= saveData.highScore && saveData.totalGamesPlayed > 1 && (
                            <div className="text-yellow-300 font-black text-lg animate-pulse">🎉 YENİ REKOR!</div>
                        )}
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

                {/* Gece: Upgrade Shop */}
                {dayPhase === 'night' && !isGameOver && (
                    <UpgradeShop
                        score={score} upgrades={upgrades} day={day}
                        lives={lives}
                        ovenCount={ovenCount}
                        onUpgrade={id => emit('upgrade', id)}
                        onBuyOven={() => emit('buyOven')}
                        onBuyLife={() => emit('buyLife')}
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
                <SettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setShowSettings(false)} onLeaveGame={onLeaveGame} isJoined={isJoined} />
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
                    startVoiceChat={() => {
                        setVoiceActive(true);
                    }}
                    isVoiceActive={voiceActive}
                />
            )}
        </div>
    );
};
