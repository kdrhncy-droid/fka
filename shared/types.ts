// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES & CONSTANTS — Server ve Client ortak kullanır
// Bu dosyayı değiştirirsen HER İKİ TARAF da otomatik güncellenir.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Temel Tipler ────────────────────────────────────────────────────────────
export type Item = string | null;
export type StockKey = '🍞' | '🥩' | '🥬';
export type UpgradeKey = 'patience' | 'earnings' | 'stockMax';
export const CLEAN_PLATE = '__clean_plate__';
export const DIRTY_PLATE = '__dirty_plate__';

export interface Player {
    id: string; x: number; y: number;
    holding: Item; color: string; name: string; hat: string;
    charType?: number; // 0-5: hangi karakter tipi
}

// 8 Karakter Tipi — CharacterSelect + drawPlayer kullanır
export const CHARACTER_TYPES = [
    { id: 0, name: 'Aşçı', hat: '👨‍🍳', bodyColor: '#f5f5f4', accent: '#a78bfa', label: 'Klasik Aşçı' },
    { id: 1, name: 'Suşici', hat: '🍣', bodyColor: '#fca5a5', accent: '#dc2626', label: 'Hızlı Suşi' },
    { id: 2, name: 'Ninja', hat: '🥷', bodyColor: '#292524', accent: '#ef4444', label: 'Gizli Ninja' },
    { id: 3, name: 'Chef', hat: '🧑‍🍳', bodyColor: '#fed7aa', accent: '#f97316', label: 'Baş Chef' },
    { id: 4, name: 'Bahçıvan', hat: '🌿', bodyColor: '#bbf7d0', accent: '#16a34a', label: 'Taze Bahçı' },
    { id: 5, name: 'Kaptan', hat: '⛴️', bodyColor: '#bfdbfe', accent: '#1d4ed8', label: 'Kaptan' },
    { id: 6, name: 'Garson', hat: '🍽️', bodyColor: '#fef3c7', accent: '#92400e', label: 'Şık Garson' },
    { id: 7, name: 'Bulaşıkçı', hat: '🧽', bodyColor: '#e0f2fe', accent: '#0284c7', label: 'Temizlikçi' },
] as const;

export interface Customer {
    id: string;
    seatX: number; seatY: number;
    x: number; y: number; targetY: number;
    wants: Item;
    patience: number; maxPatience: number;
    isSeated: boolean; isEating: boolean; eatTimer: number;
    tipAmount?: number;
}

export interface WaitingGuest { id: string; wants: Item; }

export interface Upgrades {
    patience: number; earnings: number; stockMax: number;
}

export interface CookStation {
    input: string | null;
    timer: number;
    output: string | null;
    burnTimer?: number;    // Yemek piştikten sonra yanma sayacı
    isBurned?: boolean;    // Yemek tamamen yandı mı?
    id: string;           // Fırın ID'si (oven1, oven2, vs.)
    x: number;            // Fırın pozisyonu
    y: number;
}

export interface HoldingStation {
    id: string; // 'plate0', 'plate1', 'counter0', vb.
    items: string[]; // Sadece 1 item tutar (Plate Up tarzı)
    type: 'plate' | 'counter'; // plate: tabak rafı, counter: servis bloğu
    maxItems: number; // Maksimum item sayısı (counter için 1, plate için 1)
}

// ─── Tepsi Fonksiyonları ───────────────────────────────────────────────────
export const TRAY_PREFIX = 'TRAY:';
export const MAX_TRAY_CAPACITY = 4;

export function isTray(item: Item): boolean {
    return typeof item === 'string' && item.startsWith(TRAY_PREFIX);
}

export function getTrayItems(item: Item): string[] {
    if (!item || !item.startsWith(TRAY_PREFIX)) return [];
    const content = item.substring(TRAY_PREFIX.length);
    return content ? content.split(',') : [];
}

export function createTray(items: string[]): string {
    return TRAY_PREFIX + items.join(',');
}

export interface DirtyTable {
    seatX: number;
    seatY: number;
    tip: number; // Bahşiş miktarı — oyuncu toplarken score'a eklenir
}

// ─── Masa Çarpışma Boyutları ───────────────────────────────────────────────
export const TABLE_HALF_W = 45; // Masa yarı genişlik
export const TABLE_HALF_H = 35; // Masa yarı yükseklik

export interface GameState {
    players: Record<string, Player>;
    customers: Customer[];
    waitList: WaitingGuest[];
    holdingStations: HoldingStation[];
    dirtyTables: DirtyTable[];
    score: number;
    stock: Record<StockKey, number>;
    marketName: string;
    dayPhase: 'prep' | 'day' | 'night';
    dayTimer: number;
    upgrades: Upgrades;
    day: number;
    hasOrderedTonight: boolean;
    cookStations: CookStation[]; // Array olarak değiştirdik
    dirtyTrayCount: number;      // Kirli tabak biriktirme sepeti
}

// ─── Boyut ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// ─── Gün / Gece ──────────────────────────────────────────────────────────────
export const DAY_TICKS = 3000;   // 100 saniye (30fps) - Günler daha uzun
export const NIGHT_TICKS = 600;    // ~20 saniye
export const CLOSING_THRESHOLD = 450; // son ~15sn müşteri gelmesin
export const BURN_TICKS = 300;     // ~10 sn yemek yanma süresi
export const EAT_TICKS = 240;      // Müşteri yeme hızı (8 saniye)
export const BURNED_FOOD = '⬛';   // Çöpe atılacak yanan yemek

// ─── Bekletme İstasyonları (Prep Counters / Plates) ──────────────────────────
export const HOLDING_STATION_POSITIONS = [
    { id: 'plate0', x: 600, y: 65, radius: 35, type: 'plate' as const },
    { id: 'plate1', x: 660, y: 65, radius: 35, type: 'plate' as const },
    { id: 'plate2', x: 720, y: 65, radius: 35, type: 'plate' as const },
    { id: 'plate3', x: 780, y: 65, radius: 35, type: 'plate' as const },
];

// ─── Servis Masaları (Pass/Counter - Duvar üzerinde) ─────────────────────────
// Plate Up tarzı - Her blok 1 item tutar
export const COUNTER_POSITIONS = [
    // Sol kapı yanları
    { id: 'counter0', x: 180, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter1', x: 220, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter2', x: 440, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter3', x: 480, y: 245, width: 40, height: 40, type: 'counter' as const },

    // Ortada (2 kapı arası)
    { id: 'counter4', x: 580, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter5', x: 620, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter6', x: 660, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter7', x: 700, y: 245, width: 40, height: 40, type: 'counter' as const },

    // Sağ kapı yanları
    { id: 'counter8', x: 800, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter9', x: 840, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter10', x: 1020, y: 245, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter11', x: 1060, y: 245, width: 40, height: 40, type: 'counter' as const },
];

// ─── Yatay Duvar & Kapılar (mutfak↔salon) ────────────────────────────────────
export const WALL_Y1 = 225;
export const WALL_Y2 = 265; // 40 piksel kalınlık (daha belirgin)
export const DOOR_RANGES: [number, number][] = [
    [280, 420],  // Sol kapı
    [860, 1000], // Sağ kapı
];
export function isInDoor(x: number): boolean {
    return DOOR_RANGES.some(([a, b]) => x >= a && x <= b);
}

// ─── Tepsi ve Malzeme İstasyonları ──────────────────────────────────────────
export const TRAY_STATION = { x: 80, y: 170 };

export const INGREDIENTS = [
    { key: '🍞' as StockKey, pos: { x: 150, y: 65 }, label: 'Hamur', color: '#fde68a' },
    { key: '🥩' as StockKey, pos: { x: 300, y: 65 }, label: 'Et', color: '#fca5a5' },
    { key: '🥬' as StockKey, pos: { x: 450, y: 65 }, label: 'Sebze', color: '#bbf7d0' },
];

// ─── Universal Fırın Sistemi ─────────────────────────────────────────────────
// Her fırında her yemek yapılabilir
export const RECIPE_DEFS = {
    '🍞': { output: '🍕', time: 90, label: '🍕 Pizza' },
    '🥩': { output: '🍔', time: 60, label: '🍔 Burger' },
    '🥬': { output: '🥗', time: 30, label: '🥗 Salata' },
} as const;

// Başlangıç fırın pozisyonları (sadece 1 fırın, malzemelerden farklı X)
export const INITIAL_OVEN_POSITIONS = [
    { x: 200, y: 170 },
];

// Upgrade ile satın alınabilir ek fırın pozisyonları (malzemelerle çakışmayan X)
export const ADDITIONAL_OVEN_POSITIONS = [
    { x: 350, y: 170 },
    { x: 500, y: 170 },
    { x: 650, y: 170 },
];

// ─── Çöp Kutusu, Kirli Sepeti & Lavabo ──────────────────────────────────────
export const TRASH_STATION = { x: 1200, y: 190 }; // Mutfağın sağ alt köşesine alındı
export const DIRTY_TRAY_POS = { x: 1115, y: 90 }; // Lavabonun solunda kirli sepeti
export const SINK_STATION = { x: 1180, y: 90 };

// ─── Koltuklar ───────────────────────────────────────────────────────────────
export const SEAT_SLOTS: { x: number; y: number }[] = [
    { x: 190, y: 453 }, { x: 190, y: 547 },
    { x: 390, y: 453 }, { x: 390, y: 547 },
    { x: 640, y: 453 }, { x: 640, y: 547 },
    { x: 890, y: 453 }, { x: 890, y: 547 },
    { x: 1090, y: 453 }, { x: 1090, y: 547 },
];

// ─── Yemek Çıktıları (müşteri istekleri) ─────────────────────────────────────
export const DISH_ITEMS = ['🍕', '🍔', '🥗'] as const;

// ─── Upgrade Tanımları ───────────────────────────────────────────────────────
export const UPGRADE_DEFS: Record<UpgradeKey, { costs: number[]; max: number }> = {
    patience: { costs: [30, 50, 80], max: 3 },
    earnings: { costs: [40, 70], max: 2 },
    stockMax: { costs: [35, 55, 85], max: 3 },
};

// Fırın upgrade sistemi (2., 3., 4. fırın maliyetleri)
export const OVEN_UPGRADE_COSTS = [80, 120, 180];
