# Belalı Müşteriler — Tasarım Dokümanı

## Mevcut Durum

- `rude`, `recep`, `thug` tipleri var
- Oyuncu bunları dövebiliyor (4 yumruk = kaçar)
- Dövülünce `revengeQueue`'ya ekleniyor (rude %30, recep %60)
- ~90-120 saniye sonra 2-4 thug gelip masaya oturuyor
- **Sorun:** thug'ların waiting/eating/leaving diyalogları boş, sessiz gelip gidiyorlar

---

## A) Thug Diyalogları

Thug'lar masaya oturduklarında, yerken ve giderken konuşmalı.
Tonu: tehditkâr ama komik, Recep İvedik evreni.

### waiting
Masada beklerken sinirli, etrafı tarıyorlar:
- "Nerde lan o piç, görsem tanırım."
- "Sakin ol kardeş, sakin... (derin nefes)"
- "Yemek yiyip gideceğiz, sonra hesap sorarız."
- "Şu aşçıya bak, bizi görmezden geliyor."
- "Acıktım ama asabım daha aç."

### eating
Yerken bile tehdit havası:
- "İyi yemek... ama bu bizi kurtarmaz."
- "Şlop şlop... Hesabı kapatıyoruz sonra."
- "Güzel pişirmiş, yazık olacak."
- "Ye kardeşim ye, güç lazım olacak."

### leaving_happy (yemek yedilerse)
- "Bu sefer geçtiniz... Bu sefer."
- "Lezzetliydi. Ama unutmadık."
- "Eyvallah aşçı. Bir dahaki sefere daha dikkatli ol."
- "Gidiyoruz... Şimdilik."

### leaving_angry (sabır biterse)
- "Tamam. Tamam. Anladık."
- "Beklettiniz. Bunu not ettik."
- "Gidin lan, zaten planımız vardı."

---

## B) Yeni Müşteri Tipleri

### `vip` — VIP Müşteri
- Çok sabırlı (maxPatience x1.8)
- Her zaman `specialRequest` var (spicy/extra/quick)
- Doğru servis: 3x bahşiş
- Yanlış servis: 2 can kaybı + kötü yorum balonu
- Görünüm: altın rengi, şapkalı, küçük vücut (bodyShape 1)
- Diyalog tonu: kibar ama beklentili

### `drunk` — Sarhoş Müşteri  
- Rastgele yürüyüş (x pozisyonu ±30px sallanır her tick)
- Sabır çok yüksek ama yanlış yemek verince de mutlu olur (wants kontrolü gevşek)
- Bahşiş tamamen rastgele (0 ile 3x arası)
- Görünüm: kırmızı yüz rengi, sallanma animasyonu
- Diyalog tonu: tutarsız, bazen çok mutlu bazen ağlıyor

### `inspector` — Sağlık Müfettişi
- Görünüm: beyaz önlük, ciddi ifade
- Yanlış yemek veya yanmış yemek = 2 can kaybı
- Doğru servis = +50 bonus puan
- Sabır normalin yarısı (çok az bekler)
- Diyalog tonu: resmi, tehditkâr

---

## C) Thug'ların Aktif Zarar Vermesi

Şu an thug'lar gelip sessizce oturuyor. Değişiklikler:

- Masaya otururken entry diyaloğu göster (revenge diyaloglarından)
- Sabır biterse normal can kaybı yerine **2 can** kaybı
- Dövülmeden gitmiyorlar: sabır bitince de "Gidiyoruz ama bunu unutmayacağız" deyip çıkıyorlar
- Thug grubunun tamamı aynı anda kalkar (groupId ile bağlı)

---

## D) Spawn Oranı Dengesi

### Mevcut
```
solo:  ['polite', 'polite', 'rude']          → %33 rude
multi: ['polite', 'rude', 'recep']           → %33 rude, %33 recep
rude_day kartı:
solo:  ['polite', 'rude', 'rude']            → %66 rude  
multi: ['rude', 'rude', 'recep']             → %66 rude, %33 recep
```

### Önerilen
```
solo gün 1-3:   ['polite', 'polite', 'polite', 'rude']         → %25 rude
solo gün 4-7:   ['polite', 'polite', 'rude', 'rude']           → %50 rude
solo gün 8+:    ['polite', 'rude', 'rude', 'recep']            → %50 rude, %25 recep
multi gün 1-3:  ['polite', 'polite', 'rude']                   → %33 rude
multi gün 4+:   ['polite', 'rude', 'recep']                    → %33 rude, %33 recep
vip: gün 5+, %10 şans (solo ve multi)
drunk: gün 3+, %15 şans
inspector: gün 7+, %8 şans
```

---

## 🔥 ANA ÖZELLİK — İntikam Gecesi Sahnesi

### Konsept
Bir müşteriyi dövüp intikam yemini ettirirsen, o gün akşam **upgrade/sipariş ekranı gelmez**.
Bunun yerine tek bir sinematik sahne oynar.

### Sahne Akışı

```
[Gün biter]
    ↓
[Normal DayEnd ekranı yerine]
    ↓
[Karartma — 1 saniye]
    ↓
[Sahne: Dükkanın dış cephesi, gece]
  - Sokak lambası titriyor
  - Uzaktan ayak sesleri
  - 3-4 siluet yaklaşıyor (thug karakterleri)
  - Molotof fırlatılıyor
  - Dükkanın girişi alev alıyor
  - Ekranda yazı: "Bu sadece bir uyarıydı..."
    ↓
[2 saniye bekle]
    ↓
[Sabah — prep fazı, ama...]
  - Başlangıç tabak sayısı -1 (hasar)
  - O gün müşteri spawn hızı +%20 (dedikodu yayıldı)
  - Ekranda küçük not: "Dükkanın girişi hasar gördü. Müşteriler merak ediyor."
```

### Teknik Uygulama

**Server tarafı:**
- `gs.revengeQueue` doluyken gün biterse → `gs.pendingRevengeScene = true` flag'i set et
- DayEnd emit'i yerine `revengeScene` emit'i gönder
- Sabah başlarken hasar efektlerini uygula

**Client tarafı:**
- `revengeScene` event'i gelince `DayEndModal` yerine `RevengeSceneOverlay` render et
- Canvas üzerinde dükkan dış cephesi çizilir (basit: duvar, kapı, sokak lambası)
- Ateş animasyonu: turuncu/sarı partiküller, drawLighting'e benzer
- Siluetler: mevcut `drawCustomer` fonksiyonu kullanılır (karanlık renk)
- Yazı fade-in animasyonu

**Yeni dosyalar:**
- `src/components/RevengeSceneOverlay.tsx` — sahne container'ı
- `src/renderer/drawRevengeScene.ts` — canvas çizim fonksiyonları
- `shared/types.ts` — `pendingRevengeScene?: boolean` GameState'e eklenir

### Hasar Kalıcılığı
- Sahne sadece bir kez gösterilir (flag sıfırlanır)
- Hasar efektleri o gün için geçerli
- Eğer aynı gün tekrar intikam yemini ettirirsen: sahne yok, direkt 2 can kaybı

---

## Uygulama Sırası

1. [ ] A — Thug diyalogları doldur (`shared/dialogues.ts`)
2. [ ] B — Yeni tipler ekle (vip, drunk, inspector) — types, dialogues, spawn, render
3. [ ] C — Thug aktif zarar (2 can, grup kalkışı)
4. [ ] D — Spawn oranı dengesi (`server/gameLoop.ts`)
5. [ ] 🔥 İntikam Gecesi Sahnesi — en son, diğerleri hazır olunca
