# 🚀 Deployment Rehberi

## 📦 GitHub'a Yükleme

```bash
git add .
git commit -m "update"
git push origin main
```

---

## 🌐 Render'e Deploy

### Yöntem: GitHub ile (Önerilen)

1. **Render.com'a Git**
   - https://render.com
   - GitHub ile giriş yap

2. **New Web Service**
   - "Connect a repository" seç
   - Repository'ni seç

3. **Ayarlar**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=10000
   ```

5. **Deploy**
   - "Create Web Service" tıkla
   - ~3-5 dakika sürer
   - Örnek URL: `https://fka.onrender.com`

---

## ⚙️ Build Ayarları

```typescript
// server.ts — port zaten hazır
const PORT = process.env.PORT || 3000;
```

---

## 📱 Mobil Test

### iOS (Safari):
1. Render URL'ini aç
2. Share → Add to Home Screen

### Android (Chrome):
1. Render URL'ini aç
2. Menu → Install App

---

## 🐛 Troubleshooting

### Build Hatası:
```bash
npm run build
npm start
```

### WebSocket:
Render otomatik WebSocket destekler, ek ayar gerekmez.

---

## 📊 Deployment Checklist

- [x] Build script çalışıyor
- [x] Production mode hazır
- [x] GitHub'a push yapıldı
- [ ] Render'e deploy edildi
- [ ] Domain alındı
- [ ] Mobil test yapıldı