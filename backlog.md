# TerraMarket — Backlog

Yapılmamış her şey burada. Öncelik sırasına göre.

---

## 🔴 Öncelik 1 — Tamamlandı ✅

- `mystery_guests` — sabır barları gizleniyor ✅
- `kaos_day` — istasyon pozisyonu değişiyor ✅
- Animasyonlar — ✨ ve ❤️ eklendi ✅

---

## 🟠 Öncelik 2 — Oyun Derinliği

### Sipariş Özelleştirme (PlateUp'ta yok — özgün)
Müşteri bazen "acı olsun", "az pişmiş", "ekstra sos" gibi özel istek ekler.
Doğru yapınca +%50 bahşiş, yanlış yapınca can kaybı.
Görsel: sipariş balonunda yemek emojisinin yanında küçük bir ikon.
Tahmini süre: ~2-3 saat

### Mahalle İtibarı (PlateUp'ta yok — Franchise yerine)
Her gün iyi servis yapınca itibar puanı artar (1-5 yıldız).
İtibar arttıkça yeni müşteri tipleri açılır, daha fazla müşteri gelir.
İtibar düşünce müşteri sayısı azalır.
Kalıcı ilerleme verir ama organik hissettiriyor.
Tahmini süre: ~2-3 saat

### Çok Aşamalı Yemek (Combining)
Şu an tüm yemekler tek adım: malzeme → fırın → yemek.
Combining ile: pişmiş malzeme + başka malzeme = final yemek.
Etki: Co-op'ta iş bölümü doğuruyor, herkes farklı rol üstleniyor.
Tahmini süre: ~4-5 saat

### Floorplan Seçim Sistemi
Run başında 4 farklı restoran şekli: Klasik, L-Şekli, U-Şekli, Dar & Uzun.
Tahmini süre: ~2 saat

---

## 🟡 Öncelik 3 — İçerik (Özgün)

### Yeni Müşteri Tipleri (PlateUp'ta yok)
- **Esnaf** — mahalleden tanıdık, çok sabırlı ama bahşiş vermez
- **Dedektif** — yemeği uzun inceler, çok yavaş yer ama 5x bahşiş bırakır
- **Grup lideri** — toplu sipariş verir, tek seferde servis edilmeli

### Upgrade Sistemi Genişletme
- Müşteri yeme hızı upgrade'i (masayı daha hızlı boşaltır)
- Bekleme listesi kapasitesi upgrade'i
Tahmini süre: ~30 dakika

### Yeni İstasyonlar
- 🥚 Omlet — tava istasyonu
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
