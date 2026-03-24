import { Socket, Server } from "socket.io";
import {
  GameState, Item,
  DISH_ITEMS, INGREDIENTS, RECIPE_DEFS,
  COUNTER_POSITIONS, PLATE_STACK_POS,
  CLEAN_PLATE, DIRTY_PLATE, BURNED_FOOD, EAT_TICKS,
  MAX_TRAY_CAPACITY, isTray, getTrayItems, createTray,
  SINK_STATION, TRASH_STATION, TRAY_STATION,
  CHOPPABLE, CHOP_PREFIX, isChopped,
  SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R,
} from "../shared/types.js";

const INTERACT_R = 110; // Fırın ve istasyonlar için daha geniş etkileşim alanı
const SERVE_R = 125;   // Servis ve masa etkileşimi için daha geniş alan

function earn(lv: number) { return 10 + 5 * lv; }
function isDish(item: Item): item is string { return !!item && DISH_ITEMS.includes(item as any); }

export function registerInteractHandler(
  socket: Socket,
  io: Server,
  getRoomId: () => string | null,
  getRoomState: (rid: string) => GameState | undefined
) {
  socket.on("interact", () => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    const p = gs.players[socket.id];
    if (!p) return;
    const px = p.x, py = p.y;

    // Servis Penceresi — mutfak tarafından bırak, salon tarafından al
    if (gs.serviceWindow?.length) {
      for (const slot of gs.serviceWindow) {
        const def = SERVICE_WINDOW_SLOTS.find(s => s.id === slot.id);
        if (!def) continue;
        if (Math.hypot(px - def.x, py - def.y) < SERVICE_WINDOW_R) {
          if (!p.holding && slot.item) {
            p.holding = slot.item; slot.item = null;
            socket.emit('sound', 'pickup');
          } else if (p.holding && !slot.item) {
            slot.item = p.holding; p.holding = null;
            socket.emit('sound', 'success');
          }
          return;
        }
      }
    }

    // Lavabolar (Progressli Yıkama)
    if (gs.sinks) {
      for (const sink of gs.sinks) {
        const dynX = gs.stationLayout?.[sink.id]?.x ?? sink.x;
        const dynY = gs.stationLayout?.[sink.id]?.y ?? sink.y;
        if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
          if (!p.holding) {
            if (sink.input === CLEAN_PLATE) {
              // Yıkanmış temiz tabağı al
              p.holding = CLEAN_PLATE;
              sink.input = null;
              sink.progress = 0;
              sink.isWashing = false;
              sink.washingPlayerId = null;
              socket.emit("sound", "pickup");
            } else if (sink.input === DIRTY_PLATE && !sink.isWashing) {
              // Yıkamayı başlat (El boşken lavabodaki kirli tabağı yıkamaya başla)
              sink.isWashing = true;
              sink.washingPlayerId = socket.id;
            }
          } else if (p.holding === DIRTY_PLATE && !sink.input) {
            // Elindeki kirli tabağı boş lavaboya bırak
            sink.input = DIRTY_PLATE;
            sink.progress = 0;
            sink.isWashing = false;
            sink.washingPlayerId = null;
            p.holding = null;
            socket.emit("sound", "success");
          } else {
             socket.emit("sound", "fail");
          }
          return; // Lavabo etkileşim alanındayken başka istasyona bakma
        }
      }
    }

    // Çöp kovası — yanmış yemek atılabilir; temiz/kirli TABAK asla atılamaz
    const trashPos = gs.stationLayout['trash'] ?? TRASH_STATION;
    if (Math.hypot(px - trashPos.x, py - trashPos.y) < INTERACT_R) {
      if (p.holding) {
        // Temiz veya kirli tabak çöpe atılamaz
        if (p.holding === CLEAN_PLATE || p.holding === DIRTY_PLATE) {
          socket.emit("sound", "fail");
          return;
        }
        if (isTray(p.holding)) {
          const items = getTrayItems(p.holding);
          // Tepside tabak varsa çöpe atılamaz
          if (items.includes(CLEAN_PLATE) || items.includes(DIRTY_PLATE)) {
            socket.emit("sound", "fail");
            return;
          }
          // Tabak yoksa (sadece yanmış yemek vb.) atılabilir
        }
        p.holding = null;
        socket.emit("sound", "trash");
      }
      return;
    }

    // Tepsi istasyonu — boş tepsi al veya tepsini geri bırak
    const trayPos = gs.stationLayout['tray'] ?? TRAY_STATION;
    if (Math.hypot(px - trayPos.x, py - trayPos.y) < INTERACT_R) {
      if (!p.holding) {
        // Boş tepsi al
        p.holding = createTray([]);
        socket.emit("sound", "pickup");
      } else if (isTray(p.holding)) {
        // Tepsini bırak (içindekiler kaybolmadan geri koy)
        p.holding = null;
        socket.emit("sound", "success");
      }
      return;
    }

    // Kirli tepsi sepeti — kirli tabakları bırak, dirtyTrayCount artar
    const dirtyTrayPos = gs.stationLayout['dirty_tray'] ?? { x: 1050, y: 90 };
    if (Math.hypot(px - dirtyTrayPos.x, py - dirtyTrayPos.y) < INTERACT_R) {
      if (p.holding === DIRTY_PLATE) {
        gs.dirtyTrayCount = (gs.dirtyTrayCount || 0) + 1;
        p.holding = null;
        socket.emit("sound", "success");
      } else if (isTray(p.holding)) {
        const items = getTrayItems(p.holding);
        const dirtyCountInTray = items.filter(i => i === DIRTY_PLATE).length;
        if (dirtyCountInTray > 0) {
          // Tepsideki kirli tabakları sepete bırak
          const cleaned = items.filter(i => i !== DIRTY_PLATE);
          p.holding = cleaned.length > 0 ? createTray(cleaned) : null;
          gs.dirtyTrayCount = (gs.dirtyTrayCount || 0) + dirtyCountInTray;
          socket.emit("sound", "success");
        } else if (items.length < MAX_TRAY_CAPACITY && (gs.dirtyTrayCount || 0) > 0) {
          // Sepetten kirli tabağı tepsiye al
          items.push(DIRTY_PLATE);
          p.holding = createTray(items);
          gs.dirtyTrayCount--;
          socket.emit("sound", "pickup");
        }
      } else if (!p.holding && (gs.dirtyTrayCount || 0) > 0) {
        // Sepetten tek bir kirli tabak al
        p.holding = DIRTY_PLATE;
        gs.dirtyTrayCount = Math.max(0, gs.dirtyTrayCount - 1);
        socket.emit("sound", "pickup");
      }
      return;
    }
    const dirtyIdx = gs.dirtyTables.findIndex(t => Math.hypot(px - t.seatX, py - t.seatY) < SERVE_R);
    if (dirtyIdx !== -1) {
      const dt = gs.dirtyTables[dirtyIdx];
      if (!p.holding) {
        p.holding = DIRTY_PLATE;
        if (dt.tip > 0) {
          gs.score += dt.tip;
          io.to(roomId).emit("tipCollected", { x: dt.seatX, y: dt.seatY, amount: dt.tip });
        }
        gs.dirtyTables.splice(dirtyIdx, 1);
        socket.emit("sound", "pickup");
      } else if (isTray(p.holding)) {
        const items = getTrayItems(p.holding);
        if (items.length < MAX_TRAY_CAPACITY) {
          items.push(DIRTY_PLATE);
          p.holding = createTray(items);
          if (dt.tip > 0) {
            gs.score += dt.tip;
            io.to(roomId).emit("tipCollected", { x: dt.seatX, y: dt.seatY, amount: dt.tip });
          }
          gs.dirtyTables.splice(dirtyIdx, 1);
          socket.emit("sound", "pickup");
        }
        return;
      } else {
        // Oyuncu elinde yemek tutuyor — kirli masayı yoksay, servis kontrolüne geç
      }
    }

    // Tabak Yığını — dinamik koordinat (stationLayout'tan al, yoksa sabit)
    const plateStackPos = gs.stationLayout?.['plate_stack'] ?? PLATE_STACK_POS;
    if (Math.hypot(px - plateStackPos.x, py - plateStackPos.y) < PLATE_STACK_POS.radius) {
      const ps = gs.plateStack;
      if (!p.holding && ps.count > 0) {
        p.holding = CLEAN_PLATE; ps.count--;
        socket.emit("sound", "pickup"); return;
      } else if (p.holding === DIRTY_PLATE) {
        socket.emit("sound", "fail"); return;
      } else if (p.holding === CLEAN_PLATE && ps.count < ps.maxCount) {
        p.holding = null; ps.count++;
        socket.emit("sound", "success"); return;
      } else if (isTray(p.holding)) {
        const items = getTrayItems(p.holding);
        const cpIdx = items.indexOf(CLEAN_PLATE);
        if (cpIdx !== -1 && ps.count < ps.maxCount) {
          items.splice(cpIdx, 1);
          p.holding = items.length > 0 ? createTray(items) : null;
          ps.count++;
          socket.emit("sound", "success"); return;
        } else if (ps.count > 0 && items.length < MAX_TRAY_CAPACITY) {
          items.push(CLEAN_PLATE);
          p.holding = createTray(items);
          ps.count--;
          socket.emit("sound", "pickup"); return;
        }
      }
    }

    // Counter istasyonları
    for (const station of gs.holdingStations) {
      if (station.type !== 'counter') continue;
      const stationDef = COUNTER_POSITIONS.find(pos => pos.id === station.id);
      const dynPos = gs.stationLayout[station.id];
      const posX = dynPos?.x ?? stationDef?.x ?? 0;
      const posY = dynPos?.y ?? stationDef?.y ?? 0;
      if (!stationDef || !(Math.abs(px - posX) < 50 && Math.abs(py - posY) < 70)) continue;
      if (!p.holding && station.items.length > 0) {
        p.holding = station.items.pop()!;
        socket.emit("sound", "pickup"); return;
      }
      if (p.holding && station.items.length === 0) {
        station.items.push(p.holding);
        p.holding = null;
        socket.emit("sound", "success"); return;
      }
    }

    // Kesme tahtaları — malzeme bırak/al (E tuşu)
    if (gs.choppingBoards) {
      for (const board of gs.choppingBoards) {
        const dynX = gs.stationLayout?.[board.id]?.x ?? board.x;
        const dynY = gs.stationLayout?.[board.id]?.y ?? board.y;
        if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
          if (!p.holding) {
            // Doğranmamış malzemeyi geri al (henüz tamamlanmamış)
            if (board.input && !isChopped(board.input)) {
              p.holding = board.input;
              board.input = null;
              board.progress = 0;
              board.isChopping = false;
              board.choppingPlayerId = null;
              socket.emit("sound", "pickup");
            } else if (board.input && isChopped(board.input)) {
              // Doğranmış malzemeyi direkt al — tabak gerekmez
              p.holding = board.input;
              board.input = null;
              board.progress = 0;
              board.isChopping = false;
              board.choppingPlayerId = null;
              socket.emit("sound", "success");
            }
          } else if (p.holding === CLEAN_PLATE && board.input && isChopped(board.input)) {
            // Tabakla alınması engellendi — tabak kaybolma sorunu için
            socket.emit("sound", "fail");
          } else if (CHOPPABLE.includes(p.holding as any) && !board.input) {
            // Tahtaya doğranabilir malzeme bırak
            board.input = p.holding;
            board.progress = 0;
            board.isChopping = false;
            board.choppingPlayerId = null;
            p.holding = null;
            socket.emit("sound", "success");
          }
          return;
        }
      }
    }

    // Fırınlar
    for (const station of gs.cookStations) {
      const dynX = gs.stationLayout?.[station.id]?.x ?? station.x;
      const dynY = gs.stationLayout?.[station.id]?.y ?? station.y;
      if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
        const holding = p.holding;
        const isRawChoppable = typeof holding === 'string' && CHOPPABLE.includes(holding as any);
        const isChoppedItem = typeof holding === 'string' && holding.startsWith(CHOP_PREFIX);
        const isNonChoppableIngredient = INGREDIENTS.some(ing => ing.key === holding && !CHOPPABLE.includes(ing.key as any));

        // Fırına koyma: doğranmış malzeme veya doğrama gerektirmeyen malzeme
        if ((isChoppedItem || isNonChoppableIngredient) && !station.input && !station.output) {
          const recipe = RECIPE_DEFS[holding as keyof typeof RECIPE_DEFS];
          if (recipe) {
            station.input = holding; station.timer = recipe.time;
            p.holding = null; station.isBurned = false; station.burnTimer = 0;
            socket.emit("sound", "pickup");
          }
        } else if (isRawChoppable && !station.input && !station.output) {
          // Ham doğranabilir malzeme — fırına koyma, uyar
          socket.emit("sound", "fail");
        } else if (p.holding === CLEAN_PLATE && station.output && !station.isBurned) {
          // Tabakla alırken tabağın yok olmaması için DISH_ITEMS kontrolü (pişmiş yemek zaten tabağa girmiş sayılır)
          // Eğer yemek zaten bir tabaklı öğeyse (DISH_ITEMS içindeyse), eldeki tabağı tüketmiyoruz.
          // Ancak mevcut sistemde p.holding değiştiği için tabağın "yok olması" normal, 
          // önemli olan yemeğin tabağa girmiş bir şekilde (servis edilebilir) temsil edilmesidir.
          p.holding = station.output;
          station.output = null; station.burnTimer = 0;
          socket.emit("sound", "success");
        } else if (isTray(p.holding) && station.output && !station.isBurned) {
          const items = getTrayItems(p.holding);
          const cpIdx = items.indexOf(CLEAN_PLATE);
          if (cpIdx !== -1) {
            items[cpIdx] = station.output;
            p.holding = createTray(items);
            station.output = null; station.burnTimer = 0;
            socket.emit("sound", "success");
          }
        } else if (!p.holding && station.isBurned) {
          p.holding = BURNED_FOOD;
          station.output = null; station.isBurned = false; station.burnTimer = 0;
          socket.emit("sound", "trash");
        }
        return;
      }
    }

    // Servis
    if (p.holding) {
      for (let ci = 0; ci < gs.customers.length; ci++) {
        const c = gs.customers[ci];
        if (c.isSeated && !c.isEating && Math.hypot(px - c.seatX, py - c.seatY) < SERVE_R) {
          if (!isTray(p.holding) && c.wants === p.holding) {
            c.tipAmount = earn(gs.upgrades.earnings);
            c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
            io.to(roomId).emit("sound", "success"); return;
          } else if (isTray(p.holding)) {
            const items = getTrayItems(p.holding);
            const wIdx = items.indexOf(c.wants as string);
            if (wIdx !== -1) {
              items.splice(wIdx, 1);
              p.holding = createTray(items);
              c.tipAmount = earn(gs.upgrades.earnings);
              c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null;
              io.to(roomId).emit("sound", "success"); return;
            }
          }
        }
      }
    }

    // Malzeme al
    for (const s of INGREDIENTS) {
      const dynPos = gs.stationLayout[`ingredient_${s.key}`];
      const posX = dynPos?.x ?? s.pos.x;
      const posY = dynPos?.y ?? s.pos.y;
      if (Math.hypot(px - posX, py - posY) < INTERACT_R) {
        // Tabakla veya tepsi içindeki tabakla malzeme alınamaz
        const hasPlate = p.holding === CLEAN_PLATE || (isTray(p.holding) && getTrayItems(p.holding).includes(CLEAN_PLATE));
        if (hasPlate || isDish(p.holding)) {
          socket.emit("sound", "fail"); return;
        }
        const recipe = RECIPE_DEFS[s.key as keyof typeof RECIPE_DEFS];
        if (recipe && !gs.unlockedDishes.includes(recipe.output)) {
          socket.emit("sound", "fail"); return;
        }
        if (!p.holding) {
          p.holding = s.key;
          socket.emit("sound", "pickup"); return;
        }
      }
    }
  });
}
