# SUVIDHA ONE - Troubleshooting Guide

## 🔧 Common Issues & Solutions

### 1. "API Error: TypeError: Failed to fetch"

**Symptoms:**
- Console shows: `API Error: TypeError: Failed to fetch`
- Network tab shows failed requests
- Backend appears unreachable

**Causes & Solutions:**

#### A. CORS Not Configured (Most Common)
```bash
# Check browser console for CORS errors
# Look for: "Access to fetch at ... has been blocked by CORS policy"
```

**Fix:**
1. Ensure backend nginx.conf has CORS headers (already added)
2. Rebuild and restart backend:
```bash
cd /mnt/c/SUVIDHA_ONE/suvidha-one-backend
docker-compose down
docker-compose up -d --build
```

#### B. Wrong API URL
```bash
# Check .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL

# Should be:
# Development: NEXT_PUBLIC_API_URL=http://localhost:8080
# Production: NEXT_PUBLIC_API_URL=https://suvidha-one.onrender.com
```

**Fix:**
```bash
# Update .env.local
nano .env.local

# Rebuild frontend
npm run build
npm run start
```

#### C. Backend Not Running
```bash
# Test backend health
curl http://localhost:8080/health

# Should return: {"status":"healthy","service":"nginx"}
```

**Fix:**
```bash
# Start backend
cd /mnt/c/SUVIDHA_ONE/suvidha-one-backend
docker-compose up -d

# Check logs
docker-compose logs -f
```

#### D. Network/Firewall Issues
```bash
# Test connectivity
ping suvidha-one.onrender.com

# Test specific endpoint
curl -X GET https://suvidha-one.onrender.com/health
```

---

### 2. "NEXT_PUBLIC_API_URL references Secret" Error

**Cause:** Old Vercel configuration

**Fix:**
```bash
# Remove vercel.json if it exists
rm vercel.json

# Use .env.local instead
cp .env.example .env.local
```

---

### 3. Build Fails with TypeScript Errors

**Symptoms:**
```
Type error: Property 'X' does not exist on type 'Y'
```

**Fix:**
```bash
# Clean and rebuild
rm -rf node_modules .next
npm install
npm run build

# If errors persist, check type definitions
npx tsc --noEmit
```

---

### 4. Docker Build Fails

**Symptoms:**
```
ERROR: failed to solve: process didn't exit successfully
```

**Fix:**
```bash
# Clean Docker
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker resources
docker stats
```

---

### 5. OTP Not Sending

**Causes:**
- SMS service not configured
- Wrong phone number format
- Rate limiting

**Fix:**
```bash
# Check backend logs
docker-compose logs notification-service

# Verify SMS configuration
cat .env | grep SMS

# Test OTP endpoint manually
curl -X POST http://localhost:8080/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","kiosk_id":"KIOSK001"}'
```

---

### 6. Payment Integration Not Working

**Symptoms:**
- Razorpay checkout not opening
- Payment status shows error

**Fix:**
```bash
# Check Razorpay key in .env.local
cat .env.local | grep RAZORPAY

# Should have:
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# Verify key is valid (test mode)
# Visit: https://dashboard.razorpay.com/app/keys

# Clear browser cache and retry
```

---

### 7. Dark Mode Not Working

**Symptoms:**
- Toggle button doesn't change theme
- Theme reverts on refresh

**Fix:**
```bash
# Check browser localStorage
# Open DevTools > Console:
localStorage.getItem('theme')

# Should return: 'light' or 'dark'

# Clear and retry
localStorage.removeItem('theme')
location.reload()
```

---

### 8. "Module not found" Errors

**Symptoms:**
```
Module not found: Can't resolve 'react-icons/fi'
```

**Fix:**
```bash
# Install missing dependency
npm install react-icons

# Or all dependencies
npm install

# Restart dev server
npm run dev
```

---

### 9. Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

### 10. Slow Performance / High Memory Usage

**Fix:**
```bash
# Enable production mode
npm run build
npm run start

# Or use PM2
pm2 start ecosystem.config.js

# Monitor memory
pm2 monit
```

---

## 📊 Debugging Tools

### Browser DevTools

1. **Console** - View errors and logs
2. **Network** - Inspect API requests
3. **Application** - Check localStorage, cookies
4. **Sources** - Set breakpoints

### Backend Logs

```bash
# View all services
docker-compose logs -f

# View specific service
docker-compose logs -f auth-service
docker-compose logs -f utility-service
```

### Frontend Logs

```bash
# Check browser console
# API requests are logged with:
# - Request URL
# - Request method
# - Response data
```

### Health Checks

```bash
# Backend health
curl http://localhost:8080/health

# Individual services
curl http://localhost:8080/auth/health
curl http://localhost:8080/payments/health

# Frontend (if running)
curl http://localhost:3000
```

---

## 🔍 Network Debugging

### Test CORS

```bash
# Send OPTIONS request (preflight)
curl -X OPTIONS http://localhost:8080/auth/otp/send \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -i

# Should see headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### Test Authentication Flow

```bash
# 1. Send OTP
curl -X POST http://localhost:8080/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","kiosk_id":"KIOSK001"}'

# 2. Verify OTP (use OTP from logs/SMS)
curl -X POST http://localhost:8080/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","otp":"123456","kiosk_id":"KIOSK001"}'

# Should return JWT tokens
```

---

## 📞 Getting Help

1. **Check logs first** - 90% of issues are in the logs
2. **Search error messages** - Copy exact error to Google/GitHub
3. **Check environment variables** - Most issues are config-related
4. **Restart services** - Classic but effective
5. **Clear cache** - Browser, Docker, npm

### Useful Commands

```bash
# Reset everything
docker-compose down -v
rm -rf node_modules .next
npm install
docker-compose up -d --build

# Export logs for debugging
docker-compose logs > logs.txt 2>&1
```

---

## 🎯 Quick Checklist

Before reporting an issue:

- [ ] Backend is running (`docker-compose ps`)
- [ ] Frontend is running (`npm run dev`)
- [ ] `.env.local` exists with correct values
- [ ] No CORS errors in console
- [ ] Backend health check passes
- [ ] Network tab shows requests going out
- [ ] Browser cache cleared
- [ ] Docker containers healthy

---

**Made with ❤️ for Digital India**
*SUVIDHA ONE - One Kiosk, All Services*
