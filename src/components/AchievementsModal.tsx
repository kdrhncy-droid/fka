import React from 'react';
import { getAchievementProgress } from '../utils/achievements';

interface Props { onClose: () => void; }

export const AchievementsModal: React.FC<Props> = ({ onClose }) => {
  const items = getAchievementProgress();
  const unlockedCount = items.filter(i => i.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-stone-900 flex flex-col shadow-2xl" style={{ maxHeight: '85vh' }}>

        {/* Başlık */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white">Başarımlar</h2>
            <p className="text-stone-500 text-xs mt-0.5">{unlockedCount} / {items.length} açıldı</p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* İlerleme barı */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all"
              style={{ width: `${(unlockedCount / items.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto px-4 pb-5 space-y-2 flex-1">
          {items.map(({ ach, unlocked }) => (
            <div
              key={ach.id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                unlocked
                  ? 'bg-yellow-900/30 border border-yellow-600/40'
                  : 'bg-stone-800/40 border border-stone-700/30 opacity-60'
              }`}
            >
              <span className="text-2xl flex-shrink-0" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>
                {ach.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${unlocked ? 'text-yellow-300' : 'text-stone-400'}`}>
                    {ach.name}
                  </span>
                  {unlocked && <span className="text-[10px] text-yellow-500 font-bold">✓</span>}
                </div>
                <p className="text-stone-500 text-xs truncate">{ach.desc}</p>
              </div>
              {ach.reward && (
                <span className={`text-xs font-bold flex-shrink-0 ${unlocked ? 'text-yellow-400' : 'text-stone-600'}`}>
                  +{ach.reward}🪙
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
