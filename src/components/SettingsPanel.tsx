import React from 'react';
import { Settings } from '../hooks/useSettings';

interface Props {
    settings: Settings;
    onUpdate: (patch: Partial<Settings>) => void;
    onClose: () => void;
    isJoined?: boolean;
    onLeaveGame?: () => void;
    onOpenHudEditor?: () => void;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative h-7 w-14 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-stone-600'}`}
        >
            <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-7' : ''}`} />
        </button>
    );
}

function SliderRow({ label, valueLabel, min, max, step, value, onChange }: {
    label: string; valueLabel: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
    return (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
            <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-black uppercase tracking-[0.14em] text-stone-200">{label}</span>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">{valueLabel}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-4 w-full accent-amber-400" />
        </div>
    );
}

export const SettingsPanel: React.FC<Props> = ({ settings, onUpdate, onClose, isJoined, onLeaveGame, onOpenHudEditor }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#1c1917,#0c0a09)] p-4 text-stone-100 shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                <div>
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-stone-500">Ayarlar</div>
                    <h2 className="mt-2 text-2xl font-black uppercase text-stone-50">Kontrol paneli</h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-stone-100 transition-colors hover:bg-white/10"
                >
                    Kapat
                </button>
            </div>

            <div className="mt-5 space-y-4">
                    <SliderRow
                        label="Ana ses seviyesi"
                        valueLabel={`${Math.round(settings.masterVolume * 100)}%`}
                        min={0}
                        max={1}
                        step={0.05}
                        value={settings.masterVolume}
                        onChange={(value) => onUpdate({ masterVolume: value })}
                    />

                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-black uppercase tracking-[0.14em] text-stone-200">Ses efektleri</div>
                                <div className="mt-1 text-sm text-stone-400">Mutfak feedback seslerini ac kapa.</div>
                            </div>
                            <Toggle on={settings.sfxOn} onClick={() => onUpdate({ sfxOn: !settings.sfxOn })} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-sm font-black uppercase tracking-[0.14em] text-stone-200">Ping Göstergesi</div>
                                <div className="mt-1 text-sm text-stone-400">Sunucu gecikmesini (ping) ekranda göster.</div>
                            </div>
                            <Toggle on={settings.showPerfStats} onClick={() => onUpdate({ showPerfStats: !settings.showPerfStats })} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                        <div className="text-sm font-black uppercase tracking-[0.14em] text-stone-200">Joystick tarafı</div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {(['left', 'right'] as const).map((side) => (
                                <button
                                    key={side}
                                    type="button"
                                    onClick={() => onUpdate({ joystickSide: side })}
                                    className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors ${settings.joystickSide === side
                                        ? 'bg-amber-300 text-stone-950'
                                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                                        }`}
                                >
                                    {side === 'left' ? 'Sol' : 'Sag'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HUD Düzenleyici */}
                    <button
                        type="button"
                        onClick={onOpenHudEditor}
                        className="w-full rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 text-sm font-black uppercase tracking-[0.14em] text-yellow-300 transition-colors hover:bg-yellow-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                        🎮 Arayüzü Düzenle
                        <span className="text-yellow-500/60 text-xs font-normal normal-case tracking-normal">Butonları sürükle &amp; boyutlandır</span>
                    </button>
            </div>

            <div className={`mt-5 flex items-center ${isJoined ? 'justify-between' : 'justify-end'} gap-3`}>
                {isJoined && (
                    <button
                        type="button"
                        onClick={() => {
                            if(confirm("Odadan ayrılmak istediğine emin misin?")) {
                                onLeaveGame?.();
                            }
                        }}
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-red-500 transition-colors hover:bg-red-500/20 active:scale-[0.99]"
                    >
                        🚪 Odadan Ayrıl
                    </button>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#ea580c)] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-stone-950 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                    Kaydet ve Kapat
                </button>
            </div>
        </div>
    </div>
);
