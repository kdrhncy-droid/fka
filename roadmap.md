# TerraMarket — Yol Haritası

## Mevcut Durum (Gün 20)

Çalışan özellikler:
- Çok oyunculu gerçek zamanlı (Socket.io)
- 7 yemek (2 başlangıç, 5 unlock edilebilir)
- Fırın, fritöz, buzdolabı, kesme tahtası, lavabo
- Masa/istasyon layout editörü
- Upgrade sistemi (6 upgrade)
- Karakter özelleştirme
- BGM + SFX
- Tutorial overlay
- İstatistik kaydı (localStorage)
- Mobil + PC + PWA desteği

---

## Öncelik 1 — Oynanabilirlik (Acil)

Bunlar olmadan oyun sıkıcı hissettiriyor.

### Zorluk Dengesi
- [ ] ~~Gün 1 çok kolay, gün 5+ çok zor — eğri düzeltilmeli~~ (şimdilik dokunma)
- [ ] ~~Müşteri sabırsızlığı ilk günlerde daha affedici olmalı~~ (şimdilik dokunma)
- [ ] ~~Solo oyunda müşteri sayısı çok oyunculuya göre daha az olmalı~~ (şimdilik dokunma)

### Oyun Döngüsü Çeşitliliği
- [ ] Her gün farklı bir "özel olay" — indirim günü, VIP müşteri, acele sipariş
- [ ] Haftalık hedefler — "Bu hafta 500$ kazan" gibi
- [ ] Combo sistemi — arka arkaya hızlı servis yapınca bonus puan

### Müşteri Çeşitliliği
- [ ] Şu an 4 tip var (polite, rude, recep, thug) — 2-3 yeni tip ekle
- [ ] Grup siparişleri — "Hepimiz aynı şeyi istiyoruz" (şu an var ama görsel yok)
- [ ] VIP müşteri — çok sabırsız ama çok bahşiş bırakıyor

---

## Öncelik 2 — İçerik (Kısa Vadeli)

### Yeni Yemekler & İstasyonlar
- [ ] 🍰 Tatlı — fırında pişiyor, uzun süre ama yüksek bahşiş
- [ ] ☕ Kahve — buzdolabı gibi anında, ama kahve makinesi gerekiyor
- [ ] 🥚 Omlet — tava istasyonu (yeni istasyon)
- [ ] Baharat rafı — yemeğe eklenince +%20 bahşiş (strateji katmanı)

### Harita İyileştirmesi
- [ ] Mevcut haritada istasyonlar daha mantıklı yerleştirilmeli
- [ ] Servis penceresi daha belirgin olmalı (şu an kafa karıştırıcı)
- [ ] Mutfak ile salon arasındaki geçiş daha net olmalı

### Upgrade Sistemi Genişletme
- [ ] Bekleme listesi kapasitesi upgrade'i
- [ ] İkinci kesme tahtası unlock
- [ ] İkinci lavabo unlock
- [ ] Müşteri yeme hızı upgrade'i (daha hızlı masayı boşaltır)

---

## Öncelik 3 — Görsel & His (Orta Vadeli)

### Animasyonlar & Efektler
- [ ] Yemek pişince küçük "✨" efekti
- [ ] Müşteri memnun ayrılınca kalp animasyonu
- [ ] Combo streak göstergesi (3+ hızlı servis = ateş efekti)
- [ ] Gün geçişinde kısa animasyon (gün/gece geçişi)

### Görsel İyileştirmeler
- [ ] İstasyon görselleri daha detaylı (şu an emoji tabanlı)
- [ ] Müşteri karakterleri daha çeşitli
- [ ] Harita dekorasyonları — saksı, tablo, lamba (taşınabilir)
- [ ] Gece fazında ışıklandırma efekti (şu an var ama geliştirilebilir)

### Ses
- [ ] Daha fazla SFX — müşteri gelince farklı ses, combo sesi
- [ ] Müşteri diyalogları için ses efekti (kısa bip sesi)

---

## Öncelik 4 — Sosyal & Retention (Uzun Vadeli)

### Hesap Sistemi (Supabase)
- [ ] Google/Discord ile giriş
- [ ] Oyuncu profili — toplam oyun süresi, en yüksek skor
- [ ] Kalıcı karakter özelleştirmesi (şu an localStorage'da)

### Skor Tablosu
- [ ] Global skor tablosu — en yüksek günlük ciro
- [ ] Arkadaş skor tablosu
- [ ] Haftalık/aylık sıralama

### Sosyal Özellikler
- [ ] Oda şifresi — sadece davetliler girebilsin
- [ ] Oyun içi emoji reaksiyonları
- [ ] Oyun sonu ekranı — "Bu haftanın en iyi takımı" gibi

---

## Öncelik 5 — Platform (Çok Uzun Vadeli)

### PWA İyileştirmesi
- [ ] Gerçek uygulama ikonu (şu an CDN'den geliyor)
- [ ] Service worker — offline çalışma (menü ekranı)
- [ ] Push notification — "Arkadaşın seni oyuna davet etti"

### Play Store
- [ ] Bubblewrap ile TWA paketi oluştur
- [ ] Play Store developer hesabı ($25 tek seferlik)
- [ ] Store listing — ekran görüntüleri, açıklama

### Hosting
- [ ] Render.com ücretsiz → Railway/Fly.io ücretli (uyku modu yok)
- [ ] UptimeRobot ile render.com'u uyanık tut (ücretsiz geçici çözüm)

---

## Teknik Borç (Arka Planda)

Bunlar oyunu bozmaz ama temizlenmeli:

- [ ] `server.ts` çok büyük — handler'ları ayrı dosyalara taşı
- [ ] `GameScreen.tsx` 570 satır — bileşenlere böl
- [ ] `upgrade` event'inde input validation eksik
- [ ] `CharacterSelect.tsx` artık kullanılmıyor — sil
- [ ] useGameLoop dependency array eksik

---

## Öneri Sırası

```
Zorluk dengesi → Yeni yemekler → Görsel efektler → Skor tablosu → Hesap sistemi
```

Oyun eğlenceli olmadan hesap sistemi kurmak anlamsız.
Önce insanların oynamak isteyeceği bir oyun yap, sonra retention mekanizmaları ekle.
