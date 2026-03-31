# 🛠️ FKA v2 Mimari Refactoring Günlüğü (Kadir & Recep)

**Tarih:** 31 Mart 2026

## 🎯 Vizyon & Amaç
Projede "Single Responsibility Principle (SRP)" (Tek Sorumluluk Prensibi) ihlalleri mevcuttu. Özellikle "Çok Aşamalı Yemek / Combining" gibi yenilikçi mekaniklere geçmeden önce "Spagetti Kod" bariyerini aşmamız gerekiyordu. 

İleride oyun patlamasın, yeni özellik eklerken dosyalar arasında kaybolmayalım diye devasa dosyaları **cerrahi bir hassasiyetle** parçalayıp modüler hale getirdik.

---

## 🔪 1. Aşama: Veri Tipleri Operasyonu (`shared` Klasörü)
`shared/types.ts` dosyası 700 satırlık bir canavardı. İçinde tip tanımlamaları, oyun mantığı, nesne koordinatları ve süreler iç içe geçmişti. Bunu 5 ayrı küçük dosyaya böldük:
- **`shared/types.ts`**: Artık sadece `interface` ve `type` barındıran temiz bir çatı görevi görüyor. Dışarıdaki diğer modüllerin yollarını re-export (`export * from`) ederek projedeki importların patlamasını önledi.
- **`shared/constants.ts`**: Oyunun içine gizlenmiş tüm "magic number"ları (örneğin fırın bekleme süreleri, yürüme hızları, vb.) buraya toplandı.
- **`shared/gameLogic.ts`**: Saf iş fonksiyonlarını (`isChopped`, `getComboMultiplier` vb.) içeriyor.
- **`shared/gameData.ts`**: İstasyon koordinatları, `RECIPE_DEFS`, menü listesi ve fırın boyutları gibi fiziksel ve oyun içi veri tablolarını barındırıyor.
- **`shared/mapState.ts`**: İlk defa başlatılan bir oyun odasının "GameState" JSON'ını üreten (`mkGameState`) fonksiyona ev sahipliği yapıyor.
*Ayrıca Client tarafında (`src/hooks/useSocket.ts`) hata veren spagetti `DEFAULT_STATE` mock yapısı bu klasördeki yeni `mkGameState` factory fonksiyonuyla düzeltildi.*

---

## 🍔 2. Aşama: Backend Handler Operasyonu (`server/interactHandler.ts`)
Gelen bütün kullanıcı "E" (interact) isteklerini tek bir dosyada karşılayan 700 satırlık `interactHandler.ts` dosyası mantıksal klasörlere (`server/handlers/`) ayrıldı:
- **`server/handlers/kitchenHandler.ts`**: Sadece pişirme (Fırın, Fritöz, Pasta Makinesi, Kahve) ve çiğ malzeme alma fonksiyonlarını yönetiyor.
- **`server/handlers/serviceHandler.ts`**: Müşteriye yemek verme, servis pencereleri ve para kazanma (Tip) mantığı.
- **`server/handlers/itemHandler.ts`**: Alet/Edevat (Çöp Kutusu, Tepsi Masası, Kirli Sepeti, Tabak Yığını ve Baharatlık).
- **`server/handlers/sinkHandler.ts`**: Lavabo ve Kesme Tahtası gibi etkileşimli ilerlemeler (progress bar).
- **`server/handlers/utils.ts`**: Müşteri tip parasını hesaplayan (`earn`), kombo hesaplayan ve ortak tip interface'i (`InteractContext`) barındıran yardımcı dosya.
- **`server/interactHandler.ts`**: Bu dosya artık asıl işlem yapmıyor, sadece bir **Yönlendirici (Router)** gibi çalışarak kullanıcının hangi istasyona yakın olduğuna bakıp istekleri yukarıdaki klasörlere devrediyor.

---

## 🚦 3. Aşama: TypeScript Doğrulaması (TSC Check)
Uygulanan refactoring işlemi devasa olduğu için (yaklaşık 1400 satır kod taşındı/silindi) projenin compile (derleme) durumunu kontrol ettik. `npx tsc --noEmit` işlemi başarıyla 0 hata verdi! VITE ve Server tarafı tamamen stabil durumda gözüküyor.

## Sonraki Adımlar
Bu sağlam zemin üzerine artık çok beklenen "**Çok Aşamalı Yemek Yapma (Combining)**" mekaniği eklenecektir. Daha öncesinde oyunun canlı bir testinin yapılıp çökme olmadığından emin olunması (Zorunlu Kontrol Noktası) gerekir.
