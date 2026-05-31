import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, GAME_WIDTH, GAME_HEIGHT } from '../types/game';
import { SettingsPanel } from './SettingsPanel';
import { SettingsModal } from './SettingsModal';
import { CosmeticsModal } from './CosmeticsModal';
import { HudEditor } from './HudEditor';
import { useGameLoop } from '../hooks/useGameLoop';
import { Settings } from '../hooks/useSettings';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useGameState } from '../hooks/useGameState';
import { useLayoutEditor } from '../hooks/useLayoutEditor';
import { playSound } from '../utils/audio';
import { stopBgm } from '../utils/bgm';
import { ChatPanel } from './ChatPanel';
import { RevengeSceneOverlay } from './RevengeSceneOverlay';
import { LeaveModal } from './LeaveModal';
import { saveStats, loadStats } from './StatsModal';
import { TutorialOverlay, isTutorialDone } from './TutorialOverlay';
import { DevPanel } from './DevPanel';
import { GameTopBar } from './GameTopBar';
import { GameNightOverlays } from './GameNightOverlays';
import { JoystickPanel, TouchActionButtons } from './GameActionButtons';

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
    revengeSceneSummary: import('../hooks/useSocket').DayEndSummary | null;
    onClearRevengeScene: () => void;
    lastEarnedCoins?: number;
    onClearEarnedCoins?: () => void;
}

export const GameScreen: React.FC<Props> = ({
    canvasRef, isJoined, myId, socket,
    gameStateRef, localPlayerRef, keysRef, audioCtxRef, settings, updateSettings, roomId, onLeaveGame,
    interactOverrideRef, ping = 0, onOpenStats, chatMessages, dayEndSummary, onClearDayEnd,
    revengeSceneSummary, onClearRevengeScene, lastEarnedCoins = 0, onClearEarnedCoins,
}) => {
    const joystickVectorRef = useRef({ x: 0, y: 0 });
    const lastPunchTimeRef = useRef<number>(0);
    const chopTouchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

    const [musicOn, setMusicOn] = useState(settings.bgmOn);
    const [showSettings, setShowSettings] = useState(false);
    const [showLeave, setShowLeave] = useState(false);
    const [showTutorial, setShowTutorial] = useState(!isTutorialDone());
    const [showCosmetics, setShowCosmetics] = useState(false);
    const [showHudEditor, setShowHudEditor] = useState(false);
    const [showDevPanel, setShowDevPanel] = useState(false);
    const [devTapCount, setDevTapCount] = useState(0);
    const [voiceActive, setVoiceActive] = useState(false);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [globalVoiceVol, setGlobalVoiceVol] = useState(1.0);
    const [lifeFlash, setLifeFlash] = useState(false);
    const [comboEdge, setComboEdge] = useState<{ color: string; key: number } | null>(null);
    const [perfectBanner, setPerfectBanner] = useState<{ visible: boolean; leaving: boolean } | null>(null);

    const { score, dayPhase, dayTimer, upgrades, day, ovenCount, tableCount, queueLen, lives, isGameOver, menuChoices, unlockedDishes, pendingCardChoices, activeCards, comboCount } = useGameState(gameStateRef);

    const { editorState, editorStateRef, handleInteract, handleCancel, handleCycleSeats, updatePreview } = useLayoutEditor({
        socket, gameStateRef, localPlayerRef, dayPhase,
    });

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const bs = settings.hudLayout.btnSize ?? 80;
    const joystickSize = settings.hudLayout.joystickSize ?? 128;
    const punchButtonSize = Math.round(bs * 0.9);
    const panelWidth = settings.hudLayout.panelWidth ?? 17;

    const emit = (event: string, data?: unknown) => {
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
        socket?.emit(event, data);
    };

    const toggleMusic = () => {
        const next = !musicOn;
        setMusicOn(next);
        updateSettings({ bgmOn: next });
    };

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!interactOverrideRef) return;
        interactOverrideRef.current = dayPhase === 'prep' ? handleInteract : () => { socket?.emit('interact'); };
    }, [dayPhase, handleInteract, socket, interactOverrideRef]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && (editorStateRef.current.isMoving || editorStateRef.current.isMovingTable)) handleCancel();
            if ((e.key === 'r' || e.key === 'R') && editorStateRef.current.isMovingTable) handleCycleSeats();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleCancel, editorStateRef]);

    useEffect(() => {
        if (dayPhase !== 'day' && chopTouchIntervalRef.current) {
            clearInterval(chopTouchIntervalRef.current);
            chopTouchIntervalRef.current = null;
        }
    }, [dayPhase]);

    useEffect(() => {
        return () => {
            if (chopTouchIntervalRef.current) clearInterval(chopTouchIntervalRef.current);
        };
    }, []);

    useEffect(() => { return () => stopBgm(); }, []);

    // ── Can kaybı flash + combo kenar efekti ─────────────────────────────────
    useEffect(() => {
        if (!socket) return;
        const onLoseHeart = () => {
            setLifeFlash(true);
            setTimeout(() => setLifeFlash(false), 400);
        };
        const onCombo = (data: { count: number }) => {
            if (data.count < 5) return;
            const color = data.count >= 10 ? '#f97316' : data.count >= 7 ? '#eab308' : '#a855f7';
            setComboEdge({ color, key: Date.now() });
            setTimeout(() => setComboEdge(null), 750);
        };
        socket.on('loseHeart', onLoseHeart);
        socket.on('comboServe', onCombo);
        return () => { socket.off('loseHeart', onLoseHeart); socket.off('comboServe', onCombo); };
    }, [socket]);

    // ── Mükemmel gün — hiç can kaybetmeden gün bitti ─────────────────────────
    useEffect(() => {
        if (!socket) return;
        const onDayEnd = (data: { lives: number }) => {
            const gs = gameStateRef.current;
            if (data.lives === 3 && gs.lives === 3) {
                setPerfectBanner({ visible: true, leaving: false });
                setTimeout(() => setPerfectBanner(b => b ? { ...b, leaving: true } : null), 3000);
                setTimeout(() => setPerfectBanner(null), 3400);
            }
        };
        socket.on('dayEnd', onDayEnd);
        return () => { socket.off('dayEnd', onDayEnd); };
    }, [socket]);

    useEffect(() => {
        if (lastEarnedCoins > 0) {
            const t = setTimeout(() => onClearEarnedCoins?.(), 3000);
            return () => clearTimeout(t);
        }
    }, [lastEarnedCoins]);

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
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const s = loadStats();
            saveStats({ totalPlayTime: s.totalPlayTime + elapsed, lastPlayed: Date.now(), gamesPlayed: s.gamesPlayed + 1 });
        };
    }, []);

    const { isMuted, toggleMute, audioStreams } = useVoiceChat({ isJoined: voiceActive && isJoined, myId, socket });

    useEffect(() => {
        Object.entries(audioStreams).forEach(([id, s]) => {
            const stream = s as MediaStream;
            if (!audioElementsRef.current[id]) {
                const audio = new Audio();
                audio.srcObject = stream; audio.autoplay = true; audio.volume = 0;
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
        showPerfStats: settings.showPerfStats, onPreviewUpdate: updatePreview,
    });

    // High DPI ekranlar için canvas çözünürlüğünü ayarla
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            // İç çözünürlüğü sabit tutuyoruz ama DPR ile netliği artırıyoruz
            // Not: Bu oyunun çizim mantığı GAME_WIDTH/HEIGHT üzerine kurulu olduğu için 
            // sadece CSS boyutlandırması ve image-rendering ile netlik sağlıyoruz.
            // Eğer gerçek çözünürlüğü artırırsak tüm çizim koordinatlarını dpr ile çarpmak gerekir.
            // Bu yüzden burada sadece dpr'ı kontrol edip gerekirse canvas style'ını optimize ediyoruz.
            canvas.style.imageRendering = dpr > 1 ? 'auto' : 'pixelated';
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [canvasRef]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="game-screen w-full flex flex-col select-none safe-top safe-bottom" style={{ background: '#545250' }}>

            {/* Yemek seçim ekranı açıkken tüm UI'ı blokla */}
            {menuChoices && menuChoices.length > 0 && dayPhase === 'prep' && (
                <div className="absolute inset-0 z-[45] pointer-events-auto" />
            )}

            <GameTopBar
                marketName={gameStateRef.current.marketName}
                roomId={roomId}
                dayPhase={dayPhase} day={day} dayTimer={dayTimer}
                score={score} lives={lives} queueLen={queueLen}
                comboCount={comboCount} activeCards={activeCards}
                isEditing={editorState.isMoving || editorState.isMovingTable}
                voiceActive={voiceActive} isMuted={isMuted}
                dayEndSummary={dayEndSummary} onClearDayEnd={onClearDayEnd}
                onOpenShop={() => emit('openShop')}
                onOpenVoice={() => setShowVoiceSettings(true)}
                onOpenCosmetics={() => setShowCosmetics(true)}
                onOpenSettings={() => setShowSettings(true)}
                onDevTap={() => {
                    navigator.clipboard.writeText(roomId);
                    const next = devTapCount + 1;
                    setDevTapCount(next);
                    if (next >= 5) { setShowDevPanel(true); setDevTapCount(0); }
                }}
            />

            <div className="flex-1 min-h-0 flex" style={{ background: '#9a7858' }}>

                {/* Sol panel — joystick (touch) */}
                {isTouchDevice && !showHudEditor && (
                    <JoystickPanel
                        panelWidth={panelWidth} joystickSize={joystickSize}
                        offset={settings.hudLayout.joystickOffset}
                        onOffsetChange={(offset) => updateSettings({ hudLayout: { ...settings.hudLayout, joystickOffset: offset } })}
                        onMove={(x, y) => { joystickVectorRef.current = { x, y }; }}
                    />
                )}

                {/* Canvas */}
                <div className="relative flex items-center justify-center flex-1 overflow-hidden">
                    <div className="relative canvas-container" style={{ aspectRatio: '1280/870', height: '100%', width: '100%' }}>
                        <canvas
                            ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT}
                            onContextMenu={(e) => e.preventDefault()}
                            className="w-full h-full block touch-none select-none"
                        />

                        <GameNightOverlays
                            isGameOver={isGameOver} dayPhase={dayPhase} day={day} score={score}
                            upgrades={upgrades} lives={lives} ovenCount={ovenCount} tableCount={tableCount}
                            unlockedDishes={unlockedDishes} menuChoices={menuChoices}
                            pendingCardChoices={pendingCardChoices} activeCards={activeCards}
                            onEmit={emit} onLeaveGame={onLeaveGame}
                        />

                        {/* Can kaybı kırmızı flash */}
                        {lifeFlash && (
                            <div className="life-flash absolute inset-0 rounded-sm bg-red-600 z-30" />
                        )}

                        {/* Combo x5+ kenar efekti */}
                        {comboEdge && (
                            <div
                                key={comboEdge.key}
                                className="combo-edge absolute inset-0 rounded-sm z-30"
                                style={{ '--combo-color': comboEdge.color } as React.CSSProperties}
                            />
                        )}

                        {/* Mükemmel gün banner */}
                        {perfectBanner && (
                            <div
                                className={`absolute top-[18%] left-1/2 z-40 pointer-events-none ${perfectBanner.leaving ? 'perfect-banner-out' : 'perfect-banner-in'}`}
                                style={{ transform: 'translateX(-50%)' }}
                            >
                                <div className="flex items-center gap-2 bg-yellow-900/90 border-2 border-yellow-400/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-2xl">
                                    <span className="text-2xl">⭐</span>
                                    <div className="flex flex-col">
                                        <span className="text-yellow-300 font-black text-base leading-tight">Mükemmel Gün!</span>
                                        <span className="text-yellow-500 text-xs">Hiç can kaybetmedin</span>
                                    </div>
                                    <span className="text-2xl">⭐</span>
                                </div>
                            </div>
                        )}

                        {settings.showPerfStats && (
                            <div className="absolute top-2 right-2 z-20 pointer-events-none">
                                <div className="bg-black/60 rounded-lg px-2 py-1 font-mono text-xs leading-tight">
                                    <div style={{ color: ping < 150 ? '#4ade80' : ping < 300 ? '#facc15' : '#f87171' }}>PING: {ping}ms</div>
                                </div>
                            </div>
                        )}

                        <ChatPanel socket={socket} myId={myId} messages={chatMessages} />
                    </div>
                </div>

                {/* Sağ panel — aksiyon butonları (touch) */}
                {isTouchDevice && !showHudEditor && (
                    <TouchActionButtons
                        dayPhase={dayPhase} bs={bs} musicOn={musicOn}
                        socket={socket} gameStateRef={gameStateRef} localPlayerRef={localPlayerRef}
                        lastPunchTimeRef={lastPunchTimeRef} chopTouchIntervalRef={chopTouchIntervalRef}
                        handleInteract={handleInteract} onEmit={emit} toggleMusic={toggleMusic}
                    />
                )}
            </div>

            {/* Düzenleme modu bar */}
            {dayPhase === 'prep' && (editorState.isMoving || editorState.isMovingTable) && (
                <div className="flex-none flex items-center justify-between gap-2 px-3 py-2 bg-stone-950 border-t border-purple-600/40">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-[11px] uppercase tracking-wider text-purple-300">
                            {editorState.isMoving ? '📦 İstasyon' : '🪑 Masa'}
                        </span>
                        {editorState.isMovingTable && (
                            <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-md">
                                {Object.keys(gameStateRef.current.tableLayout ?? {}).length} masa
                            </span>
                        )}
                        {editorState.isMovingTable && (() => {
                            const seats = editorState.movingTableId
                                ? (gameStateRef.current.tableLayout[editorState.movingTableId]?.seats ?? 4) : 4;
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

            {/* PC ipuçları */}
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

            {/* Modaller */}
            {showSettings && (
                <SettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setShowSettings(false)}
                    onLeaveGame={() => { setShowSettings(false); setShowLeave(true); }}
                    isJoined={isJoined}
                    onOpenHudEditor={() => { setShowSettings(false); setShowHudEditor(true); joystickVectorRef.current = { x: 0, y: 0 }; }}
                />
            )}
            {showLeave && (
                <LeaveModal score={score} day={day}
                    onConfirm={() => { setShowLeave(false); onLeaveGame?.(); }}
                    onCancel={() => setShowLeave(false)}
                />
            )}
            {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
            {showHudEditor && (
                <HudEditor layout={settings.hudLayout}
                    onChange={(layout) => updateSettings({ hudLayout: layout })}
                    onClose={() => setShowHudEditor(false)}
                />
            )}
            {showCosmetics && (
                <CosmeticsModal onClose={() => setShowCosmetics(false)} socket={socket}
                    myCharType={gameStateRef.current?.players?.[myId]?.charType}
                />
            )}
            {showVoiceSettings && (
                <SettingsModal onClose={() => setShowVoiceSettings(false)}
                    globalVolume={globalVoiceVol} setGlobalVolume={setGlobalVoiceVol}
                    isMuted={isMuted} toggleMute={toggleMute}
                    startVoiceChat={() => { setVoiceActive(true); }}
                    isVoiceActive={voiceActive}
                />
            )}
            {showDevPanel && <DevPanel socket={socket} onClose={() => setShowDevPanel(false)} />}

            {/* Coin Toast */}
            {lastEarnedCoins > 0 && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
                    style={{ animation: 'coinToastIn 0.3s ease-out, coinToastOut 0.4s ease-in 2.6s forwards' }}>
                    <div className="flex items-center gap-2 bg-yellow-900/90 border border-yellow-500/60 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-xl">
                        <span className="text-xl">🪙</span>
                        <span className="text-yellow-300 font-black text-sm">+{lastEarnedCoins} coin kazandın!</span>
                    </div>
                </div>
            )}

            {/* İntikam Sahnesi */}
            {revengeSceneSummary && (
                <RevengeSceneOverlay summary={revengeSceneSummary} onDone={onClearRevengeScene} bgmOn={settings.bgmOn} />
            )}
        </div>
    );
};
