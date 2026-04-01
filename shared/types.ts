// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES — Server ve Client ortak kullanır
// Bu dosya modülerleştirilmiştir. (gameData, gameLogic, constants)
// Bütün dış bağlantılar kopmaması için buradan re-export edilmektedir.
// ═══════════════════════════════════════════════════════════════════════════════

export * from './constants';
export * from './gameLogic';
export * from './gameData';
export * from './mapState';

// ─── Temel Tipler ────────────────────────────────────────────────────────────
import { Personality } from './dialogues';
export type { Personality };

export type Item = string | null;
export type StockKey = '🍞' | '🥩' | '🥬' | '🥘' | '🍢' | '🥔' | '🧁';
export type UpgradeKey = 'patience' | 'earnings' | 'plateStackMax' | 'safeOven' | 'fryerSpeed' | 'cakeBaker' | 'coffeeMachine' | 'extraSink' | 'extraChopBoard';

export interface Player {
    id: string; x: number; y: number;
    holding: Item; color: string; name: string; hat: string;
    charType?: number;
    peerId?: string;
    hairColor?: string;
    clothingColor?: string;
    faceShape?: number;
    nameLabelColor?: string;
    title?: string;
}

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

    phase?: 'entering' | 'seating' | 'seated';
    doorX?: number;

    specialRequest?: 'spicy' | 'extra' | 'quick' | null;
}

export interface WaitingGuest {
    id: string;
    wants: Item;
    personality: Personality;
    currentDialog?: string;
    dialogTimer?: number;
    bodyShape: 1 | 2 | 3 | 4;
    bodyColor: string;
    groupId?: string;
}

export interface Upgrades {
    patience: number; earnings: number; plateStackMax: number; safeOven: number;
    fryerSpeed: number;
    cakeBaker: number; coffeeMachine: number;
    extraSink: number; extraChopBoard: number;
}

export interface GameCard {
    id: string;
    icon: string;
    name: string;
    penalty: string;
    reward: string;
}

export interface ActiveCard {
    id: string;
    appliedOnDay: number;
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

export interface PlateStack {
    count: number;
    maxCount: number;
}

export interface ChoppingBoard {
  id: string;
  x: number;
  y: number;
  input: string | null;
  progress: number;
  isChopping: boolean;
  choppingPlayerId: string | null;
}

export interface CakeBaker {
  id: string;
  x: number;
  y: number;
  input: string | null;
  timer: number;
  output: string | null;
  isBurned?: boolean;
  burnTimer?: number;
}

export interface CoffeeMachine {
  id: string;
  x: number;
  y: number;
  cups: number;
  maxCups: number;
}

export interface Fryer {
  id: string;
  x: number;
  y: number;
  input: string | null;
  timer: number;
  output: string | null;
  isBurned?: boolean;
  burnTimer?: number;
}

export interface Fridge {
  id: string;
  x: number;
  y: number;
  drinks: number;
  maxDrinks: number;
}

export interface WashingSink {
  id: string;
  x: number;
  y: number;
  input: string | null;
  progress: number;
  isWashing: boolean;
  washingPlayerId: string | null;
}

export interface DirtyTable {
    seatX: number;
    seatY: number;
    tip: number;
}

export interface GameState {
    players: Record<string, Player>;
    customers: Customer[];
    waitList: WaitingGuest[];
    holdingStations: HoldingStation[];
    dirtyTables: DirtyTable[];
    score: number;
    marketName: string;
    dayPhase: 'prep' | 'day' | 'night';
    dayTimer: number;
    upgrades: Upgrades;
    day: number;
    hasOrderedTonight: boolean;
    cookStations: CookStation[];
    dirtyTrayCount: number;
    plateStack: PlateStack;
    lives: number;
    isGameOver: boolean;
    revengeQueue: number[];
    unlockedDishes: string[];
    menuChoices: string[] | null;
    activeCards: ActiveCard[];
    pendingCardChoices: GameCard[] | null;
    hidePatience: boolean;
    comboCount: number;
    comboTimer: number;
    stationLayout: Record<string, StationPosition>;
    lockedStations: Record<string, string>;
    tableLayout: Record<string, TablePosition>;
    lockedTables: Record<string, string>;
    choppingBoards: ChoppingBoard[];
    sinks: WashingSink[];
    fryers: Fryer[];
    fridges: Fridge[];
    cakeBakers: CakeBaker[];
    coffeeMachines: CoffeeMachine[];
    serviceWindow: ServiceWindowSlot[];

    _stateTick?: number;
    _seatCooldown?: number;
    _kaosTimer?: number;
    mapId?: string;
    pendingRevengeScene?: boolean;
}

export interface StationPosition {
  id: string;
  x: number;
  y: number;
}

export interface TablePosition {
  id: string;
  x: number;
  y: number;
  seats?: 1 | 2 | 3 | 4;
}

export interface ServiceWindowSlot {
  id: string;
  item: Item;
}

export type SpecialRequest = 'spicy' | 'extra' | 'quick';
export type SpiceableDish = '🍕' | '🍔' | '🍜' | '🌯' | '🥗';
export type MapId = 'classic';
