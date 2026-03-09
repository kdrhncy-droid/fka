import React from 'react';

interface SettingsModalProps {
    onClose: () => void;
    globalVolume: number;
    setGlobalVolume: (vol: number) => void;
    isMuted: boolean;
    toggleMute: () => void;
    startVoiceChat: () => void;
    isVoiceActive: boolean;
}

export function SettingsModal({ onClose, globalVolume, setGlobalVolume, isMuted, toggleMute, startVoiceChat, isVoiceActive }: SettingsModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-[#2A2D34] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl space-y-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">⚙️ Ayarlar</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">×</button>
                </div>

                <div className="space-y-4">
                    {/* Sesi Kapat / Aç */}
                    <div className="bg-black/30 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white">Mikrofon</p>
                            <p className="text-xs text-white/50">{isMuted ? 'Şu an kapalı' : 'Şu an açık'}</p>
                        </div>

                        {!isVoiceActive ? (
                            <button
                                onClick={startVoiceChat}
                                className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg shadow whitespace-nowrap"
                            >
                                🎙️ Sese Katıl
                            </button>
                        ) : (
                            <button
                                onClick={toggleMute}
                                className={`font-bold py-2 px-6 rounded-lg shadow whitespace-nowrap transition-colors ${isMuted
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
                                    }`}
                            >
                                {isMuted ? 'Susturuldu 🔇' : 'Açık 🎙️'}
                            </button>
                        )}
                    </div>

                    {/* Ses Seviyesi (Volume) */}
                    <div className="bg-black/30 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between">
                            <p className="font-bold text-white">Genel Ses Seviyesi</p>
                            <p className="text-white/70 font-mono">{Math.round(globalVolume * 100)}%</p>
                        </div>
                        <p className="text-xs text-white/50">Diğer oyuncuların ve oyunun genel sesini ayarlar.</p>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={globalVolume}
                            onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                        />
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl shadow-[0_4px_0_#b45309] active:shadow-none active:translate-y-1 transition-all"
                >
                    Kapat
                </button>
            </div>
        </div>
    );
}
