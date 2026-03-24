import React, { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { playSound } from '../utils/audio';

interface UseKeyboardProps {
    isJoinedRef: React.MutableRefObject<boolean>;
    socket: Socket | null;
    audioCtxRef: React.MutableRefObject<AudioContext | null>;
    gameStateRef: React.MutableRefObject<GameState>;
    localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
    onInteract?: () => void; // Prep fazında layout editor'a yönlendirmek için
}

/**
 * WASD + Arrow tuşlarıyla hareket, Space/E ile etkişim.
 * Rude/Recep müşteri yakınsa ve aktif diyaloğu varsa daha önce punchCustomer emit edilir.
 * keys ref'ini döndürür — game loop bunu her frame okur.
 */
export function useKeyboard({ isJoinedRef, socket, audioCtxRef, gameStateRef, localPlayerRef, onInteract }: UseKeyboardProps) {
    const keys = useRef({ w: false, a: false, s: false, d: false });
    const lastPunchTime = useRef(0);
    const chopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isJoinedRef.current) return;

            // AudioContext'i uyandır (ilk tuşa basışta)
            if (audioCtxRef.current?.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            switch (e.key) {
                case 'w': case 'W': case 'ArrowUp': keys.current.w = true; break;
                case 'a': case 'A': case 'ArrowLeft': keys.current.a = true; break;
                case 's': case 'S': case 'ArrowDown': keys.current.s = true; break;
                case 'd': case 'D': case 'ArrowRight': keys.current.d = true; break;
                case ' ': case 'e': case 'E': {
                    e.preventDefault();
                    if (e.repeat) break; // basılı tutunca tekrar tetiklenmesin
                    if (audioCtxRef.current?.state === 'suspended') {
                        audioCtxRef.current.resume();
                    }
                    if (onInteract) {
                        onInteract();
                    } else {
                        socket?.emit('interact');
                    }
                    break;
                }

                case 'f': case 'F': case 'q': case 'Q': {
                    e.preventDefault();

                    const now = Date.now();
                    const gs = gameStateRef.current;
                    const lp = localPlayerRef.current;

                    const PUNCH_RADIUS = 120;
                    const PUNCH_COOLDOWN_MS = 250;
                    if (now - lastPunchTime.current > PUNCH_COOLDOWN_MS) {
                        const punchTarget = gs.customers.find(c => {
                            if (c.isLeaving) return false;

                            // Oturuyorsa y ekseni yukarıda kalıyor, vurma noktasını masaya hizalayalım
                            const visualY = c.isSeated ? c.seatY + 20 : c.y;
                            const dist = Math.hypot(c.x - lp.x, visualY - lp.y);

                            // Artık dialog şartı yok, sadece tipine ve mesafeye bakıyoruz
                            return dist <= PUNCH_RADIUS && (c.personality === 'rude' || c.personality === 'recep' || c.personality === 'thug');
                        });

                        if (punchTarget) {
                            socket?.emit('punchCustomer', punchTarget.id);
                            lastPunchTime.current = now;
                            break;
                        }
                    }
                    break;
                }

                // R tuşu — kesme tahtasında basılı tut
                case 'r': case 'R': {
                    e.preventDefault();
                    if (e.repeat) break;
                    const gs2 = gameStateRef.current;
                    const lp2 = localPlayerRef.current;
                    const board = gs2.choppingBoards?.find(b => Math.hypot(b.x - lp2.x, b.y - lp2.y) < 90);
                    if (board) {
                        socket?.emit('chop_start', board.id);
                        // Doğrama ses efekti — her 300ms'de bir
                        if (!chopIntervalRef.current) {
                            playSound(null, 'chop');
                            chopIntervalRef.current = setInterval(() => playSound(null, 'chop'), 300);
                        }
                    }
                    break;
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!isJoinedRef.current) return;
            switch (e.key) {
                case 'w': case 'W': case 'ArrowUp': keys.current.w = false; break;
                case 'a': case 'A': case 'ArrowLeft': keys.current.a = false; break;
                case 's': case 'S': case 'ArrowDown': keys.current.s = false; break;
                case 'd': case 'D': case 'ArrowRight': keys.current.d = false; break;
                // R bırakılınca chop_stop
                case 'r': case 'R': {
                    const gs = gameStateRef.current;
                    const lp = localPlayerRef.current;
                    const board = gs.choppingBoards?.find(b => Math.hypot(b.x - lp.x, b.y - lp.y) < 90);
                    if (board) socket?.emit('chop_stop', board.id);
                    // Ses intervalini durdur
                    if (chopIntervalRef.current) {
                        clearInterval(chopIntervalRef.current);
                        chopIntervalRef.current = null;
                    }
                    break;
                }
            }
        };

        // Pencere focus kaybedince tüm tuşları sıfırla (takılı kalma sorunu)
        const handleBlur = () => {
            keys.current = { w: false, a: false, s: false, d: false };
            if (chopIntervalRef.current) {
                clearInterval(chopIntervalRef.current);
                chopIntervalRef.current = null;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, [socket]); // socket değişirse interact emit doğru socket'e gitsin

    return keys;
}
