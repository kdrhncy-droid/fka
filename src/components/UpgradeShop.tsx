import React from 'react';
import { Upgrades, UpgradeKey, UPGRADE_DEFS as SHARED_UPGRADES, OVEN_UPGRADE_COSTS, INITIAL_OVEN_POSITIONS, ADDITIONAL_OVEN_POSITIONS } from '../types/game';

const UPGRADE_UI: { id: UpgradeKey; icon: string; name: string; desc: string }[] = [
    { id: 'patience', icon: '⏳', name: 'Müşteri Sabrı', desc: 'Müşteriler daha uzun bekler' },
    { id: 'earnings', icon: '💰', name: 'Servis Kazancı', desc: 'Her servisten +5 ekstra puan' },
    { id: 'plateStackMax', icon: '🍽️', name: 'Tabak Yığını', desc: 'Başlangıçta daha çok tabak' },
    { id: 'safeOven', icon: '🛡️', name: 'Güvenli Fırın', desc: 'Lv1: yanma 2x yavaş · Lv2: hiç yanmaz' },
    { id: 'fryerSpeed', icon: '🍟', name: 'Fritöz Hızı', desc: 'Patates daha hızlı kızarır' },
    { id: 'fridgeCapacity', icon: '🧊', name: 'Buzdolabı Kapasitesi', desc: '+3 içecek kapasitesi' },
    { id: 'cakeBaker', icon: '🍰', name: 'Pasta Fırını Hızı', desc: 'Pasta daha hızlı pişer' },
    { id: 'coffeeMachine', icon: '☕', name: 'Kahve Kapasitesi', desc: '+2 kahve kapasitesi' },
];

const DISH_NAMES: Record<string, string> = {
    '🍕': 'Pizza', '🍔': 'Burger', '🥗': 'Salata', '🍜': 'Çorba', '🌯': 'Dürüm',
    '🍟': 'Patates', '🥤': 'İçecek',
};

interface Props {
    score: number;
    upgrades: Upgrades;
    day: number;
    lives: number;
    ovenCount: number;
    unlockedDishes: string[];
    menuChoices: string[] | null;
    pendingCardChoices?: any[] | null;
    onUpgrade: (id: keyof Upgrades) => void;
    onBuyOven: () => void;
    onBuyLife: () => void;
    onOrder: () => void;
    onNextDay: () => void;
}

export const UpgradeShop: React.FC<Props> = ({
    score, upgrades, day, lives, ovenCount, unlockedDishes, menuChoices, pendingCardChoices, onUpgrade, onBuyOven, onBuyLife, onOrder, onNextDay,
}) => {
    const maxOvens = INITIAL_OVEN_POSITIONS.length + ADDITIONAL_OVEN_POSITIONS.length;
    const canBuyOven = ovenCount < maxOvens;
    const ovenIndex = ovenCount - INITIAL_OVEN_POSITIONS.length;
    const ovenCost = canBuyOven ? OVEN_UPGRADE_COSTS[ovenIndex] : 0;

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-start sm:justify-center gap-5 bg-black/65 backdrop-blur-sm p-4 overflow-y-auto py-10">

            {/* Başlık */}
            <div className="text-center">
                <div className="text-5xl mb-1">🌙</div>
                <h2 className="text-white font-black text-2xl">Gün {day} Bitti!</h2>
                <p className="text-stone-300 text-sm mt-1">
                    Ciro: <span className="text-emerald-400 font-black text-lg">${score}</span>
                </p>
            </div>

            {/* Mevcut Menü */}
            <div className="bg-stone-800/80 rounded-xl px-4 py-2 border border-stone-600 flex items-center gap-3">
                <span className="text-stone-300 text-xs font-bold">Menün:</span>
                <div className="flex gap-2">
                    {unlockedDishes.map(d => (
                        <div key={d} className="flex flex-col items-center gap-0.5">
                            <span className="text-xl">{d}</span>
                            <span className="text-[9px] text-stone-400">{DISH_NAMES[d]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upgrade kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
                {/* Fırın */}
                <div className="bg-stone-800/90 rounded-xl p-3 border border-stone-600 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <span className="text-2xl">🔥</span>
                        <div>
                            <div className="text-white font-bold text-sm leading-tight">Ek Fırın</div>
                            <div className="text-stone-400 text-xs">Daha hızlı pişirme</div>
                        </div>
                    </div>
                    <div className="text-stone-300 text-xs">Mevcut: {ovenCount}/{maxOvens}</div>
                    <button
                        onClick={() => canBuyOven && score >= ovenCost && onBuyOven()}
                        disabled={!canBuyOven || score < ovenCost}
                        className={`w-full py-1.5 rounded-lg text-sm font-black transition-colors ${!canBuyOven ? 'bg-stone-700 text-stone-500 cursor-default' :
                            score >= ovenCost ? 'bg-orange-600 hover:bg-orange-500 text-white' :
                                'bg-stone-700 text-stone-500 cursor-not-allowed'
                            }`}
                    >
                        {!canBuyOven ? 'MAX ✓' : `$${ovenCost} Satın Al`}
                    </button>
                </div>

                {/* Can */}
                <div className="bg-stone-800/90 rounded-xl p-3 border border-stone-600 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <span className="text-2xl">❤️</span>
                        <div>
                            <div className="text-white font-bold text-sm leading-tight">Ekstra Can</div>
                            <div className="text-stone-400 text-xs">+1 kalp, max 3</div>
                        </div>
                    </div>
                    <div className="text-stone-300 text-xs">
                        Mevcut: {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, 3 - lives))}
                    </div>
                    <button
                        onClick={() => lives < 3 && score >= 75 && onBuyLife()}
                        disabled={lives >= 3 || score < 75}
                        className={`w-full py-1.5 rounded-lg text-sm font-black transition-colors ${lives >= 3 ? 'bg-stone-700 text-stone-500 cursor-default' :
                                score >= 75 ? 'bg-rose-600 hover:bg-rose-500 text-white' :
                                    'bg-stone-700 text-stone-500 cursor-not-allowed'
                            }`}
                    >
                        {lives >= 3 ? 'DOLU ✓' : '$75 Satın Al'}
                    </button>
                </div>

                {/* Upgrades */}
                {UPGRADE_UI.map(u => {
                    const def = SHARED_UPGRADES[u.id];
                    const level = upgrades[u.id];
                    const maxed = level >= def.max;
                    const cost = maxed ? 0 : def.costs[level as number];
                    const canBuy = !maxed && score >= cost;

                    return (
                        <div key={u.id} className="bg-stone-800/90 rounded-xl p-3 border border-stone-600 flex flex-col gap-2">
                            <div className="flex items-start gap-2">
                                <span className="text-2xl">{u.icon}</span>
                                <div>
                                    <div className="text-white font-bold text-sm leading-tight">{u.name}</div>
                                    <div className="text-stone-400 text-xs">{u.desc}</div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {Array.from({ length: def.max }, (_, i) => (
                                    <div key={i} className={`h-2 flex-1 rounded-full ${i < level ? 'bg-purple-500' : 'bg-stone-600'}`} />
                                ))}
                            </div>
                            <button
                                onClick={() => canBuy && onUpgrade(u.id)}
                                disabled={maxed || !canBuy}
                                className={`w-full py-1.5 rounded-lg text-sm font-black transition-colors ${maxed ? 'bg-stone-700 text-stone-500 cursor-default' :
                                    canBuy ? 'bg-purple-600 hover:bg-purple-500 text-white' :
                                        'bg-stone-700 text-stone-500 cursor-not-allowed'
                                    }`}
                            >
                                {maxed ? 'MAX ✓' : `$${cost} Satın Al`}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Alt buton */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                <button
                    onClick={onNextDay}
                    disabled={!!(menuChoices && menuChoices.length > 0) || !!(pendingCardChoices && pendingCardChoices.length > 0)}
                    className={`flex-1 py-3 rounded-xl font-black text-base border-2 transition-all active:scale-95 ${
                        (menuChoices && menuChoices.length > 0) || (pendingCardChoices && pendingCardChoices.length > 0)
                        ? 'bg-stone-700 text-stone-500 border-stone-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-amber-300'
                    }`}
                >
                    {(menuChoices && menuChoices.length > 0)
                        ? '⏳ Önce yemek seç...'
                        : (pendingCardChoices && pendingCardChoices.length > 0)
                        ? '⚡ Önce kart seç...'
                        : '☀️ Yeni Güne Başla →'}
                </button>
            </div>
        </div>
    );
};
