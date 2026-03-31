import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types/game';
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
}

export interface ChatMessage {
    id: string;
    name: string;
    text: string;
    ts: number;
}

const DEFAULT_STATE: GameState = {
    players: {},
    customers: [],
    waitList: [],
    holdingStations: [],
    dirtyTables: [],
    score: 0,
    marketName: '',
    dayPhase: 'prep',
    dayTimer: 2700,
    upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0,
                fryerSpeed: 0, cakeBaker: 0, coffeeMachine: 0, extraSink: 0, extraChopBoard: 0 },
    day: 1,
    hasOrderedTonight: false,
    cookStations: [],
    dirtyTrayCount: 0,
    plateStack: { count: 4, maxCount: 4 },
    lives: 3,
    isGameOver: false,
    revengeQueue: [],
    unlockedDishes: ['🥗', '🍔'],
    menuChoices: null,
    activeCards: [],
    pendingCardChoices: null,
    hidePatience: false,
    comboCount: 0,
    comboTimer: 0,
    stationLayout: {},
    lockedStations: {},
    tableLayout: {},
    lockedTables: {},
    choppingBoards: [],
    sinks: [],
    serviceWindow: [],
};

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
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [ping, setPing] = useState<number>(0);
    const pingBufferRef = useRef<number[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [dayEndSummary, setDayEndSummary] = useState<DayEndSummary | null>(null);
    const gameStateRef = useRef<GameState>(DEFAULT_STATE);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const roomIdRef = useRef<string>('');
    interface PlayerJoinData { room?: string; roomId?: string; name: string; color: string; hat: string; charType?: number; hairColor?: string; clothingColor?: string; faceShape?: number; mapId?: string; }
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
            reconnectDelayRef.current = 1000;

            // Ping ölçümü — her 2 saniyede bir, 5 örnekli hareketli ortalama
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

        newSocket.on('chatMessage', (msg: ChatMessage) => {
            setChatMessages(prev => [...prev.slice(-49), msg]);
        });

        newSocket.on('dayEnd', (summary: DayEndSummary) => {
            setDayEndSummary(prev => prev ?? summary); // zaten varsa ezme
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
                if (newSocket.connected && myId) {
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

    return { socket, isConnected, myId, gameStateRef, audioCtxRef, connectionStatus, ping, chatMessages, dayEndSummary, clearDayEnd };
}
