// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES & CONSTANTS — Server ve Client ortak kullanır
// Bu dosyayı değiştirirsen HER İKİ TARAF da otomatik güncellenir.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Temel Tipler ────────────────────────────────────────────────────────────
export type Item = string | null;
export type StockKey = '🫓' | '🥩' | '🥬';
export type UpgradeKey = 'patience' | 'earnings' | 'stockMax';

export interface Player {
    id: string; x: number; y: number;
    holding: Item; color: string; name: string; hat: string;
}

export interface Customer {
    id: string;
    seatX: number; seatY: number;
    x: number; y: number; targetY: number;
    wants: Item;
    patience: number; maxPatience: number;
    isSeated: boolean; isEating: boolean; eatTimer: number;
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
}

export interface GameState {
    players: Record<string, Player>;
    customers: Customer[];
    waitList: WaitingGuest[];
    score: number;
    stock: Record<StockKey, number>;
    marketName: string;
    dayPhase: 'prep' | 'day' | 'night';
    dayTimer: number;
    upgrades: Upgrades;
    day: number;
    cookStations: { pizza: CookStation; grill: CookStation; salad: CookStation };
}

// ─── Boyut ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// ─── Gün / Gece ──────────────────────────────────────────────────────────────
export const DAY_TICKS = 3000;   // 100 saniye (30fps) - Günler daha uzun
export const NIGHT_TICKS = 600;    // ~20 saniye
export const CLOSING_THRESHOLD = 450; // son ~15sn müşteri gelmesin
export const BURN_TICKS = 300;     // ~10 sn yemek yanma süresi
export const BURNED_FOOD = '⬛';   // Çöpe atılacak yanan yemek

// ─── Yatay Duvar & Kapılar (mutfak↔salon) ────────────────────────────────────
export const WALL_Y1 = 230;
export const WALL_Y2 = 248;
export const DOOR_RANGES: [number, number][] = [
    [170, 290], [430, 550], [730, 850], [990, 1110],
];
export function isInDoor(x: number): boolean {
    return DOOR_RANGES.some(([a, b]) => x >= a && x <= b);
}

// ─── Dikey Duvar (mutfak↔lavabo/çöp alanı) ──────────────────────────────────
export const UTIL_WALL_X1 = 830;
export const UTIL_WALL_X2 = 842;
export const UTIL_DOOR_RANGE: [number, number] = [80, 190]; // kapı açıklığı (y)
export function isInUtilDoor(y: number): boolean {
    return y >= UTIL_DOOR_RANGE[0] && y <= UTIL_DOOR_RANGE[1];
}

// ─── Malzeme İstasyonları ────────────────────────────────────────────────────
export const INGREDIENTS = [
    { key: '🫓' as StockKey, pos: { x: 200, y: 65 }, label: 'Hamur', color: '#fde68a' },
    { key: '🥩' as StockKey, pos: { x: 450, y: 65 }, label: 'Et', color: '#fca5a5' },
    { key: '🥬' as StockKey, pos: { x: 700, y: 65 }, label: 'Sebze', color: '#bbf7d0' },
];

// ─── Pişirme İstasyonları ────────────────────────────────────────────────────
export const COOK_STATION_DEFS = {
    pizza: { pos: { x: 200, y: 170 }, input: '🫓', output: '🍕', time: 90, label: '🍕 Pizzacı' },
    grill: { pos: { x: 450, y: 170 }, input: '🥩', output: '🍔', time: 60, label: '🍔 Izgara' },
    salad: { pos: { x: 700, y: 170 }, input: '🥬', output: '🥗', time: 30, label: '🥗 Salata' },
} as const;

export type CookStationId = keyof typeof COOK_STATION_DEFS;

// ─── Çöp Kutusu ──────────────────────────────────────────────────────────────
export const TRASH_STATION = { x: 920, y: 120 };
export const SINK_STATION = { x: 1080, y: 120 }; // dekoratif

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
