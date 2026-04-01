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
        <button type="button" onClick={onClick}
            className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-emerald-500' : 'bg-stone-600'}`}>
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
        </button>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{title}</div>
            {children}
        </div>
    );
}

function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-stone-800/50 border border-stone-700/50 px-4 py-3">
            <div className="min-w-0">
                <div className="text-sm font-bold text-stone-200 leading-tight">{label}</div>
                {desc && <div className="text-xs text-stone-500 mt-0.5">{desc}</div>}
            </div>
            <div className="flex-shrink-0">{right}</div>
        </div>
    );
}

function Slider({ value, onChange, accent = 'amber' }: { value: number; onChange: (v: number) => void; accent?: string }) {
    const handle = (e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));
    return (
        <input type="range" min={0} max={1} step={0.05} value={value}
            onChange={handle}
            onInput={handle as any}
            style={{ touchAction: 'none' }}
            className={`w-full h-1.5 rounded-full appearance-none bg-stone-700 accent-${accent}-400`} />
    );
}

export const SettingsPanel: React.FC<Props> = ({ settings, onUpdate, onClose, isJoined, onLeaveGame, onOpenHudEditor }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/10 bg-stone-950 text-stone-100 shadow-2xl">

            {/* Başlık */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
                <h2 className="text-base font-black uppercase tracking-widest">⚙️ Ayarlar</h2>
                <button onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center text-sm transition-colors">
                    ✕
                </button>
            </div>

            <div className="p-5 space-y-6">

                {/* ── Ses ── */}
                <Section title="🎵 Ses">
                    <Row label="Arka Plan Müziği" desc="Oyun müziğini aç / kapat"
                        right={<Toggle on={settings.bgmOn} onClick={() => onUpdate({ bgmOn: !settings.bgmOn })} />} />
                    <div className={`px-4 py-3 rounded-2xl bg-stone-800/50 border border-stone-700/50 space-y-2 ${!settings.bgmOn ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="flex justify-between text-xs">
                            <span className="text-stone-400">Müzik Seviyesi</span>
                            <span className="text-violet-400 font-bold">{Math.round(settings.bgmVolume * 100)}%</span>
                        </div>
                        <Slider value={settings.bgmVolume} onChange={v => onUpdate({ bgmVolume: v })} accent="violet" />
                    </div>

                    <Row label="Ses Efektleri" desc="Mutfak ve etkileşim sesleri"
                        right={<Toggle on={settings.sfxOn} onClick={() => onUpdate({ sfxOn: !settings.sfxOn })} />} />
                    <div className={`px-4 py-3 rounded-2xl bg-stone-800/50 border border-stone-700/50 space-y-2 ${!settings.sfxOn ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="flex justify-between text-xs">
                            <span className="text-stone-400">Efekt Seviyesi</span>
                            <span className="text-amber-400 font-bold">{Math.round(settings.sfxVolume * 100)}%</span>
                        </div>
                        <Slider value={settings.sfxVolume} onChange={v => onUpdate({ sfxVolume: v })} accent="amber" />
                    </div>
                </Section>

                {/* ── Grafik ── */}
                <Section title="🖥️ Grafik">
                    <div className="rounded-2xl bg-stone-800/50 border border-stone-700/50 p-3">
                        <div className="text-xs text-stone-400 mb-2">Grafik Kalitesi</div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(['low', 'medium', 'high'] as const).map(q => (
                                <button key={q} onClick={() => onUpdate({ graphicsQuality: q })}
                                    className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${settings.graphicsQuality === q ? 'bg-amber-500 text-stone-950' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}>
                                    {q === 'low' ? 'Düşük' : q === 'medium' ? 'Orta' : 'Yüksek'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Row label="Ping Göstergesi" desc="Sunucu gecikmesini ekranda göster"
                        right={<Toggle on={settings.showPerfStats} onClick={() => onUpdate({ showPerfStats: !settings.showPerfStats })} />} />
                </Section>

                {/* ── Kontroller ── */}
                <Section title="🎮 Kontroller">
                    <div className="rounded-2xl bg-stone-800/50 border border-stone-700/50 p-3">
                        <div className="text-xs text-stone-400 mb-2">Joystick Tarafı</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(['left', 'right'] as const).map(side => (
                                <button key={side} onClick={() => onUpdate({ joystickSide: side })}
                                    className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${settings.joystickSide === side ? 'bg-amber-500 text-stone-950' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}>
                                    {side === 'left' ? '← Sol' : 'Sağ →'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Row label="Titreşim" desc="Dokunmatik geri bildirim (mobil)"
                        right={<Toggle on={settings.vibration} onClick={() => onUpdate({ vibration: !settings.vibration })} />} />
                    {onOpenHudEditor && (
                        <button onClick={onOpenHudEditor}
                            className="w-full py-3 rounded-2xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                            🎮 Arayüzü Düzenle
                            <span className="text-yellow-500/50 text-xs font-normal normal-case">Butonları sürükle</span>
                        </button>
                    )}
                </Section>

            </div>

            {/* Alt butonlar */}
            <div className={`px-5 pb-5 flex gap-2 ${isJoined ? 'justify-between' : 'justify-end'}`}>
                {isJoined && onLeaveGame && (
                    <button onClick={onLeaveGame}
                        className="px-4 py-3 rounded-2xl bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-400 text-sm font-bold uppercase tracking-wider transition-all">
                        🚪 Ayrıl
                    </button>
                )}
                <button onClick={onClose}
                    className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 text-sm font-black uppercase tracking-wider transition-all">
                    Kaydet ve Kapat
                </button>
            </div>
        </div>
    </div>
);
