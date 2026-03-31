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
- Canvas `aspect-ratio: 1280/870`, body bg `#9a7858`

### TASK 4: Tabak Yığını Taşıma
- `plate_stack` stationLayout'a eklendi, prep fazında taşınabilir

### TASK 5: Müşteriler Kapıdan Giriyor/Çıkıyor
- `phase: 'entering' | 'seating' | 'seated'` eklendi
- Smooth hareket (3px/tick), kapıdan giriş/çıkış

### TASK 6-12: Oyun Döngüsü, HUD, Lavabo, Işıklandırma, Grup Müşteri
- `patLimit`, `spawnTick`, `revengeQueue` playerCount'a göre ölçekleniyor
- HUD editörü, ışıklandırma sistemi, grup müşteri sistemi

### TASK 13: Kart Sistemi
- 15+ kart, gün 2/5/8/11... tetiklenme
- `CardSelectModal`, aktif kart ikonları üst barda
- Tüm kart efektleri server'da uygulanıyor

### TASK 14: Combo Sistemi
- 3+ = 1.5x, 5+ = 2x, 8+ = 3x bahşiş
- 180 tick timeout, üst barda 🔥 göstergesi

### TASK 15: Sipariş Özelleştirme
- 🌶️ Acı (1.8x), ➕ Bol (1.5x), ⚡ Acele (2x bahşiş)
- Sipariş balonunda ikon gösterimi

### TASK 16: Kesme Tahtası Sistemi
- `CHOP_TICKS=60`, `CHOPPED_` prefix
- PC: R basılı tut, Mobil: 🔪 butonu
- Progress bar, bıçak animasyonu

### TASK 17: Baharat Rafı (Acı Yemek Sistemi)
- Pişmiş yemek → Baharat Rafı → Acı yemek (🍔🌶️ vb.)
- Yanlış acılık = can kaybı, doğru = 1.8x bahşiş
- Gün 3'ten sonra görünür
- Layout editöründe taşınabilir

### TASK 18: Etkileşim Sistemi İyileştirme
- Etkileşim halkası geri açıldı, tüm istasyonları kapsıyor
- Unlock olmamış istasyonlarda halka görünmüyor
- `interactUtils.ts` server `INTERACTION_CHAIN` ile birebir eşleşiyor

### TASK 19: Oyun Dengesi & Bug Düzeltmeleri
- İçecek stok sistemi kaldırıldı (sınırsız)
- `fridgeCapacity` upgrade kaldırıldı
- Upgrade shop'ta unlock olmamış yemek upgrade'leri gizleniyor
- Gece otomatik geçiş kaldırıldı
- `resetDay`'de combo sıfırlanıyor
- `nextDay` duplicate kod temizlendi

### TASK 20: Deployment & Performans
- Render keep-alive (10 dakikada bir ping)
- BGM URL encoding düzeltildi
- Ping eşikleri Render için güncellendi (150/300ms)
- Başarı sesi kısaltıldı

### TASK 21: Kod Kalitesi (code-quality.md)
- 9 kullanılmayan import kaldırıldı
- `DEFAULT_UI/STATE.upgrades` düzeltildi
- `getDynPos` helper eklendi
- `stock` alanı GameState'ten kaldırıldı
- `playerDataRef` tipi `any`'den `PlayerJoinData`'ya çevrildi
- Console.log'lar production'da gizlendi

---

## Mimari

```
server.ts                 — Socket.io, oda yönetimi, upgrade/shop eventleri
server/gameLoop.ts        — gameTick, spawnTick, customerTick, tryQueueSeat
server/interactHandler.ts — E tuşu etkileşimleri (INTERACTION_CHAIN)
server/layoutHandler.ts   — İstasyon/masa taşıma eventleri
shared/types.ts           — Ortak tipler ve sabitler (tek kaynak)
src/hooks/useGameLoop.ts  — Client render döngüsü + ışıklandırma
src/renderer/             — Canvas çizim fonksiyonları (20+ dosya)
src/components/           — React UI bileşenleri
src/utils/interactUtils.ts — Etkileşim halkası proximity hesabı
```

## Sabitler

| Sabit | Değer | Açıklama |
|-------|-------|----------|
| `GAME_WIDTH` | 1280 | Canvas genişliği |
| `GAME_HEIGHT` | 870 | Canvas yüksekliği |
| `EXTERIOR_Y` | 720 | Dış alan başlangıcı |
| `WALL_Y1` | 340 | Mutfak-salon sınırı üst |
| `WALL_Y2` | 380 | Mutfak-salon sınırı alt |
| `DAY_TICKS` | 2700 | Gündüz süresi |
| `NIGHT_TICKS` | 900 | Gece süresi |
| `CLOSING_THRESHOLD` | 600 | Kapanış eşiği |
| `CHOP_TICKS` | 60 | Doğrama süresi |
| `WASH_TICKS` | 60 | Yıkama süresi |
| `BURN_TICKS` | 300 | Yanma süresi |
| `EAT_TICKS` | 240 | Yeme süresi |
