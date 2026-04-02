# 🎨 Dekorasyon & Görsel İyileştirme Planı

## Mevcut Görsel Zayıf Yönler

| Alan | Sorun |
|------|-------|
| Salon duvarları | Tamamen çıplak, hiç dekorasyon yok |
| Mutfak arka duvarı | Steril, sadece karo zemin var |
| Kaldırım | Geniş ve boş, ağaç/lamba dışında hiçbir şey yok |
| Ön cephe | Restoran tabelası yok, kimlik yok |
| Işıklandırma | Gece/gündüz farkı yok, her şey aynı parlaklıkta |
| Bekleme alanı | Müşteriler çıplak kaldırımda bekliyor |

---

## 1. SALON DEKORASYONLARı

### 1.1 Duvar Tabloları / Çerçeveler
**Nereye:** Salon sol ve sağ duvarlarına (x=30-60 arası ve x=1220-1250 arası), y=380-500 arası
**Görsel tarif:**
- Koyu ahşap çerçeve: `roundRect` ile 40x30 boyutunda, `#3e2810` renk, 3px stroke
- İç alan: açık krem `#f5f0e8`, hafif gradient
- İçine basit soyut şekil: 3-4 renkli dikdörtgen veya daire (modern sanat hissi)
- Çerçeve gölgesi: `rgba(0,0,0,0.25)` ile 2px offset

```
┌──────────────┐
│  ╔════════╗  │  ← koyu ahşap çerçeve (#3e2810)
│  ║ 🎨     ║  │  ← krem iç alan (#f5f0e8)
│  ║  soyut ║  │  ← renkli şekiller
│  ╚════════╝  │
└──────────────┘
```

### 1.2 Saksı Bitkiler (Salon Köşeleri)
**Nereye:** 4 köşe — (60, 380), (1220, 380), (60, 680), (1220, 680)
**Görsel tarif:**
- Saksı: `arc` ile yarım daire, `#c1440e` turuncu-kırmızı, 14px yarıçap
- Saksı gövdesi: hafif trapez şekli (üstte geniş, altta dar)
- Toprak: `#5c3317` koyu kahve, saksının üst kısmı
- Yapraklar: 3-5 adet `bezierCurveTo` ile organik eğri, `#4a9a28` yeşil
- Büyük yaprak: `#3a7818`, küçük yaprak: `#6ab840`
- Gölge: saksının altında `rgba(0,0,0,0.2)` elips

```
    🌿🌿🌿
   🌿🌿🌿🌿
    ╭────╮   ← toprak (#5c3317)
    │    │   ← saksı (#c1440e)
    ╰──╯     ← saksı alt
```

### 1.3 Tavan Lambaları (Masa Üstü)
**Nereye:** Her masanın tam üstünde, y=420 (masa y=460 ise 40px yukarı)
**Görsel tarif:**
- Tavan bağlantısı: ince çizgi `#888`, 2px, yukarıdan aşağıya 20px
- Lamba gövdesi: `arc` ile 10px yarıçap, `#d4a830` altın sarısı
- Lamba şapkası: yarım daire, `#2a2a2a` koyu, üstte geniş
- Işık halesi: `createRadialGradient`, merkez `rgba(255,240,150,0.25)` → dış `rgba(255,240,150,0)`, 40px yarıçap
- Gece modunda hale daha belirgin olacak (ileride)

```
    |        ← ince tel (#888)
   ╭─╮       ← lamba şapkası (#2a2a2a)
  ( ● )      ← ampul (#d4a830)
 ░░░░░░░     ← ışık halesi (radial gradient)
```

### 1.4 Menü Panosu
**Nereye:** Kapı yanına, salon içinde sol taraf — (100, 360)
**Görsel tarif:**
- Tahta zemin: `roundRect` 80x50, `#5c3317` koyu ahşap
- Çerçeve: `#3e2810`, 3px stroke
- Başlık: "MENÜ" yazısı, `#fde68a` sarı, bold 11px
- Alt çizgiler: 3 adet yatay çizgi `rgba(255,255,255,0.3)`, yemek listesi simüle eder
- Köşe vidaları: 4 köşede küçük `arc`, `#888` gri

```
╔══════════════╗
║    MENÜ      ║  ← başlık (#fde68a)
║ ─────────── ║  ← çizgiler
║ ─────────── ║
║ ─────────── ║
╚══════════════╝
```

---

## 2. MUTFAK DEKORASYONLARı

### 2.1 Arka Duvar Rafları
**Nereye:** y=20-60 arası, x=200-1100 arası (kapı ve köşe boşlukları hariç)
**Görsel tarif:**
- Raf tahtası: `roundRect` 200x12, `#5c3317` ahşap rengi, hafif gradient
- Raf altı gölgesi: `rgba(0,0,0,0.3)` ince şerit
- Raf üstünde küçük objeler:
  - Baharat kavanozu: küçük `roundRect` 8x12, `#e8d5b0` cam rengi, içinde renkli nokta
  - Yağ şişesi: ince uzun `roundRect` 6x16, `#c8b860` sarı-yeşil
  - Küçük tencere: `arc` 8px, `#555` gri

```
 [🫙][🫙][🍶][🫙]   ← objeler
 ══════════════════  ← raf tahtası (#5c3317)
 ░░░░░░░░░░░░░░░░░   ← raf gölgesi
```

### 2.2 Havalandırma Boruları
**Nereye:** Mutfak tavanı boyunca, y=15-25 arası
**Görsel tarif:**
- Ana boru: `roundRect` yatay, tüm genişlik, `#484848` koyu gri, 14px yükseklik
- Boru parlaması: üst kenar `rgba(255,255,255,0.12)` ince şerit
- Dikey bağlantılar: 3-4 adet kısa dikey boru, `#404040`
- Perçinler: boru üzerinde eşit aralıklı küçük `arc`, `#606060`

```
●──●──●──●──●──●──●  ← perçinler
╔══════════════════╗  ← ana boru (#484848)
║░░░░░░░░░░░░░░░░░║  ← parlama
╚══════════════════╝
│    │    │    │      ← dikey bağlantılar
```

### 2.3 Mutfak Duvar Karoları (Arka Duvar)
**Nereye:** y=10-40 arası, duvar bandı
**Görsel tarif:**
- Beyaz/krem karo: 20x20 grid, `#e8e4dc`
- Karo arası fuga: `#c8c4bc`, 1px
- Her 4. karonun hafif farklı tonu: `#dedad2` (çeşitlilik için)
- Üst kısımda hafif gölge: `rgba(0,0,0,0.1)`

---

## 3. DIŞ ALAN DEKORASYONLARı

### 3.1 Restoran Tabelası
**Nereye:** Ön duvar üstünde, kapının tam üstü — x=520-760, y=700-718
**Görsel tarif:**
- Tabela zemini: `roundRect` 240x22, `#1a1a2e` koyu lacivert veya `#8B1a1a` koyu kırmızı
- Çerçeve: `#d4a830` altın, 2px stroke
- Yazı: "FKA MARKET" veya "🍽️ RESTORAN", `#fde68a` sarı, bold 13px
- Tabela ışığı: altında `rgba(255,240,100,0.15)` hafif hale
- Köşe süsler: küçük yıldız veya nokta `#d4a830`

```
★ ╔══════════════════╗ ★
  ║  🍽️  FKA MARKET  ║   ← tabela (#1a1a2e + #fde68a)
  ╚══════════════════╝
  ░░░░░░░░░░░░░░░░░░░     ← ışık halesi
```

### 3.2 Kapı Önü Paspas
**Nereye:** Kapının hemen önünde, kaldırımda — x=590-690, y=752-762
**Görsel tarif:**
- Paspas zemini: `roundRect` 100x10, `#4a3828` koyu kahve
- Desen: yatay çizgiler `rgba(255,255,255,0.1)`, 2px aralıklı
- Kenar: `#2e2018`, 1px stroke
- Hafif gölge: `rgba(0,0,0,0.3)`

### 3.3 Çiçek Saksıları (Kapı Yanları)
**Nereye:** Kapının iki yanında — (555, 748) ve (725, 748)
**Görsel tarif:**
- Saksı: `roundRect` 20x18, `#c1440e` turuncu-kırmızı, trapez şekli
- Toprak: `#5c3317`, üst 6px
- Çiçekler: 3 adet küçük `arc` 4px, `#ff6b9d` pembe veya `#ff9f43` turuncu
- Yaprak: 2 adet `bezierCurveTo`, `#4a9a28` yeşil
- Gölge: `rgba(0,0,0,0.2)` elips

```
  🌸🌸🌸
  🌿🌿🌿
  ╭────╮   ← toprak
  │    │   ← saksı (#c1440e)
  ╰──╯
```

### 3.4 Bekleme Bankı
**Nereye:** Kaldırımda, kapının sağında — x=750-850, y=760-775
**Görsel tarif:**
- Bank oturma yüzeyi: `roundRect` 100x8, `#8B6914` ahşap sarısı, gradient
- Bank bacakları: 2 adet `roundRect` 6x12, `#555` koyu gri
- Ahşap çizgileri: 3 yatay çizgi `rgba(0,0,0,0.15)` tahta desen simüle eder
- Metal bağlantılar: köşelerde küçük `arc`, `#888`

```
 ══════════════════  ← oturma yüzeyi (#8B6914)
 │                │  ← ahşap çizgileri
 ╷              ╷    ← bacaklar (#555)
```

### 3.5 Yol Çizgileri / Yaya Geçidi
**Nereye:** Kaldırım ile yol arasında, kapı önünde — x=580-700
**Görsel tarif:**
- Beyaz şeritler: 4-5 adet `fillRect` 20x8, `rgba(255,255,255,0.6)`
- Eşit aralıklı, yaya geçidi simüle eder
- Hafif soluk (yıpranmış his için düşük alpha)

---

## 4. IŞIKLANDIRMA İYİLEŞTİRMELERİ

### 4.1 Gece Modu Overlay
**Ne zaman:** `dayPhase === 'night'` veya gün biterken
**Görsel tarif:**
- Tüm canvas üzerine `rgba(0,0,30,0.35)` koyu mavi overlay
- Pencerelerden sarı ışık sızması: `rgba(255,240,100,0.08)` dikey şeritler
- Sokak lambası ışığı daha belirgin: hale yarıçapı 2x büyür

### 4.2 Masa Üstü Işık Halesi (Gündüz)
**Görsel tarif:**
- Her masa üstünde `createRadialGradient`
- Merkez: `rgba(255,250,220,0.12)` → dış: `rgba(255,250,220,0)`
- 50px yarıçap, masanın tam üstünde

---

## 5. UYGULAMA SIRASI

| Öncelik | Özellik | Dosya | Süre |
|---------|---------|-------|------|
| 1 | Restoran tabelası | `drawFloor.ts → drawExterior()` | 30 dk |
| 2 | Kapı önü paspas + çiçek saksıları | `drawFloor.ts → drawExterior()` | 45 dk |
| 3 | Salon saksı bitkiler | `drawFloor.ts → drawFloor()` | 30 dk |
| 4 | Duvar tabloları | `drawFloor.ts → drawFloor()` | 45 dk |
| 5 | Menü panosu | `drawFloor.ts → drawFloor()` | 20 dk |
| 6 | Bekleme bankı | `drawFloor.ts → drawExterior()` | 20 dk |
| 7 | Mutfak arka duvar karoları | `drawFloor.ts → drawFloor()` | 30 dk |
| 8 | Havalandırma boruları | `drawFloor.ts → drawFloor()` | 30 dk |
| 9 | Arka duvar rafları | `drawFloor.ts → drawFloor()` | 45 dk |
| 10 | Tavan lambaları | `drawFloor.ts → drawFloor()` | 45 dk |

**Toplam tahmini süre:** ~5-6 saat

---

## 6. TEKNİK NOTLAR

- Tüm dekorasyonlar `drawFloor.ts`'e eklenir
- `drawFloorCached.ts` sayesinde her frame yeniden çizilmez, sadece state değişince
- `FLOOR_CACHE_VERSION` sayısını artırmayı unutma (şu an 14)
- Dekorasyonlar `drawFloor()` fonksiyonunun en sonuna eklenmeli (istasyonların üstüne çizilmesin)
- Dış alan dekorasyonları `drawExterior()` içine
- Salon dekorasyonları `drawFloor()` içine, `drawExterior()` çağrısından önce
