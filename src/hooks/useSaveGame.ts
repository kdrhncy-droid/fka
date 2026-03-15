const LS_KEY = 'fka-save-v1';

export interface SaveData {
    highScore: number;
    bestDay: number;
    bestDayHolders: string[];
    lastScore: number;
    lastDay: number;
    totalGamesPlayed: number;
    playerName: string;
    nameChangesLeft: number;
}

const DEFAULTS: SaveData = {
    highScore: 0,
    bestDay: 0,
    bestDayHolders: [],
    lastScore: 0,
    lastDay: 0,
    totalGamesPlayed: 0,
    playerName: '',
    nameChangesLeft: 2,
};

export function loadSave(): SaveData {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
        return { ...DEFAULTS };
    }
}

function persist(data: SaveData): void {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { }
}

export function writeSave(score: number, day: number, playerName?: string): SaveData {
    const prev = loadSave();

    let bestDayHolders = prev.bestDayHolders ?? [];
    if (playerName) {
        if (day > prev.bestDay) {
            bestDayHolders = [playerName];
        } else if (day === prev.bestDay && prev.bestDay > 0 && !bestDayHolders.includes(playerName)) {
            bestDayHolders = [...bestDayHolders, playerName];
        }
    }

    const next: SaveData = {
        ...prev,
        highScore: Math.max(prev.highScore, score),
        bestDay: Math.max(prev.bestDay, day),
        bestDayHolders,
        lastScore: score,
        lastDay: day,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
    };
    persist(next);
    return next;
}

/** İsim ayarla — ilk kez ücretsiz, sonrakiler hak tüketir.
 *  Döner: { allowed, changesLeft } */
export function trySetPlayerName(newName: string): { allowed: boolean; changesLeft: number } {
    const save = loadSave();
    const trimmed = newName.trim();
    if (!trimmed) return { allowed: false, changesLeft: save.nameChangesLeft };

    if (!save.playerName) {
        // İlk kez isim belirleniyor — ücretsiz
        persist({ ...save, playerName: trimmed });
        return { allowed: true, changesLeft: save.nameChangesLeft };
    }
    if (save.playerName === trimmed) {
        // Aynı isim — hak kullanılmaz
        return { allowed: true, changesLeft: save.nameChangesLeft };
    }
    if (save.nameChangesLeft <= 0) {
        return { allowed: false, changesLeft: 0 };
    }
    const left = save.nameChangesLeft - 1;
    persist({ ...save, playerName: trimmed, nameChangesLeft: left });
    return { allowed: true, changesLeft: left };
}

export function clearSave() {
    try { localStorage.removeItem(LS_KEY); } catch { }
}
