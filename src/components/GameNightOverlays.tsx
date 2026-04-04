import React from 'react';
import { UpgradeShop } from './UpgradeShop';
import { CardSelectModal } from './CardSelectModal';
import type { Upgrades, GameCard, ActiveCard } from '../../shared/types';

const DISH_NAMES: Record<string, string> = {
    '🍕': 'Pizza', '🍔': 'Burger', '🥗': 'Salata', '🍜': 'Çorba',
    '🌯': 'Dürüm', '🍟': 'Patates', '🥤': 'İçecek', '🍰': 'Pasta', '☕': 'Kahve',
};

const DISH_INFO: Record<string, { ingredient: string; time: string; color: string }> = {
    '🍕': { ingredient: '🍞 Hamur',         time: '3 sn',   color: 'from-orange-600 to-red-600' },
    '🍔': { ingredient: '🥩 Et (doğra)',    time: '1.2 sn', color: 'from-amber-600 to-yellow-600' },
    '🥗': { ingredient: '🥬 Sebze (doğra)', time: '0.5 sn', color: 'from-green-600 to-emerald-600' },
    '🍜': { ingredient: '🥘 Çorba',         time: '4 sn',   color: 'from-yellow-600 to-amber-600' },
    '🌯': { ingredient: '🍢 Kebap (doğra)', time: '2 sn',   color: 'from-stone-600 to-amber-800' },
    '🍟': { ingredient: '🥔 Patates',       time: '1 sn',   color: 'from-yellow-500 to-amber-500' },
    '🥤': { ingredient: '🧊 Buzdolabı',     time: 'Anında', color: 'from-sky-500 to-blue-600' },
    '🍰': { ingredient: '🧁 Hamur Tatlı',   time: '6 sn',   color: 'from-pink-500 to-rose-500' },
    '☕': { ingredient: '☕ Kahve Makinesi',  time: 'Anında', color: 'from-amber-800 to-stone-800' },
};

interface Props {
    isGameOver: boolean;
    dayPhase: 'prep' | 'day' | 'night';
    day: number;
    score: number;
    upgrades: Upgrades;
    lives: number;
    ovenCount: number;
    tableCount: number;
    unlockedDishes: string[];
    menuChoices: string[] | null;
    pendingCardChoices: GameCard[] | null;
    activeCards: ActiveCard[];
    onEmit: (event: string, data?: unknown) => void;
    onLeaveGame?: () => void;
}

export const GameNightOverlays: React.FC<Props> = ({
    isGameOver, dayPhase, day, score, upgrades, lives, ovenCount, tableCount,
    unlockedDishes, menuChoices, pendingCardChoices, activeCards, onEmit, onLeaveGame,
}) => {
    if (isGameOver) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-red-950/90 backdrop-blur-md">
                <div className="text-center animate-bounce">
                    <div className="text-6xl mb-4">🤬</div>
                    <h2 className="text-red-500 font-black text-5xl tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">GAME OVER</h2>
                    <p className="text-red-200 text-lg mt-2 font-bold">Müşterileri çıldırttın ve restoranı terk ettiler!</p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-sm">
                    <button onClick={() => onEmit('resetDay')}
                        className="px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl font-black text-2xl border-2 border-amber-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(217,119,6,0.4)]">
                        🔄 TEKRAR DENE
                    </button>
                    <button onClick={() => onLeaveGame?.()}
                        className="px-10 py-5 bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 text-stone-100 rounded-2xl font-black text-2xl border-2 border-stone-500 transition-all active:scale-95 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
                        🏠 ANA MENÜ
                    </button>
                </div>
            </div>
        );
    }

    if (dayPhase !== 'night') {
        // Başlangıç yemek seçimi: prep fazında menuChoices varsa VE henüz yemek seçilmemişse göster
        if (!(menuChoices && menuChoices.length > 0 && unlockedDishes.length === 0)) return null;
    }

    return (
        <>
            {pendingCardChoices && pendingCardChoices.length > 0 && (
                <CardSelectModal
                    cards={pendingCardChoices}
                    activeCards={activeCards}
                    day={day}
                    onSelect={(cardId) => onEmit('selectCard', cardId)}
                />
            )}

            {menuChoices && menuChoices.length > 0 && (
                <div className="absolute inset-0 z-[50] bg-indigo-950/90 backdrop-blur-md p-4 overflow-y-auto flex flex-col items-center justify-center py-4 sm:py-8">
                    <div className="text-center mb-4 sm:mb-8 flex-shrink-0">
                        <div className="text-4xl sm:text-5xl mb-1 sm:mb-2">⭐</div>
                        <h2 className="text-white font-black text-xl sm:text-3xl uppercase tracking-tight">
                            {unlockedDishes.length === 0 ? 'İlk Yemeğini Seç!' : 'Yeni Menü Öğesi!'}
                        </h2>
                        <p className="text-indigo-200 text-[10px] sm:text-sm mt-1 max-w-md mx-auto px-4">
                            {unlockedDishes.length === 0
                                ? 'Restoranını açmak için bir başlangıç yemeği seçmelisin.'
                                : `Menünü genişlet! Yeni yemeğin yarından itibaren sipariş edilebilecek.`}
                        </p>
                    </div>

                    <div className="flex flex-row gap-3 sm:gap-6 w-full max-w-4xl justify-center px-2 sm:px-6">
                        {menuChoices.map(dish => {
                            const info = DISH_INFO[dish];
                            return (
                                <button key={dish} onClick={() => onEmit('selectMenu', dish)}
                                    className={`flex-1 max-w-[280px] bg-gradient-to-br ${info?.color ?? 'from-stone-600 to-stone-700'} 
                                    hover:scale-[1.02] active:scale-95 text-white rounded-xl sm:rounded-3xl p-3 sm:p-8 
                                    border-2 sm:border-4 border-white/30 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
                                    flex flex-col items-center justify-between gap-2 sm:gap-4 relative overflow-hidden group`}>
                                    
                                    {/* Parlama Efekti */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                    
                                    <div className="flex flex-col items-center gap-1 sm:gap-3">
                                        <span className="text-4xl sm:text-7xl drop-shadow-lg transform group-hover:rotate-12 transition-transform">{dish}</span>
                                        <span className="font-black text-sm sm:text-2xl uppercase tracking-tighter">{DISH_NAMES[dish] ?? dish}</span>
                                    </div>

                                    {info && (
                                        <div className="bg-black/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 w-full text-[9px] sm:text-xs space-y-1 border border-white/10">
                                            <div className="flex justify-between items-center">
                                                <span className="opacity-70">Malzeme:</span>
                                                <span className="font-bold">{info.ingredient.split(' ')[1]}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="opacity-70">Hazırlık:</span>
                                                <span className="font-bold">{info.time}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full py-1.5 sm:py-3 bg-white text-indigo-900 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-base uppercase shadow-lg group-hover:bg-indigo-50 transition-colors">
                                        SEÇ VE BAŞLA
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {unlockedDishes.length > 0 && (
                        <div className="mt-6 sm:mt-10 flex flex-col items-center gap-2 opacity-60">
                            <span className="text-indigo-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Mevcut Menün</span>
                            <div className="flex gap-2 bg-white/5 p-2 rounded-full px-4 border border-white/10">
                                {unlockedDishes.map(d => (
                                    <span key={d} className="text-lg sm:text-2xl filter grayscale hover:grayscale-0 transition-all cursor-help" title={DISH_NAMES[d]}>{d}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(!menuChoices || menuChoices.length === 0) && dayPhase === 'night' && (
                <UpgradeShop
                    score={score} upgrades={upgrades} day={day}
                    lives={lives} ovenCount={ovenCount} tableCount={tableCount}
                    unlockedDishes={unlockedDishes}
                    menuChoices={menuChoices}
                    pendingCardChoices={pendingCardChoices}
                    onUpgrade={id => onEmit('upgrade', id)}
                    onBuyOven={() => onEmit('buyOven')}
                    onBuyLife={() => onEmit('buyLife')}
                    onBuyTable={() => onEmit('buyTable')}
                    onOrder={() => onEmit('order')}
                    onNextDay={() => onEmit('nextDay')}
                />
            )}
        </>
    );
};
