import React, { useEffect } from "react";
import { Socket } from "socket.io-client";
import {
  GameState,
  Player,
  DIRTY_TRAY_POS,
  PLATE_STACK_POS,
} from "../types/game";

import { drawCustomer, cleanupCRS } from "../renderer/drawCustomer";
import { drawPlayer } from "../renderer/drawPlayer";
import { drawCookStation } from "../renderer/drawCookStation";
import { movePlayer } from "./usePlayerMovement";
import { setupGameEffects, renderFloatingTexts, renderPunchParticles, renderSparkleParticles, renderServiceParticles } from "./useGameEffects";
import { updateProximityAudio } from "./useProximityAudio";
import { drawLayoutPreview, LayoutEditorState } from '../renderer/drawLayoutEditor';
import { drawDirtyTrayBasket } from '../renderer/drawDirtyTrayBasket';
import { drawWaitList } from '../renderer/drawWaitList';
import { drawDirtyTable } from '../renderer/drawDirtyTable';
import { drawChoppingBoard } from '../renderer/drawChoppingBoard';
import { drawServiceWindow } from '../renderer/drawServiceWindow';
import { drawLighting } from '../renderer/drawLighting';
import { getNearestInteractable } from '../utils/interactUtils';

import { drawFloorCached } from '../renderer/drawFloorCached';
import { drawInteractionRing } from '../renderer/drawInteractionRing';
import { drawBasicStations } from '../renderer/drawBasicStations';
import { drawPlateStack } from '../renderer/drawPlateStack';
import { drawSinks } from '../renderer/drawSinks';
import { drawPerfStats } from '../renderer/drawPerfStats';
import { drawFryer } from '../renderer/drawFryer';
import { drawFridge } from '../renderer/drawFridge';
import { drawCakeBaker } from '../renderer/drawCakeBaker';
import { drawCoffeeMachine } from '../renderer/drawCoffeeMachine';

interface UseGameLoopProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isJoined: boolean;
  myId: string;
  socket: Socket | null;
  gameStateRef: React.MutableRefObject<GameState>;
  localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
  keysRef: React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  audioElementsRef?: React.MutableRefObject<Record<string, HTMLAudioElement>>;
  globalVolume?: number;
  editorStateRef?: React.MutableRefObject<LayoutEditorState>;
  showPerfStats?: boolean;
  onPreviewUpdate?: () => void;
}

export function useGameLoop({
  canvasRef, isJoined, myId, socket, gameStateRef,
  localPlayerRef, keysRef, joystickVectorRef, audioElementsRef, globalVolume = 1.0, editorStateRef, showPerfStats = false, onPreviewUpdate,
}: UseGameLoopProps) {

  // Dinamik pozisyon yardımcısı — stationLayout varsa oradan, yoksa fallback
  function getDynPos(id: string, fallback: { x: number; y: number }, layout?: GameState['stationLayout']) {
    return { x: layout?.[id]?.x ?? fallback.x, y: layout?.[id]?.y ?? fallback.y };
  }
  useEffect(() => {
    if (!isJoined) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let lastFrameTime = 0;
    const lastEmitRef = { current: 0 };
    const { floatingTexts, punchParticles, sparkleParticles, serviceParticles, cleanup: cleanupEffects } = setupGameEffects(socket);

    // Perf stats
    const fpsBuffer: number[] = [];
    let perfMs = 0;
    let perfFps = 0;

    const render = (time: number) => {
      const renderStart = performance.now();
      const state = gameStateRef.current;
      const deltaMs = lastFrameTime === 0 ? 1000 / 60 : Math.min(50, time - lastFrameTime);
      lastFrameTime = time;
      const frameScale = deltaMs / (1000 / 60);

      const lastMove = movePlayer(time, lastEmitRef, frameScale, { socket, gameStateRef, localPlayerRef, keysRef, joystickVectorRef });

      // Editor preview her frame güncellenir — gecikme sıfır
      onPreviewUpdate?.();

      const isEditing = !!(editorStateRef?.current?.isMoving || editorStateRef?.current?.isMovingTable);
      // stationLayout'tan ingredient pozisyonlarını çıkar
      const ingPositions: Record<string, { x: number; y: number }> = {};
      if (state.stationLayout) {
        for (const [id, pos] of Object.entries(state.stationLayout) as [string, { x: number; y: number }][]) {
          if (id.startsWith('ingredient_')) {
            ingPositions[id.replace('ingredient_', '')] = { x: pos.x, y: pos.y };
          }
        }
      }
      const movingTableId = editorStateRef?.current?.movingTableId;
      const plateStackDynPos = state.stationLayout?.['plate_stack'] ?? undefined;
      const sinkDynPos = state.stationLayout?.['sink'] ?? undefined;
      const chopBoardDynPos = state.stationLayout?.['chop1'] ?? undefined;
      drawFloorCached(ctx, state.unlockedDishes, isEditing, ingPositions, state.tableLayout, movingTableId, plateStackDynPos, sinkDynPos, chopBoardDynPos, state.mapId);

      // ── Etkileşim Halkası Çizimi ──
      const lp = localPlayerRef.current;
      const nearest = getNearestInteractable(lp.x, lp.y, state, lastMove.dx, lastMove.dy);
      drawInteractionRing(ctx, nearest, isEditing);

      const movingId = editorStateRef?.current?.movingStationId;
      drawBasicStations(ctx, state, movingId);

      // Kirli tepsi sepeti
      const dirtyTrayLayout = state.stationLayout?.['dirty_tray'] ?? DIRTY_TRAY_POS;
      if (movingId !== 'dirty_tray') {
        drawDirtyTrayBasket(ctx, state.dirtyTrayCount || 0, dirtyTrayLayout);
      } // end dirty_tray guard

      const hs = state.holdingStations;
      if (hs) {
        drawPlateStack(ctx, state, movingId, PLATE_STACK_POS);
      }

      // Servis penceresi
      if (state.serviceWindow) drawServiceWindow(ctx, state.serviceWindow);

      if (state.cookStations) {
        for (const station of state.cookStations) drawCookStation(ctx, station, time);
      }

      // Kesme tahtaları
      if (state.choppingBoards) {
        for (const board of state.choppingBoards) {
          if (movingId === board.id) continue;
          drawChoppingBoard(ctx, board, time);
        }
      }

      // Lavabolar (3D Tabaklar ve Yıkama Barı)
      if (state.sinks) {
        drawSinks(ctx, state.sinks, state.stationLayout, movingId);
      }

      // Fritözler — sadece 🍟 unlock edilmişse göster
      if (state.fryers && state.unlockedDishes.includes('🍟')) {
        for (const fryer of state.fryers) {
          if (movingId === fryer.id) continue;
          const pos = getDynPos(fryer.id, fryer, state.stationLayout);
          drawFryer(ctx, { ...fryer, ...pos }, time);
        }
      }

      // Buzdolabı — sadece 🥤 unlock edilmişse göster
      if (state.fridges && state.unlockedDishes.includes('🥤')) {
        for (const fridge of state.fridges) {
          if (movingId === fridge.id) continue;
          const pos = getDynPos(fridge.id, fridge, state.stationLayout);
          drawFridge(ctx, { ...fridge, ...pos });
        }
      }

      // Pasta fırını — sadece 🍰 unlock edilmişse göster
      if (state.cakeBakers && state.unlockedDishes.includes('🍰')) {
        for (const baker of state.cakeBakers) {
          if (movingId === baker.id) continue;
          const pos = getDynPos(baker.id, baker, state.stationLayout);
          drawCakeBaker(ctx, { ...baker, ...pos }, time);
        }
      }

      // Kahve makinesi — sadece ☕ unlock edilmişse göster
      if (state.coffeeMachines && state.unlockedDishes.includes('☕')) {
        for (const cm of state.coffeeMachines) {
          if (movingId === cm.id) continue;
          const pos = getDynPos(cm.id, cm, state.stationLayout);
          drawCoffeeMachine(ctx, { ...cm, ...pos });
        }
      }


      state.customers.forEach((c: import('../types/game').Customer) => drawCustomer(ctx, c, state.tableLayout, state.hidePatience ?? false, state.hidePersonality ?? false));
      if (frameId % 150 === 0) {
        const activeIds = new Set<string>(state.customers.map((c: import('../types/game').Customer) => c.id));
        cleanupCRS(activeIds);
      }
      (state.dirtyTables ?? []).forEach((t: import('../types/game').DirtyTable) => drawDirtyTable(ctx, t.seatX, t.seatY, state.tableLayout));
      drawWaitList(ctx, state.waitList ?? []);

      // Layout editor önizlemesi — oyunculardan ÖNCE çizilir (oyuncu üstte kalır)
      if ((editorStateRef?.current?.isMoving || editorStateRef?.current?.isMovingTable) && state.stationLayout) {
        drawLayoutPreview(ctx, editorStateRef.current, state.stationLayout, state.tableLayout);
      }

      const sp = state.players;
      if (sp) {
        Object.values(sp).forEach((p: Player) => {
          const isMe = p.id === myId;
          try {
            drawPlayer(ctx, isMe ? localPlayerRef.current.x : p.x, isMe ? localPlayerRef.current.y : p.y, p, isMe);
          } catch (e) {
            // drawPlayer hatası tüm frame'i bozmasın
            ctx.restore();
          }
        });
        if (audioElementsRef?.current) {
          updateProximityAudio(audioElementsRef, localPlayerRef, sp, myId, globalVolume);
        }
      }

      renderFloatingTexts(ctx, floatingTexts);
      renderPunchParticles(ctx, punchParticles);
      renderSparkleParticles(ctx, sparkleParticles);
      renderServiceParticles(ctx, serviceParticles);

      // ── Işıklandırma Sistemi ──────────────────────────────────────────────
      drawLighting(ctx, state.dayPhase, state.dayTimer);

      // ── Perf Stats (sadece FPS — ping HTML overlay'de gösteriliyor) ─────────
      if (showPerfStats) {
        perfMs = performance.now() - renderStart;
        fpsBuffer.push(1000 / Math.max(deltaMs, 1));
        if (fpsBuffer.length > 30) fpsBuffer.shift();
        perfFps = Math.round(fpsBuffer.reduce((a, b) => a + b, 0) / fpsBuffer.length);

        drawPerfStats(ctx, perfFps);
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frameId); cleanupEffects(); };
  }, [isJoined, myId, socket, showPerfStats]);
}
