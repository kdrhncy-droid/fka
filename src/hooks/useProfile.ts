import { useState } from 'react';

export interface Profile {
    playerName: string;
    charType: number;
}

const LS_KEY = 'fka-profile';
const DEFAULTS: Profile = { playerName: '', charType: 0 };

function load(): Profile {
    try {
        const saved = localStorage.getItem(LS_KEY);
        if (!saved) return DEFAULTS;
        return { ...DEFAULTS, ...JSON.parse(saved) };
    } catch { return DEFAULTS; }
}

function save(p: Profile) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch { }
}

export function useProfile() {
    const [profile, setProfile] = useState<Profile>(load);

    const update = (patch: Partial<Profile>) =>
        setProfile(prev => {
            const next = { ...prev, ...patch };
            save(next);
            return next;
        });

    return { profile, update };
}
