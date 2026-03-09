import React from 'react';
import { Upgrades, UpgradeKey, UPGRADE_DEFS as SHARED_UPGRADES, OVEN_UPGRADE_COSTS, INITIAL_OVEN_POSITIONS, ADDITIONAL_OVEN_POSITIONS } from '../types/game';

// UI bilgileri — costs/max değerleri shared'dan gelir (tek kaynak)
const UPGRADE_UI: { id: UpgradeKey; icon: string; name: string; desc: string }[] = [
    { id: 'patience', icon: '⏳', name: 'Müşteri Sabrı', desc: 'Müşteriler daha uzun bekler' },
    { id: 'earnings', icon: '💰', name: 'Servis Kazancı', desc: 'Her servisten +5 ekstra puan' },
    { id: 'stockMax', icon: '📦', name: 'Depo Kapasitesi', desc: 'Siparişte daha fazla stok gelir' },
];

interface Props {
    score: number;
    upgrades: Upgrades;
    day: number;
    ovenCount: number; // Mevcut fırın sayısı
    onUpgrade: (id: keyof Upgrades) => void;
    onBuyOven: () => void; // Fırın satın alma
    onOrder: () => void;
    onNextDay: () => void;
}

/** Gece ekranı: upgrade shop + sipariş + yeni gün */
export const UpgradeShop: React.FC<Props> = ({
    score, upgrades, day, ovenCount, onUpgrade, onBuyOven, onOrder, onNextDay,
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

            {/* Upgrade kartları + Fırın */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
                {/* Fırın Satın Alma */}
                <div className="bg-stone-800/90 rounded-xl p-3 border border-stone-600 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <span className="text-2xl">🔥</span>
                        <div>
                            <div className="text-white font-bold text-sm leading-tight">Ek Fırın</div>
                            <div className="text-stone-400 text-xs">Daha hızlı pişirme</div>
                        </div>
                    </div>

                    <div className="text-stone-300 text-xs">
                        Mevcut: {ovenCount}/{maxOvens}
                    </div>

                    <button
                        onClick={() => canBuyOven && score >= ovenCost && onBuyOven()}
                        disabled={!canBuyOven || score < ovenCost}
                        className={`w-full py-1.5 rounded-lg text-sm font-black transition-colors ${!canBuyOven ? 'bg-stone-700 text-stone-500 cursor-default' :
                                score >= ovenCost ? 'bg-orange-600 hover:bg-orange-500 text-white' :
                                    'bg-stone-700 text-stone-500 cursor-not-allowed'
                            }`}
                    >
                        {!canBuyOven ? 'MAX ✓' : `${ovenCost} Satın Al`}
                    </button>
                </div>

                {/* Mevcut Upgrade'ler */}
                {UPGRADE_UI.map(u => {
                    const def = SHARED_UPGRADES[u.id];
                    const level = upgrades[u.id];
                    const maxed = level >= def.max;
                    const cost = maxed ? 0 : def.costs[level as number];
                    const canBuy = !maxed && score >= cost;

                    return (
                        <div
                            key={u.id}
                            className="bg-stone-800/90 rounded-xl p-3 border border-stone-600 flex flex-col gap-2"
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-2xl">{u.icon}</span>
                                <div>
                                    <div className="text-white font-bold text-sm leading-tight">{u.name}</div>
                                    <div className="text-stone-400 text-xs">{u.desc}</div>
                                </div>
                            </div>

                            {/* Seviye barları */}
                            <div className="flex gap-1">
                                {Array.from({ length: def.max }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 flex-1 rounded-full ${i < level ? 'bg-purple-500' : 'bg-stone-600'}`}
                                    />
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

            {/* Alt butonlar */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                <button
                    onClick={onOrder}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-base border-2 border-indigo-400 transition-all active:scale-95"
                >
                    🛒 Stok Siparişi Ver
                </button>
                <button
                    onClick={onNextDay}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-black text-base border-2 border-amber-300 transition-all active:scale-95"
                >
                    ☀️ Yeni Güne Başla →
                </button>
            </div>
        </div>
    );
};
