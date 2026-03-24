import { useState, useEffect, useRef } from 'react';

export interface PlayerStats {
    totalPlayTime: number;   // saniye
    totalDays: number;
    maxDay: number;
    maxScore: number;
    totalEarned: number;
    totalCustomersServed: number;
    totalRuns: number;
}

const LS_KEY = 'fka-stats';
const DEFAULTS: PlayerStats = {
    totalPlayTime: 0,
    totalDays: 0,
    maxDay: 0,
    maxScore: 0,
    totalEarned: 0,
    totalCustomersServed: 0,
    totalRuns: 0,
};

function load(): PlayerStats {
    try {
        const saved = localStorage.getItem(LS_KEY);
        if (!saved) return DEFAULTS;
        return { ...DEFAULTS, ...JSON.parse(saved) };
    } catch { return DEFAULTS; }
}

function save(s: PlayerStats) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { }
}

export function useStats() {
    const [stats, setStats] = useState<PlayerStats>(load);
    const sessionStartRef = useRef<number>(Date.now());
    const isTrackingRef = useRef(false);

    // Oturum süresini periyodik kaydet
    useEffect(() => {
        if (!isTrackingRef.current) return;
        const id = setInterval(() => {
            const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
            setStats(prev => {
                const next = { ...prev, totalPlayTime: prev.totalPlayTime + elapsed };
                save(next);
                sessionStartRef.current = Date.now();
                return next;
            });
        }, 30_000); // 30 saniyede bir kaydet
        return () => clearInterval(id);
    }, [isTrackingRef.current]);

    const startTracking = () => {
        sessionStartRef.current = Date.now();
        isTrackingRef.current = true;
    };

    const stopTracking = () => {
        if (!isTrackingRef.current) return;
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        isTrackingRef.current = false;
        setStats(prev => {
            const next = { ...prev, totalPlayTime: prev.totalPlayTime + elapsed };
            save(next);
            return next;
        });
    };

    // Koşu bitince çağır (game over veya çıkış)
    const recordRun = (params: { day: number; score: number; earned: number; customersServed: number }) => {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        sessionStartRef.current = Date.now();
        setStats(prev => {
            const next: PlayerStats = {
                ...prev,
                totalPlayTime: prev.totalPlayTime + elapsed,
                totalDays: prev.totalDays + params.day,
                maxDay: Math.max(prev.maxDay, params.day),
                maxScore: Math.max(prev.maxScore, params.score),
                totalEarned: prev.totalEarned + params.earned,
                totalCustomersServed: prev.totalCustomersServed + params.customersServed,
                totalRuns: prev.totalRuns + 1,
            };
            save(next);
            return next;
        });
    };

    const resetStats = () => {
        save(DEFAULTS);
        setStats(DEFAULTS);
    };

    return { stats, startTracking, stopTracking, recordRun, resetStats };
}
