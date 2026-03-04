import React from 'react';
import { COLORS, HATS } from '../types/game';
import { MARKET_NAME } from '../constants';

interface CharacterSelectProps {
    isConnected: boolean;
    playerName: string;
    setPlayerName: (v: string) => void;
    playerColor: string;
    setPlayerColor: (v: string) => void;
    playerHat: string;
    setPlayerHat: (v: string) => void;
    marketName: string;
    setMarketName: (v: string) => void;
    roomId: string;
    setRoomId: (v: string) => void;
    onJoin: (e: React.FormEvent) => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
    isConnected,
    playerName, setPlayerName,
    playerColor, setPlayerColor,
    playerHat, setPlayerHat,
    marketName, setMarketName,
    roomId, setRoomId,
    onJoin,
}) => (
    <div className="w-full min-h-dvh bg-stone-900 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h1 className="text-3xl font-black text-center mb-2 text-stone-800">{MARKET_NAME} 🏪</h1>
            <p className="text-center text-stone-500 mb-8 font-medium">Karakterini oluştur ve dükkana gir!</p>

            <form onSubmit={onJoin} className="space-y-6">
                {/* Bağlantı durumu */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm font-bold text-stone-500">
                        {isConnected ? 'Sunucuya Bağlı' : 'Sunucuya Bağlanıyor...'}
                    </span>
                </div>

                {/* İsim */}
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">İsmin (veya Lakabın)</label>
                    <input
                        type="text"
                        value={playerName}
                        onChange={e => setPlayerName(e.target.value)}
                        maxLength={10}
                        placeholder="Örn: Aşkım"
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-blue-500 outline-none transition-colors text-lg font-medium"
                        required
                    />
                </div>

                {/* Renk */}
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Rengini Seç</label>
                    <div className="flex gap-2 justify-between">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setPlayerColor(c)}
                                className={`w-10 h-10 rounded-full transition-transform ${playerColor === c ? 'scale-125 ring-4 ring-offset-2 ring-stone-800' : 'hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Şapka */}
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Şapkanı Seç</label>
                    <div className="flex gap-2 justify-between bg-stone-100 p-2 rounded-xl">
                        {HATS.map(h => (
                            <button
                                key={h || 'none'}
                                type="button"
                                onClick={() => setPlayerHat(h)}
                                className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all ${playerHat === h ? 'bg-white shadow-md scale-110' : 'hover:bg-white/50'}`}
                            >
                                {h || '❌'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Market İsmi */}
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Market İsmi</label>
                    <input
                        type="text"
                        value={marketName}
                        onChange={e => setMarketName(e.target.value)}
                        maxLength={20}
                        placeholder="Örn: Bizim Market"
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-blue-500 outline-none transition-colors text-lg font-medium"
                    />
                </div>

                {/* Oda */}
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Oda İsmi (Opsiyonel)</label>
                    <input
                        type="text"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value)}
                        maxLength={15}
                        placeholder="Örn: askimla-market"
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-blue-500 outline-none transition-colors text-lg font-medium"
                    />
                    <p className="text-xs text-stone-400 mt-1">Aynı odaya girmek için aynı ismi yazın.</p>
                </div>

                <button
                    type="submit"
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-lg transition-colors shadow-lg shadow-blue-500/30"
                >
                    DÜKKANA GİR 🚀
                </button>
            </form>
        </div>
    </div>
);
