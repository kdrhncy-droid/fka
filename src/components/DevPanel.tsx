import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface Props {
    socket: Socket | null;
    onClose: () => void;
}

export const DevPanel: React.FC<Props> = ({ socket, onClose }) => {
    const [log, setLog] = useState<string[]>([]);

    const emit = (event: string, data?: unknown) => {
        socket?.emit(event, data);
        setLog(prev => [`→ ${event}${data !== undefined ? ' ' + JSON.stringify(data) : ''}`, ...prev.slice(0, 9)]);
    };

    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg bg-stone-950 border border-stone-700 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-stone-900 border-b border-stone-800">
                    <span className="text-amber-400 font-black text-sm uppercase tracking-widest">🛠️ Dev Panel</span>
                    <button onClick={onClose} className="text-stone-500 hover:text-white text-lg">✕</button>
                </div>

                <div className="p-4 grid grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto">

                    {/* Faz Kontrolleri */}
                    <div className="col-span-2 text-[10px] font-black text-stone-500 uppercase tracking-widest mt-1">Faz</div>
                    <button onClick={() => emit('openShop')} className="dev-btn bg-amber-700">☀️ Günü Başlat</button>
                    <button onClick={() => emit('dev:makeNight')} className="dev-btn bg-indigo-700">🌙 Geceye Geç</button>
                    <button onClick={() => emit('nextDay')} className="dev-btn bg-emerald-700">➡️ Sonraki Gün</button>
                    <button onClick={() => emit('resetDay')} className="dev-btn bg-red-800">🔄 Sıfırla</button>

                    {/* Müşteri */}
                    <div className="col-span-2 text-[10px] font-black text-stone-500 uppercase tracking-widest mt-2">Müşteri</div>
                    <button onClick={() => emit('dev:spawnCustomer', { personality: 'polite' })} className="dev-btn bg-blue-700">😊 Kibar Müşteri</button>
                    <button onClick={() => emit('dev:spawnCustomer', { personality: 'rude' })} className="dev-btn bg-orange-700">😡 Kaba Müşteri</button>
                    <button onClick={() => emit('dev:spawnCustomer', { personality: 'recep' })} className="dev-btn bg-purple-700">🤪 Recep</button>
                    <button onClick={() => emit('dev:spawnCustomer', { personality: 'thug' })} className="dev-btn bg-stone-700">💀 Thug</button>
                    <button onClick={() => emit('dev:spawnCustomer', { personality: 'polite', specialRequest: 'spicy' })} className="dev-btn bg-red-700">🌶️ Acı İstek</button>
                    <button onClick={() => emit('dev:spawnCustomer', { personality: 'polite', specialRequest: 'quick' })} className="dev-btn bg-yellow-700">⚡ Acele İstek</button>

                    {/* Kart Sistemi */}
                    <div className="col-span-2 text-[10px] font-black text-stone-500 uppercase tracking-widest mt-2">Kart Sistemi</div>
                    <button onClick={() => emit('dev:triggerCards')} className="dev-btn bg-indigo-800 col-span-2">⚡ Kart Seçimini Tetikle</button>

                    {/* Yemek Unlock */}
                    <div className="col-span-2 text-[10px] font-black text-stone-500 uppercase tracking-widest mt-2">Yemek Unlock</div>
                    {['🍕','🍜','🌯','🍟','🥤','🍰','☕'].map(dish => (
                        <button key={dish} onClick={() => emit('dev:unlockDish', dish)} className="dev-btn bg-stone-700">
                            {dish} Aç
                        </button>
                    ))}

                    {/* Para */}
                    <div className="col-span-2 text-[10px] font-black text-stone-500 uppercase tracking-widest mt-2">Para</div>
                    <button onClick={() => emit('dev:addScore', 100)} className="dev-btn bg-emerald-800">+$100</button>
                    <button onClick={() => emit('dev:addScore', 500)} className="dev-btn bg-emerald-700">+$500</button>
                    <button onClick={() => emit('dev:addScore', 1000)} className="dev-btn bg-emerald-600">+$1000</button>
                    <button onClick={() => emit('dev:addScore', -100)} className="dev-btn bg-red-900">-$100</button>

                    {/* Can */}
                    <div className="col-span-2 text-[10px] font-black text-stone-500 uppercase tracking-widest mt-2">Can</div>
                    <button onClick={() => emit('dev:setLives', 3)} className="dev-btn bg-rose-700">❤️❤️❤️ Full Can</button>
                    <button onClick={() => emit('dev:setLives', 1)} className="dev-btn bg-rose-900">❤️ 1 Can</button>
                </div>

                {/* Log */}
                {log.length > 0 && (
                    <div className="px-4 pb-3 border-t border-stone-800 pt-2">
                        <div className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Log</div>
                        {log.map((l, i) => (
                            <div key={i} className="text-[10px] text-stone-400 font-mono">{l}</div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`.dev-btn { padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; color: white; transition: opacity 0.15s; text-align: center; } .dev-btn:hover { opacity: 0.85; } .dev-btn:active { transform: scale(0.97); }`}</style>
        </div>
    );
};
