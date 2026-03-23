# SUVIDHA ONE Frontend - Deployment Guide

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker & Docker Compose installed
- Backend API running (Render, local, etc.)

#### Steps:

1. **Clone and navigate to project**
```bash
cd /mnt/c/SUVIDHA_ONE/suvidha-one
```

2. **Create environment file**
```bash
cp .env.example .env.local
# Edit .env.local with your values
nano .env.local
```

3. **Update environment variables**
```env
NEXT_PUBLIC_API_URL=https://suvidha-one.onrender.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_here
```

4. **Build and run with Docker**
```bash
# Build the Docker image
docker-compose build

# Run the container
docker-compose up -d

# Check logs
docker-compose logs -f
```

5. **Access the application**
```
http://localhost:3000
```

---

### Option 2: Direct Node.js Deployment

#### Prerequisites
- Node.js 20+ installed
- npm or yarn

#### Steps:

1. **Install dependencies**
```bash
npm install
```

2. **Set environment variables**
```bash
export NEXT_PUBLIC_API_URL=https://suvidha-one.onrender.com
export NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_here
```

3. **Build the application**
```bash
npm run build
```

4. **Start production server**
```bash
npm run start
```

---

### Option 3: PM2 Deployment (Production Process Manager)

#### Prerequisites
- PM2 installed globally: `npm install -g pm2`

#### Steps:

1. **Create ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'suvidha-one-frontend',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://suvidha-one.onrender.com',
      NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_test_your_key_here'
    }
  }]
};
```

2. **Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### Option 4: Railway Deployment

1. **Connect GitHub repository**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically on push**

Environment variables needed:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

---

### Option 5: Render Deployment

1. **Create new Web Service**
2. **Connect repository**
3. **Build command**: `npm run build`
4. **Start command**: `npm run start`
5. **Set environment variables**

---

## 📋 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080` | ✅ Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name | `SUVIDHA ONE` | ❌ No |
| `NEXT_PUBLIC_APP_VERSION` | App version | `1.0.0` | ❌ No |
| `NEXT_PUBLIC_KIOSK_MODE` | Enable kiosk mode | `true` | ❌ No |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key | - | ✅ For payments |
| `NEXT_PUBLIC_ENABLE_BILL_PAYMENT` | Enable bill payments | `true` | ❌ No |
| `NEXT_PUBLIC_ENABLE_CERTIFICATES` | Enable certificates | `true` | ❌ No |
| `NEXT_PUBLIC_ENABLE_GRIEVANCES` | Enable grievances | `true` | ❌ No |

---

## 🔧 Configuration Files

### docker-compose.yml
```yaml
services:
  suvidha-one:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://suvidha-one.onrender.com
    restart: unless-stopped
```

### .env.local (Development)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_key
```

### .env.production (Production)
```env
NEXT_PUBLIC_API_URL=https://suvidha-one.onrender.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_key
```

---

## ✅ Pre-Deployment Checklist

- [ ] Backend API is deployed and accessible
- [ ] `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Razorpay keys are configured (if using payments)
- [ ] CORS is configured on backend to allow frontend domain
- [ ] SSL certificate is set up (for production)
- [ ] Environment variables are secured (not in version control)
- [ ] `.env` files are in `.gitignore`

---

## 🔒 Security Best Practices

1. **Never commit `.env` files**
```bash
# .gitignore
.env.local
.env.production
.env*.local
```

2. **Use environment-specific keys**
- Test keys for development
- Live keys only in production

3. **Enable HTTPS in production**
- Use Let's Encrypt or cloud provider SSL

4. **Set secure headers**
- Configure in `next.config.mjs` or reverse proxy

---

## 🐛 Troubleshooting

### "NEXT_PUBLIC_API_URL references Secret" Error
**Cause**: Old Vercel configuration
**Fix**: Remove `vercel.json` and use `.env.local`

### Build fails with environment variable error
**Fix**: Ensure all `NEXT_PUBLIC_*` variables are set before build

### CORS errors in browser
**Fix**: Configure backend to allow frontend origin

### Port already in use
**Fix**: Change port in `docker-compose.yml` or stop other services

---

## 📞 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Test backend API connectivity
4. Check browser console for errors

---

**Made with ❤️ for Digital India**
*SUVIDHA ONE - One Kiosk, All Services*
