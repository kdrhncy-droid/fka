import React from 'react';

const LS_KEY = 'terracraft-stats';

export interface GameStats {
  totalPlayTime: number;   // saniye
  totalDays: number;
  totalScore: number;
  totalServed: number;
  gamesPlayed: number;
  lastPlayed: number;      // timestamp
}

const DEFAULT_STATS: GameStats = {
  totalPlayTime: 0,
  totalDays: 0,
  totalScore: 0,
  totalServed: 0,
  gamesPlayed: 0,
  lastPlayed: 0,
};

export function loadStats(): GameStats {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? { ...DEFAULT_STATS, ...JSON.parse(s) } : DEFAULT_STATS;
  } catch { return DEFAULT_STATS; }
}

export function saveStats(patch: Partial<GameStats>) {
  try {
    const current = loadStats();
    localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function fmtDate(ts: number): string {
  if (!ts) return 'Hiç';
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface Props {
  onClose: () => void;
}

export const StatsModal: React.FC<Props> = ({ onClose }) => {
  const stats = loadStats();

  const rows = [
    { label: 'Toplam Oyun Süresi', value: fmt(stats.totalPlayTime), icon: '⏱️' },
    { label: 'Oynanan Oyun', value: stats.gamesPlayed.toString(), icon: '🎮' },
    { label: 'Tamamlanan Gün', value: stats.totalDays.toString(), icon: '📅' },
    { label: 'Toplam Ciro', value: `$${stats.totalScore}`, icon: '💰' },
    { label: 'Servis Edilen Yemek', value: stats.totalServed.toString(), icon: '🍽️' },
    { label: 'Son Oynama', value: fmtDate(stats.lastPlayed), icon: '🕐' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-stone-900 p-6 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-widest text-white">İstatistikler</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between bg-stone-800/60 rounded-xl px-4 py-2.5">
              <span className="text-stone-400 text-xs flex items-center gap-2">
                <span>{r.icon}</span>{r.label}
              </span>
              <span className="text-white font-black text-sm">{r.value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { if (confirm('İstatistikleri sıfırlamak istediğine emin misin?')) { localStorage.removeItem(LS_KEY); onClose(); } }}
          className="w-full py-2 rounded-xl bg-red-900/40 hover:bg-red-800/60 border border-red-700/30 text-red-400 text-xs font-bold uppercase tracking-widest transition-all"
        >
          Sıfırla
        </button>
      </div>
    </div>
  );
};
