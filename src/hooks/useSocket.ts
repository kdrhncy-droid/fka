import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { playSound } from '../utils/audio';

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    myId: string;
    gameStateRef: React.MutableRefObject<GameState>;
    audioCtxRef: React.MutableRefObject<AudioContext | null>;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

const DEFAULT_STATE: GameState = {
    players: {},
    customers: [],
    waitList: [],
    holdingStations: [],
    dirtyTables: [],
    score: 0,
    stock: { '🍞': 10, '🥩': 10, '🥬': 10 },
    marketName: '',
    dayPhase: 'prep',
    dayTimer: 1800,
    upgrades: { patience: 0, earnings: 0, stockMax: 0 },
    day: 1,
    hasOrderedTonight: false,
    cookStations: [],
    dirtyTrayCount: 0,
    lives: 3,
    isGameOver: false,
    revengeQueue: [],
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
    const gameStateRef = useRef<GameState>(DEFAULT_STATE);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const roomIdRef = useRef<string>('');
    const playerDataRef = useRef<any>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 15;
    const reconnectDelayRef = useRef(1000); // 1 saniye başlangıç

    useEffect(() => {
        // Socket.IO konfigürasyonu: mobil uyumluluk için optimize edilmiş
        const newSocket = io({
            transports: ['websocket', 'polling'], // Fallback olarak polling
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts,
            // Arka planda bağlantıyı canlı tutmak için
            pingInterval: 25000, // 25 saniye
            pingTimeout: 60000, // 60 saniye timeout
            // Mobil tarayıcıların sekmeyi uyutmasını engelleme
            forceNew: false,
        });

        setSocket(newSocket);

        // ─── Bağlantı Event'leri ───────────────────────────────────────────
        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            reconnectAttemptsRef.current = 0;
            reconnectDelayRef.current = 1000;

            // Eğer önceden oyuncu verisi varsa, yeniden join et
            if (playerDataRef.current && roomIdRef.current) {
                console.log('[Socket] Re-joining room after reconnect:', roomIdRef.current);
                newSocket.emit('join', playerDataRef.current);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
            setConnectionStatus('disconnected');
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

        newSocket.on('state', (state: GameState) => {
            gameStateRef.current = state;
        });

        newSocket.on('sound', (type: string) => {
            playSound(audioCtxRef, type);
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

    return { socket, isConnected, myId, gameStateRef, audioCtxRef, connectionStatus };
}
