# Oyun Geliştirme İlerleme Notları

## Tamamlanan Görevler

### TASK 1: Kod Şişkinliği Azaltma
- `server.ts` 783→320 satıra düşürüldü
- Renderer fonksiyonları ayrı dosyalara taşındı

### TASK 2: Station + Table Layout Editor
- Prep fazında E/AL-VER ile istasyon ve masa taşıma sistemi
- Grid snap, multiplayer senkronizasyon, kilit sistemi

### TASK 3: Görsel Yenileme — Dış Alan + Duvarlar
- `GAME_HEIGHT=870`, `EXTERIOR_Y=720`, tek kapı `[580,700]`
- `drawExterior()`: tuğla ön duvar, taş döşeme, yaya yolu, ağaçlar, sokak lambaları
- Sol/sağ/üst tuğla duvar şeritleri
- Canvas `max-w-[80vw]`, `aspect-ratio: 1280/870`, body bg `#9a7858`

### TASK 4: Tabak Yığını Taşıma
- `plate_stack` stationLayout'a eklendi, prep fazında taşınabilir

### TASK 5: Müşteriler Kapıdan Giriyor/Çıkıyor
- `phase: 'entering' | 'seating' | 'seated'` eklendi
- Müşteriler x ve y ekseninde smooth hareket ediyor (3px/tick)
- Çıkarken kapıya yürüyüp dışarı çıkıyor

### TASK 6: Oyun Döngüsü Hata Düzeltmeleri
- `patLimit(lv, day, playerCount)` — gün + oyuncu sayısına göre sabır
- `CLOSING_THRESHOLD` shared/types.ts'den geliyor (450)
- `DOOR_X`/`DOOR_ENTRY_Y` modül seviyesinde sabit

### TASK 7: Buton Konumlandırma — Canvas Dışına Taşıma
- Joystick ve AL/VER butonu canvas dışında, HUD editörüyle uyumlu

### TASK 8: PUBG Mobil Tarzı HUD Editörü
- `HudLayout` interface, `HudEditor.tsx` bileşeni
- SettingsPanel'e buton eklendi
- HudEditor açıkken joystick/butonlar gizleniyor

### TASK 9: Çöp Kovası + Lavabo Render
- Çöp kovası: gerçekçi trapez kova şekli, kapak, tutacak
- Lavabo: metalik/endüstriyel görünüm, musluk detayı
- Her ikisi de `stationLayout`'tan dinamik pozisyon alıyor
- Çift render bug'ı düzeltildi (drawFloor statik + useGameLoop dinamik çakışması)

### TASK 10: Taşıma Modu Banner'ı Üst Bara Taşıma
- Taşıma modu göstergesi canvas üstündeki bar'a alındı

### TASK 11: Solo vs Multiplayer Zorluk Skalası
- Solo: daha yavaş spawn, daha sabırlı müşteriler, daha az kuyruk
- Multi: daha hızlı spawn, daha az sabır, daha fazla kuyruk
- `patLimit`, `spawnTick`, `revengeQueue` hepsi playerCount'a göre ölçekleniyor

### TASK 12: Genel Bug Düzeltmeleri (fixes.md)
- `stockMax` → `plateStackMax` düzeltildi
- Game over'da `dirtyTables` temizleniyor
- `menuChoices` varken "Yeni Güne Başla" disabled
- `CLOSING_THRESHOLD` client'ta re-export edildi
- Müşteri `phase='seated'` güncelleniyor
- `drawGrassPatch` dead code silindi
- HudEditor açıkken HUD elemanları gizleniyor

### TASK 13: Grup Müşteri Gelme Sistemi
- `groupChance = min(0.15 + day*0.04, 0.45)`
- Solo: 2-3 kişi, multi: 2-4 kişi
- Kuyruk limitine göre kırpılıyor

### TASK 14: Işıklandırma Sistemi
- Prep: hafif sıcak sarı tonu
- Gündüz: temiz, overlay yok
- Gün sonu (son %25): turuncu/akşam tonu smooth geçiş
- Gece: koyu mavi overlay, yıldızlar, ay ikonu
- Sabah geçişi: gece tonu yavaşça açılıyor

### TASK 15: Dev Araçları Kaldırıldı
- `dev:makeNight`, `dev:toggleImmortality` event handler'ları silindi
- `isImmortal` alanı GameState'ten kaldırıldı
- `useDevMode.ts` dosyası silindi
- Logo gizli tıklama aktivasyonu kaldırıldı

### TASK 16: Ana Menü + CharacterSelect Yeniden Tasarım
- Sade koyu tema (`#0f0e0c`)
- Gereksiz bilgi kartları, grid arka plan, kontrol ipuçları kaldırıldı
- CharacterSelect: emoji tabanlı karakter kartları, minimal form

### TASK 19: Kesme Tahtası Sistemi ✅
- `shared/types.ts`: `ChoppingBoard` interface, `CHOP_PREFIX`, `CHOP_TICKS=60`, `CHOPPABLE`, `CHOPPING_BOARD_POS`
- `RECIPE_DEFS`'e `CHOPPED_🥩`, `CHOPPED_🥬`, `CHOPPED_🍢` eklendi — doğranmış malzeme daha hızlı pişer
- `GameState`'e `choppingBoards: ChoppingBoard[]` eklendi, `mkGameState()`'e başlangıç tahtası
- `server/gameLoop.ts`: kesme tahtası tick — `isChopping` true ise `progress++`, tamamlanınca `CHOPPED_` prefix
- `server/interactHandler.ts`: tahtaya malzeme bırak/al, doğranmış malzemeyi al
- `server.ts`: `chop_start` ve `chop_stop` socket event'leri
- `src/renderer/drawChoppingBoard.ts`: ahşap tahta görseli, PlateUp tarzı progress bar, bıçak animasyonu
- `src/hooks/useGameLoop.ts`: `drawChoppingBoard` çağrısı eklendi
- `src/types/game.ts`: tüm kesme tahtası sembolleri re-export edildi
- PC: `R` tuşu basılı tut = doğra, mobil: 🔪 DOĞRA butonu

---

## Bekleyen Görevler

### Floorplan Seçim Sistemi
- Run başında 4 farklı restoran şekli seçimi (Klasik, L, U, Dar)
- Detay: backlog.md

---

## Mimari

```
server.ts                 — Socket.io, oda yönetimi, upgrade/shop eventleri
server/gameLoop.ts        — gameTick, spawnTick, customerTick, tryQueueSeat
server/interactHandler.ts — E tuşu etkileşimleri
server/layoutHandler.ts   — İstasyon/masa taşıma eventleri
shared/types.ts           — Ortak tipler ve sabitler (tek kaynak)
src/hooks/useGameLoop.ts  — Client render döngüsü + ışıklandırma
src/renderer/             — Canvas çizim fonksiyonları
src/components/           — React UI bileşenleri
```

## Sabitler

| Sabit | Değer | Açıklama |
|-------|-------|----------|
| `GAME_WIDTH` | 1280 | Canvas genişliği |
| `GAME_HEIGHT` | 870 | Canvas yüksekliği |
| `EXTERIOR_Y` | 720 | Dış alan başlangıcı |
| `WALL_Y1` | 225 | Mutfak-salon sınırı üst |
| `WALL_Y2` | 265 | Mutfak-salon sınırı alt |
| `DAY_TICKS` | 3000 | Gündüz süresi |
| `NIGHT_TICKS` | 600 | Gece süresi |
| `CLOSING_THRESHOLD` | 450 | Kapanış eşiği |
