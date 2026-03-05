import React from 'react';
import { Settings } from '../hooks/useSettings';

interface Props {
    settings: Settings;
    onUpdate: (patch: Partial<Settings>) => void;
    onClose: () => void;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-purple-500' : 'bg-stone-600'}`}
        >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : ''}`} />
        </button>
    );
}

/** Ayarlar modalı — ses, buton boyutu, joystick tarafı */
export const SettingsPanel: React.FC<Props> = ({ settings, onUpdate, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <div className="bg-stone-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-stone-700 space-y-5">

            {/* Başlık */}
            <div className="flex items-center justify-between">
                <h2 className="text-white font-black text-xl">⚙️ Ayarlar</h2>
                <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none">✕</button>
            </div>

            {/* Ses Seviyesi */}
            <div>
                <label className="block text-stone-300 text-sm font-bold mb-2">
                    🔊 Ses Seviyesi — {Math.round(settings.masterVolume * 100)}%
                </label>
                <input
                    type="range" min={0} max={1} step={0.05}
                    value={settings.masterVolume}
                    onChange={e => onUpdate({ masterVolume: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                />
            </div>

            {/* SFX Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-stone-300 text-sm font-bold">🎵 Ses Efektleri</span>
                <Toggle on={settings.sfxOn} onClick={() => onUpdate({ sfxOn: !settings.sfxOn })} />
            </div>

            {/* Buton Boyutu */}
            <div>
                <label className="block text-stone-300 text-sm font-bold mb-2">
                    📱 Buton Boyutu — {settings.buttonSize}px
                </label>
                <input
                    type="range" min={60} max={120} step={5}
                    value={settings.buttonSize}
                    onChange={e => onUpdate({ buttonSize: parseInt(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-stone-500 text-xs mt-1">
                    <span>Küçük</span><span>Normal</span><span>Büyük</span>
                </div>
            </div>

            {/* Buton Yüksekliği */}
            <div className="mb-4">
                <label className="block text-stone-300 text-sm font-bold mb-2">↕️ Buton Yüksekliği (Aşağıdan Mesafesi)</label>
                <input
                    type="range"
                    min="10" max="150" step="10"
                    value={settings.buttonOffset}
                    onChange={(e) => onUpdate({ buttonOffset: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-stone-500 text-xs mt-1">
                    <span>Aşağıda</span><span>Yukarıda</span>
                </div>
            </div>

            {/* Joystick Tarafı */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-stone-300 text-sm font-bold">🕹️ Joystick Tarafı</span>
                <div className="flex gap-2">
                    {(['left', 'right'] as const).map(side => (
                        <button
                            key={side}
                            onClick={() => onUpdate({ joystickSide: side })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${settings.joystickSide === side
                                ? 'bg-blue-500 text-white'
                                : 'bg-stone-700 text-stone-400'
                                }`}
                        >
                            {side === 'left' ? '⬅️ Sol' : 'Sağ ➡️'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Joystick Boyutu */}
            <div className="mb-4">
                <label className="block text-stone-300 text-sm font-bold mb-2">🕹️ Joystick Boyutu</label>
                <input
                    type="range"
                    min="80" max="200" step="10"
                    value={settings.joystickSize}
                    onChange={(e) => onUpdate({ joystickSize: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-stone-500 text-xs mt-1">
                    <span>Küçük</span><span>Normal</span><span>Büyük</span>
                </div>
            </div>

            {/* Joystick Yüksekliği */}
            <div className="mb-6">
                <label className="block text-stone-300 text-sm font-bold mb-2">↕️ Joystick Yüksekliği (Aşağıdan Mesafesi)</label>
                <input
                    type="range"
                    min="10" max="150" step="10"
                    value={settings.joystickOffset}
                    onChange={(e) => onUpdate({ joystickOffset: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-stone-500 text-xs mt-1">
                    <span>Aşağıda</span><span>Yukarıda</span>
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-base transition-colors"
            >
                ✓ Kaydet & Kapat
            </button>
        </div>
    </div>
);
