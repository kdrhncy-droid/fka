import React, { useEffect, useRef, useState } from 'react';
import { addCoinsFromScore, loadProfile, saveProfile } from '../utils/profile';
import { checkAchievements } from '../utils/achievements';
import { io, Socket } from 'socket.io-client';
import { GameState, mkGameState } from '../types/game';
import { playSound } from '../utils/audio';

export interface DayEndSummary {
    day: number;
    score: number;
    lives: number;
}

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    myId: string;
    gameStateRef: React.MutableRefObject<GameState>;
    audioCtxRef: React.MutableRefObject<AudioContext | null>;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    ping: number;
    chatMessages: ChatMessage[];
    dayEndSummary: DayEndSummary | null;
    clearDayEnd: () => void;
    revengeSceneSummary: DayEndSummary | null;
    clearRevengeScene: () => void;
    lastEarnedCoins: number;
    clearEarnedCoins: () => void;
    newAchievements: import('../utils/achievements').Achievement[];
    clearAchievements: () => void;
}

export interface ChatMessage {
    id: string;
    name: string;
    text: string;
    ts: number;
}

const DEFAULT_STATE: GameState = mkGameState();

/**
 * Socket.IO bağlantısını ve sunucu event'lerini yönetir.
 * Mobil cihazlarda arka planda bağlantı kopmasını önlemek için geliştirilmiş.
 * - Otomatik yeniden bağlanma
 * - Visibility API ile arka plan/ön plan algılama
 * - Periyodik ping-pong
 * - State re-sync
 */
export function useSocket(
    localPlayerRef: React.MutableRefObject<{ x: number; y: number }>
): UseSocketReturn {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [myId, setMyId] = useState('');
    const myIdRef = useRef('');
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [ping, setPing] = useState<number>(0);
    const pingBufferRef = useRef<number[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [dayEndSummary, setDayEndSummary] = useState<DayEndSummary | null>(null);
    const [revengeSceneSummary, setRevengeSceneSummary] = useState<DayEndSummary | null>(null);
    const [lastEarnedCoins, setLastEarnedCoins] = useState(0);
    const [newAchievements, setNewAchievements] = useState<import('../utils/achievements').Achievement[]>([]);
    // runtime stats (tek oyun içi)
    const runtimeRef = useRef({ perfectDays: 0, maxCombo: 0, servedInOneDay: 0, livesAtDayStart: 3 });
    const gameStateRef = useRef<GameState>(DEFAULT_STATE);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const roomIdRef = useRef<string>('');
    interface PlayerJoinData { room?: string; roomId?: string; name: string; color: string; hat: string; charType?: number; hairColor?: string; hairStyle?: string; clothingColor?: string; faceShape?: number; nameLabelColor?: string; title?: string; labelEffect?: string; mapId?: string; }
    const playerDataRef = useRef<PlayerJoinData | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 15;

    useEffect(() => {
        // Socket.IO konfigürasyonu: mobil uyumluluk için optimize edilmiş
        const newSocket = io(undefined, {
            transports: ['websocket', 'polling'], // Fallback olarak polling
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts,
            // Mobil tarayıcıların sekmeyi uyutmasını engelleme
            forceNew: false,
        });

        setSocket(newSocket);

        // ─── Bağlantı Event'leri ───────────────────────────────────────────
        newSocket.on('connect', () => {
            if (process.env.NODE_ENV !== 'production') console.log('[Socket] Connected:', newSocket.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            reconnectAttemptsRef.current = 0;

            // Ping ölçümü — her 2 saniyede bir, 5 örnekli hareketli ortalama
            clearInterval((newSocket as any)._pingInterval); // önceki varsa temizle
            const pingInterval = setInterval(() => {
                if (!newSocket.connected) return;
                newSocket.emit('ping_check', Date.now());
            }, 2000);
            // Cleanup için ref'e kaydet
            (newSocket as any)._pingInterval = pingInterval;

            // Eğer önceden oyuncu verisi varsa, yeniden join et
            if (playerDataRef.current && roomIdRef.current) {
                if (process.env.NODE_ENV !== 'production') console.log('[Socket] Re-joining room after reconnect:', roomIdRef.current);
                newSocket.emit('join', playerDataRef.current);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
            setConnectionStatus('disconnected');
            clearInterval((newSocket as any)._pingInterval);
        });

        newSocket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
            setConnectionStatus('reconnecting');
        });

        newSocket.on('reconnect_attempt', () => {
            console.log('[Socket] Reconnecting... Attempt:', reconnectAttemptsRef.current + 1);
            setConnectionStatus('reconnecting');
            reconnectAttemptsRef.current++;
        });

        newSocket.on('reconnect', () => {
            console.log('[Socket] Reconnected successfully');
            setIsConnected(true);
            setConnectionStatus('connected');
            reconnectAttemptsRef.current = 0;
        });

        newSocket.on('reconnect_failed', () => {
            console.error('[Socket] Reconnection failed after max attempts');
            setConnectionStatus('disconnected');
        });

        // ─── Oyun Event'leri ──────────────────────────────────────────────
        newSocket.on('init', (data: { id: string; state: GameState }) => {
            console.log('[Socket] init:', data.id);
            setMyId(data.id);
            myIdRef.current = data.id;
            gameStateRef.current = data.state;
            
            // Spawn pozisyonunu local ref'e yaz
            if (data.state.players[data.id]) {
                localPlayerRef.current.x = data.state.players[data.id].x;
                localPlayerRef.current.y = data.state.players[data.id].y;
            }
        });

        // Son bilinen pozisyonları cache'le — state gelince ezilmesin
        const lastPositions = new Map<string, { x: number; y: number }>();

        newSocket.on('state', (state: GameState) => {
            // Mevcut pozisyonları koru (positions event'inden gelen daha güncel olabilir)
            if (gameStateRef.current?.players) {
                for (const [id, p] of Object.entries(gameStateRef.current.players) as [string, { x: number; y: number }][]) {
                    lastPositions.set(id, { x: p.x, y: p.y });
                }
            }
            gameStateRef.current = state;
            // Pozisyonları geri yaz
            for (const [id, pos] of lastPositions) {
                if (gameStateRef.current.players[id]) {
                    gameStateRef.current.players[id].x = pos.x;
                    gameStateRef.current.players[id].y = pos.y;
                }
            }
        });

        newSocket.on('positions', (positions: Record<string, { x: number; y: number }>) => {
            const players = gameStateRef.current?.players;
            if (!players) return;
            for (const [id, pos] of Object.entries(positions)) {
                if (players[id]) {
                    players[id].x = pos.x;
                    players[id].y = pos.y;
                    lastPositions.set(id, pos);
                }
            }
        });

        newSocket.on('pong_check', (t0: number) => {
            const sample = Date.now() - t0;
            pingBufferRef.current.push(sample);
            if (pingBufferRef.current.length > 5) pingBufferRef.current.shift();
            const avg = Math.round(pingBufferRef.current.reduce((a, b) => a + b, 0) / pingBufferRef.current.length);
            setPing(avg);
        });

        newSocket.on('sound', (type: string) => {
            playSound(audioCtxRef, type);
        });

        // Servis sayısı ve combo takibi
        newSocket.on('comboServe', (data: { count: number }) => {
            const rt = runtimeRef.current;
            if (data.count > rt.maxCombo) {
                rt.maxCombo = data.count;
                const profile = loadProfile();
                if (data.count > (profile.maxCombo ?? 0)) {
                    saveProfile({ maxCombo: data.count });
                    const stats = { totalServed: profile.totalServed, totalDays: profile.totalDays, totalScore: profile.totalScore, gamesPlayed: profile.gamesPlayed, totalPlayTime: profile.totalPlayTime, perfectDays: profile.perfectDays ?? 0, maxCombo: data.count, servedInOneDay: rt.servedInOneDay };
                    const unlocked = checkAchievements(stats);
                    if (unlocked.length > 0) setNewAchievements(prev => [...prev, ...unlocked]);
                }
            }
        });

        newSocket.on('tipCollected', () => {
            const rt = runtimeRef.current;
            rt.servedInOneDay++;
            const profile = loadProfile();
            saveProfile({ totalServed: profile.totalServed + 1 });
            const updatedProfile = loadProfile();
            const stats = { totalServed: updatedProfile.totalServed, totalDays: updatedProfile.totalDays, totalScore: updatedProfile.totalScore, gamesPlayed: updatedProfile.gamesPlayed, totalPlayTime: updatedProfile.totalPlayTime, perfectDays: updatedProfile.perfectDays ?? 0, maxCombo: updatedProfile.maxCombo ?? 0, servedInOneDay: rt.servedInOneDay };
            const unlocked = checkAchievements(stats);
            if (unlocked.length > 0) setNewAchievements(prev => [...prev, ...unlocked]);
        });

        newSocket.on('chatMessage', (msg: ChatMessage) => {
            setChatMessages(prev => [...prev.slice(-49), msg]);
        });

        newSocket.on('dayEnd', (summary: DayEndSummary) => {
            setDayEndSummary(prev => prev ?? summary);
            if (summary.score > 0) {
                const earned = addCoinsFromScore(summary.score);
                setLastEarnedCoins(earned);
            }
            // Başarım kontrolü
            const rt = runtimeRef.current;
            if (summary.lives === 3) rt.perfectDays++;
            const profile = loadProfile();
            saveProfile({
                totalDays: profile.totalDays + 1,
                totalScore: profile.totalScore + summary.score,
                perfectDays: (profile.perfectDays ?? 0) + (summary.lives === 3 ? 1 : 0),
            });
            const updatedProfile = loadProfile();
            const stats = {
                totalServed: updatedProfile.totalServed,
                totalDays: updatedProfile.totalDays,
                totalScore: updatedProfile.totalScore,
                gamesPlayed: updatedProfile.gamesPlayed,
                totalPlayTime: updatedProfile.totalPlayTime,
                perfectDays: updatedProfile.perfectDays ?? 0,
                maxCombo: updatedProfile.maxCombo ?? 0,
                servedInOneDay: rt.servedInOneDay,
            };
            const unlocked = checkAchievements(stats);
            if (unlocked.length > 0) setNewAchievements(prev => [...prev, ...unlocked]);
            rt.servedInOneDay = 0;
            rt.livesAtDayStart = summary.lives;
        });

        newSocket.on('revengeScene', (summary: DayEndSummary) => {
            setRevengeSceneSummary(summary);
            setDayEndSummary(null); // dayEnd ile çakışmasın
        });

        // ─── Visibility API: Arka planda/Ön planda Algılama ───────────────
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('[Socket] Page is now hidden (background)');
                // Arka planda: bağlantıyı canlı tutmaya devam et
                // Socket.IO zaten bunu yapıyor, ek bir şey yapmamıza gerek yok
            } else {
                console.log('[Socket] Page is now visible (foreground)');
                // Ön plana geri geldi: state senkronizasyonu iste
                if (newSocket.connected && myIdRef.current) {
                    console.log('[Socket] Requesting state sync...');
                    newSocket.emit('requestSync');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // ─── Cleanup ──────────────────────────────────────────────────────
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            newSocket.disconnect();
        };
    }, []);

    // ─── Join event'ini yakala ve playerDataRef'e kaydet ────────────────
    useEffect(() => {
        if (socket) {
            const originalEmit = socket.emit.bind(socket);
            socket.emit = function (event: string, ...args: any[]) {
                if (event === 'join') {
                    // Join event'ini kaydet (yeniden bağlanmada kullanmak için)
                    playerDataRef.current = args[0];
                    roomIdRef.current = args[0]?.roomId || '';
                    console.log('[Socket] Saved player data for reconnect:', playerDataRef.current);
                }
                return originalEmit(event, ...args);
            };
        }
    }, [socket]);

    const clearDayEnd = () => setDayEndSummary(null);
    const clearRevengeScene = () => setRevengeSceneSummary(null);
    const clearEarnedCoins = () => setLastEarnedCoins(0);
    const clearAchievements = () => setNewAchievements([]);

    return { socket, isConnected, myId, gameStateRef, audioCtxRef, connectionStatus, ping, chatMessages, dayEndSummary, clearDayEnd, revengeSceneSummary, clearRevengeScene, lastEarnedCoins, clearEarnedCoins, newAchievements, clearAchievements };
}
