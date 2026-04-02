// ─── Kalıcı Oyuncu Profili ────────────────────────────────────────────────────
// Karakter görünümü, market parası ve istatistikler tek yerden yönetilir.

const LS_KEY = 'fka-profile-v1';

export interface PlayerProfile {
  name: string;
  charType: number;
  hairColor: string;
  hairStyle: string;
  outfitStyle: string;
  clothingColor: string;
  faceShape: number;
  nameLabelColor: string;
  coins: number;
  ownedItems: string[];
  equippedHat: string;
  equippedTitle: string;
  equippedLabelEffect: string;
  equippedServiceEffect: string;
  totalPlayTime: number;
  totalDays: number;
  totalScore: number;
  totalServed: number;
  gamesPlayed: number;
  lastPlayed: number;
  unlockedAchievements: string[];
  perfectDays: number;
  maxCombo: number;
}

const DEFAULT: PlayerProfile = {
  name: '',
  charType: 0,
  hairColor: '#4b2c20',
  hairStyle: 'default',
  outfitStyle: 'default',
  clothingColor: '#f5f5f4',
  faceShape: 0,
  nameLabelColor: '#ffffff',
  coins: 0,
  ownedItems: [],
  equippedHat: '',
  equippedTitle: '',
  equippedLabelEffect: '',
  equippedServiceEffect: '',
  totalPlayTime: 0,
  totalDays: 0,
  totalScore: 0,
  totalServed: 0,
  gamesPlayed: 0,
  lastPlayed: 0,
  unlockedAchievements: [],
  perfectDays: 0,
  maxCombo: 0,
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
export type ShopCategory = 'hat' | 'hairStyle' | 'hairColor' | 'outfitStyle' | 'clothingColor' | 'labelColor' | 'title' | 'colorSet' | 'labelEffect' | 'serviceEffect';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  icon: string;
  value: string;       // emoji (şapka), hex renk, unvan metni, veya colorSet için primary renk
  price: number;
  rarity: 'common' | 'rare' | 'epic';
  // Renk seti için ek alanlar
  colorSet?: { hair: string; clothing: string; label: string };
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── Saç Stilleri ──────────────────────────────────────────────────────────
  { id: 'hair_short',    category: 'hairStyle', name: 'Kısa Saç',    icon: '✂️', value: 'short',    price: 0,   rarity: 'common' },
  { id: 'hair_long',     category: 'hairStyle', name: 'Uzun Saç',    icon: '💇', value: 'long',     price: 100, rarity: 'common' },
  { id: 'hair_wavy',     category: 'hairStyle', name: 'Dalgalı',     icon: '🌊', value: 'wavy',     price: 150, rarity: 'common' },
  { id: 'hair_afro',     category: 'hairStyle', name: 'Afro',        icon: '✨', value: 'afro',     price: 200, rarity: 'rare'   },
  { id: 'hair_bun',      category: 'hairStyle', name: 'Topuz',       icon: '🎀', value: 'bun',      price: 150, rarity: 'common' },
  { id: 'hair_spiky',    category: 'hairStyle', name: 'Dikenli',     icon: '⚡', value: 'spiky',    price: 200, rarity: 'rare'   },
  { id: 'hair_ponytail', category: 'hairStyle', name: 'At Kuyruğu',  icon: '🐴', value: 'ponytail', price: 150, rarity: 'common' },
  { id: 'hair_mohawk',   category: 'hairStyle', name: 'Mohawk',      icon: '🔥', value: 'mohawk',   price: 300, rarity: 'epic'   },
  // ── Kıyafet Stilleri ──────────────────────────────────────────────────────
  { id: 'outfit_default', category: 'outfitStyle', name: 'Casual',       icon: '👕', value: 'default', price: 0,   rarity: 'common' },
  { id: 'outfit_chef',    category: 'outfitStyle', name: 'Aşçı Önlüğü', icon: '👨‍🍳', value: 'chef',    price: 150, rarity: 'rare'   },
  { id: 'outfit_waiter',  category: 'outfitStyle', name: 'Garson',       icon: '🤵', value: 'waiter',  price: 200, rarity: 'rare'   },
  { id: 'outfit_hoodie',  category: 'outfitStyle', name: 'Kapüşonlu',    icon: '🧥', value: 'hoodie',  price: 120, rarity: 'common' },
  { id: 'outfit_suit',    category: 'outfitStyle', name: 'Takım Elbise', icon: '💼', value: 'suit',    price: 350, rarity: 'epic'   },
  { id: 'outfit_apron',   category: 'outfitStyle', name: 'Mutfak Önlüğü',icon: '🍳', value: 'apron',   price: 100, rarity: 'common' },
  // ── Şapkalar ──────────────────────────────────────────────────────────────
  { id: 'hat_crown',   category: 'hat', name: 'Altın Taç',    icon: '👑', value: '👑', price: 300, rarity: 'epic'   },
  { id: 'hat_tophat',  category: 'hat', name: 'Silindir',     icon: '🎩', value: '🎩', price: 150, rarity: 'rare'   },
  { id: 'hat_cap',     category: 'hat', name: 'Şapka',        icon: '🧢', value: '🧢', price: 80,  rarity: 'common' },
  { id: 'hat_bow',     category: 'hat', name: 'Fiyonk',       icon: '🎀', value: '🎀', price: 80,  rarity: 'common' },
  { id: 'hat_cat',     category: 'hat', name: 'Kedi Kulak',   icon: '🐱', value: '🐱', price: 120, rarity: 'rare'   },
  { id: 'hat_star',    category: 'hat', name: 'Yıldız',       icon: '⭐', value: '⭐', price: 200, rarity: 'rare'   },
  { id: 'hat_chef',    category: 'hat', name: 'Aşçı Şapkası', icon: '👨‍🍳', value: '👨‍🍳', price: 250, rarity: 'epic'   },  // ── Özel Saç Renkleri ─────────────────────────────────────────────────────
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
  // ── Renk Setleri ──────────────────────────────────────────────────────────
  { id: 'set_golden_chef',  category: 'colorSet', name: 'Altın Şef',    icon: '🥇', value: '#DAA520', price: 400, rarity: 'epic',   colorSet: { hair: '#DAA520', clothing: '#B8860B', label: '#FFD700' } },
  { id: 'set_night_black',  category: 'colorSet', name: 'Gece Karası',  icon: '🌑', value: '#1a1a1a', price: 300, rarity: 'rare',   colorSet: { hair: '#1a1a1a', clothing: '#0a0a0a', label: '#6366f1' } },
  { id: 'set_neon_pink',    category: 'colorSet', name: 'Neon Pembe',   icon: '💗', value: '#FF69B4', price: 350, rarity: 'rare',   colorSet: { hair: '#FF69B4', clothing: '#FF1493', label: '#FF69B4' } },
  { id: 'set_ocean',        category: 'colorSet', name: 'Okyanus',      icon: '🌊', value: '#006994', price: 300, rarity: 'rare',   colorSet: { hair: '#00CED1', clothing: '#006994', label: '#00BFFF' } },
  { id: 'set_forest',       category: 'colorSet', name: 'Orman',        icon: '🌲', value: '#2d5a27', price: 250, rarity: 'rare',   colorSet: { hair: '#228B22', clothing: '#2d5a27', label: '#4ade80' } },
  { id: 'set_blood_red',    category: 'colorSet', name: 'Kan Kırmızı',  icon: '🩸', value: '#DC143C', price: 350, rarity: 'epic',   colorSet: { hair: '#8B0000', clothing: '#DC143C', label: '#FF4444' } },
  { id: 'set_ice_blue',     category: 'colorSet', name: 'Buz Mavisi',   icon: '❄️', value: '#4682B4', price: 250, rarity: 'rare',   colorSet: { hair: '#B0E0E6', clothing: '#4682B4', label: '#60a5fa' } },
  { id: 'set_classic',      category: 'colorSet', name: 'Klasik',       icon: '⚪', value: '#f5f5f4', price: 100, rarity: 'common', colorSet: { hair: '#4b2c20', clothing: '#f5f5f4', label: '#ffffff' } },
  // ── Unvanlar ──────────────────────────────────────────────────────────────  { id: 'title_patron',  category: 'title', name: 'PATRON',       icon: '👑', value: '👑 PATRON',       price: 500, rarity: 'epic'   },
  { id: 'title_efsane',  category: 'title', name: 'EFSANE',       icon: '🔥', value: '🔥 EFSANE',       price: 400, rarity: 'epic'   },
  { id: 'title_sef',     category: 'title', name: 'ŞEF',          icon: '🍳', value: '🍳 ŞEF',          price: 150, rarity: 'rare'   },
  { id: 'title_hizli',   category: 'title', name: 'HIZLI',        icon: '⚡', value: '⚡ HIZLI',        price: 200, rarity: 'rare'   },
  { id: 'title_acimaz',  category: 'title', name: 'ACIMAZ',       icon: '🌶️', value: '🌶️ ACIMAZ',       price: 200, rarity: 'rare'   },
  { id: 'title_korku',   category: 'title', name: 'KORKU',        icon: '💀', value: '💀 KORKU',        price: 300, rarity: 'epic'   },
  { id: 'title_temiz',   category: 'title', name: 'TEMİZLİKÇİ',  icon: '🧹', value: '🧹 TEMİZLİKÇİ',  price: 50,  rarity: 'common' },
  { id: 'title_yeni',    category: 'title', name: 'YENİ BAŞLAYAN',icon: '🌱', value: '🌱 YENİ BAŞLAYAN',price: 50,  rarity: 'common' },
  // ── Etiket Efektleri ──────────────────────────────────────────────────────
  { id: 'fx_glow',      category: 'labelEffect', name: 'Parlayan',      icon: '✨', value: 'glow',     price: 300, rarity: 'rare'   },
  { id: 'fx_rainbow',   category: 'labelEffect', name: 'Gökkuşağı',     icon: '🌈', value: 'rainbow',  price: 600, rarity: 'epic'   },
  { id: 'fx_pulse',     category: 'labelEffect', name: 'Yanıp Sönen',   icon: '💫', value: 'pulse',    price: 400, rarity: 'epic'   },
  { id: 'fx_gold',      category: 'labelEffect', name: 'Altın Çerçeve', icon: '🏅', value: 'gold',     price: 250, rarity: 'rare'   },
  // ── Servis Efektleri ──────────────────────────────────────────────────────
  { id: 'sfx_star',     category: 'serviceEffect', name: 'Yıldız Patlaması', icon: '✨', value: 'star',     price: 400, rarity: 'epic'   },
  { id: 'sfx_heart',    category: 'serviceEffect', name: 'Kalp Yağmuru',     icon: '❤️', value: 'heart',    price: 300, rarity: 'rare'   },
  { id: 'sfx_fire',     category: 'serviceEffect', name: 'Ateş',             icon: '🔥', value: 'fire',     price: 350, rarity: 'rare'   },
  { id: 'sfx_coin',     category: 'serviceEffect', name: 'Para Yağmuru',     icon: '💰', value: 'coin',     price: 250, rarity: 'rare'   },
  { id: 'sfx_rainbow',  category: 'serviceEffect', name: 'Gökkuşağı',        icon: '🌈', value: 'rainbow',  price: 600, rarity: 'epic'   },
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
