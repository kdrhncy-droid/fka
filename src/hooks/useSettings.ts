import { useState, useEffect, useRef } from 'react';
import { setSfxEnabled, setSfxVolume } from '../utils/audio';
import { setBgmVolume, setBgmEnabled } from '../utils/bgm';

export interface HudElementLayout {
    x: number;  // % cinsinden (0-100), sol kenardan
    y: number;  // % cinsinden (0-100), üst kenardan
    scale: number; // 0.5 - 2.0
}

export interface HudLayout {
    joystick: HudElementLayout;
    actionBtn: HudElementLayout;
    punchBtn: HudElementLayout;
    musicBtn: HudElementLayout;
    chopBtn: HudElementLayout;
    // Yan panel boyutları (touch cihazlar için)
    panelWidth: number;    // % cinsinden (10-25)
    joystickSize: number;  // px (80-160)
    btnSize: number;       // px (44-88)
    joystickOffset: { x: number; y: number }; // panel içi konum (%)
}

export const DEFAULT_HUD_LAYOUT: HudLayout = {
    joystick:  { x: 3,  y: 65, scale: 1.0 },
    actionBtn: { x: 82, y: 68, scale: 1.0 },
    punchBtn:  { x: 82, y: 55, scale: 1.0 },
    musicBtn:  { x: 82, y: 82, scale: 0.7 },
    chopBtn:   { x: 72, y: 68, scale: 1.0 },
    panelWidth: 17,
    joystickSize: 128,
    btnSize: 64,
    joystickOffset: { x: 50, y: 50 }, // panel ortası
};

export interface Settings {
    masterVolume: number;
    bgmVolume: number;
    sfxVolume: number;
    sfxOn: boolean;
    bgmOn: boolean;
    joystickSide: 'left' | 'right';
    hudLayout: HudLayout;
    showPerfStats: boolean;
    graphicsQuality: 'low' | 'medium' | 'high';
    vibration: boolean;
}

const DEFAULTS: Settings = {
    masterVolume: 0.5,
    bgmVolume: 0.5,
    sfxVolume: 0.8,
    sfxOn: true,
    bgmOn: true,
    joystickSide: 'left',
    hudLayout: DEFAULT_HUD_LAYOUT,
    showPerfStats: false,
    graphicsQuality: 'high',
    vibration: true,
};

const LS_KEY = 'terracraft-settings';

function load(): Settings {
    try {
        const saved = localStorage.getItem(LS_KEY);
        if (!saved) return DEFAULTS;
        const parsed = JSON.parse(saved);
        // hudLayout yoksa default ekle
        if (!parsed.hudLayout) parsed.hudLayout = DEFAULT_HUD_LAYOUT;
        // Yeni eklenen alanlar için fallback
        if (parsed.bgmVolume === undefined) parsed.bgmVolume = DEFAULTS.bgmVolume;
        if (parsed.sfxVolume === undefined) parsed.sfxVolume = DEFAULTS.sfxVolume;
        if (parsed.bgmOn === undefined) parsed.bgmOn = DEFAULTS.bgmOn;
        if (!parsed.hudLayout.chopBtn) parsed.hudLayout.chopBtn = DEFAULT_HUD_LAYOUT.chopBtn;
        if (parsed.hudLayout.panelWidth === undefined) parsed.hudLayout.panelWidth = DEFAULT_HUD_LAYOUT.panelWidth;
        if (parsed.hudLayout.joystickSize === undefined) parsed.hudLayout.joystickSize = DEFAULT_HUD_LAYOUT.joystickSize;
        if (parsed.hudLayout.btnSize === undefined) parsed.hudLayout.btnSize = DEFAULT_HUD_LAYOUT.btnSize;
        if (!parsed.hudLayout.joystickOffset) parsed.hudLayout.joystickOffset = DEFAULT_HUD_LAYOUT.joystickOffset;
        if (parsed.graphicsQuality === undefined) parsed.graphicsQuality = DEFAULTS.graphicsQuality;
        if (parsed.vibration === undefined) parsed.vibration = DEFAULTS.vibration;
        return { ...DEFAULTS, ...parsed };
    } catch {
        return DEFAULTS;
    }
}

function save(s: Settings) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { }
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(load);

    useEffect(() => {
        setSfxEnabled(settings.sfxOn);
    }, [settings.sfxOn]);

    useEffect(() => {
        setSfxVolume(settings.sfxVolume);
    }, [settings.sfxVolume]);

    useEffect(() => {
        setBgmVolume(settings.bgmVolume);
    }, [settings.bgmVolume]);

    // bgmOn sadece kullanıcı toggle yaptığında çağrılsın,
    // ilk mount'ta çağrılmaması için skipFirst pattern
    const bgmOnMountedRef = useRef(false);
    useEffect(() => {
        if (!bgmOnMountedRef.current) { bgmOnMountedRef.current = true; return; }
        setBgmEnabled(settings.bgmOn);
    }, [settings.bgmOn]);

    const update = (patch: Partial<Settings>) =>
        setSettings(prev => {
            const next = { ...prev, ...patch };
            save(next);
            return next;
        });

    return { settings, update };
}
