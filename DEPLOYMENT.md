# 🚀 Deployment Rehberi

## 📱 Mobil Uyumluluk

### ✅ Mevcut Özellikler:
- **Joystick Kontrol** - Touch destekli
- **Responsive Design** - Tüm ekran boyutları
- **PWA Desteği** - Manifest.json hazır
- **Touch Events** - Mobil etkileşimler
- **iOS/Android** - Her ikisi de destekleniyor

### 🎮 Mobil Kontroller:
- **Joystick:** Sol/sağ taraf seçilebilir
- **Boyut:** Ayarlanabilir (80-200px)
- **Butonlar:** E tuşu için touch buton
- **Ayarlar:** Oyun içi settings paneli

---

## 📦 GitHub'a Yükleme

### 1. Git Repository Oluştur:
\`\`\`bash
# Eğer henüz git init yapmadıysan
git init

# Dosyaları ekle
git add .

# İlk commit
git commit -m "🎮 Initial commit - Plate Up style multiplayer game"
\`\`\`

### 2. GitHub'da Repository Oluştur:
1. GitHub.com'a git
2. "New repository" butonuna tıkla
3. İsim ver (örn: "terramarket-game")
4. Public veya Private seç
5. "Create repository" tıkla

### 3. GitHub'a Push:
\`\`\`bash
# Remote ekle (URL'i kendi repo'nunla değiştir)
git remote add origin https://github.com/KULLANICI_ADIN/terramarket-game.git

# Push yap
git branch -M main
git push -u origin main
\`\`\`

---

## 🚂 Railway'e Deploy

### Yöntem 1: GitHub ile (Önerilen)

1. **Railway.app'e Git**
   - https://railway.app
   - GitHub ile giriş yap

2. **New Project**
   - "Deploy from GitHub repo" seç
   - Repository'ni seç

3. **Otomatik Deploy**
   - Railway otomatik algılar
   - Build ve deploy başlar
   - ~2-3 dakika sürer

4. **Domain Al**
   - Settings → Generate Domain
   - Örnek: `terramarket.up.railway.app`

### Yöntem 2: Railway CLI

\`\`\`bash
# Railway CLI kur
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
\`\`\`

---

## ⚙️ Environment Variables (Railway)

Railway dashboard'da şunları ekle:

\`\`\`env
NODE_ENV=production
PORT=3000
\`\`\`

---

## 🔧 Build Ayarları

### Railway otomatik algılar:
- **Build Command:** \`npm run build\`
- **Start Command:** \`npm start\`
- **Port:** 3000 (otomatik)

### Eğer sorun olursa:
Railway Settings → Deploy:
- Build Command: \`npm install && npm run build\`
- Start Command: \`npm start\`
- Watch Paths: \`/\`

---

## 📱 Mobil Test

### iOS (Safari):
1. Railway URL'ini aç
2. Share → Add to Home Screen
3. PWA olarak çalışır

### Android (Chrome):
1. Railway URL'ini aç
2. Menu → Install App
3. PWA olarak çalışır

---

## 🐛 Troubleshooting

### Build Hatası:
\`\`\`bash
# Lokal test
npm run build
npm start
\`\`\`

### Port Hatası:
Railway otomatik PORT atar, kod zaten hazır:
\`\`\`typescript
const PORT = process.env.PORT || 3000;
\`\`\`

### WebSocket Hatası:
Railway otomatik WebSocket destekler, ek ayar gerekmez.

---

## 📊 Deployment Checklist

- [x] Mobil kontroller çalışıyor
- [x] PWA manifest hazır
- [x] .gitignore doğru
- [x] Build script çalışıyor
- [x] Production mode hazır
- [x] Railway.json oluşturuldu
- [ ] GitHub'a push yapıldı
- [ ] Railway'e deploy edildi
- [ ] Domain alındı
- [ ] Mobil test yapıldı

---

## 🎉 Başarılı Deploy Sonrası

1. **URL'i Paylaş** - Arkadaşlarınla oyna!
2. **Mobil Test** - iOS ve Android'de dene
3. **Multiplayer Test** - Birden fazla cihazdan bağlan
4. **Feedback Topla** - Oyunculardan geri bildirim al

---

## 📞 Destek

Sorun olursa:
- Railway Logs: Dashboard → Deployments → Logs
- GitHub Issues: Repository → Issues
- Railway Discord: https://discord.gg/railway

---

**Hazır! Artık deploy edebilirsin! 🚀**
