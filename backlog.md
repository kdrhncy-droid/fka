# TerraMarket — Backlog

Yapılmamış her şey burada. Öncelik sırasına göre.

---

## 🔴 Öncelik 1 — Eksik Kart Efektleri (Hızlı Fix)

Kart sistemi var ama bazı kartların efektleri eksik:

- `mystery_guests` — kişilik gizleme flag'i var ama müşteri sabır barı UI'da hâlâ görünüyor
- `kaos_day` — tanımlı ama istasyon pozisyonu değiştirme mantığı yok
- `vip_day` — VIP müşteri tipi yok, kart seçilince hiçbir şey olmuyor

---

## 🟠 Öncelik 2 — Oyun Derinliği

### Çok Aşamalı Yemek (Combining)
Şu an tüm yemekler tek adım: malzeme → fırın → yemek.
Combining ile: pişmiş malzeme + başka malzeme = final yemek.
Örnek: Burger = Pişmiş Et + Ekmek (birleştirme tezgahında).
Etki: Co-op'ta iş bölümü doğuruyor, herkes farklı rol üstleniyor.
Tahmini süre: ~4-5 saat

### Franchise / Kalıcı İlerleme
Game over olunca her şey sıfırlanıyor, devam etmek için sebep yok.
Belirli bir güne (örn. gün 15) ulaşınca 1-2 upgrade bir sonraki run'a taşınır.
Ama bir sonraki run daha zor başlar.
Tahmini süre: ~2-3 saat

### Floorplan Seçim Sistemi
Run başında 4 farklı restoran şekli: Klasik, L-Şekli, U-Şekli, Dar & Uzun.
Her şekil farklı duvar/kapı/masa/istasyon konfigürasyonu.
Teknik detay:
- `shared/types.ts`'e `FloorplanDef` ekle
- `drawFloor.ts` ve `usePlayerMovement.ts` dinamik hale getir
- `WelcomeScreen`'e seçim kartları ekle
- `join` event'ine `floorplanId` parametresi ekle
Tahmini süre: ~2 saat

---

## 🟡 Öncelik 3 — İçerik

### VIP Müşteri Tipi
Çok sabırsız ama 3x bahşiş bırakıyor. Altın rengi, özel görünüm.
`vip_day` kartı zaten var ama VIP tipi yok.
Tahmini süre: ~1 saat

### Animasyonlar (Eksik Olanlar)
Şu an var: floating tip text, punch particles, combo text, duman, ışıklandırma.
Eksik olanlar:
- Yemek pişince ✨ efekti (fırın üstünde)
- Müşteri memnun ayrılınca ❤️ animasyonu
- Gün/gece geçişinde kısa fade animasyonu
Tahmini süre: ~1-2 saat

### Upgrade Sistemi Genişletme
Şu an var: extraSink, extraChopBoard eklendi.
Hâlâ eksik:
- Müşteri yeme hızı upgrade'i (masayı daha hızlı boşaltır)
- Bekleme listesi kapasitesi upgrade'i
Tahmini süre: ~30 dakika

### Yeni İstasyonlar
- 🥚 Omlet — tava istasyonu (yeni istasyon tipi)
- Baharat rafı — yemeğe eklenince +%20 bahşiş
Tahmini süre: ~2-3 saat

---

## 🟢 Öncelik 4 — Görsel & His

### Zemin Kirliliği (Mess Sistemi)
Yemek hazırlarken ve müşteriler yerken zemine pislik düşer.
Pislik üzerinden yürüyünce yavaşlarsın.
Paspas alıp temizlemen gerekir.
PlateUp'ın kaos hissinin büyük kısmı buradan geliyor.
Tahmini süre: ~3-4 saat

### Ses
- Müşteri gelince farklı ses
- Combo sesi (şu an sessiz)
- Müşteri diyalogları için kısa bip sesi

---

## 🔵 Öncelik 5 — Sosyal & Platform

### Hesap Sistemi
- Google/Discord ile giriş (Supabase)
- Oyuncu profili — toplam oyun süresi, en yüksek skor
- Kalıcı karakter özelleştirmesi

### Skor Tablosu
- Global skor tablosu
- Arkadaş skor tablosu

### Sosyal
- Oda şifresi
- Oyun içi emoji reaksiyonları

### PWA & Play Store
- Service worker (offline menü ekranı)
- Bubblewrap ile TWA paketi
- Play Store listing

---

## ⚙️ Teknik Borç

- `upgrade` event'inde input validation eksik
- `useGameLoop` dependency array eksik
- `drawPerfStats.ts` var ama hiç çağrılmıyor (showPerfStats flag'i var ama bağlantı kopuk)
