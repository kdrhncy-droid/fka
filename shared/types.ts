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

// Sadeleştirilmiş Karakter Tipleri — Sadece Aşçı, Garson ve Bulaşıkçı
export const CHARACTER_TYPES = [
    { id: 0, name: 'Aşçı',     hat: '👨‍🍳', bodyColor: '#f5f5f4', accent: '#a78bfa', label: 'Usta Aşçı' },
    { id: 1, name: 'Garson',   hat: '🎩',   bodyColor: '#fef3c7', accent: '#92400e', label: 'Hızlı Garson' },
    { id: 2, name: 'Bulaşıkçı', hat: '🧹', bodyColor: '#e0f2fe', accent: '#0284c7', label: 'Titiz Bulaşıkçı' },
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

// ─── Lavabo ───────────────────────────────────────────────────────────────────
export const WASH_TICKS = 60; // ~2 saniye

export interface WashingSink {
  id: string;
  x: number;
  y: number;
  input: string | null;   // üzerindeki tabak (DIRTY_PLATE veya CLEAN_PLATE)
  progress: number;       // 0..WASH_TICKS
  isWashing: boolean;     // oyuncu aktif yıkıyor mu
  washingPlayerId: string | null;
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

    // ─── Lavabolar ───────────────────────────────────────────────────────────
    sinks: WashingSink[];

    // ─── Servis Penceresi ─────────────────────────────────────────────────────
    serviceWindow: ServiceWindowSlot[];

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

// ─── Gün / Gece (1.5 dakika gündüz, 30 saniye gece) ──────────────────────────
export const DAY_TICKS = 2700;
export const NIGHT_TICKS = 900;
export const CLOSING_THRESHOLD = 270;
export const BURN_TICKS = 300;
export const EAT_TICKS = 240;
export const BURNED_FOOD = '⬛';

// ─── Tabak Yığını İstasyonu (tek nokta, üst üste tabaklar) ─────────────────
export const PLATE_STACK_POS = { x: 650, y: 65, radius: 55 };
export const PLATE_STACK_BASE = 8;   // Başlangıç tabak kapasitesi 4 -> 8 yapıldı
export const PLATE_STACK_PER_UPGRADE = 4; // Her upgrade başına +4 tabak (eski: 2)

// Geriye uyum için (counter istasyonları hâlâ kullanılıyor)
export const HOLDING_STATION_POSITIONS: { id: string; x: number; y: number; radius: number; type: 'plate' }[] = [];

// ─── Servis Penceresi ────────────────────────────────────────────────────────
export const SERVICE_WINDOW_SLOTS = [
  { id: 'sw0', x: 480, y: 360 },
  { id: 'sw1', x: 560, y: 360 },
  { id: 'sw2', x: 640, y: 360 },
  { id: 'sw3', x: 720, y: 360 },
] as const;
export const SERVICE_WINDOW_R = 70;

export interface ServiceWindowSlot {
  id: string;
  item: Item;
}

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
