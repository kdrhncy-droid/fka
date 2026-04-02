# Oyun Tasarım Analizi — FKA Market

> Bu belge oyunun mevcut durumunu, eksiklerini ve önceliklerini oyun tasarımı perspektifinden değerlendirir.

---

## 1. Temel Oyun Döngüsü

Bir oyunun kalbi döngüdür. Oyuncu bunu yüzlerce kez yapar. Eğer döngü sıkıcıysa oyun biter.

### Mevcut Döngü

```
Malzeme al → Fırına koy → Pişince tabağa al → Müşteriye servis et → Kirli masayı temizle → Tekrar
```

### Döngü Testi: 3 Soru

| Soru | Cevap |
|------|-------|
| Oyuncu ne yapıyor? | Yemek hazırlıyor ve servis ediyor |
| Neden yapıyor? | Müşteri bekliyor, sabır tükeniyor |
| İyi yapınca ne oluyor? | Puan + bahşiş + combo |
| Kötü yapınca ne oluyor? | Can kaybı, müşteri kaçıyor |

**Sonuç:** Döngü anlaşılır. Ama hız ve tatmin eksik.

### Döngünün Olması Gereken Özellikleri

- **Anlaşılır:** Oyuncu ne yapacağını bilmeli → ✅ var
- **Hızlı:** Her adım akıcı olmalı → ⚠️ kısmen var
- **Tatmin verici:** Her servis "ding" hissettirmeli → ❌ zayıf
- **Tekrar sıkmamalı:** Çeşitlilik olmalı → ⚠️ kısmen var

---

## 2. Feedback Sistemi

> Oyuncu oyunu mantıkla değil hisle oynar. Feedback = oyunun oyuncuya verdiği cevap.

### Mevcut Feedback Durumu

| Eylem | Ses | Görsel | Değerlendirme |
|-------|-----|--------|---------------|
| Doğrama | ✅ var | ❌ yok | Ses var ama görsel yok |
| Servis | ✅ var | ⚠️ zayıf | Servis efekti var ama küçük |
| Müşteri sinirlenme | ❌ yok | ⚠️ dialog var | Animasyon yok |
| Müşteri kaçma | ✅ ses var | ✅ 💔 -1 animasyonu | ✅ Tamamlandı |
| Combo | ✅ yazı var | ✅ ekran kenarı efekti | ✅ Tamamlandı |
| Can kaybı | ✅ ses var | ✅ kırmızı ekran flash | ✅ Tamamlandı |
| Yemek yanma | ✅ ses var | ⚠️ renk değişiyor | Duman efekti yok |
| Gece upgrade | ✅ ses var | ✅ modal var | İyi |

### Eksik Feedback'ler (Öncelik Sırasıyla)

1. **Müşteri kaçınca** — kalp kırılması animasyonu + ekran kısa titremesi
2. **Can kaybı** — ekran kırmızı flash (0.3 sn)
3. **Combo x5+** — ekran kenarı ateş efekti
4. **Doğrama** — görsel talaş/parçacık efekti
5. **Yemek yanma** — duman partikülleri

### Feedback Kuralları

- **Anında:** 0 gecikme. Oyuncu bir şey yapınca hemen cevap gelmeli.
- **Net:** Ne olduğu anlaşılmalı. "Başarı" ve "başarısızlık" farklı hissettirmeli.
- **Güçlü ama abartısız:** Hissedilmeli ama oyunu boğmamalı.

---

## 3. Risk ve Ceza Sistemi

> Risk yoksa heyecan yok. Ama ceza adil olmalı.

### Mevcut Durum

- **3 kalp sistemi** ✅ — iyi tasarım
- **Müşteri kaçınca can kaybı** ✅ — mantıklı
- **Yanlış yemek servis** ✅ — can kaybı
- **Müşteri dövme** ✅ — intikam riski

### Sorunlar

**Müşteri neden kaçtı net görünmüyor:**
- Sabır barı var ama küçük ve dikkat çekmiyor
- Oyuncu "oyun saçma" değil "ben geç kaldım" demeli
- Çözüm: Sabır barı kritik seviyede kırmızı + titreme animasyonu

**Ceza öğretici değil:**
- Can kaybı olunca sadece kalp değişiyor
- "Hangi müşteri kaçtı" net gösterilmiyor
- Çözüm: Kaçan müşterinin üzerinde kısa "💔 -1" animasyonu

**İntikam sistemi:**
- Var ama oyuncu bağlantıyı kuramıyor
- "Bu thug'lar neden geldi?" sorusu cevapsız kalıyor
- Çözüm: İntikam sahnesi öncesi kısa uyarı

---

## 4. Ödül Sistemi

> Oyunu tekrar oynanır kılan şey sadece zorluk değil ödüldür.

### Mevcut Ödüller

| Ödül | Sıklık | Büyüklük | Değerlendirme |
|------|--------|----------|---------------|
| Bahşiş | Her servis | Küçük | ✅ iyi |
| Combo bonus | 3+ servis | Orta | ✅ iyi |
| Gece upgrade | Her gün | Büyük | ✅ iyi |
| Coin kazanma | Her gün sonu | Orta | ✅ iyi |
| Yeni yemek açma | Belirli günler | Büyük | ✅ iyi |
| Kart seçimi | Her 3 gün | Büyük | ✅ iyi |

### Eksik Ödüller

- **Mükemmel gün** — hiç can kaybetmeden günü bitirince özel ödül yok
- **İlk kez servis** — yeni yemek ilk kez servis edilince kutlama yok
- **Streak** — art arda combo'lar için artan bonus yok

### Ödül Kuralları

- Küçük ödüller sık verilmeli (her servis)
- Büyük ödüller seyrek ama güçlü olmalı (gece)
- Hem kısa hem uzun vadeli ödül olmalı

---

## 5. İlerleme Hissi

> Oyuncu "başladığım yerle aynı yerde değilim" demeli.

### Mevcut İlerleme Sistemleri

- **Upgrade sistemi** ✅ — fırın, sabır, kazanç
- **Yeni yemek açma** ✅ — menü genişliyor
- **Kart sistemi** ✅ — her gün farklı koşullar
- **Coin biriktirme** ✅ — kozmetik için
- **Gün sayacı** ✅ — görünür ilerleme

### Eksik İlerleme Hissi

- **Restoran görünümü değişmiyor** — gün 1 ile gün 10 aynı görünüyor
- **Müşteri çeşitliliği yavaş açılıyor** — ilk günler monoton
- **Başarım sistemi yok** — "İlk 100 müşteri" gibi milestone'lar yok

---

## 6. Çeşitlilik

> Aynı şeyi tekrar ettirmemeli.

### Mevcut Çeşitlilik

- 7 müşteri tipi ✅
- 9 yemek ✅
- 15 kart ✅
- Özel istekler (acı, bol, acele) ✅
- Grup müşteriler ✅

### Eksik Çeşitlilik

- **Günlük özel olay yok** — "Bugün VIP günü" gibi
- **Hava durumu/tema yok** — her gün aynı görünüm
- **Müşteri kombinasyonları** — aynı anda farklı kişilik kombinasyonları daha az

---

## 7. Her Özellik Testi

> Bu sistem oyunu daha eğlenceli mi yapıyor, daha anlaşılır mı, yoksa sadece var olsun diye mi var?

| Özellik | Test Sonucu |
|---------|-------------|
| Şapka sistemi | ✅ Eğlenceli — kimlik hissi |
| Saç stilleri | ✅ Eğlenceli — kişiselleştirme |
| Kıyafet stilleri | ✅ Eğlenceli — kişiselleştirme |
| Servis efektleri | ✅ Eğlenceli — feedback güçlendiriyor |
| Etiket efektleri | ✅ Eğlenceli — sosyal statü |
| Unvan sistemi | ✅ Eğlenceli — sosyal statü |
| Renk setleri | ✅ Eğlenceli — kişiselleştirme |
| Joystick taşıma | ✅ Anlaşılır — erişilebilirlik |
| HUD editörü | ✅ Anlaşılır — erişilebilirlik |
| Sesli sohbet | ⚠️ Var olsun diye — çok az kullanılıyor |
| Yüz şekli | ⚠️ Var olsun diye — fark edilmiyor |
| Kart sistemi | ✅ Eğlenceli — çeşitlilik |
| İntikam sahnesi | ✅ Eğlenceli — dramatik an |
| Combo sistemi | ✅ Eğlenceli — akış hissi |

---

## 8. Mevcut Bug Listesi

### Kritik

| # | Bug | Etki | Durum |
|---|-----|------|-------|
| 1 | Android/iOS klavye kapanınca alt kısım eski haline dönmüyor | Chat kullanılamaz | ✅ Düzeltildi |
| 2 | Chat mesajı gelince bildirim yok, mesaj butonuna basmak gerekiyor | Sosyal özellik işlevsiz | ✅ Düzeltildi (toast var) |

### Orta

| # | Bug | Etki | Durum |
|---|-----|------|-------|
| 3 | CharacterPreview kıyafet stilini göstermiyor | Market önizleme yanlış | ✅ Düzeltildi |
| 4 | PatchNotes "Yakında" bölümü eski — saç/kıyafet/servis efekti zaten var | Yanıltıcı bilgi | ✅ Düzeltildi |
| 5 | Profil modalında hairStyle prop eksik (bazı yerlerde) | Önizleme yanlış | ✅ Düzeltildi |

### Küçük

| # | Bug | Etki | Durum |
|---|-----|------|-------|
| 6 | WelcomeScreen'de HAIR_COLORS, CLOTHING_COLORS, LABEL_COLORS tanımlı ama kullanılmıyor | Gereksiz kod | ✅ Düzeltildi |
| 7 | useSocket'te `myId` state'i `useEffect` dependency'de yok | Stale closure riski | ✅ Düzeltildi |
| 8 | drawPlayer'da `outfitStyle` prop'u Player tipinde var ama CharacterPreview'da yok | Önizleme eksik | ✅ Düzeltildi |

---

## 9. Yapılacaklar Listesi (Öncelik Sırasıyla)

### Acil (Bu Oturumda)

- [x] Chat klavye fix — Android/iOS viewport sorunu
- [x] Chat toast bildirimi — oyun içinde 3-4 sn görünen bildirim
- [x] PatchNotes güncelleme — mevcut özellikleri yansıt
- [x] CharacterPreview'a outfitStyle desteği
- [x] WelcomeScreen'deki kullanılmayan sabit dizileri temizle

### Kısa Vadeli (Sıradaki)

- [x] Can kaybı ekran flash efekti (kırmızı, 0.35 sn)
- [x] Müşteri kaçınca "💔 -1" animasyonu
- [x] Sabır barı yeniden tasarlandı — müşteri altına taşındı, dialog ile çakışma yok
- [x] Combo x5+ ekran kenarı efekti

### Orta Vadeli

- [x] Mükemmel gün ödülü (banner animasyonu)
- [ ] Başarım sistemi (milestone'lar)
- [ ] Günlük özel olay sistemi

---

## 10. Oyun Döngüsü Özeti

```
HAZIRLIK → SERVIS → GECE
    ↑                  ↓
    ←←← UPGRADE ←←←←←←
```

**Her döngü şunları vermeli:**
1. **Anında feedback** — her eylem cevap almalı
2. **Net risk** — ne kaybedebileceğini bilmeli
3. **Tatmin** — iyi iş yapınca hissettirmeli
4. **İlerleme** — bir önceki günden daha güçlü

**Oyunun şu an en güçlü olduğu yer:** Çeşitlilik (müşteri tipleri, kartlar, yemekler)

**Oyunun şu an en zayıf olduğu yer:** Feedback (görsel ve ses geri bildirimleri)
