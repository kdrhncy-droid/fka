import { GameState } from "../shared/types.js";

// ─── Room Manager ─────────────────────────────────────────────────────────────
export class RoomManager {
  private static states = new Map<string, GameState>();
  private static intervals = new Map<string, NodeJS.Timeout>();
  private static peerMaps = new Map<string, Record<string, string>>();

  static getPeerMap(rid: string): Record<string, string> {
    return this.peerMaps.get(rid) || {};
  }

  static setPeerId(rid: string, socketId: string, peerId: string) {
    const map = this.peerMaps.get(rid) || {};
    map[socketId] = peerId;
    this.peerMaps.set(rid, map);
  }

  static removePeer(rid: string, socketId: string) {
    const map = this.peerMaps.get(rid);
    if (map) {
      delete map[socketId];
      if (Object.keys(map).length === 0) this.peerMaps.delete(rid);
    }
  }

  static getRoomState(rid: string): GameState | undefined {
    return this.states.get(rid);
  }

  static setRoomState(rid: string, gs: GameState) {
    this.states.set(rid, gs);
  }

  static deleteRoom(rid: string) {
    this.states.delete(rid);
    this.peerMaps.delete(rid);
    if (this.intervals.has(rid)) {
      clearInterval(this.intervals.get(rid)!);
      this.intervals.delete(rid);
    }
  }

  static setInterval(rid: string, interval: NodeJS.Timeout) {
    this.intervals.set(rid, interval);
  }
}
