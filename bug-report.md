# 🐛 Oyun İçi Hata Raporu

> Tarih: 2026-08-03  
> Branch: main (1063e10)  
> Toplam: 11 hata — 4 Kritik · 4 Orta · 3 Küçük

---

## 🔴 Kritik — Döngüyü Bozar

### H1 — Inspector asla spawn olmaz
**Dosya:** `server/spawnLogic.ts` ~satır 70  
**Neden:** `roll < 0.25` (drunk) koşulu inspector'ın `roll < 0.08` koşulunu kapsıyor, else-if zinciri hiç oraya ulaşmıyor.  
**Sonuç:** Inspector müşteri oyunda hiç görünmez.

```typescript
// HATALI
else if (gs.day >= 3 && roll < 0.25) pers = 'drunk';
else if (gs.day >= 7 && roll < 0.08) pers = 'inspector'; // ASLA ÇALIŞMAZ

// DÜZELTME — inspector önce gelmeli
else if (gs.day >= 7 && roll < 0.08) pers = 'inspector';
else if (gs.day >= 3 && roll < 0.25) pers = 'drunk';
```

---

### H2 — `endDayBonus` yanlış sırada ekleniyor
**Dosya:** `server/gameLoop.ts` ~satır 82  
**Neden:** `dayEnd` event'i emit edildikten **sonra** kart bonusu score'a ekleniyor.  
**Sonuç:** Client gün sonu ekranında kart bonusu eksik skoru görüyor.

```typescript
// HATALI
io.to(rid).emit("dayEnd", { score: gs.score }); // bonus yok
if (cm.endDayBonus > 0) gs.score += cm.endDayBonus; // sonra ekleniyor

// DÜZELTME
if (cm.endDayBonus > 0) gs.score += cm.endDayBonus;
io.to(rid).emit("dayEnd", { score: gs.score });
```

---

### H3 — Game over sonrası `tryQueueSeat` çağrılıyor
**Dosya:** `server/customerLogic.ts` ~satır 95  
**Neden:** `break` iç for döngüsünden çıkıyor ama `gs._needsQueueSeat = true` döngü dışında.  
**Sonuç:** Game over ekranında müşteriler sahneye girmeye devam ediyor.

```typescript
// DÜZELTME
if (gs.lives <= 0) {
  gs.isGameOver = true;
  // ...
  gs._needsQueueSeat = false; // ekle
  break;
}
```

---

### H4 — Lucky müşteri üçlü para: tipCollected + jackpot + comboServe
**Dosya:** `server/handlers/serviceHandler.ts` ~satır 88-100  
**Neden:** `tip * 4` yapıldıktan sonra hem `jackpot` hem `applyCombo` emit ediliyor, her ikisi score'a ekleme yapıyor.  
**Ek sorun:** drunk için `tip * Math.random() * 3` — `Math.random() = 0` olunca tip = 0.

```typescript
// DÜZELTME
if (isDrunk) tip = Math.max(1, Math.round(tip * (0.5 + Math.random() * 2.5)));
// lucky jackpot sadece display — applyCombo çağrılmamalı
```

---

## 🟡 Orta — Görünür Gameplay Hatası

### H5 — Kahve makinesi sonsuz kahve veriyor
**Dosya:** `server/handlers/kitchenHandler.ts` ~satır 60  
**Neden:** `cm.cups` azaltılmıyor; kapasite kontrolü yok.  
**Sonuç:** Kahve makinesi hiç tükenmez, upgrade'in anlamı kalmaz.

```typescript
// DÜZELTME
if (!p.holding && cm.cups > 0) {
  cm.cups--;
  p.holding = COFFEE_ITEM; snd('pickup');
}
```

---

### H6 — Fryer ve CakeBaker `cookDone` event'i göndermiyor
**Dosya:** `server/stationLogic.ts` ~satır 57 ve ~satır 69  
**Neden:** `updateFryers` ve `updateCakeBakers` pişirme bitince `io.emit('cookDone')` çağırmıyor.  
**Sonuç:** Patates kızartması ve pasta hazır olduğunda sparkle efekti çıkmıyor.  
> `updateFryers` ve `updateCakeBakers` fonksiyon imzaları `io` ve `rid` parametresi alacak şekilde güncellenmeli.

---

### H7 — `chop_pressure` kartı "hızlı pişirme" ödülü uygulanmıyor
**Dosya:** `server/stationLogic.ts` + `server/cardLogic.ts`  
**Neden:** `chop_pressure` kartının doğranmış malzeme için `cookMult` bonusu tanımlanmamış.  
**Sonuç:** Kart seçilebiliyor ama oyunda hiçbir etkisi yok.

---

### H8 — `handleDirtyTrayBasket` hardcoded yanlış pozisyon
**Dosya:** `server/handlers/itemHandler.ts` satır 38  
**Neden:** Fallback `x: 1050` ama `DIRTY_TRAY_POS` sabit değeri `x: 860`.  
**Sonuç:** İstasyon taşınmamışsa kirli tepsi etkileşimi 190px yanlış noktada çalışıyor.

```typescript
// HATALI
const dirtyTrayPos = gs.stationLayout['dirty_tray'] ?? { x: 1050, y: 90 };

// DÜZELTME
import { DIRTY_TRAY_POS } from '../../shared/types.js';
const dirtyTrayPos = gs.stationLayout['dirty_tray'] ?? DIRTY_TRAY_POS;
```

---

## 🟢 Küçük — Efekt / UI

### H9 — `sadLeave`, `loseHeart`, `urgentCustomer` animasyonu çok kısa
**Dosya:** `src/hooks/useGameEffects.ts`  
**Neden:** `maxLife` property eksik. İlk frame'de `life` 1 azalmış halde `maxLife = ft.life` set ediliyor.  
**Sonuç:** Bu üç efektin animasyonu erken başlıyor, fade-in/out yanlış hesaplanıyor.

```typescript
// DÜZELTME — maxLife ekle
floatingTexts.push({ x, y, text: '💔', life: 80, maxLife: 80, color: '#ef4444', size: 26 });
```

---

### H10 — `DayEndModal` "Günlük Ciro" toplam skoru gösteriyor
**Dosya:** `src/components/DayEndModal.tsx`  
**Neden:** `summary.score` biriken toplam skordur, günlük kazanç değil.  
**Sonuç:** Oyuncu günde $200 kazanmış olsa da ekranda $1500 (toplam) yazıyor.

---

### H11 — `useGameLoop` dependency array'inde `globalVolume` eksik
**Dosya:** `src/hooks/useGameLoop.ts` son satır  
**Neden:** `globalVolume` dependency array'ine eklenmemiş.  
**Sonuç:** Ses seviyesi değiştirildiğinde loop yeniden başlamıyor, proximity audio güncel sesi almıyor.

```typescript
// HATALI
}, [isJoined, myId, socket, showPerfStats]);

// DÜZELTME
}, [isJoined, myId, socket, showPerfStats, globalVolume]);
```

---

## Öncelik Sırası

| # | Hata | Öncelik | Dosya |
|---|------|---------|-------|
| H1 | Inspector spawn | 🔴 Kritik | `server/spawnLogic.ts` |
| H2 | endDayBonus sırası | 🔴 Kritik | `server/gameLoop.ts` |
| H3 | Game over tryQueueSeat | 🔴 Kritik | `server/customerLogic.ts` |
| H4 | Lucky triple score | 🔴 Kritik | `server/handlers/serviceHandler.ts` |
| H5 | Sonsuz kahve | 🟡 Orta | `server/handlers/kitchenHandler.ts` |
| H6 | cookDone eksik | 🟡 Orta | `server/stationLogic.ts` |
| H7 | chop_pressure etkisiz | 🟡 Orta | `server/cardLogic.ts` |
| H8 | DirtyTray yanlış pos | 🟡 Orta | `server/handlers/itemHandler.ts` |
| H9 | maxLife eksik | 🟢 Küçük | `src/hooks/useGameEffects.ts` |
| H10 | DayEndModal yanlış ciro | 🟢 Küçük | `src/components/DayEndModal.tsx` |
| H11 | globalVolume dep array | 🟢 Küçük | `src/hooks/useGameLoop.ts` |
