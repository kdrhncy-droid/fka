import React, { useEffect, useState } from 'react';
import { DayEndSummary } from '../hooks/useSocket';

interface Props {
    summary: DayEndSummary;
    onClose: () => void;
}

export const DayEndModal: React.FC<Props> = ({ summary, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Kısa gecikmeyle fade-in
        const t = setTimeout(() => setVisible(true), 50);
        // 4 saniye sonra otomatik kapat
        const auto = setTimeout(() => handleClose(), 5000);
        return () => { clearTimeout(t); clearTimeout(auto); };
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    const hearts = Array.from({ length: 3 }, (_, i) => i < summary.lives ? '❤️' : '🖤');

    return (
        <div
            className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={handleClose}
        >
            <div
                className={`bg-stone-900 border border-stone-700 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl transition-transform duration-300 ${visible ? 'scale-100' : 'scale-90'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Başlık */}
                <div className="text-center">
                    <div className="text-5xl mb-2">🌙</div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-stone-100">
                        Gün {summary.day} Bitti
                    </h2>
                </div>

                {/* İstatistikler */}
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

                {/* Devam */}
                <button
                    onClick={handleClose}
                    className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-black uppercase tracking-widest text-stone-950 active:scale-95 transition-all"
                >
                    Geceye Geç →
                </button>
                <p className="text-[10px] text-stone-600">Otomatik kapanıyor...</p>
            </div>
        </div>
    );
};
