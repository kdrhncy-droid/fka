import { loadProfile, saveProfile } from './profile';

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: (stats: AchievementStats) => boolean;
  reward?: number; // coin ödülü
}

export interface AchievementStats {
  totalServed: number;
  totalDays: number;
  totalScore: number;
  gamesPlayed: number;
  totalPlayTime: number;
  // runtime (tek oyun içi)
  perfectDays: number;
  maxCombo: number;
  servedInOneDay: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Servis ────────────────────────────────────────────────────────────────
  { id: 'first_serve',    icon: '🍽️', name: 'İlk Servis',       desc: 'İlk yemeği servis et',              check: s => s.totalServed >= 1,    reward: 10  },
  { id: 'serve_10',       icon: '🥗',  name: 'Çırak',            desc: '10 yemek servis et',                check: s => s.totalServed >= 10,   reward: 15  },
  { id: 'serve_50',       icon: '🍔',  name: 'Garson',           desc: '50 yemek servis et',                check: s => s.totalServed >= 50,   reward: 25  },
  { id: 'serve_200',      icon: '🍜',  name: 'Usta Garson',      desc: '200 yemek servis et',               check: s => s.totalServed >= 200,  reward: 50  },
  { id: 'serve_500',      icon: '👨‍🍳', name: 'Şef',              desc: '500 yemek servis et',               check: s => s.totalServed >= 500,  reward: 100 },
  { id: 'serve_1000',     icon: '⭐',  name: 'Efsane Şef',       desc: '1000 yemek servis et',              check: s => s.totalServed >= 1000, reward: 200 },
  // ── Gün ───────────────────────────────────────────────────────────────────
  { id: 'day_5',          icon: '📅',  name: 'Hafta Başı',       desc: '5 gün tamamla',                     check: s => s.totalDays >= 5,      reward: 20  },
  { id: 'day_20',         icon: '🗓️',  name: 'Aylık Çalışan',   desc: '20 gün tamamla',                    check: s => s.totalDays >= 20,     reward: 50  },
  { id: 'day_50',         icon: '🏆',  name: 'Veteran',          desc: '50 gün tamamla',                    check: s => s.totalDays >= 50,     reward: 100 },
  // ── Mükemmel ──────────────────────────────────────────────────────────────
  { id: 'perfect_1',      icon: '💎',  name: 'Kusursuz',         desc: 'Hiç can kaybetmeden 1 gün bitir',   check: s => s.perfectDays >= 1,    reward: 30  },
  { id: 'perfect_5',      icon: '👑',  name: 'Dokunulmaz',       desc: 'Hiç can kaybetmeden 5 gün bitir',   check: s => s.perfectDays >= 5,    reward: 100 },
  // ── Combo ─────────────────────────────────────────────────────────────────
  { id: 'combo_5',        icon: '🔥',  name: 'Ateşli',           desc: 'x5 combo yap',                      check: s => s.maxCombo >= 5,       reward: 20  },
  { id: 'combo_10',       icon: '💥',  name: 'Patlama',          desc: 'x10 combo yap',                     check: s => s.maxCombo >= 10,      reward: 50  },
  // ── Skor ──────────────────────────────────────────────────────────────────
  { id: 'score_500',      icon: '💰',  name: 'Kasa Dolu',        desc: 'Toplam 500 puan kazan',             check: s => s.totalScore >= 500,   reward: 20  },
  { id: 'score_5000',     icon: '💎',  name: 'Zengin',           desc: 'Toplam 5000 puan kazan',            check: s => s.totalScore >= 5000,  reward: 75  },
  // ── Oyun ──────────────────────────────────────────────────────────────────
  { id: 'games_5',        icon: '🎮',  name: 'Bağımlı',          desc: '5 oyun oyna',                       check: s => s.gamesPlayed >= 5,    reward: 30  },
  { id: 'rush_day',       icon: '⚡',  name: 'Koşuşturma',       desc: 'Bir günde 20 yemek servis et',      check: s => s.servedInOneDay >= 20, reward: 40 },
];

/** Yeni açılan başarımları döner ve profile kaydeder */
export function checkAchievements(stats: AchievementStats): Achievement[] {
  const profile = loadProfile();
  const unlocked: string[] = profile.unlockedAchievements ?? [];
  const newlyUnlocked: Achievement[] = [];
  let coinReward = 0;

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    if (ach.check(stats)) {
      newlyUnlocked.push(ach);
      unlocked.push(ach.id);
      coinReward += ach.reward ?? 0;
    }
  }

  if (newlyUnlocked.length > 0) {
    saveProfile({
      unlockedAchievements: unlocked,
      coins: (profile.coins ?? 0) + coinReward,
    });
  }

  return newlyUnlocked;
}

export function getAchievementProgress(): { ach: Achievement; unlocked: boolean }[] {
  const profile = loadProfile();
  const unlocked = new Set(profile.unlockedAchievements ?? []);
  return ACHIEVEMENTS.map(ach => ({ ach, unlocked: unlocked.has(ach.id) }));
}
