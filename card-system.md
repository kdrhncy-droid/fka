# Kart Sistemi — Tasarım Dokümanı

## Genel Fikir

Her belirli günün sonunda (gece fazında) oyuncuya 2 kart sunulur.
Her kart bir şeyi **zorlaştırır**, karşılığında bir şey **verir**.
Oyuncu birini seçmek zorundadır — ikisini alamaz, hiçbirini de alamaz.
Seçilen kart o run boyunca **kalıcı** olarak aktif kalır ve üst üste birikir.

Mevcut yemek unlock sistemiyle **aynı gece ekranında** ama ayrı bir adım olarak çalışır.
Önce yemek seçimi (varsa), sonra kart seçimi.

---

## Kart Tetiklenme Günleri

```
Gün 2, 5, 8, 11, 14, 17, 20 ...
```

Yani her 3 günde bir kart seçimi çıkar.
Yemek unlock günleriyle çakışabilir — o zaman önce yemek, sonra kart.

---

## Kart Yapısı

Her kartın 3 bileşeni var:

```ts
interface Card {
  id: string;
  icon: string;
  name: string;
  penalty: string;    // Ne zorlaşıyor (kırmızı)
  reward: string;     // Ne kazanılıyor (yeşil)
  effect: CardEffect; // Sunucuda uygulanan etki
}
```

---

## Kart Listesi (18 Kart)

### Müşteri Kartları

| İkon | İsim | Ceza | Ödül |
|------|------|------|------|
| 😤 | Sabırsız Kalabalık | Müşteri sabrı -%20 | Her servisten +3 ekstra para |
| 👥 | Yoğun Gün | Müşteri spawn hızı +%30 | Gece upgrade fiyatları -%15 |
| 🏃 | Acele Müşteriler | Müşteriler %25 daha hızlı yiyor (masa daha çabuk boşalıyor ama sabır da hızlı azalıyor) | Bahşiş miktarı +%25 |
| 😡 | Kaba Gün | Kaba müşteri oranı +%40 | Kaba müşteri dövülünce +15 ekstra puan |
| 👁️ | Kör Sabır | Müşteri sabır barları gizlenir | Tüm müşteriler +%15 daha sabırlı |
| 🌧️ | Yağmurlu Gün | Müşteriler kapıda %30 daha hızlı sabır kaybeder | Gün boyunca +%10 daha fazla müşteri gelir |

### Mutfak Kartları

| İkon | İsim | Ceza | Ödül |
|------|------|------|------|
| 🔥 | Sıcak Fırın | Yemekler %30 daha hızlı yanar | Yemekler %30 daha hızlı pişer |
| 🍽️ | Az Tabak | Başlangıç tabak sayısı -2 | Her temizlenen tabak +2 puan |
| ⏱️ | Doğrama Baskısı | Kesme tahtası %25 daha yavaş | Doğranmış malzeme fırında %40 daha hızlı pişer |
| 🧊 | Soğuk Zincir | Buzdolabı kapasitesi yarıya düşer | İçecek servisi +8 ekstra puan |
| 🍳 | Tek Fırın Günü | Sadece 1 fırın aktif (diğerleri kilitlenir) | O fırın 2x hızlı pişirir |

### Ekonomi Kartları

| İkon | İsim | Ceza | Ödül |
|------|------|------|------|
| 💸 | Pahalı Gün | Tüm upgrade fiyatları +%25 | Gün sonu bonus: +$50 sabit |
| 🎰 | Şans Günü | Spawn tamamen rastgele (kontrol yok) | Her müşteri 2x bahşiş bırakır |
| 📉 | Düşük Sezon | Müşteri sayısı -%20 | Her müşteri %50 daha sabırlı |
| 💰 | VIP Gün | Sadece 1 kişilik masalar aktif | VIP müşteriler 3x bahşiş bırakır |

### Özel Kartlar

| İkon | İsim | Ceza | Ödül |
|------|------|------|------|
| 🌪️ | Kaos Günü | Her 60 saniyede rastgele bir istasyon pozisyonu değişir | Gün sonu +$100 bonus |
| ⚡ | Turbo Gün | Oyuncu hareket hızı -%15 | Tüm pişirme süreleri -%20 |
| 🎭 | Tiyatro Günü | Müşteri kişilikleri gizlenir (kim kaba belli olmaz) | Tüm diyalog bahşişleri 2x |

---

## Sunucu Tarafı Uygulama

### GameState'e Eklenenler

```ts
// shared/types.ts
interface ActiveCard {
  id: string;
  appliedOnDay: number;
}

// GameState'e eklenecek:
activeCards: ActiveCard[];        // Aktif kartlar listesi
pendingCardChoices: Card[] | null; // Gece ekranında sunulan 2 kart
```

### Etki Sistemi

Kartlar `gameTick` ve `spawnTick` içinde `activeCards` listesi kontrol edilerek uygulanır.

```ts
// Örnek: "Sabırsız Kalabalık" kartı aktifse
const impatientCard = gs.activeCards.find(c => c.id === 'impatient_crowd');
const patienceMultiplier = impatientCard ? 0.8 : 1.0;
const maxP = patLimit(...) * patienceMultiplier;

// Örnek: "Sıcak Fırın" kartı aktifse
const hotOvenCard = gs.activeCards.find(c => c.id === 'hot_oven');
const burnMultiplier = hotOvenCard ? 0.7 : 1.0;
s.burnTimer = BURN_TICKS * burnMultiplier;
```

### Socket Event'leri

```
client → server: 'selectCard' { cardId: string }
server → client: 'cardSelected' { card: Card, activeCards: ActiveCard[] }
```

---

## Client Tarafı UI

### Kart Seçim Ekranı

Gece ekranında yemek seçiminden sonra çıkar.
Tam ekran overlay, 2 kart yan yana gösterilir.

```
┌─────────────────────────────────────────────────────┐
│              ⚡ Günlük Kart Seç                      │
│         Bu etki tüm run boyunca aktif kalır          │
│                                                     │
│  ┌──────────────────┐    ┌──────────────────┐       │
│  │  😤 Sabırsız     │    │  🔥 Sıcak Fırın  │       │
│  │  Kalabalık       │    │                  │       │
│  │                  │    │                  │       │
│  │  ❌ Sabır -%20   │    │  ❌ Yanma +%30   │       │
│  │  ✅ Servis +3₺   │    │  ✅ Pişirme +%30 │       │
│  │                  │    │                  │       │
│  │   [ Seç ]        │    │   [ Seç ]        │       │
│  └──────────────────┘    └──────────────────┘       │
│                                                     │
│  Aktif Kartlar: 😤 🔥                               │
└─────────────────────────────────────────────────────┘
```

### Aktif Kart Göstergesi

Üst barda küçük ikonlar olarak gösterilir.
Üzerine gelince tooltip açılır.

---

## Multiplayer Davranışı

Kart seçimi **oda bazlı** — bir oyuncu seçer, tüm odaya uygulanır.
İlk seçen kazanır (race condition yok, server tarafında ilk `selectCard` event'i işlenir).
Diğer oyuncular seçim yapıldığında bildirim alır.

---

## Kart Tetiklenme Mantığı

```ts
// server/gameLoop.ts içinde dayEnd'de:
const CARD_DAYS = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29];

if (CARD_DAYS.includes(gs.day + 1)) {
  // Tüm kartlardan rastgele 2 tane seç
  // Zaten aktif olan kartları hariç tut (aynı kart 2 kez gelmesin)
  generateCardChoices(gs);
}
```

---

## Denge Notları

- İlk kartlar (gün 2, 5) daha hafif ceza/ödül içermeli
- Geç oyun kartları (gün 14+) daha agresif tradeoff sunmalı
- "Kaos Günü" ve "Tiyatro Günü" sadece gün 8'den sonra çıkabilir
- Aynı kart bir run'da en fazla 1 kez seçilebilir

---

## Uygulama Sırası

1. `shared/types.ts` — `ActiveCard`, `pendingCardChoices` ekle
2. `server/gameLoop.ts` — `generateCardChoices()`, `selectCard` event handler
3. Kart efektlerini `gameTick` ve `spawnTick`'e entegre et
4. `src/components/CardSelectModal.tsx` — UI bileşeni
5. `src/components/GameScreen.tsx` — aktif kart ikonları üst bara ekle
6. Test: Her kartın etkisini tek tek doğrula
