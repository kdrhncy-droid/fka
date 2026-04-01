import React from 'react';
import { HudLayout, DEFAULT_HUD_LAYOUT } from '../hooks/useSettings';

interface Props {
    layout: HudLayout;
    onChange: (layout: HudLayout) => void;
    onClose: () => void;
}

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (v: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between">
            <span className="text-stone-300 text-xs font-bold">{label}</span>
            <span className="text-amber-400 text-xs font-black">{Math.round(value)}{unit}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#f59e0b' }}
        />
    </div>
);

export const HudEditor: React.FC<Props> = ({ layout, onChange, onClose }) => {
    const pw = layout.panelWidth ?? 17;
    const js = layout.joystickSize ?? 128;
    const bs = layout.btnSize ?? 64;

    const update = (patch: Partial<HudLayout>) => onChange({ ...layout, ...patch });

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-sm">
            {/* Üst bar */}
            <div className="flex-none flex items-center justify-between px-4 py-3 bg-stone-900 border-b border-stone-800">
                <div>
                    <span className="text-white font-black text-sm">🎮 Arayüz Düzenle</span>
                    <p className="text-stone-500 text-[10px] mt-0.5">Sliderları sürükle · Önizleme canlı güncellenir</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => update(DEFAULT_HUD_LAYOUT)}
                        className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-xs font-bold transition-colors active:scale-95">
                        ↺ Sıfırla
                    </button>
                    <button onClick={onClose}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg text-xs font-black transition-colors active:scale-95">
                        ✓ Kaydet
                    </button>
                </div>
            </div>

            {/* İçerik: önizleme + ayarlar */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

                {/* Sol: Önizleme */}
                <div className="flex-1 flex items-center justify-center p-4 bg-stone-900/50">
                    <div className="relative bg-stone-800 rounded-2xl overflow-hidden border border-stone-700"
                        style={{ width: '100%', maxWidth: 480, aspectRatio: '16/9' }}>
                        {/* Oyun alanı simülasyonu */}
                        <div className="absolute inset-0 flex">
                            {/* Sol panel */}
                            <div className="flex-none flex items-center justify-center bg-black/20 border-r border-stone-700/30"
                                style={{ width: `${pw}%` }}>
                                <div className="rounded-full bg-stone-600/60 border-2 border-stone-500/40 flex items-center justify-center"
                                    style={{ width: js * 0.4, height: js * 0.4 }}>
                                    <div className="rounded-full bg-stone-500/60"
                                        style={{ width: js * 0.2, height: js * 0.2 }} />
                                </div>
                            </div>
                            {/* Orta: oyun */}
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-stone-600 text-xs font-bold uppercase tracking-widest">Oyun Alanı</span>
                            </div>
                            {/* Sağ panel */}
                            <div className="flex-none flex flex-col items-center justify-center gap-2 bg-black/20 border-l border-stone-700/30"
                                style={{ width: `${pw}%` }}>
                                {/* AL/VER */}
                                <div className="rounded-xl bg-blue-600/60 border border-blue-400/30 flex items-center justify-center text-white font-black"
                                    style={{ width: bs * 0.55, height: bs * 0.55, fontSize: bs * 0.12 }}>
                                    🤲
                                </div>
                                {/* DOĞRA */}
                                <div className="rounded-xl bg-amber-600/60 border border-amber-400/30 flex items-center justify-center"
                                    style={{ width: bs * 0.45, height: bs * 0.45, fontSize: bs * 0.12 }}>
                                    🔪
                                </div>
                                {/* DÖV */}
                                <div className="rounded-xl bg-red-600/60 border border-red-400/30 flex items-center justify-center"
                                    style={{ width: bs * 0.45, height: bs * 0.45, fontSize: bs * 0.12 }}>
                                    👊
                                </div>
                                {/* MÜZİK */}
                                <div className="rounded-xl bg-stone-600/60 border border-stone-500/30 flex items-center justify-center"
                                    style={{ width: bs * 0.35, height: bs * 0.35, fontSize: bs * 0.1 }}>
                                    🎵
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sağ: Ayarlar */}
                <div className="flex-none w-64 bg-stone-900 border-l border-stone-800 p-4 space-y-5 overflow-y-auto"
                    style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Panel Genişliği</p>
                        <Slider label="Sol & Sağ Panel" value={pw} min={12} max={25} unit="%" onChange={v => update({ panelWidth: v })} />
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Joystick</p>
                        <Slider label="Boyut" value={js} min={80} max={160} unit="px" onChange={v => update({ joystickSize: v })} />
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Aksiyon Butonları</p>
                        <Slider label="Boyut" value={bs} min={44} max={88} unit="px" onChange={v => update({ btnSize: v })} />
                    </div>

                    {/* Bilgi */}
                    <div className="bg-stone-800/60 rounded-xl p-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Mevcut Değerler</p>
                        <div className="text-[10px] text-stone-400 space-y-0.5">
                            <div>Panel: <span className="text-amber-400 font-bold">{pw}%</span></div>
                            <div>Joystick: <span className="text-amber-400 font-bold">{js}px</span></div>
                            <div>Butonlar: <span className="text-amber-400 font-bold">{bs}px</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
