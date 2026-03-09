import React from 'react';
import { CHARACTER_TYPES } from '../../shared/types';
import { useGameLoop } from '../hooks/useGameLoop';

interface Props {
    onClose: () => void;
    socket: any;
    myCharType?: number;
}

export const CosmeticsModal: React.FC<Props> = ({ onClose, socket, myCharType }) => {
    const handleSelect = (id: number) => {
        if (socket) {
            socket.emit("changeCosmetic", id);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-200">

                {/* Header */}
                <div className="bg-stone-800 p-5 flex justify-between items-center border-b border-stone-700">
                    <div>
                        <h2 className="text-2xl font-black text-amber-400">Kostüm Mağazası 👕</h2>
                        <span className="text-xs text-stone-400 font-bold tracking-widest uppercase mt-1 block">Tüm Kostümler ÜCRETSİZ Giyilebilir</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-stone-700 hover:bg-stone-600 rounded-full flex items-center justify-center text-xl font-bold transition-transform active:scale-95"
                    >
                        ✕
                    </button>
                </div>

                {/* İçerik Gövdesi */}
                <div className="p-6 overflow-y-auto no-scrollbar pb-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CHARACTER_TYPES.map((char) => {
                            const isSelected = char.id === myCharType;

                            return (
                                <div
                                    key={char.id}
                                    className={`relative rounded-xl border-2 flex flex-col items-center justify-between p-4 transition-all ${isSelected
                                        ? 'border-emerald-500 bg-stone-800 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                        : 'border-stone-700 bg-stone-800/50 hover:bg-stone-700 hover:border-stone-500 cursor-pointer'
                                        }`}
                                    onClick={() => !isSelected && handleSelect(char.id)}
                                >
                                    {/* Icon / Head */}
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner mb-3"
                                        style={{ backgroundColor: char.bodyColor, border: `3px solid ${char.accent}` }}
                                    >
                                        {char.hat}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center w-full">
                                        <h3 className="font-black text-stone-100 uppercase tracking-tight text-sm">{char.name}</h3>
                                        <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">{char.label}</p>
                                    </div>

                                    {/* Button */}
                                    <div className="w-full mt-4">
                                        {isSelected ? (
                                            <div className="w-full bg-emerald-500/20 text-emerald-400 text-xs font-black py-2 rounded-lg text-center uppercase tracking-widest border border-emerald-500/30">
                                                GİYİLDİ
                                            </div>
                                        ) : (
                                            <div className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-black py-2 rounded-lg text-center uppercase tracking-widest shadow-md transition-colors">
                                                SEÇ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
