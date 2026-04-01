// ─── Kalıcı Oyuncu Profili ────────────────────────────────────────────────────
// Karakter görünümü, market parası ve istatistikler tek yerden yönetilir.

const LS_KEY = 'fka-profile-v1';

export interface PlayerProfile {
  // Kimlik
  name: string;
  // Karakter görünümü
  charType: number;
  hairColor: string;
  clothingColor: string;
  faceShape: number;
  nameLabelColor: string; // isim etiketi rengi (YENİ)
  // Market parası (kalıcı, oyunlar arası birikir)
  coins: number;
  // İstatistikler
  totalPlayTime: number;
  totalDays: number;
  totalScore: number;
  totalServed: number;
  gamesPlayed: number;
  lastPlayed: number;
}

const DEFAULT: PlayerProfile = {
  name: '',
  charType: 0,
  hairColor: '#4b2c20',
  clothingColor: '#f5f5f4',
  faceShape: 0,
  nameLabelColor: '#ffffff',
  coins: 0,
  totalPlayTime: 0,
  totalDays: 0,
  totalScore: 0,
  totalServed: 0,
  gamesPlayed: 0,
  lastPlayed: 0,
};

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return migrateOldData();
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProfile(patch: Partial<PlayerProfile>) {
  try {
    const current = loadProfile();
    localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}

// Eski 'terracraft-stats' verisini yeni profile'a taşı
function migrateOldData(): PlayerProfile {
  try {
    const old = localStorage.getItem('terracraft-stats');
    if (old) {
      const parsed = JSON.parse(old);
      const migrated = { ...DEFAULT, ...parsed };
      localStorage.setItem(LS_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return { ...DEFAULT };
}

// Gün sonunda kazanılan market parasını ekle (score'un %10'u, min 5)
export function addCoinsFromScore(score: number): number {
  const earned = Math.max(5, Math.floor(score * 0.1));
  saveProfile({ coins: loadProfile().coins + earned });
  return earned;
}
