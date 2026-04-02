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
    unlockedDishes: string[];
    menuChoices: string[] | null;
    pendingCardChoices: GameCard[] | null;
    activeCards: ActiveCard[];
    onEmit: (event: string, data?: unknown) => void;
    onLeaveGame?: () => void;
}

export const GameNightOverlays: React.FC<Props> = ({
    isGameOver, dayPhase, day, score, upgrades, lives, ovenCount,
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
        // Başlangıç yemek seçimi: prep fazında menuChoices varsa göster
        if (!(menuChoices && menuChoices.length > 0)) return null;
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
                <div className="absolute inset-0 z-30 bg-indigo-950/85 backdrop-blur-sm p-4 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start sm:justify-center py-8">
                    <div className="text-center mb-6 flex-shrink-0 mt-4 sm:mt-0">
                        <div className="text-5xl mb-2">⭐</div>
                        <h2 className="text-white font-black text-2xl">{unlockedDishes.length === 0 ? 'Hangi yemeği yapacaksın?' : 'Yeni Yemek Seç!'}</h2>
                        <p className="text-indigo-200 text-sm mt-1">
                            {unlockedDishes.length === 0
                                ? 'Menünü oluşturmak için bir yemek seç.'
                                : `Menüye eklemek için bir yemek seç. Gün ${day + 1}'den itibaren müşteriler bu yemeği sipariş edebilecek.`}
                        </p>
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                            <span className="text-indigo-300 text-xs">Mevcut menün:</span>
                            {unlockedDishes.map(d => (
                                <span key={d} className="text-base" title={DISH_NAMES[d]}>{d}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg flex-shrink-0">
                        {menuChoices.map(dish => {
                            const info = DISH_INFO[dish];
                            return (
                                <button key={dish} onClick={() => onEmit('selectMenu', dish)}
                                    className={`flex-1 bg-gradient-to-b ${info?.color ?? 'from-stone-600 to-stone-700'} hover:brightness-110 active:scale-95 text-white rounded-2xl p-5 border-2 border-white/20 transition-all shadow-xl flex flex-col items-center gap-2`}>
                                    <span className="text-5xl">{dish}</span>
                                    <span className="font-black text-xl">{DISH_NAMES[dish] ?? dish}</span>
                                    {info && (
                                        <div className="text-white/80 text-xs text-center space-y-0.5">
                                            <div>Malzeme: {info.ingredient}</div>
                                            <div>Pişirme: ~{info.time}</div>
                                        </div>
                                    )}
                                    <span className="mt-1 px-3 py-1 bg-white/20 rounded-full text-sm font-bold">Seç →</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {(!menuChoices || menuChoices.length === 0) && dayPhase === 'night' && (
                <UpgradeShop
                    score={score} upgrades={upgrades} day={day}
                    lives={lives} ovenCount={ovenCount}
                    unlockedDishes={unlockedDishes}
                    menuChoices={menuChoices}
                    pendingCardChoices={pendingCardChoices}
                    onUpgrade={id => onEmit('upgrade', id)}
                    onBuyOven={() => onEmit('buyOven')}
                    onBuyLife={() => onEmit('buyLife')}
                    onOrder={() => onEmit('order')}
                    onNextDay={() => onEmit('nextDay')}
                />
            )}
        </>
    );
};
