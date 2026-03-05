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
}

const DEFAULT_STATE: GameState = {
    players: {},
    customers: [],
    waitList: [],
    holdingStations: [],
    score: 0,
    stock: { '🫓': 10, '🥩': 10, '🥬': 10 },
    marketName: '',
    dayPhase: 'prep',
    dayTimer: 1800,
    upgrades: { patience: 0, earnings: 0, stockMax: 0 },
    day: 1,
    cookStations: {
        pizza: { input: null, timer: 0, output: null },
        grill: { input: null, timer: 0, output: null },
        salad: { input: null, timer: 0, output: null },
    },
};

/**
 * Socket.IO bağlantısını ve sunucu event'lerini yönetir.
 * localPlayerRef'i de init sırasında spawn pozisyonuna set eder.
 */
export function useSocket(
    localPlayerRef: React.MutableRefObject<{ x: number; y: number }>
): UseSocketReturn {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [myId, setMyId] = useState('');
    const gameStateRef = useRef<GameState>(DEFAULT_STATE);
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        const newSocket = io({ transports: ['websocket'] });
        setSocket(newSocket);

        newSocket.on('connect', () => setIsConnected(true));
        newSocket.on('disconnect', () => setIsConnected(false));

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

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return { socket, isConnected, myId, gameStateRef, audioCtxRef };
}
