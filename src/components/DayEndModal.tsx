import React, { useState } from 'react';
import { DayEndSummary } from '../hooks/useSocket';

interface Props {
    summary: DayEndSummary;
    onClose: () => void;
}

export const DayEndModal: React.FC<Props> = ({ summary, onClose }) => {
    const [open, setOpen] = useState(false);

    const hearts = Array.from({ length: 3 }, (_, i) => i < summary.lives ? '❤️' : '🖤');

    return (
        <>
            {/* Üst barda küçük buton */}
            <button
                onClick={() => setOpen(true)}
                className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs border border-indigo-500 transition-all active:scale-95 whitespace-nowrap"
            >
                📋 Özet
            </button>

            {/* Modal */}
            {open && (
                <div
                    className="absolute inset-0 z-40 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-stone-900 border border-stone-700 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <div className="text-5xl mb-2">🌙</div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-stone-100">
                                Gün {summary.day} Bitti
                            </h2>
                        </div>

                        <div className="w-full space-y-3 min-w-[220px]">
                            <div className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3">
                                <span className="text-sm text-stone-400 font-bold">💰 Günlük Ciro</span>
                                <span className="text-xl font-black text-amber-400">${summary.score}</span>
                            </div>
                            <div className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3">
                                <span className="text-sm text-stone-400 font-bold">❤️ Can</span>
                                <span className="text-lg font-black text-stone-100 tracking-widest">{hearts.join(' ')}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-black uppercase tracking-widest text-stone-950 active:scale-95 transition-all"
                        >
                            Kapat ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
