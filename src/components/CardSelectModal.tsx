import React from 'react';
import { GameCard, ActiveCard } from '../../shared/types';

interface Props {
    cards: GameCard[];
    activeCards: ActiveCard[];
    day: number;
    onSelect: (cardId: string) => void;
}

export const CardSelectModal: React.FC<Props> = ({ cards, activeCards, day, onSelect }) => {
    return (
        <div className="absolute inset-0 z-40 bg-indigo-950/90 backdrop-blur-sm p-4 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start sm:justify-center py-8">
            {/* Başlık */}
            <div className="text-center mb-6 flex-shrink-0 mt-4 sm:mt-0">
                <div className="text-4xl mb-2">⚡</div>
                <h2 className="text-white font-black text-2xl tracking-wide">Günlük Kart Seç</h2>
                <p className="text-indigo-300 text-sm mt-1">
                    Bu etki <span className="text-white font-bold">tüm run boyunca</span> aktif kalır
                </p>
            </div>

            {/* Kart seçenekleri */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl flex-shrink-0">
                {cards.map(card => (
                    <button
                        key={card.id}
                        onClick={() => onSelect(card.id)}
                        className="flex-1 bg-stone-900/90 hover:bg-stone-800/90 active:scale-95 border-2 border-indigo-500/40 hover:border-indigo-400/70 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all shadow-xl"
                    >
                        <span className="text-5xl">{card.icon}</span>
                        <span className="text-white font-black text-lg">{card.name}</span>
                        <div className="w-full space-y-2">
                            <div className="flex items-start gap-2 bg-red-950/50 border border-red-500/30 rounded-xl px-3 py-2">
                                <span className="text-red-400 text-sm font-bold flex-shrink-0">✗</span>
                                <span className="text-red-300 text-xs leading-relaxed">{card.penalty}</span>
                            </div>
                            <div className="flex items-start gap-2 bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-3 py-2">
                                <span className="text-emerald-400 text-sm font-bold flex-shrink-0">✓</span>
                                <span className="text-emerald-300 text-xs leading-relaxed">{card.reward}</span>
                            </div>
                        </div>
                        <span className="mt-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white text-sm font-black transition-colors">
                            Seç →
                        </span>
                    </button>
                ))}
            </div>

            {/* Aktif kartlar */}
            {activeCards.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Aktif:</span>
                    {activeCards.map(ac => {
                        const def = cards.find(c => c.id === ac.id);
                        return (
                            <span key={ac.id} className="text-lg" title={def?.name ?? ac.id}>
                                {def?.icon ?? '⚡'}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
