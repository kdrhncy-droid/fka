# Requirements Document

## Introduction

Bu spec, mevcut restoran yönetim oyununun (PlateUp tarzı, multiplayer, canvas tabanlı) görsel kimliğini ve kullanıcı deneyimini dört ana başlıkta iyileştirmeyi kapsar:

1. **Görsel Kimlik Geliştirme** — Karakter, istasyon, zemin/duvar görselleri; renk paleti tutarlılığı; hover/interact/idle animasyon efektleri.
2. **Özet Ekranı (DayEndModal) Detaylandırma** — Servis istatistikleri, oyuncu katkıları, animasyonlu sayaçlar, rozet/yıldız sistemi.
3. **Sohbet Butonu Konumu Ayarı** — Ayarlar paneline preset konum seçeneği eklenmesi, localStorage'a kaydedilmesi.
4. **Ses Sistemi İyileştirme** — Web Audio API reverb/compressor zinciri, layered ortam sesleri, kategori bazlı volume slider'ları.

Teknik altyapı: React + TypeScript + Vite, Socket.io, Canvas 2D (`src/renderer/`), `src/utils/audio.ts`, `src/hooks/useSettings.ts`, `src/components/SettingsPanel.tsx`, `src/components/DayEndModal.tsx`, `src/components/ChatPanel.tsx`.

---

## Glossary

- **Renderer**: `src/renderer/` klasöründeki Canvas 2D çizim modülleri.
- **DayEndModal**: Gün sonu özet ekranı — `src/components/DayEndModal.tsx`.
- **SettingsPanel**: Ayarlar paneli — `src/components/SettingsPanel.tsx`.
- **ChatPanel**: Sohbet bileşeni — `src/components/ChatPanel.tsx`.
- **AudioEngine**: `src/utils/audio.ts` içindeki Web Audio API yönetim katmanı.
- **Settings**: `src/hooks/useSettings.ts` içindeki ayar state'i ve localStorage kalıcılığı.
- **ChatPosition**: Sohbet butonunun ekrandaki preset konumu (sol-alt, sağ-alt, sol-üst, sağ-üst).
- **DayEndSummary**: Socket üzerinden gelen gün sonu istatistik nesnesi.
- **PlayerContribution**: Bir oyuncunun gün içindeki servis, temizlik ve kazanç katkısı.
- **AudioCategory**: SFX, müzik veya ortam ses kategorisi.
- **AmbientLayer**: Sürekli çalan arka plan ses katmanı (mutfak, kalabalık, müzik).
- **AudioBus**: Reverb ve compressor düğümlerinden oluşan Web Audio API işlem zinciri.
- **RenderState**: Her canvas nesnesi için frame'ler arası animasyon durumu (timer, faz, hedef değer).
- **HoverState**: Bir istasyon veya nesnenin fare/dokunma ile üzerine gelindiğinde tetiklenen görsel durum.
- **IdleAnimation**: Oyuncu veya nesnenin etkileşim olmadığında oynadığı döngüsel animasyon.
- **Badge**: DayEndModal'da performansa göre gösterilen görsel rozet (altın, gümüş, bronz, vs.).

---

## Requirements

### Requirement 1: Karakter Görsel Kalitesi

**User Story:** Bir oyuncu olarak, karakterimin daha canlı ve ayırt edici görünmesini istiyorum; böylece multiplayer'da takım arkadaşlarımdan kolayca ayırt edilebileyim.

#### Acceptance Criteria

1. THE Renderer SHALL her `CHARACTER_TYPES` girişi için benzersiz bir renk aksanı ve şapka kombinasyonu kullanarak karakteri çizmeli.
2. WHEN bir oyuncu hareket etmediğinde, THE Renderer SHALL karaktere saniyede 1–2 döngü hızında hafif bir nefes alma (idle bob) animasyonu uygulamalı.
3. WHEN bir oyuncu bir istasyona yaklaştığında (mesafe ≤ 60px), THE Renderer SHALL o istasyonun etrafında 200ms içinde beliren bir vurgu halkası (highlight ring) çizmeli.
4. THE Renderer SHALL karakter gölgesini zemin perspektifiyle tutarlı biçimde, karakterin tam altında elips olarak çizmeli.
5. IF bir oyuncunun `charType` değeri `CHARACTER_TYPES` dizisinin dışındaysa, THEN THE Renderer SHALL varsayılan `charType = 0` ile çizmeye devam etmeli.
6. THE Renderer SHALL karakter isim etiketini karakterin üzerinde, arka plan rengi oyuncunun aksanıyla uyumlu olacak şekilde çizmeli.

---

### Requirement 2: İstasyon Görsel Kalitesi

**User Story:** Bir oyuncu olarak, her istasyonun işlevini tek bakışta anlayabilmek istiyorum; böylece yoğun oyun sırasında hızlı karar verebileyim.

#### Acceptance Criteria

1. THE Renderer SHALL her istasyon türü için tutarlı bir renk paleti kullanmalı: malzeme istasyonları sarı-turuncu, pişirme istasyonları kırmızı-turuncu, temizlik istasyonları mavi, çöp istasyonu gri.
2. WHEN bir istasyon üzerinde işlem yapılıyorken (pişirme, kesme, yıkama), THE Renderer SHALL ilerleme çubuğunu istasyonun üst yüzeyinde animasyonlu olarak göstermeli.
3. WHEN bir istasyon kilitliyken, THE Renderer SHALL istasyonu `globalAlpha = 0.38` ile soluk çizmeli ve üzerinde kilit ikonu göstermeli.
4. WHEN bir istasyonun üzerinde eşya bulunuyorken, THE Renderer SHALL eşyayı istasyonun üst yüzeyinde, arka plan balonuyla birlikte çizmeli.
5. THE Renderer SHALL tüm istasyon etiketlerini aynı font boyutu (9px bold) ve renk (`#f0ddb8`) ile çizmeli.
6. WHEN bir istasyon yanıyorsa (burned), THE Renderer SHALL istasyonun üzerinde kırmızı-turuncu titreşen bir uyarı efekti göstermeli.

---

### Requirement 3: Zemin ve Duvar Görsel Tutarlılığı

**User Story:** Bir oyuncu olarak, mutfak ve salon alanlarının görsel olarak net biçimde ayrışmasını istiyorum; böylece hangi bölgede olduğumu anlık olarak anlayabileyim.

#### Acceptance Criteria

1. THE Renderer SHALL mutfak zeminini koyu antrasit karo deseniyle (`#2e2e2e` taban, `#343434`/`#2a2a2a` karo), salon zeminini sıcak ahşap parke deseniyle (`#e8d8b8` taban) çizmeli.
2. THE Renderer SHALL mutfak–salon sınır duvarını `WALL_Y1` koordinatında, üst ve alt gölge gradyanlarıyla birlikte çizmeli.
3. THE Renderer SHALL tüm duvarları (üst, sol, sağ, ön) aynı tuğla desen ve renk paleti (`#9a7858` → `#7a5838`) ile çizmeli.
4. THE Renderer SHALL dış alanı (kaldırım, yol, ağaçlar, sokak lambaları) `EXTERIOR_Y` koordinatından itibaren çizmeli.
5. WHEN `unlockedDishes` listesi değiştiğinde, THE Renderer SHALL kilitli yemeklere ait malzeme raflarını gizlemeli, açık olanlara ait rafları göstermeli.

---

### Requirement 4: Hover ve Interact Animasyon Efektleri

**User Story:** Bir oyuncu olarak, etkileşime girebileceğim nesnelerin görsel geri bildirim vermesini istiyorum; böylece hangi nesneyle etkileşime girebileceğimi anlık olarak anlayabileyim.

#### Acceptance Criteria

1. WHEN oyuncu bir etkileşim alanına (istasyon, masa, müşteri) 60px mesafeye girdiğinde, THE Renderer SHALL o nesnenin etrafında 150ms içinde beliren, 2px kalınlığında beyaz/sarı bir vurgu halkası çizmeli.
2. WHEN oyuncu etkileşim alanından çıktığında, THE Renderer SHALL vurgu halkasını 150ms içinde söndürmeli.
3. WHEN bir eşya alındığında veya bırakıldığında, THE Renderer SHALL 300ms süren bir ölçek (scale) animasyonu (1.0 → 1.2 → 1.0) oynatmalı.
4. THE Renderer SHALL tüm animasyon durumlarını `RenderState` nesnelerinde saklamalı; her frame'de delta-time ile güncellemeli.
5. IF tarayıcı `requestAnimationFrame` callback'i 100ms'den uzun gecikirse, THEN THE Renderer SHALL animasyon durumunu sıfırlayarak görsel bozulmayı önlemeli.

---

### Requirement 5: DayEndModal — Temel İstatistikler

**User Story:** Bir oyuncu olarak, günün sonunda ne kadar iyi performans gösterdiğimi ayrıntılı olarak görmek istiyorum; böylece bir sonraki gün stratejimi belirleyebileyim.

#### Acceptance Criteria

1. WHEN gün sona erdiğinde, THE DayEndModal SHALL servis edilen toplam yemek sayısını, kaçırılan müşteri sayısını, toplam tip miktarını ve en çok servis edilen yemeği göstermeli.
2. THE DayEndModal SHALL her istatistiği ayrı bir kart bileşeninde, ikon ve sayısal değerle birlikte göstermeli.
3. WHEN modal açıldığında, THE DayEndModal SHALL tüm sayısal değerleri 0'dan gerçek değere 1.2 saniyede animasyonlu sayaç (count-up) ile göstermeli.
4. THE DayEndModal SHALL mevcut `summary.score` ve `summary.lives` değerlerini de göstermeye devam etmeli.
5. IF `DayEndSummary` içinde isteğe bağlı bir alan eksikse, THEN THE DayEndModal SHALL o alanı `0` veya `"—"` ile göstermeli, hata fırlatmamalı.

---

### Requirement 6: DayEndModal — Oyuncu Katkı İstatistikleri

**User Story:** Multiplayer bir oyuncu olarak, her takım üyesinin gün içindeki katkısını görmek istiyorum; böylece takım koordinasyonunu değerlendirebileyim.

#### Acceptance Criteria

1. THE DayEndModal SHALL her bağlı oyuncu için ayrı bir katkı satırı göstermeli: oyuncu adı, servis ettiği yemek sayısı ve kazandırdığı toplam gelir.
2. THE DayEndModal SHALL oyuncuları katkı puanına göre azalan sırada listelemeli.
3. WHEN tek oyuncu varsa, THE DayEndModal SHALL oyuncu katkı bölümünü gizlemeli.
4. THE DayEndModal SHALL kendi oyuncusunun satırını diğerlerinden görsel olarak ayırt etmeli (vurgu rengi veya ikon).
5. IF bir oyuncunun katkı verisi sunucudan gelmiyorsa, THEN THE DayEndModal SHALL o oyuncuyu listede `0` değerleriyle göstermeli.

---

### Requirement 7: DayEndModal — Rozet ve Yıldız Sistemi

**User Story:** Bir oyuncu olarak, günlük performansıma göre görsel bir ödül almak istiyorum; böylece oyun motivasyonum artsın.

#### Acceptance Criteria

1. THE DayEndModal SHALL günlük skora göre 1–3 yıldız vermeli: 1 yıldız (skor < 100$), 2 yıldız (100$ ≤ skor < 250$), 3 yıldız (skor ≥ 250$).
2. THE DayEndModal SHALL yıldızları modal açıldıktan 800ms sonra, birer birer 200ms aralıklarla animasyonlu olarak göstermeli.
3. THE DayEndModal SHALL performansa göre en az bir rozet göstermeli: "Hızlı Servis" (kaçırılan müşteri = 0), "Cömert Müşteriler" (toplam tip ≥ 50$), "Temiz Mutfak" (kirli tepsi = 0 ile gün kapandıysa).
4. WHEN 3 yıldız kazanıldığında, THE DayEndModal SHALL konfeti animasyonu oynatmalı (CSS veya Canvas tabanlı, en az 30 parçacık).
5. IF skor hesaplanamıyorsa (undefined/null), THEN THE DayEndModal SHALL yıldız göstermemeli ve rozet bölümünü gizlemeli.

---

### Requirement 8: Sohbet Butonu Konum Ayarı

**User Story:** Bir oyuncu olarak, sohbet butonunun ekrandaki konumunu tercihime göre ayarlamak istiyorum; böylece oyun arayüzüyle çakışmasını önleyebileyim.

#### Acceptance Criteria

1. THE SettingsPanel SHALL sohbet butonu konumu için dört preset seçenek sunmalı: "Sol Alt", "Sağ Alt", "Sol Üst", "Sağ Üst".
2. WHEN bir konum seçildiğinde, THE Settings SHALL seçimi `chatPosition` anahtarıyla localStorage'a kaydetmeli.
3. WHEN sayfa yenilendiğinde, THE ChatPanel SHALL localStorage'dan okunan `chatPosition` değerine göre konumlanmalı.
4. THE ChatPanel SHALL seçilen konuma göre Tailwind CSS pozisyon sınıflarını (`bottom-2 right-2`, `bottom-2 left-2`, `top-2 right-2`, `top-2 left-2`) dinamik olarak uygulamalı.
5. IF localStorage'da `chatPosition` değeri yoksa veya geçersizse, THEN THE ChatPanel SHALL varsayılan olarak "Sağ Alt" konumunu kullanmalı.
6. THE SettingsPanel SHALL aktif seçeneği diğerlerinden görsel olarak ayırt etmeli (amber vurgu rengi).

---

### Requirement 9: Ses Kategorileri ve Volume Slider'ları

**User Story:** Bir oyuncu olarak, SFX, müzik ve ortam seslerini bağımsız olarak kontrol etmek istiyorum; böylece kendi tercihime göre ses deneyimini özelleştirebileyim.

#### Acceptance Criteria

1. THE Settings SHALL `sfxVolume`, `musicVolume` ve `ambientVolume` alanlarını 0.0–1.0 aralığında tutmalı; varsayılan değerler sırasıyla 0.7, 0.5, 0.4 olmalı.
2. THE SettingsPanel SHALL her ses kategorisi için ayrı bir volume slider göstermeli: "Ses Efektleri", "Müzik", "Ortam Sesleri".
3. WHEN bir slider değiştiğinde, THE AudioEngine SHALL ilgili kategorideki tüm aktif ses düğümlerinin gain değerini 50ms içinde güncellemeli.
4. THE Settings SHALL mevcut `masterVolume` slider'ını koruyarak tüm kategorileri etkileyen ana ses seviyesi olarak kullanmaya devam etmeli.
5. IF `masterVolume` sıfırlanırsa, THEN THE AudioEngine SHALL tüm kategorilerin çıkışını susturmalı, kategori slider değerlerini değiştirmemeli.

---

### Requirement 10: Web Audio API İşlem Zinciri (AudioBus)

**User Story:** Bir oyuncu olarak, oyun seslerinin daha zengin ve atmosferik duyulmasını istiyorum; böylece oyun deneyimim daha sürükleyici olsun.

#### Acceptance Criteria

1. THE AudioEngine SHALL tüm SFX seslerini reverb (ConvolverNode veya yapay reverb) ve compressor (DynamicsCompressorNode) düğümlerinden geçirerek `AudioContext.destination`'a bağlamalı.
2. THE AudioEngine SHALL reverb wet/dry oranını 0.0–1.0 arasında ayarlanabilir tutmalı; varsayılan wet = 0.25.
3. THE AudioEngine SHALL compressor parametrelerini şu değerlerle başlatmalı: threshold = -24dB, knee = 30dB, ratio = 12, attack = 0.003s, release = 0.25s.
4. WHEN `AudioContext` `suspended` durumundaysa, THE AudioEngine SHALL ilk kullanıcı etkileşiminde `resume()` çağırmalı.
5. IF `AudioContext` oluşturulamazsa (tarayıcı desteği yoksa), THEN THE AudioEngine SHALL sessiz modda çalışmalı ve hata fırlatmamalı.
6. THE AudioEngine SHALL `AudioContext` nesnesini singleton olarak yönetmeli; her ses çalındığında yeni bir context oluşturmamalı.

---

### Requirement 11: Layered Ortam Sesleri

**User Story:** Bir oyuncu olarak, oyun fazına göre değişen ortam seslerini duymak istiyorum; böylece oyunun atmosferi daha gerçekçi hissettirsin.

#### Acceptance Criteria

1. THE AudioEngine SHALL üç bağımsız ortam katmanı yönetmeli: mutfak ortam sesi (fırın/ocak uğultusu), müşteri kalabalık sesi (salon gürültüsü), arka plan müziği.
2. WHEN `dayPhase` `'day'`'e geçtiğinde, THE AudioEngine SHALL müşteri kalabalık sesini 1 saniyede fade-in ile başlatmalı.
3. WHEN `dayPhase` `'night'`'a geçtiğinde, THE AudioEngine SHALL müşteri kalabalık sesini 2 saniyede fade-out ile durdurmalı ve gece müziğini başlatmalı.
4. WHEN `dayPhase` `'prep'`'e geçtiğinde, THE AudioEngine SHALL yalnızca mutfak ortam sesini çalmalı; diğer katmanları susturmalı.
5. THE AudioEngine SHALL ortam seslerini Web Audio API `OscillatorNode` veya `AudioBufferSourceNode` ile üretmeli; harici ses dosyası gerektirmemeli.
6. WHEN `ambientVolume` değiştiğinde, THE AudioEngine SHALL tüm aktif ortam katmanlarının gain değerini 50ms içinde güncellemeli.
7. IF ortam sesi başlatılamazsa, THEN THE AudioEngine SHALL sessiz modda devam etmeli ve konsola uyarı yazmalı.

---

### Requirement 12: Ses Sistemi Kalıcılığı ve Entegrasyonu

**User Story:** Bir oyuncu olarak, ses ayarlarımın oyun oturumları arasında korunmasını istiyorum; böylece her seferinde yeniden ayarlama yapmak zorunda kalmayayım.

#### Acceptance Criteria

1. THE Settings SHALL `sfxVolume`, `musicVolume`, `ambientVolume` değerlerini mevcut `masterVolume` ve `sfxOn` ile birlikte aynı localStorage anahtarına (`terracraft-settings`) kaydetmeli.
2. WHEN sayfa yüklendiğinde, THE AudioEngine SHALL localStorage'dan okunan ses ayarlarını uygulayarak başlatılmalı.
3. THE AudioEngine SHALL mevcut `setSfxEnabled` ve `isSfxEnabled` fonksiyonlarını geriye dönük uyumlu biçimde korumalı.
4. WHEN `sfxOn` `false` yapıldığında, THE AudioEngine SHALL `sfxVolume` slider değerini değiştirmeden tüm SFX seslerini susturmalı.
5. THE AudioEngine SHALL `playSound` fonksiyonunun mevcut çağrı arayüzünü (`playSound(ref, type)`) değiştirmemeli; yeni ses kategorisi yönetimini iç implementasyonda yapmalı.
