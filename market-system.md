# 🏪 Market ve Kalıcı Para Sistemi Tasarımı

## 🎯 **NEDEN MANTIKLI?**

### **1. Oyuncu Bağlılığını Artırır**
- **Uzun vadeli hedefler** - Sadece günlük oyun değil, kalıcı ilerleme
- **Kişiselleştirme** - Oyuncu karakterini kendine göre özelleştirir
- **Koleksiyon hissi** - "Tüm şapkaları toplamak istiyorum"
- **Sosyal statü** - Nadir eşyalarla diğer oyunculara gösteriş

### **2. Oyun Deneyimini Zenginleştirir**
- **Çeşitlilik** - Her oyuncu farklı görünür
- **Motivasyon** - "Bu eşyayı almak için daha iyi oynamalıyım"
- **Sosyal etkileşim** - "Şu şapka çok güzel, nereden aldın?"
- **Replayability** - Sürekli yeni hedefler

### **3. Sürdürülebilir Gelir Modeli**
- **Etik monetization** - Pay-to-win değil, pay-for-cosmetics
- **Uzun vadeli gelir** - Tek seferlik satış değil, sürekli
- **Düşük barrier** - Küçük miktarlar, erişilebilir fiyatlar
- **Gönüllü** - Zorla değil, isteyerek satın alma

---

## 💰 **KALICI PARA SİSTEMİ**

### **Para Birimleri**

#### **🌍 Terra Coin (TC) - Ana Para**
```
Kazanma Yolları:
✅ Gün tamamlama: 50-100 TC
✅ Yüksek skor bonusu: 20-50 TC
✅ Günlük görevler: 25-75 TC
✅ Başarım açma: 50-200 TC
✅ Reklam izleme: 25 TC (günde 5 kez)
✅ Arkadaş davet etme: 100 TC

Kullanım Alanları:
- Temel kozmetik eşyalar
- Convenience upgrades
- Profil özelleştirmeleri
```

#### **💎 Terra Gem (TG) - Premium Para**
```
Kazanma Yolları:
✅ Haftalık challenge: 10-25 TG
✅ Combo rekoru: 5-15 TG
✅ Özel etkinlikler: 20-50 TG
✅ Seviye atlama: 5-10 TG
✅ Satın alma: $0.99-$4.99

Kullanım Alanları:
- Nadir kozmetik eşyalar
- Özel efektler
- Premium temalar
- Battle pass
```

#### **⭐ XP (Deneyim Puanı)**
```
Kazanma Yolları:
✅ Her oyun: 10-50 XP
✅ İyi performans: +%25 XP bonus
✅ Takım oyunu: +%15 XP bonus
✅ Günlük ilk oyun: 2x XP

Faydaları:
- Seviye atlama
- Yeni içerik açma
- Prestij sistemi
```

---

## 🏪 **MARKET KATEGORİLERİ**

### **1. 👕 Kozmetik Eşyalar**

#### **Şapkalar & Aksesuarlar**
```
🧢 Beyzbol Şapkası: 150 TC
👑 Altın Taç: 500 TC
🎀 Pembe Kurdele: 200 TC
🎩 Sihirbaz Şapkası: 300 TC
👨‍🍳 Aşçı Şapkası: 250 TC
🐱 Kedi Kulakları: 400 TC
🔥 Alev Efekti: 100 TG
✨ Yıldız Efekti: 150 TG
```

#### **Kıyafetler**
```
👨‍🍳 Klasik Aşçı Önlüğü: 300 TC
🌈 Gökkuşağı Önlük: 450 TC
🖤 Goth Kıyafeti: 600 TC
🎯 Sporcu Kıyafeti: 350 TC
👔 Takım Elbise: 800 TC
🦸 Süper Kahraman: 200 TG
```

#### **Emote'lar & Animasyonlar**
```
👍 Başparmak: 50 TC
🕺 Victory Dance: 150 TC
😎 Cool Pose: 100 TC
🤝 Takım Selamı: 200 TC
🔥 Combo Celebration: 100 TG
⚡ Speed Boost Efekti: 150 TG
```

### **2. 💬 Quick Chat Emote Sistemi**

Mobile Legends tarzı — chat butonuna **basılı tut**, 4 yönde seçenek çıkar, **bırakınca** gönderilir.

#### **Nasıl Çalışır?**
```
1. Oyuncu chat butonuna basılı tutar
2. Etrafında 4 yönde emote/mesaj belirir (↑ ↓ ← →)
3. Parmağı/mouse'u istediği yöne kaydırır
4. Bırakınca karakter üzerinde emote gösterilir
5. Diğer oyuncular görür
```

#### **Varsayılan 4 Slot (Ücretsiz)**
```
↑  "Tamam! 👍"
↓  "Yardım! 🆘"
←  "Teşekkürler! 🙏"
→  "Harika! 🔥"
```

#### **Özelleştirilebilir Emote Slotları**
```
Her slot ayrı ayrı değiştirilebilir:

Ücretsiz Emote'lar:
👍 Tamam        🆘 Yardım
🙏 Teşekkürler  🔥 Harika
😅 Ups!         ⚡ Hızlan!
🍽️ Servis!      🧹 Temizle!

TC ile Alınan Emote'lar:
🕺 Victory Dance: 150 TC
😎 Cool Pose: 100 TC
🤝 Takım Selamı: 200 TC
👨‍🍳 Şef Selamı: 120 TC
🎉 Parti: 180 TC
😤 Sinirli: 80 TC

TG ile Alınan Emote'lar:
🔥 Combo Celebration: 100 TG  ← Animasyonlu
⚡ Speed Boost Efekti: 150 TG  ← Animasyonlu
💎 VIP Selamı: 200 TG          ← Animasyonlu + ses
```

#### **Teknik Uygulama**
```typescript
// Quick chat wheel
interface QuickChatSlot {
  direction: 'up' | 'down' | 'left' | 'right';
  emoteId: string;
  label: string;
  icon: string;
  isAnimated?: boolean;
}

interface PlayerEmoteConfig {
  playerId: string;
  slots: QuickChatSlot[]; // 4 slot
}

// Emote event
interface EmoteEvent {
  playerId: string;
  emoteId: string;
  x: number;
  y: number;
  timestamp: number;
}
```

#### **Görsel Gösterim**
```
Emote gönderilince:
- Karakter üzerinde balon çıkar (3 saniye)
- Yakındaki oyuncular görür (mesafe: 300px)
- Animasyonlu emote'lar özel efekt gösterir
```

---

### **3. 🎨 Tema ve Özelleştirme**

#### **Mutfak Temaları**
```
🏖️ Plaj Teması: 400 TC
🌸 Sakura Teması: 600 TC
🌙 Gece Teması: 500 TC
🎄 Noel Teması: 300 TC (sezonluk)
🚀 Uzay Teması: 250 TG
🏰 Ortaçağ Teması: 300 TG
```

#### **UI Özelleştirmeleri**
```
🎵 Özel Müzik Paketi: 200 TC
🔊 Ses Efekti Paketi: 150 TC
💬 Chat Emoji Paketi: 100 TC
🏆 Profil Çerçevesi: 300 TC
📊 Gelişmiş İstatistik: 250 TC
```

### **3. ⚡ Convenience Upgrades**

#### **Gameplay Yardımcıları (Dikkatli!)**
```
🍽️ +1 Başlangıç Tabağı: 200 TC
⏰ %5 Uzun Müşteri Sabrı: 300 TC
🔥 %10 Az Yanma Riski: 400 TC
📈 2x XP Boost (1 saat): 50 TC
💰 %20 TC Bonus (1 gün): 100 TC

⚠️ ÖNEMLI: Pay-to-win olmamalı!
Sadece convenience, skill advantage değil!
```

### **4. 🎁 Paketler & Bundle'lar**

#### **Başlangıç Paketi**
```
🎁 Yeni Oyuncu Paketi: 500 TC
İçerik:
- 2 şapka seçeneği
- 1 kıyafet
- 3 emote
- 7 günlük XP boost
```

#### **Sezonluk Paketler**
```
🎃 Halloween Paketi: 150 TG
🎄 Noel Paketi: 150 TG
💝 Sevgililer Günü: 100 TG
🌸 İlkbahar Paketi: 125 TG
```

---

## 📊 **PROGRESSION SİSTEMİ**

### **Seviye Sistemi**
```
Seviye 1-10: Temel özellikler
Seviye 11-25: Yeni kozmetikler açılır
Seviye 26-50: Premium içerik erişimi
Seviye 51-100: Prestij sistemi

Her seviyede:
- TC ödülü (50-200)
- Yeni eşya unlock
- Özel başarım
```

### **Başarım Sistemi**
```
🔥 İlk Combo: 50 TC
⚡ Hız Şeytanı (10 combo): 100 TC
🤝 Takım Oyuncusu (50 co-op oyun): 200 TC
⭐ Mükemmeliyetçi (sıfır hata): 150 TC
👑 Combo Kralı (25 combo): 50 TG
🏆 Efsane (100 oyun): 100 TG
💎 Koleksiyoncu (50 eşya): 200 TG
```

### **Günlük Görevler**
```
📅 Her Gün Yenilenen:
- 3 oyun oyna: 50 TC
- 1 combo yap: 25 TC  
- Arkadaşla oyna: 75 TC
- Yeni rekor kır: 100 TC

📅 Haftalık Challenge:
- 20 oyun tamamla: 25 TG
- 500 müşteri servis et: 50 TG
- 10 farklı arkadaşla oyna: 75 TG
```

---

## 🛠️ **TEKNİK UYGULAMA**

### **Database Yapısı**
```sql
-- Kullanıcı profili
users (
  id, username, email, created_at,
  level, experience, terra_coins, terra_gems,
  total_games, best_score, playtime
)

-- Sahip olunan eşyalar  
user_items (
  user_id, item_id, purchased_at,
  equipped, purchase_price
)

-- Başarımlar
user_achievements (
  user_id, achievement_id, 
  unlocked_at, progress
)

-- Günlük görevler
daily_quests (
  user_id, quest_id, progress,
  completed_at, reward_claimed
)
```

### **Anti-Cheat Sistemi**
```typescript
// Server-side validation
function validateTCEarn(userId: string, amount: number, source: string) {
  // Makul kazanç mı?
  // Çok hızlı kazanım var mı?
  // Kaynak geçerli mi?
  // Rate limiting
}

function validatePurchase(userId: string, itemId: string) {
  // Yeterli bakiye var mı?
  // Eşya zaten sahip mi?
  // Fiyat manipülasyonu var mı?
}
```

### **Sync Sistemi**
```typescript
// Client-server senkronizasyonu
interface UserProfile {
  terraCoins: number;
  terraGems: number;
  level: number;
  experience: number;
  ownedItems: string[];
  equippedItems: Record<string, string>;
}

// Offline-online sync
// Conflict resolution
// Data integrity
```

---

## 💡 **MONETIZATION STRATEJİSİ**

### **Etik Yaklaşım**
```
✅ YAPILMALI:
- Sadece kozmetik eşyalar
- Makul fiyatlar ($0.99-$4.99)
- Ücretsiz coin kazanma yolları
- Reklam izleyerek ödül
- Şeffaf fiyatlandırma

❌ YAPILMAMALI:
- Pay-to-win mekanikler
- Loot box / gacha
- Agresif satış taktikleri
- Çocuklara yönelik manipülasyon
- Zorunlu satın alma
```

### **Fiyat Stratejisi**
```
💰 TC Paketleri:
- 500 TC: $0.99
- 1200 TC: $1.99 (%20 bonus)
- 2500 TC: $3.99 (%25 bonus)
- 6000 TC: $7.99 (%30 bonus)

💎 TG Paketleri:
- 50 TG: $0.99
- 120 TG: $1.99 (%20 bonus)
- 300 TG: $4.99 (%25 bonus)

🎁 Özel Teklifler:
- Başlangıç paketi: $2.99 (ilk hafta)
- Battle pass: $4.99 (aylık)
- Sezonluk paket: $1.99
```

---

## 🎮 **OYUNCU DENEYİMİ**

### **Günlük Rutin**
```
1. 🎁 Günlük ödül al
2. 📋 Görevleri kontrol et
3. 🎮 Arkadaşlarla oyna
4. 🌍 TC kazan
5. 🏪 Market'i kontrol et
6. 📊 İlerlemeyi gör
7. 🎯 Hedef belirle
```

### **Uzun Vadeli Hedefler**
```
🎯 Kısa Vade (1 hafta):
- Yeni şapka al
- 5 seviye atla
- Günlük görevleri tamamla

🎯 Orta Vade (1 ay):
- Seviye 25'e ulaş
- Nadir eşya topla
- Tüm başarımları aç

🎯 Uzun Vade (3+ ay):
- Seviye 50+ prestij
- Legendary koleksiyonu
- Leaderboard zirvesi
```

---

## 🚨 **RİSK YÖNETİMİ**

### **Potansiyel Problemler**
```
⚠️ Pay-to-win algısı
→ Çözüm: Sadece kozmetik odaklan

⚠️ Grind zorluğu  
→ Çözüm: Makul kazanma oranları

⚠️ FOMO baskısı
→ Çözüm: Kalıcı eşyalar, rotasyon yok

⚠️ Çocuk güvenliği
→ Çözüm: Ebeveyn kontrolü, limit

⚠️ Ekonomi dengesizliği
→ Çözüm: A/B test, data analizi
```

### **Başarı Metrikleri**
```
📈 İzlenecek KPI'lar:
- Günlük aktif kullanıcı (DAU)
- Retention rate (7/30 gün)
- ARPU (Average Revenue Per User)
- Conversion rate (free → paid)
- Session length
- Churn rate
```

---

## 🎯 **SONUÇ**

### **Neden Bu Sistem Mantıklı?**

1. **Oyuncu Bağlılığı** - Uzun vadeli hedefler, sürekli ilerleme
2. **Kişiselleştirme** - Her oyuncu kendine özgü karakter
3. **Sosyal Etkileşim** - Eşya gösterisi, koleksiyon paylaşımı
4. **Sürdürülebilir Gelir** - Etik monetization, uzun vadeli
5. **Rekabet Avantajı** - Diğer oyunlardan farklılaşma

### **Başarı İçin Kritik Faktörler**

✅ **Etik sınırları aşmamak**
✅ **Eğlenceyi bozmamak** 
✅ **Makul fiyatlandırma**
✅ **Sürekli içerik güncellemesi**
✅ **Topluluk geri bildirimini dinlemek**

**Bu sistem oyunu bir sonraki seviyeye taşır ve uzun vadeli başarı sağlar!** 🚀

---

*Son güncelleme: 2024*
*Tasarım: TerraMarket Geliştirme Ekibi*