# TerraMarket — Backlog

Yapılmamış işler. Öncelik sırasına göre.

---

## 🔴 Öncelik 1 — Oyun Derinliği

### Çok Aşamalı Yemek (Combining)
Şu an tüm yemekler tek adım: malzeme → fırın → yemek.
Combining ile: pişmiş malzeme + başka malzeme = final yemek.
Etki: Co-op'ta iş bölümü doğuruyor, herkes farklı rol üstleniyor.
Detay: `combining-system.md`
Tahmini süre: ~4-5 saat

### Mahalle İtibarı
Her gün iyi servis yapınca itibar puanı artar (1-5 yıldız).
İtibar arttıkça yeni müşteri tipleri açılır, daha fazla müşteri gelir.
İtibar düşünce müşteri sayısı azalır.
Kalıcı ilerleme verir ama organik hissettiriyor.
Detay: `mahalle-itibari.md`
Tahmini süre: ~2-3 saat

### Floorplan Seçim Sistemi
Run başında 4 farklı restoran şekli: Klasik, L-Şekli, U-Şekli, Dar & Uzun.
Tahmini süre: ~2 saat

---

## 🟠 Öncelik 2 — İçerik

### Yeni Müşteri Tipleri
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
Tahmini süre: ~3-4 saat

### Ses
- Müşteri gelince farklı ses
- Combo sesi (şu an sessiz)
- Müşteri diyalogları için kısa bip sesi

### Quick Chat Emote Wheel
Mobile Legends tarzı — chat butonuna basılı tut, 4 yönde emote seç, bırakınca gönder.
Detay: `market-system.md` → Quick Chat Emote Sistemi bölümü

---

## 🟢 Öncelik 4 — Market & Kalıcı Para Sistemi

Terra Coin (TC) 🌍 ve Terra Gem (TG) 💎 para birimleriyle kalıcı ilerleme sistemi.
Detay: `market-system.md`

### Alt Görevler
- [ ] Database schema (users, user_items, achievements, daily_quests)
- [ ] User profile sistemi (TC/TG bakiye, seviye, XP)
- [ ] Kozmetik eşya sistemi (şapka, kıyafet, emote)
- [ ] Başarım sistemi
- [ ] Günlük görev sistemi
- [ ] Market UI
- [ ] Ana menü üst bar — TC/TG bakiye gösterimi (sadece menüde, oyun içinde yok)
- [ ] Karakter butonunu Profil'e dönüştür (karakter + bakiye + market erişimi)
- [ ] Ana menü butonlarındaki emojileri kaldır

---

## 🔵 Öncelik 5 — Sosyal & Platform

### Hesap Sistemi
- Google/Discord ile giriş (Supabase)
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

## 🔧 Teknik Borç

- `useGameLoop` refactoring (200+ satır monolith → modüler)
- Error handling sistemi (try-catch, network hataları)
- Configuration management (magic number'ları temizle)
- Testing infrastructure (unit/integration/e2e)
- Bundle size 455KB → 300KB altına indir (lazy loading)
