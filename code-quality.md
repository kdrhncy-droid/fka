# Kod Kalitesi İyileştirme Planı

## Mevcut Durum Özeti

Kod çalışıyor ama birkaç kategoride temizlenecek şeyler var:
- Kullanılmayan import'lar
- Tip güvenliği eksiklikleri
- Tekrar eden kod blokları
- Eksik null check'ler
- DEFAULT_STATE tutarsızlıkları

---

## 🔴 Öncelik 1 — Hemen Düzeltilmeli

### 1. `useGameLoop.ts` — Kullanılmayan Import'lar

```ts
// Bunlar import edilmiş ama hiç kullanılmıyor:
GAME_WIDTH, GAME_HEIGHT, TRAY_STATION, INGREDIENTS,
RECIPE_DEFS, TRASH_STATION, SINK_STATION, DAY_TICKS, NIGHT_TICKS
```

**Düzeltme**: Kullanılmayan import'ları sil.

---

### 2. `useGameState.ts` — `DEFAULT_UI` Eksik Alanlar

```ts
// Şu an:
upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0 }

// Olması gereken (fridgeCapacity kaldırıldı, diğerleri eksik):
upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0,
            fryerSpeed: 0, cakeBaker: 0, coffeeMachine: 0, extraSink: 0, extraChopBoard: 0 }
```

**Düzeltme**: `DEFAULT_UI.upgrades`'i `Upgrades` interface'iyle tam eşleştir.

---

### 3. `useSocket.ts` — `DEFAULT_STATE` Eksik Alanlar

```ts
// Şu an upgrades'de fridgeCapacity hala var:
upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0, extraSink: 0, extraChopBoard: 0 }

// Eksik: fryerSpeed, cakeBaker, coffeeMachine
```

**Düzeltme**: `DEFAULT_STATE.upgrades`'i güncel `Upgrades` interface'iyle eşleştir.

---

### 4. `useSocket.ts` — `playerDataRef` Tipi `any`

```ts
const playerDataRef = useRef<any>(null); // ❌ any
```

**Düzeltme**:
```ts
interface PlayerJoinData {
  room: string;
  name: string;
  color: string;
  hat: string;
  charType?: number;
  hairColor?: string;
  clothingColor?: string;
  faceShape?: number;
  mapId?: string;
}
const playerDataRef = useRef<PlayerJoinData | null>(null);
```

---

### 5. `useGameLoop.ts` — `any` Tip Kullanımı

```ts
// ❌ implicit any
state.customers.forEach((c) => drawCustomer(...))
(state.dirtyTables ?? []).forEach((t) => drawDirtyTable(...))
Object.values(sp).forEach((p: Player) => ...)
```

**Düzeltme**: Explicit tip ekle.

---

## 🟠 Öncelik 2 — Tekrar Eden Kod

### 6. `useGameLoop.ts` — Dinamik Pozisyon Alma Tekrarı

Her istasyon için aynı pattern tekrarlanıyor:
```ts
const dynX = state.stationLayout?.[fryer.id]?.x ?? fryer.x;
const dynY = state.stationLayout?.[fryer.id]?.y ?? fryer.y;
```

**Düzeltme**: Yardımcı fonksiyon:
```ts
function getDynPos(layout: GameState['stationLayout'], id: string, fallback: { x: number; y: number }) {
  return {
    x: layout?.[id]?.x ?? fallback.x,
    y: layout?.[id]?.y ?? fallback.y,
  };
}
```

---

### 7. `useGameLoop.ts` — İstasyon Render Bloğu Tekrarı

Fritöz, buzdolabı, pasta fırını, kahve makinesi için aynı pattern:
```ts
if (state.X && state.unlockedDishes.includes('emoji')) {
  for (const item of state.X) {
    if (movingId === item.id) continue;
    const dynX = ...
    const dynY = ...
    drawX(ctx, { ...item, x: dynX, y: dynY }, time);
  }
}
```

**Düzeltme**: Generic render helper:
```ts
function renderStations<T extends { id: string; x: number; y: number }>(
  stations: T[] | undefined,
  requiredDish: string | null,
  unlockedDishes: string[],
  movingId: string | undefined,
  layout: GameState['stationLayout'],
  draw: (ctx: CanvasRenderingContext2D, station: T, time: number) => void,
  ctx: CanvasRenderingContext2D,
  time: number
) {
  if (!stations) return;
  if (requiredDish && !unlockedDishes.includes(requiredDish)) return;
  for (const s of stations) {
    if (movingId === s.id) continue;
    const pos = getDynPos(layout, s.id, s);
    draw(ctx, { ...s, ...pos }, time);
  }
}
```

---

### 8. `server/interactHandler.ts` — `gs` Kullanılmıyor

```ts
const handleSpiceRack: InteractionHandler = (ctx) => {
  const { gs, p, px, py, snd } = ctx; // gs hiç kullanılmıyor
```

**Düzeltme**: `gs` destructure'dan çıkar.

---

## 🟡 Öncelik 3 — Tip Güvenliği

### 9. `shared/types.ts` — `stock` Alanı Kullanılmıyor

```ts
export interface GameState {
  stock: Record<StockKey, number>; // Hiç kullanılmıyor, kaldırılabilir
```

**Düzeltme**: `stock` alanını `GameState`'ten ve `mkGameState`'ten kaldır.

---

### 10. `useGameState.ts` — `upgradesEqual` Eksik Alanlar

```ts
function upgradesEqual(a: Upgrades, b: Upgrades): boolean {
  return a.patience === b.patience && a.earnings === b.earnings
    && a.plateStackMax === b.plateStackMax && a.safeOven === b.safeOven
    && a.extraSink === b.extraSink && a.extraChopBoard === b.extraChopBoard;
  // ❌ fryerSpeed, cakeBaker, coffeeMachine eksik
}
```

**Düzeltme**: Tüm upgrade alanlarını karşılaştır ya da `JSON.stringify` kullan.

---

### 11. `server/gameLoop.ts` — `FRIDGE_BASE_CAPACITY` Import Edilmiş Ama Kullanılmıyor

`fridgeCapacity` upgrade kaldırıldıktan sonra bu import gereksiz kaldı.

---

### 12. `useSocket.ts` — `reconnectDelayRef` Hiç Kullanılmıyor

```ts
const reconnectDelayRef = useRef(1000); // tanımlanmış ama hiç okunmuyor
```

**Düzeltme**: Kaldır.

---

## 🟢 Öncelik 4 — Küçük İyileştirmeler

### 13. `server.ts` — `console.log` Temizliği

Production'da gereksiz loglar:
```ts
console.log('[Socket] Connected:', newSocket.id);
console.log('[Socket] Re-joining room after reconnect:', roomIdRef.current);
console.log('[Socket] Saved player data for reconnect:', playerDataRef.current);
```

**Düzeltme**: `process.env.NODE_ENV !== 'production'` koşuluna al ya da kaldır.

---

### 14. `useGameLoop.ts` — `dependency array` Eksik

```ts
useEffect(() => {
  // ...
}, [isJoined, myId, socket, showPerfStats]); // globalVolume, editorStateRef eksik
```

**Düzeltme**: Tüm dış bağımlılıkları ekle ya da kasıtlı olarak boş bırakıldığını yorum satırıyla belirt.

---

### 15. `server/gameLoop.ts` — `FRIDGE_BASE_CAPACITY` Artık Gereksiz

```ts
import { FRIDGE_BASE_CAPACITY } from "../shared/types.js"; // kullanılmıyor
```

---

## 📋 Uygulama Sırası

### Faz 1 — Hızlı Temizlik (~30 dakika)
1. `useGameLoop.ts` — kullanılmayan import'ları sil
2. `useGameState.ts` — `DEFAULT_UI.upgrades` düzelt, `upgradesEqual` tamamla
3. `useSocket.ts` — `DEFAULT_STATE.upgrades` düzelt, `reconnectDelayRef` kaldır
4. `server/gameLoop.ts` — `FRIDGE_BASE_CAPACITY` import'unu kaldır
5. `server/interactHandler.ts` — `gs` unused variable düzelt

### Faz 2 — Refactor (~1 saat)
6. `getDynPos` yardımcı fonksiyonu ekle
7. `renderStations` generic helper ekle
8. `stock` alanını `GameState`'ten kaldır
9. `PlayerJoinData` interface ekle

### Faz 3 — Polish (~30 dakika)
10. Console.log'ları production'da gizle
11. `useGameLoop` dependency array düzelt
12. Tip annotation'larını tamamla

---

## Beklenen Sonuçlar

- TypeScript hata/uyarı sayısı: ~12 → 0
- `useGameLoop.ts` satır sayısı: ~230 → ~180 (tekrar eden bloklar kaldırılınca)
- Tip güvenliği: `any` kullanımı 4 → 0
- Bundle boyutu: minimal değişim (dead code elimination zaten yapıyor)
