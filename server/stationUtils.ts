import {
  GameState,
  CookStation, ChoppingBoard, Fryer, CakeBaker, WashingSink,
} from "../shared/types.js";

// Tüm istasyon tipleri için ortak arayüz
type AnyStation = { id: string; x: number; y: number };

/**
 * Verilen id'ye sahip istasyonu GameState içindeki tüm array'lerde arar.
 * Bulunan istasyonu döner, bulamazsa null.
 */
export function getStationById(gs: GameState, id: string): AnyStation | null {
  return (
    gs.cookStations.find(s => s.id === id) ??
    gs.choppingBoards?.find(b => b.id === id) ??
    gs.fryers?.find(f => f.id === id) ??
    gs.cakeBakers?.find(c => c.id === id) ??
    gs.sinks?.find(s => s.id === id) ??
    null
  );
}

/**
 * Bir istasyonun koordinatını stationLayout + ilgili array'de tek seferde günceller.
 * layoutHandler ve kaos_day gibi her yerde bu kullanılmalı.
 */
export function moveStation(gs: GameState, id: string, x: number, y: number): boolean {
  if (!(id in gs.stationLayout)) return false;
  gs.stationLayout[id].x = x;
  gs.stationLayout[id].y = y;
  const station = getStationById(gs, id);
  if (station) { station.x = x; station.y = y; }
  return true;
}

/**
 * Dinamik koordinatı döner — stationLayout varsa onu, yoksa station'ın kendi x/y'sini.
 */
export function getStationPos(gs: GameState, station: AnyStation): { x: number; y: number } {
  const dyn = gs.stationLayout?.[station.id];
  return dyn ? { x: dyn.x, y: dyn.y } : { x: station.x, y: station.y };
}

/**
 * Tüm istasyonları düz bir array olarak döner (tip-agnostik).
 */
export function getAllStations(gs: GameState): AnyStation[] {
  return [
    ...gs.cookStations,
    ...(gs.choppingBoards ?? []),
    ...(gs.fryers ?? []),
    ...(gs.cakeBakers ?? []),
    ...(gs.sinks ?? []),
  ];
}
