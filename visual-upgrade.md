# Görsel & Efekt Yükseltme Planı

> Hedef: "Vay be, bu ne?" dedirten seviye. Brawl Stars / Among Us kalitesi.

---

## 1. Karakter Görsel Kalitesi

### 1.1 Şapka Sistemi — Gerçek Canvas Çizimi
Şu an emoji kullanıyoruz. Bunun yerine her şapka canvas'ta özel çizilmeli.

**Yapılacaklar:**
- `👑 Altın Taç` — parlak altın gradient, taşlar animasyonlu (titreşim)
- `🎩 Silindir` — deri dokusu, şerit detayı
- `🧢 Kep` — kumaş dokusu, düğme, gölge
- `🎀 Fiyonk` — yumuşak pembe, 3D görünüm
- `🐱 Kedi Kulakları` — iç kulak pembe, hafif tüy efekti
- `⭐ Yıldız` — dönen animasyon, parıltı efekti
- **YENİ: 🔥 Alev Tacı** — turuncu/kırmızı gradient, alev partikülleri
- **YENİ: 💎 Elmas Taç** — mavi/beyaz gradient, ışık kırılması efekti
- **YENİ: 🌙 Ay Tacı** — gümüş, yıldız partikülleri

### 1.2 Karakter Aura Sistemi
Oyuncu etrafında sürekli görünen arka plan efekti.

```
Karakter
   ↑
[Aura halkası — renk ve şekil değişebilir]
```

**Aura tipleri:**
- `Ateş Aurası` — turuncu/kırmızı partiküller, ısı dalgası
- `Buz Aurası` — mavi/beyaz kristaller, soğuk nefes
- `Elektrik Aurası` — sarı şimşekler, statik
- `Karanlık Aurası` — mor/siyah duman, gölge partikülleri
- `Gökkuşağı Aurası` — sürekli renk döngüsü, pastel

**Teknik:** `drawPlayer.ts`'de karakter çiziminden önce aura partikülleri render edilir.

### 1.3 Giriş Animasyonu
Oyuncu odaya katılınca özel giriş efekti.

- Normal: düz yürüyüş
- **Epik Giriş:** ışık patlaması + partikül yağmuru + kısa ses
- **Patron Girişi:** altın konfeti, "PATRON GİRDİ" yazısı

---

## 2. İsim Etiketi Efektleri — Gelişmiş

### 2.1 Mevcut Efektler (iyileştirme)
- `Parlayan` — şu an basit glow. Olması gereken: nefes alan, renk değişen glow
- `Gökkuşağı` — şu an sadece renk değişiyor. Olması gereken: gradient metin
- `Yanıp Sönen` — şu an alpha değişiyor. Olması gereken: renk + boyut titreşimi
- `Altın Çerçeve` — şu an statik. Olması gereken: köşelerde dönen yıldızlar

### 2.2 Yeni Efektler
- `🔥 Alev Yazısı` — metin etrafında küçük alev partikülleri
- `❄️ Buz Yazısı` — metin donuyor, kristal efekti
- `⚡ Elektrik` — metin etrafında şimşek çakması
- `🌊 Dalga` — metin yukarı aşağı dalgalanıyor
- `💥 Patlama` — periyodik küçük patlama efekti
- `🌟 Yıldız Yağmuru` — etrafında dönen yıldızlar

**Teknik:** Her efekt `drawPlayer.ts`'de `Date.now()` ile animasyonlu, canvas partikülleri.

---

## 3. Servis Efektleri (Oyun İçi)

### 3.1 Yemek Servis Efekti
Müşteriye yemek verilince özel partikül patlaması.

| Efekt | Görünüm | Teknik |
|-------|---------|--------|
| Yıldız Patlaması | ✨✨✨ sarı yıldızlar | 8 yıldız parçacığı, dışa doğru |
| Kalp Yağmuru | ❤️❤️❤️ pembe kalpler | 6 kalp, yukarı doğru yüzer |
| Ateş | 🔥🔥 turuncu partiküller | alev parçacıkları |
| Para | 💰💰 yeşil coin'ler | dönerek düşer |
| Gökkuşağı | 🌈 renk patlaması | radyal renk halkası |

**Teknik:** `useGameEffects.ts`'de yeni partikül tipi. Server'dan `serviceEffect` event'i gelince tetiklenir.

### 3.2 Combo Efekti
Combo sayısı arttıkça ekran efekti.

- x3: Küçük yıldız patlaması
- x5: Ekran kenarlarında ateş
- x8: Tüm ekran titreşimi + "COMBO x8" yazısı

---

## 4. Market Görsel Kalitesi

### 4.1 Item Kartları
Şu an: küçük kart, renk dairesi, metin.
Olması gereken:

```
┌─────────────────┐
│   [Büyük Görsel] │  ← karakter önizlemesi veya animasyonlu efekt
│                 │
│  ✨ PARLAYAN    │  ← isim büyük
│  ── Nadir ──    │  ← nadirlik rengi
│                 │
│  [🪙 300 AL]   │  ← büyük buton
└─────────────────┘
```

**Nadirlik renkleri:**
- Common: gri kenarlık, mat arka plan
- Rare: mavi parıltı, hafif animasyon
- Epic: mor/altın gradient kenarlık, dönen parıltı efekti

### 4.2 Satın Alma Animasyonu
Şu an: "✓ Alındı!" yazısı.
Olması gereken:
- Konfeti patlaması
- Coin uçuş animasyonu (coin → item)
- "YENİ EŞYA KAZANILDI" banner'ı

### 4.3 Epic Item Açılış Efekti
Epic nadirlikte item satın alınca:
- Ekran kararır
- Işık huzmesi
- Item büyük gösterilir
- Partikül patlaması

---

## 5. Oyun İçi Genel Görsel İyileştirmeler

### 5.1 Zemin Efektleri
- Mutfak zeminine hafif yansıma efekti
- Kirli masa etrafında kir partikülleri
- Temizlenince temizlik efekti (köpük, parıltı)

### 5.2 Yemek Pişirme Efektleri
- Fırında pişerken buhar partikülleri
- Yemek hazır olunca ✨ sparkle (zaten var, iyileştir)
- Yemek yanarken duman + kırmızı uyarı

### 5.3 Müşteri Efektleri
- Mutlu ayrılınca ❤️ animasyonu (zaten var)
- Sinirli müşteri etrafında 💢 partikülleri
- VIP müşteri etrafında altın parıltı
- Sarhoş müşteri etrafında 🍺 baloncukları

### 5.4 Ekran Efektleri
- Gün başlangıcında güneş doğuşu efekti
- Gece geçişinde yıldız yağmuru
- Game Over'da ekran kırılma efekti
- Combo'da ekran kenarı ateş efekti

---

## 6. Ses & Görsel Senkronizasyon

Her görsel efektin bir ses karşılığı olmalı:

| Efekt | Ses |
|-------|-----|
| Yıldız servis efekti | Parlak "ding" |
| Kalp servis efekti | Yumuşak "pop" |
| Epic item açılışı | Dramatik fanfar |
| Combo x8 | Güçlü "boom" |
| Aura aktifleşme | Mistik "whoosh" |

---

## 7. Uygulama Önceliği

### Aşama 1 — Hemen Yapılabilir (1-2 gün)
1. Market item kartları büyütülmesi + nadirlik animasyonları
2. Satın alma konfeti efekti
3. Mevcut etiket efektlerinin iyileştirilmesi (glow, rainbow gradient)

### Aşama 2 — Orta Vadeli (3-5 gün)
1. Servis efektleri (yıldız, kalp, ateş)
2. Aura sistemi (3-4 aura tipi)
3. Yeni şapkalar canvas çizimi

### Aşama 3 — Uzun Vadeli (1-2 hafta)
1. Epic item açılış animasyonu
2. Giriş animasyonları
3. Zemin yansıma efektleri
4. Combo ekran efektleri

---

## 8. Teknik Notlar

### Canvas Partiküller
```typescript
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; decay: number;
  size: number;
  color: string;
  type: 'star' | 'heart' | 'coin' | 'spark' | 'smoke';
}
```

### Efekt Sistemi
- `useGameEffects.ts` genişletilmeli
- Her efekt tipi için ayrı render fonksiyonu
- Partikül pool sistemi (performans için)
- `requestAnimationFrame` ile senkronize

### Performans
- Maksimum 50 aktif partikül
- Efektler canvas dışına çıkınca otomatik temizlenir
- Düşük kalite modunda efektler devre dışı

---

## 9. Joystick Sürükle-Bırak Konumlandırma

### Konsept
Oyun içinde joystick'e uzun basınca "taşıma modu" aktif olur. Parmağı sürükleyerek istediğin yere bırakırsın. Konum localStorage'a kaydedilir.

### Davranış
```
Normal: joystick sol panelde sabit
Uzun bas (500ms): titreşim + "taşıma modu" aktif
Sürükle: joystick parmağı takip eder
Bırak: yeni konum kaydedilir
```

### Teknik
- `onPointerDown` + 500ms timeout → taşıma modu
- Taşıma modunda `onPointerMove` ile pozisyon güncellenir
- Pozisyon `settings.hudLayout.joystickOffset: { x, y }` olarak kaydedilir
- Sol panel içinde sınırlı kalır (overflow yok)
- Diğer butonlar da aynı şekilde taşınabilir olabilir

### Görsel
- Taşıma modunda joystick etrafında noktalı çerçeve
- Hafif büyüme animasyonu (scale 1.1)
- Bırakınca "yerleşti" efekti (kısa titreşim)

---

## 10. Şapka Sistemi — Kafaya Tam Uyumlu

### Sorun
Şu an tüm şapkalar aynı `headY - headR - 2` koordinatına çiziliyor. Her şapkanın farklı oturma noktası var.

### Çözüm: Şapka Tanım Sistemi

```typescript
interface HatDefinition {
  id: string;
  name: string;
  // Kafaya göre offset (headR = 18.7 baz alınarak)
  anchorY: number;      // kafanın tepesinden ne kadar yukarıda
  anchorOffsetX: number; // yatay kaydırma (kep için öne eğik)
  width: number;        // şapka genişliği (headR'a oranla)
  height: number;       // şapka yüksekliği
  drawFn: (ctx, headR, hatY, hatX) => void;
}
```

### Her Şapka İçin Özel Çizim

**Aşçı Şapkası (Toque Blanche)**
```
    ╭─────╮
    │     │  ← uzun beyaz silindir
    │     │
╭───┴─────┴───╮  ← geniş alt kenar
```
- Beyaz, uzun silindir
- Alt kısımda geniş bant
- Hafif kıvrık üst
- `anchorY: headR * 1.8` (kafadan çok yukarı)

**Silindir Şapka**
```
  ╭───────╮
  │       │  ← silindir gövde
╭─┴───────┴─╮  ← geniş kenarlık
```
- Siyah, parlak
- Kenarlık kafayı sarar
- `anchorY: headR * 1.2`

**Kep (Baseball)**
```
╭─────────╮
│  ●      │  ← düğme
╰─────────╯
  ╰──────╯  ← siper öne uzanır
```
- Öne eğik (5-10 derece)
- Siper kafanın önüne uzanır
- `anchorOffsetX: headR * 0.1` (hafif öne)

**Taç**
```
  ╱╲ ╱╲ ╱╲
 ╱  ╲╱  ╲╱  ╲
╰────────────╯  ← kafa çevresine oturur
```
- Kafanın tam çevresine oturur
- Dişler yukarı uzanır
- `width: headR * 1.4` (kafadan biraz geniş)

**Fiyonk**
```
  ╭──╮ ╭──╮
  │  ╰─╯  │  ← iki kanat
  ╰───●───╯  ← orta düğüm
```
- Kafanın tam tepesinde
- Simetrik iki kanat
- `anchorY: headR * 0.9`

---

## 11. Saç Stilleri

### Mevcut Durum
Sadece renk değişiyor, stil yok. Tüm karakterler aynı saç şekline sahip.

### Yeni Saç Stilleri

| Stil ID | İsim | Görünüm | Teknik |
|---------|------|---------|--------|
| `hair_straight` | Düz | Düz, omuzlara inen | Mevcut stil (default) |
| `hair_short` | Kısa | Kısa, düzgün kesilmiş | Recep saçı gibi |
| `hair_wavy` | Dalgalı | Dalgalı çizgiler | Bezier eğrileri |
| `hair_ponytail` | At Kuyruğu | Arkada bağlı | Ek çizim arkada |
| `hair_afro` | Afro | Büyük yuvarlak | Büyük daire, headR * 1.5 |
| `hair_spiky` | Dikenli | Yukarı diken | Üçgen çıkıntılar |
| `hair_bun` | Topuz | Üstte topuz | Küçük daire tepede |
| `hair_long` | Uzun | Omuzların altına | Daha uzun çizgiler |

### Teknik
```typescript
interface HairStyle {
  id: string;
  name: string;
  drawFn: (ctx, headR, headY, hairColor) => void;
}
```

`drawPlayer.ts`'de `p.hairStyle` kontrol edilir, ilgili `drawFn` çağrılır.

---

## 12. Kıyafet Stilleri

### Mevcut Durum
Sadece renk değişiyor. Tüm karakterler aynı yuvarlak gövde şekline sahip.

### Yeni Kıyafet Stilleri

| Stil ID | İsim | Görünüm | Detay |
|---------|------|---------|-------|
| `outfit_casual` | Casual | Düz tişört | Mevcut (default) |
| `outfit_chef` | Aşçı Önlüğü | Beyaz önlük + düğmeler | Üstüne beyaz önlük çizilir |
| `outfit_waiter` | Garson | Siyah yelek + papyon | Yelek + papyon detayı |
| `outfit_chef_jacket` | Şef Ceketi | Çift sıra düğmeli | Profesyonel şef görünümü |
| `outfit_hoodie` | Kapüşonlu | Kapüşon + kanguru cep | Kapüşon başa eklenebilir |
| `outfit_suit` | Takım Elbise | Kravat + ceket | Resmi görünüm |
| `outfit_apron` | Mutfak Önlüğü | Renkli önlük | Üstüne önlük çizilir |

### Aşçı Önlüğü Detayı
```
╭─────────────╮
│  ╭───────╮  │  ← önlük
│  │  ●  ● │  │  ← düğmeler
│  │       │  │
│  ╰───────╯  │
╰─────────────╯
```

### Teknik
```typescript
interface OutfitStyle {
  id: string;
  name: string;
  drawFn: (ctx, bodyW, bodyH, bodyY, color) => void;
  // Bazı kıyafetler rengi override eder (önlük her zaman beyaz)
  overrideColor?: string;
}
```

---

## 13. Uygulama Önceliği (Güncellendi)

### Aşama 0 — Joystick Sürükle-Bırak (1 gün)
- Uzun basınca taşıma modu
- Konum kaydetme
- Görsel geri bildirim

### Aşama 1 — Şapka Sistemi Düzeltme (1-2 gün)
- Her şapka için `HatDefinition` tanımı
- Kafaya tam oturma koordinatları
- Aşçı şapkası ekleme

### Aşama 2 — Saç Stilleri (2-3 gün)
- 5-6 temel saç stili
- Market'te "Saç Stili" kategorisi
- `drawPlayer.ts` güncelleme

### Aşama 3 — Kıyafet Stilleri (2-3 gün)
- 4-5 kıyafet stili
- Market'te "Kıyafet" kategorisi
- `drawPlayer.ts` güncelleme
