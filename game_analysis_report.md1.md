# 🎮 FKA — Kapsamlı Oyun Analiz Raporu

> **Tarih:** 2026-08-03  
> **Branch:** main  
> **Analiz Kapsamı:** Bug doğrulama, ek bug tespiti, kod kalitesi, oyun tasarımı, eğlence faktörü

---

## 📋 Bug Report Doğrulama Sonuçları

### Özet Tablo

| # | Hata | Rapor | Gerçek Durum | Sonuç |
|---|------|-------|--------------|-------|
| H1 | Inspector asla spawn olmaz | 🔴 Kritik | `roll < 0.10` (VIP) inspector'ın `roll < 0.08`'ini de kapsıyor | ✅ **GEÇERLİ** |
| H2 | endDayBonus yanlış sırada | 🔴 Kritik | `dayEnd` emit → sonra bonus ekleniyor (satır 123 vs 139) | ✅ **GEÇERLİ** |
| H3 | Game over sonrası tryQueueSeat | 🔴 Kritik | `break` zaten `_needsQueueSeat`'ten önce çıkıyor + dayPhase guard var | ❌ **GEÇERSİZ** |
| H4 | Lucky müşteri triple score | 🔴 Kritik | `jackpot` sadece UI event, çift skor yok. **AMA** drunk tip=0 olabiliyor | ⚠️ **KISMEN GEÇERLİ** |
| H5 | Sonsuz kahve | 🟡 Orta | Kahve sistemi oyundan tamamen kaldırıldı | 🗑️ **KALDIRILMIŞ** |
| H6 | Fryer/CakeBaker cookDone eksik | 🟡 Orta | `updateFryers` ve `updateCakeBakers` gerçekten emit etmiyor | ✅ **GEÇERLİ** |
| H7 | chop_pressure etkisiz | 🟡 Orta | `choppedCookMult` tanımlı ama hiçbir yerde kullanılmıyor | ✅ **GEÇERLİ** |
| H8 | DirtyTray yanlış pozisyon | 🟡 Orta | Fallback `{x:1050, y:90}` ama `DIRTY_TRAY_POS = {x:860, y:90}` | ✅ **GEÇERLİ** |
| H9 | maxLife eksik animasyon | 🟢 Küçük | `renderFloatingTexts`'te fallback var: `if (ft.maxLife === undefined) ft.maxLife = ft.life` | ⚠️ **KISMEN GEÇERLİ** |
| H10 | DayEndModal yanlış ciro | 🟢 Küçük | `summary.score` toplam skor, "Günlük Ciro" etiketi altında gösteriliyor | ✅ **GEÇERLİ** |
| H11 | globalVolume dep array | 🟢 Küçük | `globalVolume` useEffect içinde kullanılıyor ama dependency array'de yok | ✅ **GEÇERLİ** |

---

### Detaylı Doğrulama

#### ✅ H1 — Inspector Asla Spawn Olmaz (GEÇERLİ)

[spawnLogic.ts](file:///c:/fka/server/spawnLogic.ts#L129-L135) satır 129-135:

```typescript
const roll = Math.random();
if (gs.day >= 5 && roll < 0.10) pers = 'vip';       // roll < 0.10 yakalar
else if (gs.day >= 3 && roll < 0.25) pers = 'drunk'; // roll < 0.25 yakalar
else if (gs.day >= 7 && roll < 0.08) pers = 'inspector'; // ❌ ASLA ULAŞILAMAZ
```

> [!CAUTION]
> `roll < 0.08` olan her değer zaten `roll < 0.10` (VIP) tarafından yakalanıyor. Inspector **matematiksel olarak imkansız**.

---

#### ✅ H2 — endDayBonus Yanlış Sırada (GEÇERLİ)

[gameLoop.ts](file:///c:/fka/server/gameLoop.ts#L122-L139) satır 122-139:

```diff
  // Önce emit ediliyor (bonus YOK)
  io.to(rid).emit("dayEnd", { day: gs.day, score: gs.score, ... });  // satır 123
  
  // Sonra bonus ekleniyor (client bu değeri göremez)
  if (cm.endDayBonus > 0) gs.score += cm.endDayBonus;               // satır 139
```

---

#### ❌ H3 — Game Over + tryQueueSeat (GEÇERSİZ)

[customerLogic.ts](file:///c:/fka/server/customerLogic.ts#L118-L130) satır 118-130:

```typescript
if (gs.lives <= 0) {
  gs.isGameOver = true;
  gs.dayPhase = 'night';      // ← guard 1: tryQueueSeat dayPhase !== 'day' kontrolü
  gs.customers = []; gs.waitList = []; // ← guard 2: waitList boş
  break;                       // ← _needsQueueSeat satırına asla ulaşılmaz
}
// ...
gs._needsQueueSeat = true; // break sonrası buraya gelinmez
```

> [!NOTE]
> 3 katmanlı koruma mevcut: `break` önce çıkıyor, `dayPhase = 'night'` guard'ı var, `waitList` boşaltılıyor. Bu hata **yanlış raporlanmış**.

---

#### ⚠️ H4 — Lucky Triple Score (KISMEN GEÇERLİ)

[serviceHandler.ts](file:///c:/fka/server/handlers/serviceHandler.ts#L128-L139):

- **Triple skor iddiası → GEÇERSİZ:** `jackpot` emit'i sadece UI efekti, skora eklemiyor.
- **Drunk tip = 0 iddiası → GEÇERLİ:**

```typescript
if (isDrunk) tip = Math.round(tip * Math.random() * 3);
// Math.random() < 0.167 olduğunda → Math.round(sonuç) = 0 → tip = $0
```

---

#### ✅ H6 — Fryer/CakeBaker cookDone Eksik (GEÇERLİ)

[stationLogic.ts](file:///c:/fka/server/stationLogic.ts#L87-L116):

```typescript
// updateFryers — pişirme bitince emit YOK
if (f.timer <= 0) {
  f.output = '🍟'; f.input = null; f.burnTimer = FRYER_BURN_TICKS;
  // ❌ io.to(rid).emit('cookDone', ...) eksik
}

// updateCakeBakers — pişirme bitince emit YOK
if (c.timer <= 0) {
  c.output = '🍰'; c.input = null; c.burnTimer = CAKE_BURN_TICKS;
  // ❌ io.to(rid).emit('cookDone', ...) eksik
}
```

> [!IMPORTANT]
> `updateCookStations` (fırınlar) `cookDone` emit ediyor ama `updateFryers` ve `updateCakeBakers` etmiyor. Fonksiyon imzaları `io` ve `rid` parametresi almıyor.

---

#### ✅ H7 — chop_pressure Kartı Etkisiz (GEÇERLİ)

[cardLogic.ts](file:///c:/fka/server/cardLogic.ts#L28-L30):

```typescript
cookMult:        has('chop_pressure') ? 1.0 : 1.0,  // ← Aynı değer, etkisiz
chopMult:        has('chop_pressure') ? 1.25 : 1.0,  // ← Doğrama yavaşlıyor ✅
choppedCookMult: has('chop_pressure') ? 0.60 : 1.0,  // ← Tanımlı ama...
```

`choppedCookMult` tüm projede **sadece tanımlanmış**, hiçbir yerde **kullanılmıyor**. Kart açıklamasındaki "fırın %40 hızlı" ödülü çalışmıyor.

---

#### ✅ H8 — DirtyTray Yanlış Pozisyon (GEÇERLİ)

[itemHandler.ts](file:///c:/fka/server/handlers/itemHandler.ts#L45):

```typescript
const dirtyTrayPos = gs.stationLayout['dirty_tray'] ?? { x: 1050, y: 90 }; // ❌ Hardcoded
```

[gameData.ts](file:///c:/fka/shared/gameData.ts#L81):

```typescript
export const DIRTY_TRAY_POS = { x: 860, y: 90 }; // ✅ Doğru konum
```

**190px fark** — etkileşim yanlış noktada çalışıyor.

---

## 🔍 Ek Bug Tespitleri (Raporda Olmayanlar)

| # | Hata | Şiddet | Dosya | Açıklama |
|---|------|--------|-------|----------|
| E1 | Input validation eksik | 🔴 Kritik | [socketHandlers.ts](file:///c:/fka/server/socketHandlers.ts#L121-L124) | `move` event'i `pos.x/y` için bounds kontrolü yok. Client sahte koordinat gönderebilir. |
| E2 | `choppedCookMult` kullanılmıyor | 🟡 Orta | [stationLogic.ts](file:///c:/fka/server/stationLogic.ts#L17) | `cookMult` kullanılıyor ama doğranmış malzeme için `choppedCookMult` hiç uygulanmıyor. |
| E3 | `TABLE_POSITIONS` sınır dışı erişim | 🟡 Orta | [socketHandlers.ts](file:///c:/fka/server/socketHandlers.ts#L188) | `buyTable` → `TABLE_POSITIONS[currentCount]` — array bounds kontrolü yok. |
| E4 | `faceShape` modulo hatası | 🟢 Küçük | [socketHandlers.ts](file:///c:/fka/server/socketHandlers.ts#L112) | `Math.floor(data.faceShape) % 3` — `NaN` girişinde NaN kalır. |
| E5 | Room retrieval tekrarı | 🟢 Kod | [socketHandlers.ts](file:///c:/fka/server/socketHandlers.ts) | `if (!roomId \|\| !RoomManager.getRoomState(roomId)) return;` 15+ kez tekrar ediyor. |
| E6 | Full state 10Hz broadcast | 🟢 Perf | [gameLoop.ts](file:///c:/fka/server/gameLoop.ts) | Her 3 tick'te tüm `GameState` JSON olarak gönderiliyor. Delta update yok. |

---

## 📊 Kod Kalitesi Değerlendirmesi

### Genel Puan: **7.5 / 10**

| Kategori | Puan | Açıklama |
|----------|:----:|----------|
| **Mimari & Organizasyon** | 8.0 | Shared tipler, modüler handler'lar, temiz ayrım. `socketHandlers.ts` biraz şişkin. |
| **Code Smells** | 6.5 | Magic number'lar (5400, 1800, 0.25), tekrarlı room lookup, eksik input validation. |
| **TypeScript Kullanımı** | 8.0 | Güçlü tip tanımları, `as any` kullanımı minimal ama var. |
| **State Management** | 8.5 | Server-authoritative, Canvas ref ile React ayrımı mükemmel, visibility re-sync var. |
| **Performans** | 7.5 | Canvas rendering hızlı. Full state serialization ve O(N²) müşteri ayrımı potansiyel sorun. |

### Öne Çıkan Güçlü Yönler
- ✅ `shared/` klasörü ile client-server tip senkronizasyonu
- ✅ Canvas rendering React'tan ayrılmış (ref-based, 60 FPS)
- ✅ Visibility API ile mobil/tab geçişlerinde otomatik re-sync
- ✅ Modüler handler mimarisi (`handlers/`, `stationLogic`, `spawnLogic`)

### İyileştirme Alanları
- ⚠️ `socketHandlers.ts` (349 satır) → shop, combat, voice ayrı modüllere çıkarılmalı
- ⚠️ Magic number'lar sabit/const olmalı (`5400`, `1800`, `0.25`, `0.08` vb.)
- ⚠️ Socket input validation tamamen eksik (hareket, kozmetik, punch)
- ⚠️ Delta state update ile network yükü azaltılabilir

---

## 🎮 Oyun Tasarımı & Eğlence Analizi

### Eğlence Puanı: **8.5 / 10**

### Çekirdek Döngü (Core Loop) — ⭐⭐⭐⭐⭐
Pişir → Servis Et → Para Kazan → Bulaşık Yıka → Tekrarla

- **Tabak darboğazı** mekaniği harika — sadece yemek pişirmek yetmiyor, kirli tabakları yıkayıp stok yenilemezsen servis durur
- **Doğrama → Pişirme → Tabak alma → Servis** zinciri co-op'ta doğal iş bölümü yaratıyor
- **Müşteri dövme + intikam çetesi** sistemi harika bir mizah katmanı ekliyor

### İçerik Derinliği

| Kategori | Miktar | Detay |
|----------|:------:|-------|
| Yemekler | 7 | 🍕 🍔 🥗 🍜 🌯 🍟 🍰 |
| Müşteri Tipleri | 8 | Kibar, Kaba, Recep, Maganda, VIP, Sarhoş, Müfettiş, Şanslı |
| İstasyonlar | 9+ | Fırın, Fritöz, Pasta Fırını, Kesme Tahtası, Lavabo, Servis Penceresi... |
| Roguelite Kartlar | 15 | Risk/Ödül dengeli (Sabırsız Kalabalık, Kaos Günü, Kör Sabır...) |
| Kozmetikler | Çok | Şapka, saç, kıyafet, unvan, etiket, servis efekti |

### Zorluk Eğrisi — ⭐⭐⭐⭐
- Gün ilerledikçe sabır azalıyor, spawn hızlanıyor
- Gün 3+ sarhoş, gün 5+ VIP, gün 7+ müfettiş (**ama inspector şu an spawn olmuyor — H1**)
- Grup müşteriler (4'e kadar) kaos yaratıyor

### Çok Oyunculu — ⭐⭐⭐⭐⭐
- Gerçek zamanlı co-op + dahili sesli sohbet
- Mobil + masaüstü desteği
- Oyuncu sayısına göre dinamik zorluk ölçekleme

### Eksik Özellikler (Oyunu 9.5/10'a Çıkaracak)

1. **🔴 Çok aşamalı yemek sistemi** — Şu an tüm yemekler tek adım. Et + Ekmek + Sebze = Burger gibi birleştirme co-op iş bölümünü 2x artırır
2. **🟡 Harita çeşitliliği** — Tek harita (`classic`). L-şekli, U-şekli, dar-uzun haritalar replayability ekler
3. **🟡 Zemin kirliliği sistemi** — Yerlerin kirlenmesi, paspas alma, yavaşlama mekaniği
4. **🟡 Mahalle itibarı** — 1-5 yıldız sistemi ile müşteri kalitesi belirleme
5. **🟢 Ses efektleri** — Müşteri geliş sesleri, kombo sesleri, diyalog sesleri

---

## 🎯 Öncelikli Aksiyon Planı

### Hemen Düzelt (Gameplay Bozuyor)
1. **H1** — Inspector spawn sırasını düzelt (inspector → vip → drunk)
2. **H2** — `endDayBonus`'u `dayEnd` emit'inden önce ekle
3. **H4** — Drunk tip minimum 1 olmalı: `Math.max(1, ...)`

### Kısa Vadede Düzelt
4. **H6** — Fryer/CakeBaker'a `cookDone` emit ekle
5. **H7** — `choppedCookMult`'u `updateCookStations`'da uygula
6. **H8** — DirtyTray fallback'ini `DIRTY_TRAY_POS` sabitine bağla
7. **H10** — DayEndModal'da günlük kazancı hesapla (score - önceki gün skoru)

### İyileştirme
8. **H11** — `globalVolume`'u dependency array'e ekle
9. **E1** — Socket input validation ekle
10. **E3** — `TABLE_POSITIONS` bounds kontrolü ekle
