# Çok Aşamalı Yemek Sistemi — Tasarım Dokümanı

## 🎯 Genel Fikir

Şu anki sistem çok basit: **malzeme → fırın → yemek**. Combining sistemi ile **pişmiş yemek + malzeme = final yemek** yaparak oyunu stratejik derinliğe kavuşturuyoruz.

**Etki**: Co-op'ta gerçek iş bölümü doğuyor. Bir oyuncu temel malzemeleri pişirirken, diğeri combining yaparak final yemekleri hazırlıyor.

---

## 🏗️ Sistem Mimarisi

### Combining Station (🔄)
- **Konum**: (1160, 170) - sağ üst köşe, baharat rafının yanı
- **Görsel**: Metalik çalışma tezgahı + karıştırma kabı + spatula
- **Fonksiyon**: 2 malzemeyi birleştirip final yemek yapar

### Yemek Kategorileri
1. **Temel Yemekler** (mevcut): 🍕, 🍔, 🥗, 🍜, 🌯, 🍟, 🥤, 🍰, ☕
2. **Combining Yemekleri** (yeni): Temel + malzeme kombinasyonları
3. **Premium Yemekler** (gelecek): 3+ malzeme kombinasyonları

---

## 📋 Combining Tarifleri

### Faz 1: Temel Tarifler (4 adet)

| Final Yemek | Temel | + Malzeme | Süre | Bahşiş | Unlock |
|-------------|-------|-----------|------|--------|--------|
| 🍕🧀 Peynirli Pizza | 🍕 Pizza | 🧀 Peynir | 2s | +%30 | Gün 3 |
| 🍔🥬 Burger Menü | 🍔 Burger | 🥬 Salata (doğranmış) | 1.5s | +%25 | Gün 4 |
| 🍜🌶️ Acı Çorba | 🍜 Çorba | 🌶️ Biber | 1s | +%40 | Gün 5 |
| 🌯🍅 Özel Dürüm | 🌯 Dürüm | 🍅 Domates | 1.5s | +%35 | Gün 6 |

### Faz 2: Gelişmiş Tarifler (6 adet)

| Final Yemek | Temel | + Malzeme | Süre | Bahşiş | Unlock |
|-------------|-------|-----------|------|--------|--------|
| 🍰🍓 Meyveli Pasta | 🍰 Pasta | 🍓 Çilek | 2.5s | +%50 | Gün 8 |
| 🥗🥜 Protein Salata | 🥗 Salata | 🥜 Fındık | 1s | +%20 | Gün 9 |
| 🍟🧂 Tuzlu Patates | 🍟 Patates | 🧂 Tuz | 0.5s | +%15 | Gün 7 |
| ☕🥛 Sütlü Kahve | ☕ Kahve | 🥛 Süt | 1s | +%25 | Gün 10 |
| 🍔🍳 Yumurtalı Burger | 🍔 Burger | 🍳 Yumurta | 2s | +%45 | Gün 12 |
| 🍕🍄 Mantarlı Pizza | 🍕 Pizza | 🍄 Mantar | 2.5s | +%40 | Gün 11 |

### Faz 3: Premium Tarifler (4 adet - Gelecek)

| Final Yemek | Malzeme 1 | Malzeme 2 | Malzeme 3 | Süre | Bahşiş |
|-------------|-----------|-----------|-----------|------|--------|
| 🍕🧀🍄 Deluxe Pizza | 🍕 Pizza | 🧀 Peynir | 🍄 Mantar | 3s | +%60 |
| 🍔🥬🍳 Mega Burger | 🍔 Burger | 🥬 Salata | 🍳 Yumurta | 3.5s | +%65 |
| 🍜🌶️🥚 Özel Çorba | 🍜 Çorba | 🌶️ Biber | 🥚 Yumurta | 3s | +%55 |
| 🌯🍅🧀 Premium Dürüm | 🌯 Dürüm | 🍅 Domates | 🧀 Peynir | 4s | +%70 |

---

## 🧪 Yeni Malzemeler

### Combining İçin Gerekli Malzemeler

| Malzeme | Konum | Nasıl Alınır | Kullanım |
|---------|-------|--------------|----------|
| 🧀 Peynir | (990, 65) | Doğrudan al | Pizza, Dürüm |
| 🍓 Çilek | (1080, 65) | Doğrudan al | Pasta |
| 🍅 Domates | (1170, 65) | Doğrudan al | Dürüm |
| 🥜 Fındık | (360, 145) | Doğrudan al | Salata |
| 🧂 Tuz | (450, 145) | Doğrudan al | Patates |
| 🥛 Süt | Buzdolabından | Buzdolabı | Kahve |
| 🍳 Yumurta | (540, 145) | Doğrudan al | Burger |
| 🍄 Mantar | (630, 145) | Doğrudan al | Pizza |
| 🌶️ Biber | Baharat Rafından | Baharat Rafı | Çorba |

---

## ⚙️ Teknik Uygulama

### shared/types.ts Eklemeleri

```typescript
// ─── Combining Station ───────────────────────────────────────────────────────
export const COMBINING_STATION_POS = { x: 1160, y: 170 };
export const COMBINING_STATION_R = 90;
export const COMBINING_TICKS = 60; // 2 saniye combining süresi

export interface CombiningStation {
  id: string;
  x: number;
  y: number;
  input1: Item | null;     // İlk malzeme (temel yemek)
  input2: Item | null;     // İkinci malzeme
  timer: number;           // Combining süresi
  output: Item | null;     // Hazır final yemek
  isCombining: boolean;
  combiningPlayerId: string | null;
}

// Combining tarifleri
export const COMBINING_RECIPES: Record<string, {
  input1: string;    // Temel yemek
  input2: string;    // Ek malzeme
  output: string;    // Final yemek
  ticks: number;     // Combining süresi
  tipMultiplier: number; // Bahşiş çarpanı
  unlockDay: number; // Hangi günde unlock olur
}> = {
  'cheesy_pizza': {
    input1: '🍕',
    input2: '🧀',
    output: '🍕🧀',
    ticks: 60,
    tipMultiplier: 1.30,
    unlockDay: 3
  },
  'burger_combo': {
    input1: '🍔',
    input2: 'CHOPPED_🥬',
    output: '🍔🥬',
    ticks: 45,
    tipMultiplier: 1.25,
    unlockDay: 4
  },
  'spicy_soup': {
    input1: '🍜',
    input2: '🌶️',
    output: '🍜🌶️',
    ticks: 30,
    tipMultiplier: 1.40,
    unlockDay: 5
  },
  'special_wrap': {
    input1: '🌯',
    input2: '🍅',
    output: '🌯🍅',
    ticks: 45,
    tipMultiplier: 1.35,
    unlockDay: 6
  }
};

// Yeni malzemeler
export const COMBINING_INGREDIENTS = [
  { key: '🧀' as StockKey, pos: { x: 990, y: 65 }, label: 'Peynir', color: '#fef3c7' },
  { key: '🍓' as StockKey, pos: { x: 1080, y: 65 }, label: 'Çilek', color: '#fecaca' },
  { key: '🍅' as StockKey, pos: { x: 1170, y: 65 }, label: 'Domates', color: '#f87171' },
  { key: '🥜' as StockKey, pos: { x: 360, y: 145 }, label: 'Fındık', color: '#d4a017' },
  { key: '🧂' as StockKey, pos: { x: 450, y: 145 }, label: 'Tuz', color: '#f5f5f4' },
  { key: '🍳' as StockKey, pos: { x: 540, y: 145 }, label: 'Yumurta', color: '#fbbf24' },
  { key: '🍄' as StockKey, pos: { x: 630, y: 145 }, label: 'Mantar', color: '#a78bfa' },
];

// Final yemek görsel ikonları
export const COMBINING_DISPLAY: Record<string, string> = {
  '🍕🧀': '🍕🧀',
  '🍔🥬': '🍔🥬',
  '🍜🌶️': '🍜🌶️',
  '🌯🍅': '🌯🍅',
  '🍰🍓': '🍰🍓',
  '🥗🥜': '🥗🥜',
  '🍟🧂': '🍟🧂',
  '☕🥛': '☕🥛',
  '🍔🍳': '🍔🍳',
  '🍕🍄': '🍕🍄',
};
```

### GameState'e Ekleme

```typescript
export interface GameState {
  // ... mevcut alanlar
  combiningStations: CombiningStation[];
  unlockedCombiningRecipes: string[]; // Unlock edilmiş tarifler
}

export function mkGameState(rid: string, marketName: string): GameState {
  return {
    // ... mevcut alanlar
    combiningStations: [
      {
        id: 'combining_0',
        x: COMBINING_STATION_POS.x,
        y: COMBINING_STATION_POS.y,
        input1: null,
        input2: null,
        timer: 0,
        output: null,
        isCombining: false,
        combiningPlayerId: null,
      }
    ],
    unlockedCombiningRecipes: [], // Başlangıçta boş
  };
}
```

---

## 🎨 Görsel Tasarım

### Combining Station Render

```typescript
// src/renderer/drawCombiningStation.ts
export function drawCombiningStation(
  ctx: CanvasRenderingContext2D, 
  station: CombiningStation, 
  time: number
) {
  const { x, y, input1, input2, output, timer, isCombining } = station;
  const r = COMBINING_STATION_R;

  // Ana platform - metalik gri
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(x - r/2, y - r/2, r, r);
  
  // Kenar çerçevesi
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - r/2, y - r/2, r, r);

  // Karıştırma kabı (ortada)
  ctx.fillStyle = '#d1d5db';
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Input slotları
  // Slot 1 (sol)
  ctx.fillStyle = input1 ? '#10b981' : '#ef4444';
  ctx.fillRect(x - 35, y - 15, 20, 20);
  if (input1) {
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(input1, x - 25, y - 5);
  }

  // Slot 2 (sağ)
  ctx.fillStyle = input2 ? '#10b981' : '#ef4444';
  ctx.fillRect(x + 15, y - 15, 20, 20);
  if (input2) {
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(input2, x + 25, y - 5);
  }

  // Output slot (alt)
  if (output) {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 10, y + 20, 20, 20);
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(output, x, y + 35);
  }

  // Progress bar (combining sırasında)
  if (isCombining && timer > 0) {
    const progress = 1 - (timer / COMBINING_TICKS);
    const barW = 60;
    const barH = 6;
    const barX = x - barW/2;
    const barY = y + 45;

    // Arka plan
    ctx.fillStyle = '#374151';
    ctx.fillRect(barX, barY, barW, barH);
    
    // Progress
    ctx.fillStyle = '#10b981';
    ctx.fillRect(barX, barY, barW * progress, barH);
    
    // Kenar
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  // Spatula animasyonu (combining sırasında)
  if (isCombining) {
    const angle = Math.sin(time * 0.1) * 0.3;
    ctx.save();
    ctx.translate(x + 15, y - 5);
    ctx.rotate(angle);
    ctx.font = '16px Arial';
    ctx.fillText('🥄', 0, 0);
    ctx.restore();
  }

  // Ana ikon
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔄', x, y - 35);

  // Etiket
  ctx.font = 'bold 8px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText('COMBINING', x, y + 60);
}
```

---

## 🎮 Etkileşim Sistemi

### server/interactHandler.ts Ekleme

```typescript
// ─── COMBINING STATION ───────────────────────────────────────────────────────
const handleCombiningStations: InteractionHandler = (ctx) => {
  const { gs, p, px, py, snd } = ctx;
  
  for (const station of gs.combiningStations) {
    if (Math.hypot(px - station.x, py - station.y) > COMBINING_STATION_R) continue;

    // Output alma
    if (station.output && !p.holding) {
      p.holding = station.output;
      station.output = null;
      snd('pickup');
      return true;
    }

    // Input koyma
    if (p.holding && !station.output) {
      // İlk slot boşsa
      if (!station.input1) {
        // Sadece temel yemekleri kabul et
        if (isDish(p.holding)) {
          station.input1 = p.holding;
          p.holding = null;
          snd('place');
          return true;
        }
      }
      // İkinci slot boşsa
      else if (!station.input2) {
        // Malzeme kabul et
        station.input2 = p.holding;
        p.holding = null;
        snd('place');
        
        // Tarif kontrolü ve combining başlatma
        const recipe = findCombiningRecipe(station.input1, station.input2);
        if (recipe && gs.unlockedCombiningRecipes.includes(recipe.id)) {
          station.timer = recipe.ticks;
          station.isCombining = true;
          station.combiningPlayerId = p.id;
        } else {
          // Geçersiz tarif - malzemeleri geri ver
          // TODO: Implement invalid recipe handling
        }
        return true;
      }
    }

    snd('fail');
    return true;
  }
  return false;
};

function findCombiningRecipe(input1: string, input2: string) {
  for (const [id, recipe] of Object.entries(COMBINING_RECIPES)) {
    if (recipe.input1 === input1 && recipe.input2 === input2) {
      return { id, ...recipe };
    }
  }
  return null;
}
```

### server/gameLoop.ts Ekleme

```typescript
// Combining station tick
if (gs.combiningStations) {
  for (const station of gs.combiningStations) {
    if (station.isCombining && station.timer > 0) {
      station.timer--;
      
      if (station.timer <= 0) {
        // Combining tamamlandı
        const recipe = findCombiningRecipe(station.input1!, station.input2!);
        if (recipe) {
          station.output = recipe.output;
          station.input1 = null;
          station.input2 = null;
          station.isCombining = false;
          station.combiningPlayerId = null;
          
          // Combining tamamlandı efekti
          io.to(rid).emit('combiningDone', { x: station.x, y: station.y });
        }
      }
    }
  }
}

// Tarif unlock sistemi
function checkRecipeUnlocks(gs: GameState) {
  for (const [id, recipe] of Object.entries(COMBINING_RECIPES)) {
    if (gs.day >= recipe.unlockDay && !gs.unlockedCombiningRecipes.includes(id)) {
      gs.unlockedCombiningRecipes.push(id);
      // Yeni tarif unlock bildirimi
      io.to(rid).emit('recipeUnlocked', { recipeId: id, recipe });
    }
  }
}
```

---

## 🎯 Müşteri Sistemi Entegrasyonu

### Müşteri Sipariş Sistemi

```typescript
// Müşteri spawn'ında combining yemekleri de dahil et
function generateCustomerOrder(gs: GameState): Item {
  const availableDishes = [...gs.unlockedDishes];
  
  // Unlock edilmiş combining yemeklerini ekle
  for (const recipeId of gs.unlockedCombiningRecipes) {
    const recipe = COMBINING_RECIPES[recipeId];
    if (recipe) {
      availableDishes.push(recipe.output);
    }
  }
  
  return availableDishes[Math.floor(Math.random() * availableDishes.length)];
}

// Servis sırasında combining yemek kontrolü
function serveCombiningFood(customer: Customer, servedItem: string): number {
  const recipe = Object.values(COMBINING_RECIPES).find(r => r.output === servedItem);
  if (recipe) {
    // Combining yemek servis edildi - bonus bahşiş
    return recipe.tipMultiplier;
  }
  return 1.0;
}
```

---

## 📚 Tutorial Güncellemesi

### src/components/TutorialOverlay.tsx Ekleme

```typescript
{
  icon: '🔄',
  title: 'Combining Station',
  desc: 'Temel yemekleri malzemelerle birleştirip özel yemekler yap! Önce temel yemeği (🍕), sonra malzemeyi (🧀) koy. Combining tamamlanınca özel yemek hazır: 🍕🧀',
  hint: 'İpucu: Combining yemekleri daha fazla bahşiş verir ama daha uzun sürer!',
},
```

---

## 🎵 Ses Efektleri

### src/hooks/useGameEffects.ts Ekleme

```typescript
// 🔄 Combining tamamlandı
const handleCombiningDone = (data: { x: number; y: number }) => {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const speed = 2 + Math.random() * 1.5;
    sparkleParticles.push({
      x: data.x, y: data.y,
      vx: Math.cos(angle) * speed, 
      vy: Math.sin(angle) * speed - 1,
      life: 50, maxLife: 50,
      emoji: '✨',
    });
  }
};

socket.on("combiningDone", handleCombiningDone);
```

---

## 🏆 Başarı Sistemi

### Combining Başarıları

```typescript
// Başarı tanımları
const COMBINING_ACHIEVEMENTS = {
  'first_combine': {
    name: 'İlk Karışım',
    desc: 'İlk combining yemeğini yap',
    icon: '🔄',
    reward: '+50 puan'
  },
  'master_chef': {
    name: 'Usta Aşçı',
    desc: '10 farklı combining yemeği yap',
    icon: '👨‍🍳',
    reward: '+200 puan'
  },
  'speed_combiner': {
    name: 'Hızlı Karıştırıcı',
    desc: '1 günde 20 combining yemeği yap',
    icon: '⚡',
    reward: '+100 puan'
  }
};
```

---

## 📊 Denge Ayarları

### Bahşiş Çarpanları
- **Temel Combining**: +25-40% bahşiş
- **Gelişmiş Combining**: +45-65% bahşiş
- **Premium Combining**: +55-70% bahşiş

### Süre Dengeleri
- **Basit tarifler**: 1-2 saniye
- **Orta tarifler**: 2-3 saniye
- **Karmaşık tarifler**: 3-4 saniye

### Unlock Programı
- **Gün 3-6**: Temel tarifler (4 adet)
- **Gün 7-12**: Gelişmiş tarifler (6 adet)
- **Gün 15+**: Premium tarifler (4 adet)

---

## 🚀 Uygulama Sırası

### Faz 1: Temel Altyapı (2 saat)
1. `shared/types.ts` - CombiningStation interface, COMBINING_RECIPES
2. `src/renderer/drawCombiningStation.ts` - Render fonksiyonu
3. `server/interactHandler.ts` - handleCombiningStations
4. `server/gameLoop.ts` - Combining tick sistemi

### Faz 2: Entegrasyon (2 saat)
1. `src/hooks/useGameLoop.ts` - Render çağrısı
2. `server/gameLoop.ts` - Müşteri sipariş sistemi güncellemesi
3. `src/types/game.ts` - Export'lar
4. Test ve debug

### Faz 3: Polish (1 saat)
1. Tutorial güncelleme
2. Ses efektleri
3. Başarı sistemi
4. Final test

---

## 🎮 Oynanış Örneği

### Senaryo: Peynirli Pizza Yapımı

1. **Oyuncu A**: 🍞 Hamur alır → Fırına koyar → 🍕 Pizza pişirir
2. **Oyuncu B**: 🧀 Peynir alır → Combining Station'a gider
3. **Oyuncu A**: 🍕 Pizza'yı Combining Station'a koyar (input1)
4. **Oyuncu B**: 🧀 Peynir'i Combining Station'a koyar (input2)
5. **Sistem**: Tarif tanınır → 2 saniye combining başlar
6. **Sonuç**: 🍕🧀 Peynirli Pizza hazır → +30% bahşiş

### Co-op İş Bölümü
- **Aşçı**: Temel yemekleri pişirir (🍕, 🍔, 🍜)
- **Garson**: Malzemeleri toplar, combining yapar
- **Bulaşıkçı**: Tabakları temizler, servis yapar

---

## 🔮 Gelecek Genişletmeler

### Faz 4: Premium Tarifler (Gelecek)
- 3 malzemeli tarifler
- Özel combining station'ları
- Seasonal tarifler

### Faz 5: Automation (Gelecek)
- Otomatik combining station upgrade'i
- Conveyor belt sistemi
- Robot aşçı

---

## ⚠️ Dikkat Edilecekler

1. **Performance**: Combining station render'ı optimize et
2. **Balance**: Bahşiş çarpanları çok yüksek olmasın
3. **UX**: Tarif kombinasyonları açık olsun
4. **Multiplayer**: Race condition'ları önle
5. **Tutorial**: Yeni oyuncular için açık olsun

---

## 🎯 Başarı Kriterleri

✅ **Temel Fonksiyon**: 4 temel tarif çalışıyor
✅ **Co-op Uyumu**: İş bölümü doğuyor
✅ **Denge**: Bahşiş artışı makul seviyede
✅ **UX**: Etkileşim sezgisel
✅ **Performance**: 60fps korunuyor

---

Bu sistem oyunu **bambaşka bir seviyeye** çıkaracak! Co-op'ta gerçek iş bölümü, stratejik derinlik ve replay value artışı sağlayacak. 🚀