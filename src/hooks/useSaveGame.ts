const LS_KEY = 'fka-save-v1';

export interface SaveData {
    highScore: number;
    bestDay: number;
    lastScore: number;
    lastDay: number;
    totalGamesPlayed: number;
}

const DEFAULTS: SaveData = {
    highScore: 0,
    bestDay: 0,
    lastScore: 0,
    lastDay: 0,
    totalGamesPlayed: 0,
};

export function loadSave(): SaveData {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
        return { ...DEFAULTS };
    }
}

export function writeSave(score: number, day: number): SaveData {
    const prev = loadSave();
    const next: SaveData = {
        highScore: Math.max(prev.highScore, score),
        bestDay: Math.max(prev.bestDay, day),
        lastScore: score,
        lastDay: day,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
    };
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch { }
    return next;
}

export function clearSave() {
    try { localStorage.removeItem(LS_KEY); } catch { }
}
