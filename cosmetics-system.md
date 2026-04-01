# Kozmetik Sistem Tasarımı

## Sorun
Şu anki market çok basit — emoji şapka, renk seçimi. Kimse bunun için coin harcamaz.
İnsanların hava atabileceği, "bu ne?" dedirten şeyler lazım.

---

## Yeni Kozmetik Kategorileri

### 1. Unvan / Rozet (EN ÖNEMLİ)
İsim etiketinin altında küçük renkli yazı. Oyun içinde herkese görünür.

```
┌─────────────┐
│ ★ Ahmet     │  ← isim
│ 👑 PATRON   │  ← unvan (renkli, küçük)
└─────────────┘
```

**Örnekler:**
- 👑 PATRON — 500 coin, epic
- 🔥 EFSANE — 400 coin, epic  
- ⚡ HIZLI — 200 coin, rare
- 🍳 ŞEF — 150 coin, rare
- 🌶️ ACIMAZ — 150 coin, rare
- 💀 KORKU — 300 coin, epic
- 🌟 YENİ BAŞLAYAN — 50 coin, common (ironi)
- 🧹 TEMİZLİKÇİ — 50 coin, common

**Teknik:** `drawPlayer.ts`'de isim etiketinin altına ikinci satır çiz.

---

### 2. Karakter Renk Seti (HAVA ATAR)
Tek tıkla saç + kıyafet + etiket rengi birlikte değişir. İsimli setler.

| Set Adı | Saç | Kıyafet | Etiket | Fiyat | Nadirlik |
|---------|-----|---------|--------|-------|---------|
| Altın Şef | #DAA520 | #B8860B | #FFD700 | 400 | Epic |
| Gece Karası | #1a1a1a | #0a0a0a | #6366f1 | 300 | Rare |
| Neon Pembe | #FF69B4 | #FF1493 | #FF69B4 | 350 | Rare |
| Okyanus | #00CED1 | #006994 | #00BFFF | 300 | Rare |
| Orman | #228B22 | #2d5a27 | #4ade80 | 250 | Rare |
| Kan Kırmızı | #8B0000 | #DC143C | #FF4444 | 350 | Epic |
| Buz Mavisi | #B0E0E6 | #4682B4 | #60a5fa | 250 | Rare |
| Klasik Beyaz | #f1c27d | #f5f5f4 | #ffffff | 100 | Common |

**Teknik:** `profile.ts`'e `equippedColorSet` ekle. Satın alınca 3 rengi birden uygula.

---

### 3. İsim Etiketi Efekti (GÖZ ÇARPAR)
Canvas'ta isim etiketi farklı çizilir.

| Efekt | Açıklama | Fiyat | Nadirlik |
|-------|----------|-------|---------|
| Parlayan | Etrafında glow efekti | 300 | Rare |
| Yanıp Sönen | Renk titreşimi | 400 | Epic |
| Gökkuşağı | Renk döngüsü (animasyonlu) | 600 | Epic |
| Altın Çerçeve | Etiket etrafında altın border | 250 | Rare |

**Teknik:** `drawPlayer.ts`'de `p.labelEffect` kontrol et, canvas shadow/glow uygula.

---

### 4. Servis Efekti (OYUN İÇİ FARK)
Müşteriye yemek verince özel partikül çıkar. Sadece görsel, oyunu etkilemez.

| Efekt | Görünüm | Fiyat | Nadirlik |
|-------|---------|-------|---------|
| Yıldız Patlaması | ✨✨✨ | 400 | Epic |
| Kalp Yağmuru | ❤️❤️❤️ | 300 | Rare |
| Ateş | 🔥🔥 | 350 | Rare |
| Para | 💰💰 | 250 | Rare |

**Teknik:** `drawPlayer.ts` veya ayrı bir `drawEffects.ts` — servis anında partikül spawn et.

---

## Öncelik Sırası

> **Kural:** Yeni şey eklemeden önce mevcut olanı düzgün çalıştır.

### Aşama 0 — Mevcut Sistemi İyileştir (ÖNCE BU)
Şu anki market/kozmetik sistemi yarım:
- Emoji şapka çok basit, canvas'ta düzgün render edilmiyor
- Renk seçimi profil + market arasında tutarsız
- Market görsel olarak zayıf, item önizlemesi yok
- Satın alınan itemlar oyun içinde tam yansımıyor

**Yapılacaklar:**
1. Mevcut şapka sistemini kaldır veya canvas'ta gerçekten çizilen bir şapkaya dönüştür
2. Market item kartlarına canlı karakter önizlemesi ekle
3. Renk seti kavramını mevcut renk seçimine entegre et (isimli setler)
4. Satın alınan itemların oyun içinde %100 çalıştığını doğrula

### Aşama 1 — Unvan Sistemi
Mevcut sistem iyileştirildikten sonra.

### Aşama 2 — Renk Setleri
Unvan sistemi çalıştıktan sonra.

### Aşama 3 — Etiket Efektleri
Renk setleri çalıştıktan sonra.

### Aşama 4 — Servis Efektleri
En son, en karmaşık.

---

## Profile Değişiklikleri

```typescript
interface PlayerProfile {
  // mevcut...
  equippedTitle: string;      // unvan id'si
  equippedColorSet: string;   // renk seti id'si  
  equippedLabelEffect: string; // etiket efekti id'si
  equippedServiceEffect: string; // servis efekti id'si
}
```

## Player Değişiklikleri

```typescript
interface Player {
  // mevcut...
  title?: string;        // unvan
  labelEffect?: string;  // etiket efekti
  serviceEffect?: string; // servis efekti
}
```

---

## Market Görünümü

Şu anki kategoriler yerine:

```
[🏆 Unvanlar] [🎨 Renk Setleri] [✨ Etiket Efektleri] [💥 Servis Efektleri]
```

Her item kartında:
- Büyük görsel önizleme (canvas render)
- İsim + nadirlik
- Fiyat
- "Önizle" butonu — satın almadan önce karakterde göster
