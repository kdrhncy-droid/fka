# Merkezileştirme Planı — "Tek Kaynaktan Yönet"

## Mevcut Durum

### ✅ Zaten Merkezileştirilmiş
| Veri | Dosya |
|------|-------|
| İstasyon unlock kontrolü | `shared/stationRegistry.ts` |
| Oyun sabitleri (tick, boyut vb.) | `shared/constants.ts` |
| Tarif tanımları | `shared/gameData.ts` |
| Upgrade tanımları | `shared/gameData.ts` |
| Kart tanımları | `shared/gameData.ts` |
| Renderer utility'leri | `src/renderer/rendererUtils.ts` |

---

## ❌ Hâlâ Dağınık Olanlar

---

### 1. `DOOR_X = 640`
**Nerede:** 3 ayrı dosyada `const DOOR_X = 640` olarak tanımlı
- `server/spawnLogic.ts` (satır 10)
- `server/customerLogic.ts` (satır 10)
- `src/renderer/drawWaitList.ts` (satır 4)

**Nereye taşınmalı:** `shared/constants.ts`

**Risk:** Kapı konumu değişirse 3 dosyayı güncellemeyi unutmak.

---

### 2. `INTERACT_R`, `COOK_R`, `SERVE_R`
**Nerede:** 5 ayrı dosyada tanımlı
- `server/interactHandler.ts` — `INTERACT_R=110`, `COOK_R=145`, `SERVE_R=125`
- `server/handlers/kitchenHandler.ts` — `COOK_R=145`, `INTERACT_R=110`
- `server/handlers/sinkHandler.ts` — `INTERACT_R=110`
- `server/handlers/serviceHandler.ts` — `SERVE_R=125`
- `server/handlers/itemHandler.ts` — `INTERACT_R=110`
- `src/utils/interactUtils.ts` — `INTERACT_R=110`, `COOK_R=145`, `SERVE_R=125`

**Nereye taşınmalı:** `server/handlers/utils.ts` (server için) + `shared/constants.ts` (client için de lazım)

**Risk:** Etkileşim yarıçapı ayarlanmak istendiğinde 6 dosyayı güncellemeyi unutmak.

---

### 3. `WASH_TICKS = 60`
**Nerede:**
- `shared/constants.ts` — export edilmiş ✅
- `src/renderer/drawSinks.ts` — kendi tanımlıyor ❌

**Nereye taşınmalı:** `drawSinks.ts` sadece `shared/constants.ts`'ten import etmeli.

**Risk:** Yıkama süresi değişince renderer güncellenmez, progress bar yanlış gösterir.

---

### 4. Personality Renkleri (`PERS_COLORS`)
**Nerede:** 2 ayrı dosyada farklı değerlerle tanımlı
- `src/renderer/drawCustomer.ts` — `polite: { body: '#3b6ea5', skin: '#f5c090', hair: '#2d1b0e' }`
- `src/renderer/drawWaitList.ts` — aynı değerler ✅ (tutarlı)
- `server/spawnLogic.ts` — sadece `body` renkleri, farklı değerler: `polite: ['#3b82f6', '#0ea5e9', ...]`

**Sorun:** `drawCustomer` ve `drawWaitList` aynı rengi kullanıyor ama `spawnLogic`'teki spawn renkleri farklı. Müşteri spawn olurken farklı bir renk atanıyor, ama çizilirken `PERS_COLORS`'dan sabit renk kullanılıyor — `bodyColor` alanı aslında hiç kullanılmıyor!

**Nereye taşınmalı:** `shared/customerColors.ts` (yeni dosya) — hem spawn hem render buradan okur.

**Risk:** Yeni personality eklenince spawn'da renk var ama renderer'da yok (veya tam tersi).

---

### 5. `TABLE_COSTS` ve `MAX_TABLES`
**Nerede:** 2 ayrı dosyada hardcoded
- `server/socketHandlers.ts` (satır 178-179)
- `src/components/UpgradeShop.tsx` (satır 47-48)

**Nereye taşınmalı:** `shared/constants.ts`

**Risk:** Masa fiyatı değişince server'da güncellenir ama UI'da eski fiyat gösterilir (veya tam tersi).

---

### 6. `MENU_UNLOCK_DAYS = [3, 10, 13, 20, 24, 28]`
**Nerede:** Sadece `server/gameLoop.ts`'te hardcoded (satır 24)

**Sorun:** Client tarafı hangi günlerde yemek seçimi çıkacağını bilmiyor. Gelecekte UI'da "Sonraki yemek: Gün X" göstermek istersek buraya bakmak gerekir.

**Nereye taşınmalı:** `shared/gameData.ts` (zaten `CARD_DAYS` orada)

**Risk:** Düşük — şu an sadece server kullanıyor. Ama tutarlılık için taşınmalı.

---

### 7. `TABLE_POSITIONS` (masa koordinatları)
**Nerede:** `server/socketHandlers.ts`'te hardcoded array (satır 160-177)

**Sorun:** Yeni masa pozisyonu eklenince sadece server'da güncelleniyor. Layout editor veya başka bir yerde bu pozisyonlara ihtiyaç duyulursa tekrar yazılacak.

**Nereye taşınmalı:** `shared/gameData.ts`

---

## Uygulama Sırası

| # | Değişiklik | Dosyalar | Zorluk | Risk |
|---|-----------|----------|--------|------|
| 1 | `WASH_TICKS` import düzelt | `drawSinks.ts` | Çok kolay | Sıfır |
| 2 | `DOOR_X` → `constants.ts` | 3 dosya | Kolay | Düşük |
| 3 | `TABLE_COSTS`, `MAX_TABLES` → `constants.ts` | 2 dosya | Kolay | Düşük |
| 4 | `MENU_UNLOCK_DAYS` → `gameData.ts` | 1 dosya | Kolay | Düşük |
| 5 | `INTERACT_R`, `COOK_R`, `SERVE_R` → `constants.ts` | 6 dosya | Orta | Orta |
| 6 | `TABLE_POSITIONS` → `gameData.ts` | 1 dosya | Kolay | Düşük |
| 7 | `PERS_COLORS` → `customerColors.ts` | 3 dosya | Orta | Orta |

---

## Hedef Durum

Yeni bir şey eklendiğinde sadece şu dosyalara dokunmak yeterli olacak:

| Ne eklenecek | Nereye dokunulacak |
|-------------|-------------------|
| Yeni istasyon | `shared/stationRegistry.ts` |
| Yeni yemek | `shared/gameData.ts` (RECIPE_DEFS, DISH_UNLOCK_POOL) |
| Yeni müşteri tipi | `shared/customerColors.ts` |
| Yeni upgrade | `shared/gameData.ts` (UPGRADE_DEFS) |
| Yeni kart | `shared/gameData.ts` (ALL_CARDS) |
| Fiyat/süre değişikliği | `shared/constants.ts` |
