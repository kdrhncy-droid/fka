import { useState, useEffect } from 'react';
import { setSfxEnabled } from '../utils/audio';

export interface Settings {
    masterVolume: number;      // 0-1
    sfxOn: boolean;
    buttonSize: number;      // 60-120 px
    joystickSide: 'left' | 'right';
}

const DEFAULTS: Settings = {
    masterVolume: 0.5,
    sfxOn: true,
    buttonSize: 80,
    joystickSide: 'left',
};

const LS_KEY = 'terracraft-settings';

function load(): Settings {
    try {
        const saved = localStorage.getItem(LS_KEY);
        return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
        return DEFAULTS;
    }
}

function save(s: Settings) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { }
}

/** Ayarları yönetir ve localStorage'a otomatik kaydeder */
export function useSettings() {
    const [settings, setSettings] = useState<Settings>(load);

    // BUG-2: sfxOn değişince global audio flag'ı güncelle
    useEffect(() => {
        setSfxEnabled(settings.sfxOn);
    }, [settings.sfxOn]);

    const update = (patch: Partial<Settings>) =>
        setSettings(prev => {
            const next = { ...prev, ...patch };
            save(next);
            return next;
        });

    return { settings, update };
}
