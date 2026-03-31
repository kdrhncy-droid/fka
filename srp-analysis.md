# Single Responsibility Principle — Dosya Analizi

## Özet Puan: 5.5/10

Renderer katmanı mükemmel, ama server ve büyük component'ler ciddi SRP ihlali içeriyor.

---

## 🔴 KRİTİK — Acil Bölünmeli

### `server.ts` — 845 satır
**Şu an yapıyor:**
- Socket.io server init
- Oda oluşturma / katılma / ayrılma
- Oyuncu join/leave yönetimi
- Upgrade satın alma
- Shop event'leri
- Tüm handler'ları kaydetme
- Keep-alive ping

**Olması gereken:**
```
server.ts              (~100 satır) — sadece init + port
server/roomManager.ts  (~200 satır) — oda CRUD, oyuncu join/leave
server/shopHandler.ts  (~150 satır) — upgrade, buyOven, buyLife, order
```

---

### `shared/types.ts` — 658 satır
**Şu an yapıyor:**
- Interface tanımları (Player, Customer, GameState vb.)
- Oyun sabitleri (GAME_WIDTH, DAY_TICKS, BURN_TICKS vb.)
- Factory fonksiyonlar (mkGameState, mkCook)
- Oyun mantığı (getComboMultiplier, getSeatSlots, isInDoor)
- Tüm kart tanımları (ALL_CARDS)
- Tüm malzeme tanımları (INGREDIENTS, RECIPE_DEFS)

**Olması gereken:**
```
shared/types.ts        (~200 satır) — sadece interface'ler ve type'lar
shared/constants.ts    (~150 satır) — sabitler (GAME_WIDTH, TICKS vb.)
shared/gameLogic.ts    (~100 satır) — pure fonksiyonlar (getComboMultiplier vb.)
shared/gameData.ts     (~150 satır) — INGREDIENTS, RECIPE_DEFS, ALL_CARDS
shared/mapState.ts     (~100 satır) — mkGameState, mkCook
```

---

### `src/components/GameScreen.tsx` — 648 satır
**Şu an yapıyor:**
- Canvas + oyun döngüsü bağlantısı
- Tüm modal state yönetimi (6+ modal)
- HUD butonları (joystick, döv, al/ver, doğra, müzik)
- Voice chat yönetimi
- WakeLock
- Stat kaydetme
- Gece ekranı (yemek seçimi, upgrade shop, kart seçimi)
- Game over overlay
- Üst bar (skor, combo, kart ikonları)

**Olması gereken:**
```
GameScreen.tsx         (~150 satır) — sadece layout + hook bağlantıları
GameHUD.tsx            (~150 satır) — üst bar + HUD butonları
GameNightScreen.tsx    (~120 satır) — gece ekranı (yemek/kart/upgrade)
GameOverlay.tsx        (~80 satır)  — game over overlay
hooks/useGameModals.ts (~80 satır)  — modal state yönetimi
```

---

### `server/gameLoop.ts` — 613 satır
**Şu an yapıyor:**
- Ana tick döngüsü (gameTick)
- Müşteri spawn mantığı (spawnTick)
- Müşteri hareket/oturma (customerTick)
- Combo timeout
- Kart efektleri uygulama
- Gün/gece geçişi
- Bekleme listesi yönetimi
- Kaos kartı (istasyon pozisyon değiştirme)

**Olması gereken:**
```
server/gameLoop.ts      (~150 satır) — sadece tick orchestration
server/customerSpawn.ts (~150 satır) — spawn, queue, seating
server/dayNight.ts      (~100 satır) — gün/gece geçişi, reset
server/cardEffects.ts   (~150 satır) — kart efektleri
```

---

### `server/interactHandler.ts` — 601 satır
**Şu an yapıyor:**
- 15 farklı istasyon için ayrı handler
- Combo sistemi
- Servis mantığı
- Acı yemek kontrolü

**Olması gereken:**
```
server/interactHandler.ts        (~100 satır) — INTERACTION_CHAIN + kayıt
server/handlers/kitchenHandler.ts (~150 satır) — fırın, fritöz, pasta, kahve
server/handlers/serviceHandler.ts (~100 satır) — müşteri servisi, servis penceresi
server/handlers/itemHandler.ts    (~100 satır) — malzeme, tabak, tepsi, çöp
server/handlers/sinkHandler.ts    (~80 satır)  — lavabo, kesme tahtası
```

---

## 🟡 ORTA — Bölünebilir

### `src/components/WelcomeScreen.tsx` — 396 satır
**Sorun:** Ana menü + karakter seçimi + oda kurma + katılma + tutorial hepsi bir arada.

**Öneri:**
```
WelcomeScreen.tsx      (~100 satır) — ekran router
MainMenu.tsx           (~80 satır)  — ana butonlar
MultiplayerMenu.tsx    (~100 satır) — oda kur/katıl
CharacterSetup.tsx     (~120 satır) — karakter özelleştirme (zaten ayrı component var)
```

---

### `src/renderer/drawFloor.ts` — 521 satır
**Sorun:** Zemin + duvarlar + kapılar + dış alan + tüm statik dekorasyon tek dosyada.

**Öneri:**
```
drawFloor.ts           (~100 satır) — zemin karoları
drawWalls.ts           (~100 satır) — duvarlar + kapılar
drawExterior.ts        (~150 satır) — dış alan, kaldırım, ağaçlar
drawDecoration.ts      (~100 satır) — statik dekorasyon
```

---

### `src/hooks/useSocket.ts` — 271 satır
**Sorun:** Bağlantı yönetimi + state sync + ses event'leri + chat + ping hepsi bir arada.

**Öneri:**
```
useSocket.ts           (~100 satır) — sadece bağlantı + temel event'ler
useSocketChat.ts       (~60 satır)  — chat mesajları
useSocketAudio.ts      (~60 satır)  — ses event'leri
```

---

### `src/renderer/drawCookStation.ts` — 293 satır
**Sorun:** Fırın çizimi + animasyon + progress bar + alev efekti + yanma efekti hepsi bir arada. Ama renderer dosyası olduğu için kabul edilebilir sınırda.

---

## ✅ İYİ — Tek Sorumluluk

Bunlar SRP'ye uygun, dokunmaya gerek yok:

| Dosya | Satır | Sorumluluk |
|-------|-------|------------|
| `drawPlayer.ts` | 200 | Sadece oyuncu çizimi |
| `drawCustomer.ts` | 232 | Sadece müşteri çizimi |
| `drawTable.ts` | 226 | Sadece masa çizimi |
| `drawInteractionRing.ts` | 35 | Sadece etkileşim halkası |
| `drawLighting.ts` | 64 | Sadece ışıklandırma |
| `usePlayerMovement.ts` | 87 | Sadece oyuncu hareketi |
| `useProximityAudio.ts` | 23 | Sadece yakınlık sesi |
| `useGameEffects.ts` | 173 | Sadece efektler |
| `interactUtils.ts` | 183 | Sadece etkileşim hesabı |
| `audio.ts` | 117 | Sadece ses yönetimi |
| `bgm.ts` | 76 | Sadece BGM |
| `color.ts` | 7 | Sadece renk yardımcıları |

---

## 📊 Dosya Boyutu Dağılımı

```
> 500 satır  🔴  server.ts, shared/types.ts, GameScreen.tsx, gameLoop.ts, interactHandler.ts, drawFloor.ts
200-500 satır 🟡  WelcomeScreen, useSocket, drawCookStation, LoadingScreen, useLayoutEditor
< 200 satır  ✅  Renderer dosyalarının çoğu, utility hook'lar
```

---

## 🎯 Uygulama Önceliği

### Sprint 1 — En Yüksek Etki
1. `shared/types.ts` → 5 dosyaya böl (tüm proje etkiler, en kritik)
2. `server/interactHandler.ts` → handler klasörüne böl (yeni istasyon eklemek kolaylaşır)

### Sprint 2 — Orta Etki
3. `server/gameLoop.ts` → 4 dosyaya böl
4. `GameScreen.tsx` → 5 parçaya böl

### Sprint 3 — Düşük Etki
5. `server.ts` → roomManager + shopHandler
6. `WelcomeScreen.tsx` → menü bileşenlerine böl
7. `drawFloor.ts` → çizim katmanlarına böl

---

## ⚠️ Dikkat

Bölme işlemi sırasında:
- `shared/types.ts` bölünürse **tüm import'lar güncellenmeli** (15+ dosya etkilenir)
- `server/interactHandler.ts` bölünürse `INTERACTION_CHAIN` sırası korunmalı
- `GameScreen.tsx` bölünürse prop drilling artabilir → Context API düşünülmeli
