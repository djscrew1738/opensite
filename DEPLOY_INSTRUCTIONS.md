# 🚀 Deploy to ctlplumbingllc.com - Quick Instructions

## What You Have Now

Your application is ready to deploy! I've created:

1. **deploy-production.sh** - Automated deployment script
2. **check-deployment.sh** - Verify everything is working
3. **nginx-ssl.conf** - SSL-enabled nginx configuration
4. **docker-compose.prod.yml** - Docker production setup
5. **DEPLOY.md** - Detailed deployment guide

## 🎯 Quick Deploy (5 minutes)

### Step 1: SSH to Your Server

```bash
ssh user@100.83.120.32
# Password: ux4600-420 (if needed)
```

### Step 2: Run Deployment Script

```bash
cd /home/djscrew/opensite
sudo ./deploy-production.sh
# Enter sudo password: ux4600-420
```

This script will:
- ✅ Update system packages
- ✅ Install nginx, certbot, Node.js
- ✅ Build frontend
- ✅ Configure nginx
- ✅ Obtain SSL certificates
- ✅ Start backend service
- ✅ Setup auto-renewal

### Step 3: Verify Deployment

```bash
./check-deployment.sh
```

### Step 4: Check Your Site

Open in browser:
- **https://ctlplumbingllc.com**
- **https://app.ctlplumbingllc.com**

## 🔧 DNS Setup (If Not Done)

Make sure your DNS points to `100.83.120.32`:

```
Type: A
Host: @
Value: 100.83.120.32
TTL: 3600

Type: A
Host: www
Value: 100.83.120.32
TTL: 3600

Type: A
Host: app
Value: 100.83.120.32
TTL: 3600
```

## 📁 File Structure

```
/home/djscrew/opensite/
├── frontend/dist/           ← Built frontend (served by nginx)
├── backend/                 ← Node.js API server
│   └── server.js           ← Main server file
├── nginx-ssl.conf          ← SSL nginx config
├── deploy-production.sh    ← Deployment script ⭐
├── check-deployment.sh     ← Status checker ⭐
└── DEPLOY.md              ← Full guide
```

## 🔍 Common Issues

### If nginx fails to start:
```bash
sudo nginx -t                    # Test config
sudo systemctl status nginx      # Check status
sudo tail -f /var/log/nginx/error.log  # View logs
```

### If backend won't start:
```bash
cd /home/djscrew/opensite/backend
pm2 logs opensite-backend        # View logs
pm2 restart opensite-backend     # Restart
```

### If SSL fails:
```bash
sudo certbot --nginx -d ctlplumbingllc.com -d www.ctlplumbingllc.com -d app.ctlplumbingllc.com
```

## 🔄 Maintenance Commands

```bash
# Update application
cd /home/djscrew/opensite
git pull
cd frontend && npm run build
pm2 restart opensite-backend

# View logs
pm2 logs opensite-backend
sudo tail -f /var/log/nginx/error.log

# Check status
./check-deployment.sh

# Restart services
sudo systemctl restart nginx
pm2 restart opensite-backend
```

## ✅ Post-Deploy Checklist

- [ ] Site loads at https://ctlplumbingllc.com
- [ ] SSL certificate is valid (padlock icon)
- [ ] Login works
- [ ] Documents upload works
- [ ] Vision/Canvas works
- [ ] 4D Plumbing visualizer works

## 🆘 Emergency Contacts

If deployment fails:
1. Check logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify ports: `sudo lsof -i :80 -i :443 -i :5001`
3. Restart everything: `sudo reboot`

## 📊 Current Status

Build Status: **✅ SUCCESS**  
Frontend: **✅ BUILT**  
Backend: **✅ READY**  
SSL Config: **✅ READY**  
Deploy Script: **✅ READY**

**You're all set! Just run the deploy script.** 🎉
