# TerraMarket — Backlog

Yapılmamış her şey burada. Öncelik sırasına göre.

---

## 🔴 Öncelik 1 — Şu An Üzerinde Çalışılan

### Kart Sistemi (card-system.md)
Her 3 günde bir gece ekranında 2 kart sunulur, biri seçilir.
Her kart bir şeyi zorlaştırır, karşılığında bir şey verir.
Detay: `card-system.md`

---

## 🟠 Öncelik 2 — Oyun Derinliği

### Çok Aşamalı Yemek (Combining)
Şu an tüm yemekler tek adım: malzeme → fırın → yemek.
Combining ile: pişmiş malzeme + başka malzeme = final yemek.
Örnek: Burger = Pişmiş Et + Ekmek (birleştirme tezgahında).
Etki: Co-op'ta iş bölümü doğuruyor, herkes farklı rol üstleniyor.

### Franchise / Kalıcı İlerleme
Game over olunca her şey sıfırlanıyor, devam etmek için sebep yok.
Belirli bir güne (örn. gün 15) ulaşınca 1-2 upgrade bir sonraki run'a taşınır.
Ama bir sonraki run daha zor başlar.

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

### Yeni Müşteri Tipleri
Şu an 4 tip var (polite, rude, recep, thug).
Eklenebilecekler:
- VIP müşteri — çok sabırsız ama 3x bahşiş bırakıyor
- Grup lideri — "Hepimiz aynı şeyi istiyoruz" diyerek toplu sipariş veriyor

### Combo Sistemi
Arka arkaya hızlı servis yapınca bonus puan.
3+ hızlı servis = ateş efekti + çarpan artar.

### Upgrade Sistemi Genişletme
- İkinci kesme tahtası unlock
- İkinci lavabo unlock
- Müşteri yeme hızı upgrade'i (masayı daha hızlı boşaltır)
- Bekleme listesi kapasitesi upgrade'i

### Yeni İstasyonlar
- 🥚 Omlet — tava istasyonu (yeni istasyon tipi)
- Baharat rafı — yemeğe eklenince +%20 bahşiş

---

## 🟢 Öncelik 4 — Görsel & His

### Animasyonlar
- Yemek pişince küçük ✨ efekti
- Müşteri memnun ayrılınca kalp animasyonu
- Gün/gece geçişinde kısa animasyon

### Zemin Kirliliği (Mess Sistemi)
Yemek hazırlarken ve müşteriler yerken zemine pislik düşer.
Pislik üzerinden yürüyünce yavaşlarsın.
Paspas alıp temizlemen gerekir.
PlateUp'ın kaos hissinin büyük kısmı buradan geliyor.

### Ses
- Müşteri gelince farklı ses
- Combo sesi
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
