// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES & CONSTANTS — Server ve Client ortak kullanır
// Bu dosyayı değiştirirsen HER İKİ TARAF da otomatik güncellenir.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Temel Tipler ────────────────────────────────────────────────────────────
import { Personality } from './dialogues';
export type { Personality };

export type Item = string | null;
export type StockKey = '🍞' | '🥩' | '🥬' | '🥘' | '🍢';
export type UpgradeKey = 'patience' | 'earnings' | 'plateStackMax' | 'safeOven';
export const CLEAN_PLATE = '__clean_plate__';
export const DIRTY_PLATE = '__dirty_plate__';

export interface Player {
    id: string; x: number; y: number;
    holding: Item; color: string; name: string; hat: string;
    charType?: number;
    peerId?: string;
}

// 8 Karakter Tipi — CharacterSelect + drawPlayer kullanır
export const CHARACTER_TYPES = [
    { id: 0, name: 'Aşçı',     hat: '👨‍🍳', bodyColor: '#f5f5f4', accent: '#a78bfa', label: 'Klasik Aşçı' },
    { id: 1, name: 'Chef',     hat: '🧑‍🍳', bodyColor: '#fed7aa', accent: '#f97316', label: 'Baş Chef' },
    { id: 2, name: 'Garson',   hat: '🎩',   bodyColor: '#fef3c7', accent: '#92400e', label: 'Şık Garson' },
    { id: 3, name: 'Kasiyer',  hat: '💼',   bodyColor: '#dbeafe', accent: '#1d4ed8', label: 'Kasiyer' },
    { id: 4, name: 'Temizlikçi', hat: '🧹', bodyColor: '#e0f2fe', accent: '#0284c7', label: 'Temizlikçi' },
    { id: 5, name: 'Kasap',    hat: '🔪',   bodyColor: '#fca5a5', accent: '#dc2626', label: 'Kasap' },
    { id: 6, name: 'Fırıncı',  hat: '🥐',   bodyColor: '#fde68a', accent: '#d97706', label: 'Fırıncı' },
    { id: 7, name: 'Müdür',    hat: '📋',   bodyColor: '#bbf7d0', accent: '#16a34a', label: 'Müdür' },
] as const;

export interface Customer {
    id: string;
    seatX: number; seatY: number;
    x: number; y: number; targetY: number;
    wants: Item;
    patience: number; maxPatience: number;
    isSeated: boolean; isEating: boolean; eatTimer: number;
    tipAmount?: number;

    personality: Personality;
    currentDialog?: string;
    dialogTimer?: number;
    isBeatUp?: boolean;
    isLeaving?: boolean;

    bodyShape: 1 | 2 | 3 | 4;
    bodyColor: string;
    beatUpTimer?: number;
    punchCount?: number;

    // Giriş fazı: 'entering' = kapıya doğru geliyor, 'seating' = koltuğa gidiyor, 'seated' = oturdu
    phase?: 'entering' | 'seating' | 'seated';
    doorX?: number; // Hangi kapıdan girecek
}

export interface WaitingGuest {
    id: string;
    wants: Item;
    personality: Personality;
    currentDialog?: string;
    dialogTimer?: number;
    bodyShape: 1 | 2 | 3 | 4;
    bodyColor: string;
    groupId?: string; // Aynı grubu tanımlamak için (grup üyeleri aynı anda oturur)
}

export interface Upgrades {
    patience: number; earnings: number; plateStackMax: number; safeOven: number;
}

export interface CookStation {
    input: string | null;
    timer: number;
    output: string | null;
    burnTimer?: number;
    isBurned?: boolean;
    id: string;
    x: number;
    y: number;
}

export interface HoldingStation {
    id: string;
    items: string[];
    type: 'plate' | 'counter';
    maxItems: number;
}

// ─── Tabak Yığını ─────────────────────────────────────────────────────────────
export interface PlateStack {
    count: number;   // Şu an mevcut temiz tabak sayısı
    maxCount: number; // Maks tabak kapasitesi
}

// ─── Kesme Tahtası ────────────────────────────────────────────────────────────
export const CHOP_PREFIX = 'CHOPPED_';
export const CHOP_TICKS = 60; // ~2 saniye (33ms * 60)
export function isChopped(item: Item): boolean {
  return typeof item === 'string' && item.startsWith(CHOP_PREFIX);
}
export function getChoppedSource(item: string): string {
  return item.replace(CHOP_PREFIX, '');
}

export interface ChoppingBoard {
  id: string;
  x: number;
  y: number;
  input: string | null;   // üzerindeki malzeme
  progress: number;       // 0..CHOP_TICKS
  isChopping: boolean;    // oyuncu aktif kesiyor mu
  choppingPlayerId: string | null;
}

// Kesme gerektiren malzemeler: et, sebze, kebap
export const CHOPPABLE: StockKey[] = ['🥩', '🥬', '🍢'];
export const CHOPPING_BOARD_POS = { x: 760, y: 170 };


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
    tip: number;
}

// ─── Masa Çarpışma Boyutları ───────────────────────────────────────────────
export const TABLE_HALF_W = 45;
export const TABLE_HALF_H = 35;

export interface GameState {
    players: Record<string, Player>;
    customers: Customer[];
    waitList: WaitingGuest[];
    holdingStations: HoldingStation[];  // Servis tezgahları (counter)
    dirtyTables: DirtyTable[];
    score: number;
    stock: Record<StockKey, number>;
    marketName: string;
    dayPhase: 'prep' | 'day' | 'night';
    dayTimer: number;
    upgrades: Upgrades;
    day: number;
    hasOrderedTonight: boolean;
    cookStations: CookStation[];
    dirtyTrayCount: number;

    // ─── Tabak Yığını (Tek Nokta) ──────────────────────────────────────────
    plateStack: PlateStack;

    // Game Over & Penalty
    lives: number;
    isGameOver: boolean;

    // Revenge System
    revengeQueue: number[];

    // ─── Yemek Kilidi Sistemi (Plate Up tarzı) ─────────────────────────────
    unlockedDishes: string[];       // Müşterilerin sipariş edebileceği yemekler
    menuChoices: string[] | null;   // Gece ekranında seçim için sunulan kilitli yemekler

    // ─── Station Layout Editor ───────────────────────────────────────────────
    stationLayout: Record<string, StationPosition>;
    lockedStations: Record<string, string>; // stationId → socketId

    // ─── Table Layout Editor ─────────────────────────────────────────────────
    tableLayout: Record<string, TablePosition>;
    lockedTables: Record<string, string>; // tableId → socketId

    // ─── Kesme Tahtaları ─────────────────────────────────────────────────────
    choppingBoards: ChoppingBoard[];

    // ─── Internal (sunucu tarafı, client'a gönderilir ama kullanılmaz) ────────
    _stateTick?: number;
    _seatCooldown?: number; // Müşteri oturma arası cooldown (tick)
}

// ─── Boyut ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 870;

// ─── Dış Alan Sınırı (salon biter, dışarı başlar) ────────────────────────────
export const EXTERIOR_Y = 720;       // Bu çizgiden aşağısı dış alan
export const SIDEWALK_Y = 740;       // Kaldırım başlangıcı
export const ROAD_Y = 790;           // Yol başlangıcı

// ─── Grid Sabitleri ───────────────────────────────────────────────────────────
export const GRID_CELL_SIZE = 40;
export const GRID_COLS = Math.floor(GAME_WIDTH / GRID_CELL_SIZE);   // 32
export const GRID_ROWS = Math.floor(GAME_HEIGHT / GRID_CELL_SIZE);  // 18

// ─── İstasyon Layout ─────────────────────────────────────────────────────────
export interface StationPosition {
  id: string;
  x: number;
  y: number;
}

// ─── Masa Layout ─────────────────────────────────────────────────────────────
export interface TablePosition {
  id: string;
  x: number;
  y: number;
}

export function getSeatSlots(tableLayout: Record<string, TablePosition>): { x: number; y: number }[] {
  return Object.values(tableLayout).flatMap(t => [
    { x: t.x, y: t.y - 47 },
    { x: t.x, y: t.y + 47 },
  ]);
}

// ─── Gün / Gece ──────────────────────────────────────────────────────────────
export const DAY_TICKS = 3900;
export const NIGHT_TICKS = 1200;
export const CLOSING_THRESHOLD = 390;
export const BURN_TICKS = 300;
export const EAT_TICKS = 240;
export const BURNED_FOOD = '⬛';

// ─── Tabak Yığını İstasyonu (tek nokta, üst üste tabaklar) ─────────────────
export const PLATE_STACK_POS = { x: 650, y: 65, radius: 55 };
export const PLATE_STACK_BASE = 8;   // Başlangıç tabak kapasitesi 4 -> 8 yapıldı
export const PLATE_STACK_PER_UPGRADE = 4; // Her upgrade başına +4 tabak (eski: 2)

// Geriye uyum için (counter istasyonları hâlâ kullanılıyor)
export const HOLDING_STATION_POSITIONS: { id: string; x: number; y: number; radius: number; type: 'plate' }[] = [];

// ─── Servis Masaları (Mutfağın daraltılmış hali, merkeze yakın) ─────────────────
export const COUNTER_POSITIONS = [
    // Kapının sol yanı
    { id: 'counter0', x: 380, y: 360, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter1', x: 420, y: 360, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter2', x: 460, y: 360, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter3', x: 500, y: 360, width: 40, height: 40, type: 'counter' as const },

    // Kapının sağ yanı
    { id: 'counter4', x: 740, y: 360, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter5', x: 780, y: 360, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter6', x: 820, y: 360, width: 40, height: 40, type: 'counter' as const },
    { id: 'counter7', x: 860, y: 360, width: 40, height: 40, type: 'counter' as const },
];

// ─── Yatay Duvar & Kapılar ────────────────────────────────────────────────────
export const WALL_Y1 = 340;
export const WALL_Y2 = 380;
// Tek kapı — ortada, eski kapı daha da ortalandı
export const DOOR_RANGES: [number, number][] = [
    [540, 740], // Kapı geçişi iyileştirildi
];
export function isInDoor(x: number): boolean {
    return DOOR_RANGES.some(([a, b]) => x >= a && x <= b);
}

// ─── Tepsi ve Malzeme İstasyonları (Daraltıldı, ortalandı) ──────────────────
export const TRAY_STATION = { x: 300, y: 285 };

export const INGREDIENTS = [
    { key: '🍞' as StockKey, pos: { x: 360, y: 65 }, label: 'Hamur', color: '#fde68a' },
    { key: '🥩' as StockKey, pos: { x: 450, y: 65 }, label: 'Et', color: '#fca5a5' },
    { key: '🥬' as StockKey, pos: { x: 540, y: 65 }, label: 'Sebze', color: '#bbf7d0' },
    { key: '🥘' as StockKey, pos: { x: 630, y: 65 }, label: 'Çorba', color: '#fbbf24' },
    { key: '🍢' as StockKey, pos: { x: 720, y: 65 }, label: 'Kebap', color: '#92400e' },
];

// ─── Universal Fırın Sistemi ─────────────────────────────────────────────────
// CHOPPABLE malzemeler önce doğranmalı, sonra fırına girer
export const RECIPE_DEFS = {
    '🍞':          { output: '🍕', time: 90,  label: '🍕 Pizza' },
    'CHOPPED_🥩':  { output: '🍔', time: 35,  label: '🍔 Burger' },
    'CHOPPED_🥬':  { output: '🥗', time: 15,  label: '🥗 Salata' },
    '🥘':          { output: '🍜', time: 120, label: '🍜 Çorba' },
    'CHOPPED_🍢':  { output: '🌯', time: 60,  label: '🌯 Dürüm' },
} as const;

// ─── Yemek kilidi sırası — her gece 1 yeni yemek seçilir ─────────────────────
// Başlangıçta Salata + Burger açık, geri kalanlar gece seçimiyle açılır
export const DISH_UNLOCK_POOL = ['🍕', '🍜', '🌯'] as const; // Kilidini açılabilecek yemekler

export const INITIAL_OVEN_POSITIONS = [
    { x: 300, y: 170 },
];

export const ADDITIONAL_OVEN_POSITIONS = [
    { x: 400, y: 170 },
    { x: 500, y: 170 },
    { x: 600, y: 170 },
];

// ─── Çöp Kutusu, Kirli Sepeti & Lavabo ──────────────────────────────────────
export const TRASH_STATION = { x: 920, y: 285 };
export const DIRTY_TRAY_POS = { x: 860, y: 90 };
export const SINK_STATION = { x: 960, y: 90 };

// ─── Koltuklar — Artık dinamik, getSeatSlots(tableLayout) kullan ─────────────
// SEAT_SLOTS kaldırıldı — bkz. getSeatSlots()

// Geriye uyum için (drawDirtyTable, drawCustomer, usePlayerMovement kullanır)
// Dinamik tableLayout'a geçildiğinde bu sabit kaldırılabilir
export const TABLE_Y_DEFAULT = 500;

// ─── Yemek Çıktıları (tüm olası yemekler) ────────────────────────────────────
export const DISH_ITEMS = ['🍕', '🍔', '🥗', '🍜', '🌯'] as const;

// ─── Upgrade Tanımları ───────────────────────────────────────────────────────
export const UPGRADE_DEFS: Record<UpgradeKey, { costs: number[]; max: number }> = {
    patience: { costs: [50, 100, 200], max: 3 },
    earnings: { costs: [100, 250], max: 2 },
    plateStackMax: { costs: [50, 100, 150, 200, 250], max: 5 }, // Her level +4 tabak
    safeOven: { costs: [80, 180], max: 2 }, // lv1: yanma süresi 2x, lv2: hiç yanmaz
};

export const OVEN_UPGRADE_COSTS = [80, 120, 180];

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────
export function mkCook(id: string, x: number, y: number): CookStation {
  return { input: null, timer: 0, output: null, id, x, y };
}

export function mkGameState(): GameState {
  const initialOvens = INITIAL_OVEN_POSITIONS.map((pos, i) =>
    mkCook(`oven${i + 1}`, pos.x, pos.y)
  );

  // Artık sadece counter istasyonları
  const allHoldingStations = [
    ...COUNTER_POSITIONS.map(p => ({ id: p.id, items: [], type: p.type as 'counter', maxItems: 1 })),
  ];

  return {
    players: {}, customers: [], waitList: [],
    holdingStations: allHoldingStations,
    dirtyTables: [],
    score: 0, stock: { '🍞': 10, '🥩': 10, '🥬': 10, '🥘': 5, '🍢': 5 },
    marketName: "TerraMarket", dayPhase: 'prep', dayTimer: DAY_TICKS,
    upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0 }, day: 1, hasOrderedTonight: false,
    cookStations: initialOvens,
    dirtyTrayCount: 0,
    // ─── Tabak Yığını ─────────────────────────────────────────────────────
    plateStack: { count: PLATE_STACK_BASE, maxCount: PLATE_STACK_BASE },
    lives: 3,
    isGameOver: false,
    revengeQueue: [],
    // Başlangıçta sadece Salata + Burger açık (en hızlı yemekler)
    unlockedDishes: ['🥗', '🍔'],
    menuChoices: null,
    // ─── Station Layout (Tüm y-koordinatları ve dar x-koordinatları uyarlandı) ──
    stationLayout: {
      'ingredient_🍞': { id: 'ingredient_🍞', x: 360, y: 65 },
      'ingredient_🥩': { id: 'ingredient_🥩', x: 450, y: 65 },
      'ingredient_🥬': { id: 'ingredient_🥬', x: 540, y: 65 },
      'ingredient_🥘': { id: 'ingredient_🥘', x: 630, y: 65 },
      'ingredient_🍢': { id: 'ingredient_🍢', x: 720, y: 65 },
      'oven1':         { id: 'oven1',         x: 300, y: 170 },
      'tray':          { id: 'tray',          x: 300, y: 285 },
      'sink':          { id: 'sink',          x: 960,  y: 90 },
      'trash':         { id: 'trash',         x: 920, y: 285 },
      'dirty_tray':    { id: 'dirty_tray',    x: 860,  y: 90 },
      'plate_stack':   { id: 'plate_stack',   x: 650, y: 65 },
      'chop1':         { id: 'chop1',         x: 760, y: 170 },
      // Counter'lar kasıtlı olarak buraya dahil edilmedi — duvara sabit, taşınamaz
    },
    lockedStations: {},
    // ─── Table Layout (Önceden duvarın olduğu y=500 -> y=570 oldu) ───────────
    tableLayout: {
      'table0': { id: 'table0', x: 260, y: 570 },
      'table1': { id: 'table1', x: 450, y: 570 },
      'table2': { id: 'table2', x: 640, y: 570 }, // TAM ORTA MASA
      'table3': { id: 'table3', x: 830, y: 570 },
      'table4': { id: 'table4', x: 1020, y: 570 },
    },
    lockedTables: {},
    // ─── Kesme Tahtaları ──────────────────────────────────────────────────
    choppingBoards: [
      { id: 'chop1', x: CHOPPING_BOARD_POS.x, y: CHOPPING_BOARD_POS.y, input: null, progress: 0, isChopping: false, choppingPlayerId: null },
    ],
  };
}
