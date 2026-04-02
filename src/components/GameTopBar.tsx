import React from 'react';
import { DAY_TICKS, NIGHT_TICKS } from '../types/game';
import { DayEndModal } from './DayEndModal';
import { MARKET_NAME } from '../constants';
import { ALL_CARDS } from '../../shared/types';
import type { DayEndSummary } from '../hooks/useSocket';
import type { ActiveCard } from '../../shared/types';

interface Props {
    marketName: string;
    roomId: string;
    dayPhase: 'prep' | 'day' | 'night';
    day: number;
    dayTimer: number;
    score: number;
    lives: number;
    queueLen: number;
    comboCount: number;
    activeCards: ActiveCard[];
    isEditing: boolean;
    voiceActive: boolean;
    isMuted: boolean;
    dayEndSummary: DayEndSummary | null;
    onClearDayEnd: () => void;
    onOpenShop: () => void;
    onOpenVoice: () => void;
    onOpenCosmetics: () => void;
    onOpenSettings: () => void;
    onDevTap: () => void;
}

export const GameTopBar: React.FC<Props> = ({
    marketName, roomId, dayPhase, day, dayTimer, score, lives, queueLen,
    comboCount, activeCards, isEditing, voiceActive, isMuted,
    dayEndSummary, onClearDayEnd, onOpenShop, onOpenVoice, onOpenCosmetics, onOpenSettings, onDevTap,
}) => {
    const total = dayPhase === 'day' ? DAY_TICKS : NIGHT_TICKS;
    const progress = dayPhase === 'prep' ? 0 : 1 - dayTimer / total;
    const barColor = dayPhase === 'day'
        ? `hsl(${45 - progress * 30}, 90%, 55%)`
        : dayPhase === 'night'
            ? `hsl(${220 + progress * 20}, 70%, 40%)`
            : '#a78bfa';

    return (
        <div className="flex-none h-11 px-3 flex items-center justify-between gap-2 bg-stone-950/95 border-b border-stone-800">
            {/* Sol */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <h1 className="text-sm font-black text-white leading-none select-none truncate max-w-[120px]">
                    {marketName || MARKET_NAME}
                </h1>
                <button
                    onClick={onDevTap}
                    className="bg-stone-800 hover:bg-stone-700 active:bg-emerald-800 text-stone-400 font-mono text-[10px] px-2 py-0.5 rounded-md transition-colors border border-stone-700"
                    title="Oda kodunu kopyala"
                >
                    #{roomId}
                </button>
            </div>

            {/* Orta */}
            <div className="flex-1 max-w-xs flex flex-col items-center gap-0.5">
                {!isEditing ? (
                    <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: dayPhase === 'prep' ? '#a78bfa' : dayPhase === 'day' ? '#fbbf24' : '#818cf8' }}>
                        <span>
                            {dayPhase === 'prep' ? `Hazırlık · Gün ${day}` : dayPhase === 'day' ? `Gün ${day}` : `Gece ${day}`}
                            {queueLen > 0 && dayPhase === 'day' ? ` · ${queueLen} bekliyor` : ''}
                        </span>
                        <span className="flex gap-0.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} className="text-xs">{i < lives ? '❤️' : '🖤'}</span>
                            ))}
                        </span>
                    </span>
                ) : (
                    <span className="text-[10px] font-bold text-purple-400">Düzenleme Modu</span>
                )}
                {dayPhase === 'day' && (
                    <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: barColor }} />
                    </div>
                )}
            </div>

            {/* Sağ */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {dayPhase === 'prep' && (
                    <button onClick={onOpenShop}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg font-black text-xs transition-all whitespace-nowrap">
                        Dükkânı Aç
                    </button>
                )}
                <div className="bg-stone-800 border border-stone-700 text-white px-2.5 py-1 rounded-lg text-center min-w-[52px]">
                    <div className="text-[8px] font-bold text-stone-500 uppercase tracking-widest leading-none">Ciro</div>
                    <div className="text-sm font-black leading-tight text-emerald-400">${score}</div>
                </div>
                {comboCount >= 3 && (
                    <div className={`px-2 py-1 rounded-lg border text-center animate-pulse ${
                        comboCount >= 8 ? 'bg-orange-900/50 border-orange-500/50 text-orange-300' :
                        comboCount >= 5 ? 'bg-yellow-900/50 border-yellow-500/50 text-yellow-300' :
                        'bg-amber-900/50 border-amber-500/50 text-amber-300'
                    }`}>
                        <div className="text-[8px] font-bold uppercase tracking-widest leading-none">Combo</div>
                        <div className="text-sm font-black leading-tight">
                            {comboCount >= 8 ? '🔥🔥🔥' : comboCount >= 5 ? '🔥🔥' : '🔥'} x{comboCount}
                        </div>
                    </div>
                )}
                {activeCards.length > 0 && (
                    <div className="flex items-center gap-0.5">
                        {activeCards.map(ac => {
                            const def = ALL_CARDS.find(c => c.id === ac.id);
                            return (
                                <span key={ac.id} className="text-base" title={def?.name ?? ac.id}>
                                    {def?.icon ?? '⚡'}
                                </span>
                            );
                        })}
                    </div>
                )}
                <button onClick={onOpenVoice}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors border ${voiceActive && !isMuted ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'}`}>
                    🎙️
                </button>
                <button onClick={onOpenCosmetics}
                    className="w-8 h-8 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-lg flex items-center justify-center text-sm transition-colors">
                    👕
                </button>
                <button onClick={onOpenSettings}
                    className="w-8 h-8 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-lg flex items-center justify-center text-sm transition-colors">
                    ⚙️
                </button>
                {dayPhase === 'night' && dayEndSummary && (
                    <DayEndModal summary={dayEndSummary} onClose={onClearDayEnd} />
                )}
            </div>
        </div>
    );
};
