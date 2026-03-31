# TerraMarket — Backlog

Yapılmamış işler. Öncelik sırasına göre.

---

## 🔴 Öncelik 1 — Oyun Derinliği

### Çok Aşamalı Yemek (Combining) — Tasarım hazır (combining-system.md)
Şu an tüm yemekler tek adım: malzeme → fırın → yemek.
Combining ile: pişmiş malzeme + başka malzeme = final yemek.
Etki: Co-op'ta iş bölümü doğuruyor, herkes farklı rol üstleniyor.
Tahmini süre: ~4-5 saat

### Mahalle İtibarı (PlateUp'ta yok — Franchise yerine)
Her gün iyi servis yapınca itibar puanı artar (1-5 yıldız).
İtibar arttıkça yeni müşteri tipleri açılır, daha fazla müşteri gelir.
İtibar düşünce müşteri sayısı azalır.
Kalıcı ilerleme verir ama organik hissettiriyor.
Tahmini süre: ~2-3 saat

### Floorplan Seçim Sistemi
Run başında 4 farklı restoran şekli: Klasik, L-Şekli, U-Şekli, Dar & Uzun.
Tahmini süre: ~2 saat

---

## 🟠 Öncelik 2 — İçerik (Özgün)

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
Tahmini süre: ~2-3 saat

---

## 🟡 Öncelik 3 — Görsel & His

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

## 🟢 Öncelik 4 — Sosyal & Platform

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

## ✅ Tamamlananlar (Son Oturum)

- Sipariş özelleştirme — 🌶️ Acı sistemi (baharat rafı, can kaybı mekanigi) ✅
- Baharat rafı layout editöründe taşınabilir ✅
- Etkileşim halkası tüm istasyonları kapsıyor ✅
- Unlock olmamış istasyonlarda halka görünmüyor ✅
- İçecek stok sistemi kaldırıldı (sınırsız) ✅
- `fridgeCapacity` upgrade kaldırıldı ✅
- Upgrade shop'ta unlock olmamış yemek upgrade'leri gizleniyor ✅
- Gece otomatik geçiş kaldırıldı ✅
- Ping eşikleri Render için güncellendi ✅
- Render keep-alive eklendi ✅
- BGM URL encoding düzeltildi ✅
- Başarı sesi kısaltıldı ✅
- Kod kalitesi iyileştirmeleri (code-quality.md) ✅
