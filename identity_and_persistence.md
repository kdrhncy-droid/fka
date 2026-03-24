# Kimlik & Kalıcılık Önerileri

## Mevcut Durum

| Alan | Durum |
|---|---|
| Oyuncu adı / karakter | Her oturumda sıfırlanıyor |
| Skor / gün / upgrade | Sunucu bellekte, oda kapanınca gidiyor |
| Ayarlar (ses, HUD) | ✅ localStorage'da kalıcı |
| Hesap / profil | Yok |
| Görsel logo / sprite | Yok (sprites/ klasörü boş) |

---

## Öneri 1 — Hafif Kalıcılık (localStorage, backend yok)

En az iş, en hızlı etki. Sunucu değişmez.

### Ne kaydedilir?
```
terracraft-profile: { name, charType, lastRoomId }
terracraft-bestrun: { maxDay, maxScore, date }
```

### Nerede yapılır?
- `App.tsx` — `playerName` ve `charType` state'leri mount'ta localStorage'dan okunur, değişince yazılır
- `useSettings.ts` — mevcut pattern'e eklenir, ayrı bir `useProfile` hook'u yapılabilir
- `GameScreen` veya `useGameState` — game over anında `bestrun` güncellenir

### Avantaj
- Sıfır backend değişikliği
- Oyuncu adını her seferinde yazmak zorunda kalmaz
- "En iyi koşun: Gün 7, 1240 puan" gibi basit bir motivasyon ekranı yapılabilir

---

## Öneri 2 — Görsel Kimlik Tutarlılığı

### Sorun
Menü UI (Tailwind, `#0f0e0c`, amber vurgu) ile oyun içi canvas (emoji + düz renkler) arasında görsel köprü yok.

### Öneriler

**Kısa vadeli (kolay):**
- `WelcomeScreen`'e emoji logo yerine SVG veya styled `<canvas>` ile küçük bir animasyon ekle
- Karakter seçiminde `CHARACTER_TYPES[n].bodyColor` ve `accent` renklerini önizleme olarak göster (şu an sadece emoji var)
- Oyun içi HUD fontunu (`font-black tracking-widest`) canvas'taki skor/gün yazılarıyla eşleştir

**Orta vadeli:**
- `public/sprites/` klasörüne karakter sprite sheet'leri ekle, `drawPlayer.ts`'i emoji'den sprite'a geçir
- Menü arka planına oyun sahnesini andıran bir canvas animasyonu koy (idle mutfak sahnesi)

**Uzun vadeli:**
- Gerçek bir logo (SVG) — "TerraMarket" wordmark + tava/çatal ikonu
- Renk token sistemi: şu an Tailwind class'ları dağınık, `src/styles/tokens.ts` gibi bir merkezi yer

---

## Öneri 3 — Sunucu Taraflı Kalıcılık (opsiyonel, büyük iş)

Eğer gerçek hesap sistemi istenirse:

- `server.ts`'e basit bir `rooms` Map'i yerine SQLite (better-sqlite3) veya Redis ekle
- Oda state'ini periyodik olarak serialize et → oda kodu ile geri yüklenebilir
- Oyuncu kimliği için UUID tabanlı anonim token (cookie/localStorage), kayıt formu yok

> Bu öneri şu an için overkill. Önce Öneri 1'i yap.

---

## Tavsiye Edilen Sıra

1. `useProfile` hook'u yaz → ad + karakter kalıcı olsun (1-2 saat)
2. Game over ekranında "En İyi Koşun" göster (30 dk)
3. Karakter önizlemesini iyileştir — renk/accent göster (1 saat)
4. Canvas HUD yazı stilini menüyle eşleştir (30 dk)
5. Sprite sistemi — sadece hazır asset varsa (büyük iş, sonraya bırak)
