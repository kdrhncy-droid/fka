# Requirements Document

## Introduction

Oyuncular, telefon sesini en aza indirse bile oyun içi arka plan müziğinin (BGM) çok yüksek geldiğini bildiriyor. Bu özellik; BGM'nin varsayılan ses seviyesini düşürmeyi, mevcut kullanıcıların kayıtlı ayarlarını güncellemeyi ve ayarlar arayüzünde BGM ile genel ses kontrollerini birbirinden net biçimde ayırt etmeyi kapsar.

## Glossary

- **BGM_Manager**: `src/utils/bgm.ts` içindeki Web Audio API tabanlı arka plan müziği yöneticisi modülü.
- **Settings**: `src/hooks/useSettings.ts` içinde tanımlanan, `localStorage`'a kaydedilen kullanıcı tercihleri nesnesi.
- **Settings_UI**: `src/components/SettingsModal.tsx` ve `src/components/SettingsPanel.tsx` içindeki ayarlar arayüzü bileşenleri.
- **BGM_Volume**: BGM'ye özgü ses seviyesi değeri; 0.0 (sessiz) ile 1.0 (tam ses) arasında bir ondalık sayı.
- **Default_BGM_Volume**: Kullanıcının daha önce bir tercih kaydetmemiş olması durumunda uygulanan başlangıç BGM ses seviyesi.
- **LocalStorage**: Kullanıcı ayarlarının tarayıcıda kalıcı olarak saklandığı depolama alanı (`terracraft-settings` anahtarı).

---

## Requirements

### Requirement 1: Varsayılan BGM Ses Seviyesini Düşür

**User Story:** Oyuncu olarak, oyuna ilk girdiğimde BGM'nin kulağımı rahatsız etmemesini istiyorum; böylece telefon sesini ayrıca ayarlamak zorunda kalmam.

#### Acceptance Criteria

1. THE BGM_Manager SHALL `targetVolume` başlangıç değerini `0.5` yerine `0.2` olarak kullanmalıdır.
2. THE Settings SHALL `bgmVolume` için `DEFAULTS` değerini `0.5` yerine `0.2` olarak tanımlamalıdır.
3. WHEN bir kullanıcı daha önce hiç ayar kaydetmemişse, THE BGM_Manager SHALL BGM'yi `0.2` gain değeriyle başlatmalıdır.

---

### Requirement 2: Mevcut Kullanıcı Ayarlarını Güncelle

**User Story:** Oyuncu olarak, daha önce varsayılan ses seviyesiyle oynadıysam, güncelleme sonrasında BGM'nin otomatik olarak daha sessiz gelmesini istiyorum.

#### Acceptance Criteria

1. WHEN `localStorage`'da kayıtlı `bgmVolume` değeri `0.5`'e eşitse (yani kullanıcı varsayılanı hiç değiştirmemişse), THE Settings SHALL bu değeri `0.2` olarak geçersiz kılmalıdır.
2. WHEN `localStorage`'da kayıtlı `bgmVolume` değeri `0.5`'ten farklıysa (kullanıcı bilinçli olarak değiştirmiş), THE Settings SHALL mevcut değeri korumalıdır.
3. THE Settings SHALL güncellenen değeri `localStorage`'a kaydetmelidir; böylece sonraki oturumda da geçerli kalır.

---

### Requirement 3: BGM Ses Seviyesi Ayarı Arayüzde Görünür Olsun

**User Story:** Oyuncu olarak, BGM ses seviyesini ayarlar ekranından kolayca değiştirebilmek istiyorum; böylece kendi tercihime göre ayarlayabilirim.

#### Acceptance Criteria

1. THE Settings_UI SHALL BGM ses seviyesi için ayrı bir kaydırıcı (slider) göstermelidir; bu kaydırıcı `bgmVolume` değerini kontrol etmelidir.
2. THE Settings_UI SHALL BGM kaydırıcısını "Genel Ses Seviyesi" kaydırıcısından görsel olarak ayrı bir bölümde sunmalıdır.
3. WHEN kullanıcı BGM kaydırıcısını değiştirirse, THE BGM_Manager SHALL yeni gain değerini `100ms` içinde uygulamalıdır.
4. THE Settings_UI SHALL mevcut BGM ses seviyesini yüzde (%) olarak göstermelidir.

---

### Requirement 4: Ses Seviyesi Sınırları Korunsun

**User Story:** Oyuncu olarak, BGM ses seviyesini sıfıra çekebilmek ya da istediğimde tam sese getirebilmek istiyorum.

#### Acceptance Criteria

1. THE BGM_Manager SHALL `bgmVolume` değerini `0.0` ile `1.0` arasında sınırlandırmalıdır; bu aralığın dışındaki değerleri reddetmelidir.
2. IF `bgmVolume` değeri `0.0` olarak ayarlanırsa, THEN THE BGM_Manager SHALL ses çıkışını tamamen susturmalıdır; ancak çalma durumunu (paused/playing) değiştirmemelidir.
3. THE Settings SHALL `bgmVolume` değerini `0.0` ile `1.0` arasında bir ondalık sayı olarak `localStorage`'a kaydetmelidir.
