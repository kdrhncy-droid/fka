import React from 'react';
import { BaseModal } from './BaseModal';
import { PlayerStats } from '../hooks/useStats';

interface Props {
    stats: PlayerStats;
    onClose: () => void;
    onReset: () => void;
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}dk`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}sa ${rem}dk` : `${h}sa`;
}

const StatRow: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
    <div className="flex items-center justify-between py-3 border-b border-stone-800 last:border-0">
        <div className="flex items-center gap-3">
            <span className="text-xl w-7 text-center">{icon}</span>
            <span className="text-sm text-stone-400 font-medium">{label}</span>
        </div>
        <span className="text-sm font-black text-stone-100 tabular-nums">{value}</span>
    </div>
);

export const StatsModal: React.FC<Props> = ({ stats, onClose, onReset }) => {
    const [confirmReset, setConfirmReset] = React.useState(false);

    return (
        <BaseModal onClose={onClose} zIndex="z-[60]">
            {/* Header */}
            <div className="bg-stone-800 p-5 flex justify-between items-center border-b border-stone-700">
                <div>
                    <h2 className="text-2xl font-black text-amber-400">İstatistikler 📊</h2>
                    <span className="text-xs text-stone-400 font-bold tracking-widest uppercase mt-1 block">Tüm Zamanlar</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-stone-700 hover:bg-stone-600 rounded-full flex items-center justify-center text-xl font-bold transition-transform active:scale-95"
                >
                    ✕
                </button>
            </div>

            {/* İçerik */}
            <div className="p-6 space-y-1">
                <StatRow icon="⏱️" label="Toplam Oynama Süresi" value={formatTime(stats.totalPlayTime)} />
                <StatRow icon="🏃" label="Toplam Koşu" value={stats.totalRuns.toString()} />
                <StatRow icon="📅" label="Toplam Gün" value={stats.totalDays.toString()} />
                <StatRow icon="🏆" label="En Yüksek Gün" value={`Gün ${stats.maxDay}`} />
                <StatRow icon="💰" label="En Yüksek Skor" value={stats.maxScore.toString()} />
                <StatRow icon="💵" label="Toplam Kazanılan" value={`${stats.totalEarned} ₺`} />
                <StatRow icon="🍽️" label="Toplam Servis" value={`${stats.totalCustomersServed} müşteri`} />
            </div>

            {/* Reset */}
            <div className="px-6 pb-6">
                {!confirmReset ? (
                    <button
                        onClick={() => setConfirmReset(true)}
                        className="w-full rounded-xl border border-stone-700 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-red-400 hover:border-red-900 transition-colors"
                    >
                        İstatistikleri Sıfırla
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { onReset(); setConfirmReset(false); }}
                            className="flex-1 rounded-xl bg-red-900/50 border border-red-700 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-400"
                        >
                            Evet, Sıfırla
                        </button>
                        <button
                            onClick={() => setConfirmReset(false)}
                            className="flex-1 rounded-xl border border-stone-700 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-400"
                        >
                            İptal
                        </button>
                    </div>
                )}
            </div>
        </BaseModal>
    );
};
