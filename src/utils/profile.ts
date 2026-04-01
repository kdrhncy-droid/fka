// ─── Kalıcı Oyuncu Profili ────────────────────────────────────────────────────
// Karakter görünümü, market parası ve istatistikler tek yerden yönetilir.

const LS_KEY = 'fka-profile-v1';

export interface PlayerProfile {
  name: string;
  charType: number;
  hairColor: string;
  clothingColor: string;
  faceShape: number;
  nameLabelColor: string;
  coins: number;
  ownedItems: string[]; // satın alınan item id'leri
  equippedHat: string;  // aktif şapka
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
  ownedItems: [],
  equippedHat: '',
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

// ─── Market Item Tanımları ────────────────────────────────────────────────────
export type ShopCategory = 'hat' | 'hairColor' | 'clothingColor' | 'labelColor';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  icon: string;
  value: string;       // emoji (şapka) veya hex renk
  price: number;
  rarity: 'common' | 'rare' | 'epic';
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Şapkalar ──────────────────────────────────────────────────────────────
  { id: 'hat_crown',   category: 'hat', name: 'Altın Taç',    icon: '👑', value: '👑', price: 300, rarity: 'epic'   },
  { id: 'hat_tophat',  category: 'hat', name: 'Silindir',     icon: '🎩', value: '🎩', price: 150, rarity: 'rare'   },
  { id: 'hat_cap',     category: 'hat', name: 'Şapka',        icon: '🧢', value: '🧢', price: 80,  rarity: 'common' },
  { id: 'hat_bow',     category: 'hat', name: 'Fiyonk',       icon: '🎀', value: '🎀', price: 80,  rarity: 'common' },
  { id: 'hat_cat',     category: 'hat', name: 'Kedi Kulak',   icon: '🐱', value: '🐱', price: 120, rarity: 'rare'   },
  { id: 'hat_star',    category: 'hat', name: 'Yıldız',       icon: '⭐', value: '⭐', price: 200, rarity: 'rare'   },
  { id: 'hat_chef',    category: 'hat', name: 'Aşçı Şapkası', icon: '👨‍🍳', value: '👨‍🍳', price: 250, rarity: 'epic'   },
  // ── Özel Saç Renkleri ─────────────────────────────────────────────────────
  { id: 'hair_gold',   category: 'hairColor', name: 'Altın Saç',    icon: '✨', value: '#FFD700', price: 120, rarity: 'rare'   },
  { id: 'hair_silver', category: 'hairColor', name: 'Gümüş Saç',    icon: '🌫️', value: '#C0C0C0', price: 100, rarity: 'rare'   },
  { id: 'hair_pink',   category: 'hairColor', name: 'Pembe Saç',    icon: '🌸', value: '#FF69B4', price: 80,  rarity: 'common' },
  { id: 'hair_cyan',   category: 'hairColor', name: 'Turkuaz Saç',  icon: '💎', value: '#00CED1', price: 80,  rarity: 'common' },
  { id: 'hair_orange', category: 'hairColor', name: 'Turuncu Saç',  icon: '🔥', value: '#FF6600', price: 80,  rarity: 'common' },
  // ── Özel Kıyafet Renkleri ─────────────────────────────────────────────────
  { id: 'cloth_gold',    category: 'clothingColor', name: 'Altın Kıyafet',   icon: '🥇', value: '#DAA520', price: 150, rarity: 'rare'   },
  { id: 'cloth_black',   category: 'clothingColor', name: 'Siyah Kıyafet',   icon: '🖤', value: '#1a1a1a', price: 60,  rarity: 'common' },
  { id: 'cloth_rainbow', category: 'clothingColor', name: 'Gökkuşağı',       icon: '🌈', value: '#FF1493', price: 400, rarity: 'epic'   },
  { id: 'cloth_mint',    category: 'clothingColor', name: 'Nane Yeşili',     icon: '🌿', value: '#98FF98', price: 80,  rarity: 'common' },
  // ── Özel Etiket Renkleri ──────────────────────────────────────────────────
  { id: 'label_gold',    category: 'labelColor', name: 'Altın Etiket',   icon: '🏆', value: '#FFD700', price: 200, rarity: 'rare'   },
  { id: 'label_rainbow', category: 'labelColor', name: 'Gökkuşağı Etiket', icon: '🌈', value: '#FF69B4', price: 500, rarity: 'epic'   },
  { id: 'label_red',     category: 'labelColor', name: 'Kırmızı Etiket', icon: '❤️', value: '#FF4444', price: 80,  rarity: 'common' },
  { id: 'label_cyan',    category: 'labelColor', name: 'Mavi Etiket',    icon: '💙', value: '#00BFFF', price: 80,  rarity: 'common' },
];

export function buyItem(itemId: string): boolean {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return false;
  const profile = loadProfile();
  if (profile.ownedItems.includes(itemId)) return false;
  if (profile.coins < item.price) return false;
  saveProfile({
    coins: profile.coins - item.price,
    ownedItems: [...profile.ownedItems, itemId],
  });
  return true;
}
