# Kod Kalitesi İyileştirme Planı

## Durum: ✅ Tamamlandı

---

## 🔴 Öncelik 1 — Hızlı Temizlik ✅

### 1. `useGameLoop.ts` — Kullanılmayan Import'lar ✅
Kaldırıldı: `GAME_WIDTH, GAME_HEIGHT, TRAY_STATION, INGREDIENTS, RECIPE_DEFS, TRASH_STATION, SINK_STATION, DAY_TICKS, NIGHT_TICKS`

### 2. `useGameState.ts` — `DEFAULT_UI` Eksik Alanlar ✅
`fryerSpeed, cakeBaker, coffeeMachine, extraSink, extraChopBoard` eklendi.

### 3. `useSocket.ts` — `DEFAULT_STATE` Eksik Alanlar ✅
`fryerSpeed, cakeBaker, coffeeMachine` eklendi. `fridgeCapacity` kaldırıldı.

### 4. `useSocket.ts` — `playerDataRef` Tipi `any` ✅
`PlayerJoinData` interface eklendi.

### 5. `useGameLoop.ts` — `any` Tip Kullanımı ✅
`Customer`, `DirtyTable` explicit tip annotation'ları eklendi.

---

## 🟠 Öncelik 2 — Refactor ✅

### 6. `useGameLoop.ts` — `getDynPos` Yardımcı Fonksiyon ✅
`getDynPos(id, fallback, layout)` eklendi, tüm istasyon render bloklarında kullanılıyor.

### 7. `useGameLoop.ts` — İstasyon Render Bloğu Tekrarı ✅
`getDynPos` ile tekrar eden `dynX/dynY` pattern'leri temizlendi.

### 8. `server/interactHandler.ts` — `gs` Unused Variable ✅
`handleSpiceRack`'te `gs` destructure sırasına taşındı (lint uyarısı giderildi).

### 9. `shared/types.ts` — `stock` Alanı Kaldırıldı ✅
`GameState`'ten, `mkGameState`'ten ve `drawBasicStations.ts`'den kaldırıldı.

### 10. `useGameState.ts` — `upgradesEqual` Eksik Alanlar ✅
`fryerSpeed, cakeBaker, coffeeMachine` karşılaştırması eklendi.

### 11. `server/gameLoop.ts` — `FRIDGE_BASE_CAPACITY` Import ✅
Kaldırıldı.

### 12. `useSocket.ts` — `reconnectDelayRef` ✅
Kaldırıldı.

---

## 🟢 Öncelik 3 — Polish ✅

### 13. Console.log'lar ✅
`process.env.NODE_ENV !== 'production'` koşuluna alındı.

### 14. `useGameLoop` dependency array ✅
Kasıtlı olarak sınırlı tutulduğu yorum satırıyla belirtildi.

---

## Sonuçlar

- TypeScript uyarı sayısı: ~12 → 0
- `useGameLoop.ts` temizlendi, `getDynPos` helper eklendi
- `any` kullanımı kaldırıldı
- `stock` alanı tamamen silindi
- Build: ✅ başarılı
