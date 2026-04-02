import type { GameState, CookStation, MapId } from './types';
import { INITIAL_OVEN_POSITIONS, CHOPPING_BOARD_POS, SINK_STATION, SERVICE_WINDOW_SLOTS } from './gameData';
import { FRIDGE_BASE_CAPACITY, COFFEE_BASE_CAPACITY, DAY_TICKS, PLATE_STACK_BASE } from './constants';

export function mkCook(id: string, x: number, y: number): CookStation {
  return { input: null, timer: 0, output: null, id, x, y };
}

export function mkGameState(mapId: MapId = 'classic'): GameState {
  return mkClassicMapState();
}

function mkClassicMapState(): GameState {
  const initialOvens = INITIAL_OVEN_POSITIONS.map((pos, i) =>
    mkCook(`oven${i + 1}`, pos.x, pos.y)
  );
  return {
    mapId: 'classic',
    players: {}, customers: [], waitList: [],
    holdingStations: [],
    dirtyTables: [],
    score: 0,
    marketName: "TerraMarket", dayPhase: 'prep', dayTimer: DAY_TICKS,
    upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0, fryerSpeed: 0, cakeBaker: 0, coffeeMachine: 0, extraSink: 0, extraChopBoard: 0 }, day: 1, hasOrderedTonight: false,
    cookStations: initialOvens,
    dirtyTrayCount: 0,
    plateStack: { count: PLATE_STACK_BASE, maxCount: PLATE_STACK_BASE },
    lives: 3,
    isGameOver: false,
    revengeQueue: [],
    unlockedDishes: ['🥗'],
    menuChoices: null,
    activeCards: [],
    pendingCardChoices: null,
    hidePatience: false,
    comboCount: 0,
    comboTimer: 0,
    stationLayout: {
      'ingredient_🍞': { id: 'ingredient_🍞', x: 360, y: 65 },
      'ingredient_🥩': { id: 'ingredient_🥩', x: 450, y: 65 },
      'ingredient_🥬': { id: 'ingredient_🥬', x: 540, y: 65 },
      'ingredient_🥘': { id: 'ingredient_🥘', x: 630, y: 65 },
      'ingredient_🍢': { id: 'ingredient_🍢', x: 720, y: 65 },
      'ingredient_🥔': { id: 'ingredient_🥔', x: 810, y: 65 },
      'ingredient_🧁': { id: 'ingredient_🧁', x: 900, y: 65 },
      'oven1':         { id: 'oven1',         x: 400, y: 90 },
      'tray':          { id: 'tray',          x: 300, y: 285 },
      'sink':          { id: 'sink',          x: 960,  y: 90 },
      'trash':         { id: 'trash',         x: 920, y: 285 },
      'dirty_tray':    { id: 'dirty_tray',    x: 860,  y: 90 },
      'plate_stack':   { id: 'plate_stack',   x: 650, y: 65 },
      'chop1':         { id: 'chop1',         x: 760, y: 170 },
      'fryer1':        { id: 'fryer1',        x: 300, y: 170 },
      'fridge1':       { id: 'fridge1',       x: 200, y: 285 },
      'cakebaker1':    { id: 'cakebaker1',    x: 500, y: 170 },
      'coffee1':       { id: 'coffee1',       x: 100, y: 285 },
      'spice_rack':    { id: 'spice_rack',    x: 1160, y: 170 },
    },
    lockedStations: {},
    tableLayout: {
      'table0': { id: 'table0', x: 160, y: 460 },
      'table1': { id: 'table1', x: 380, y: 460 },
      'table2': { id: 'table2', x: 600, y: 460 },
      'table3': { id: 'table3', x: 820, y: 460 },
      'table4': { id: 'table4', x: 1040, y: 460 },
      'table5': { id: 'table5', x: 1200, y: 460 },
    },
    lockedTables: {},
    choppingBoards: [
      { id: 'chop1', x: CHOPPING_BOARD_POS.x, y: CHOPPING_BOARD_POS.y, input: null, progress: 0, isChopping: false, choppingPlayerId: null },
    ],
    sinks: [
      { id: 'sink', x: SINK_STATION.x, y: SINK_STATION.y, input: null, progress: 0, isWashing: false, washingPlayerId: null },
    ],
    fryers: [
      { id: 'fryer1', x: 300, y: 170, input: null, timer: 0, output: null },
    ],
    fridges: [
      { id: 'fridge1', x: 200, y: 285, drinks: FRIDGE_BASE_CAPACITY, maxDrinks: FRIDGE_BASE_CAPACITY },
    ],
    cakeBakers: [
      { id: 'cakebaker1', x: 500, y: 170, input: null, timer: 0, output: null },
    ],
    coffeeMachines: [
      { id: 'coffee1', x: 100, y: 285, cups: COFFEE_BASE_CAPACITY, maxCups: COFFEE_BASE_CAPACITY },
    ],
    serviceWindow: SERVICE_WINDOW_SLOTS.map(s => ({ id: s.id, item: null })),
  };
}
