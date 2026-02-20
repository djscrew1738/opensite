# OpenSite Remote Access via Tailscale

Your OpenSite Plumbing Intelligence Platform is now accessible remotely via Tailscale!

## 🌐 Access URLs

### From ANY Device on Your Tailscale Network:

**Main Application:**
```
http://100.83.120.32:3000
```

**Backend API:**
```
http://100.83.120.32:5001
```

**API Health Check:**
```
http://100.83.120.32:5001/api/health
```

### From Local Machine:
```
http://localhost:3000  (frontend)
http://localhost:5001  (backend)
```

---

## 📱 Access from Other Devices

### Requirements:
1. Device must have **Tailscale installed and connected**
2. Must be logged into the same Tailscale account (**cory.nich@**)
3. No additional firewall configuration needed!

### Your Tailscale Network:
- **acer-ai** (this server) - 100.83.120.32 - ✅ ONLINE
- desktop/remote device - 100.115.136.62
- desktop-o26idtv - 100.127.118.111 - Offline
- home-server - 100.109.158.92 - Offline
- iphone-12-pro - 100.109.100.60 - Offline
- motorola-moto-g---2025 - 100.92.210.105 - Offline

---

## 🚀 Quick Setup on Other Devices

### On iPhone (iOS):
1. Install Tailscale from App Store
2. Sign in with your account
3. Connect to network
4. Open Safari: `http://100.83.120.32:3000`

### On Android:
1. Install Tailscale from Play Store
2. Sign in with your account
3. Connect to network
4. Open Chrome: `http://100.83.120.32:3000`

### On Windows (desktop-o26idtv):
1. Start Tailscale client
2. Ensure connected
3. Open browser: `http://100.83.120.32:3000`

### On Another Linux Machine (home-server):
1. Start Tailscale: `sudo tailscale up`
2. Open browser: `http://100.83.120.32:3000`

---

## ✅ What's Accessible

### Full Application Features:
- ✅ **Dashboard** - Pipeline tracking, project overview
- ✅ **Lead Finder** - Create, score, manage leads
- ✅ **Pricing Calculator** - 3-tier estimates
- ✅ **PDF Upload** - Blueprint analysis
- ✅ **AI Assistant** - Chat with 5 AI models
- ✅ **Settings** - View models, system info

### AI Models Available Remotely:
- llama3.1:latest (4.9 GB)
- qwen2.5-coder:7b (4.7 GB)
- deepseek-r1:1.5b (1.1 GB)
- sam860/phi4-mini:3.8b (2.3 GB)
- gpt-oss:20b (13.8 GB)

---

## 🔒 Security Features

### Why Tailscale is Secure:
- ✅ **Encrypted** - All traffic encrypted end-to-end
- ✅ **Private Network** - Only your devices can access
- ✅ **No Port Forwarding** - No router configuration needed
- ✅ **No Public Exposure** - Not accessible from internet
- ✅ **NAT Traversal** - Works through firewalls
- ✅ **WireGuard Based** - Modern, fast, secure protocol

### Your Data:
- All AI processing happens **locally on acer-ai**
- No data sent to cloud services
- Ollama models run **entirely on-premise**
- Blueprint PDFs processed and deleted immediately

---

## 📊 Performance Tips

### For Best Performance:
1. **Use on same LAN** - Tailscale detects local network, routes directly
2. **Use WiFi/Ethernet** - Better than cellular for large blueprints
3. **Choose fast models** - Use deepseek-r1:1.5b for mobile
4. **Limit PDF size** - Keep blueprints under 10MB for mobile

### Expected Response Times:
- **Same LAN**: Near-instant (1-5ms latency)
- **Remote via Tailscale**: Fast (20-50ms typical)
- **Cellular**: Good (50-200ms depending on signal)

---

## 🎯 Use Cases

### On-Site Visits:
1. Use iPhone/Android at job site
2. Access opensite via Tailscale
3. Upload blueprint photos
4. Get instant AI analysis
5. Generate quote on-site

### Home Office:
1. Use desktop-o26idtv from home
2. Access full dashboard
3. Score leads
4. Review projects
5. Chat with AI assistant

### Remote Work:
1. Access from anywhere
2. Full functionality
3. Secure connection
4. No VPN configuration needed

---

## 🔧 Server Configuration

### Backend (Port 5001):
- Listening on: `0.0.0.0:5001` (all interfaces)
- CORS: Enabled for all origins
- Accessible via: Tailscale IP, localhost

### Frontend (Port 3000):
- Listening on: `0.0.0.0:3000` (all interfaces)
- Proxies API to: `localhost:5001`
- Accessible via: Tailscale IP, localhost

### Files Modified:
- `backend/src/server.js` - Bind to all interfaces
- `frontend/vite.config.js` - Enable network access

---

## 🐛 Troubleshooting

### Can't Access from Other Device

**Problem**: Page won't load on remote device

**Solutions:**
1. Check Tailscale is running on both devices:
   ```bash
   tailscale status
   ```

2. Verify you're using Tailscale IP (100.83.120.32) not localhost

3. Check servers are running on acer-ai:
   ```bash
   curl http://100.83.120.32:5001/api/health
   ```

4. Restart Tailscale on client device

5. Try accessing API directly first, then frontend

### Slow Performance

**Problem**: App is slow on remote device

**Solutions:**
1. Check Tailscale connection quality:
   ```bash
   tailscale status --peers
   ```

2. Use faster AI model (deepseek-r1:1.5b)

3. Reduce blueprint PDF file sizes

4. Check your cellular/WiFi signal

### Backend Not Responding

**Problem**: API health check fails

**Solutions:**
1. Check backend is running:
   ```bash
   ps aux | grep "node.*server.js"
   ```

2. Check backend logs:
   ```bash
   tail -f /home/djscrew/opensite/backend.log
   ```

3. Restart backend:
   ```bash
   cd /home/djscrew/opensite/backend
   npm run dev
   ```

### Frontend Not Loading

**Problem**: Page is blank or won't load

**Solutions:**
1. Check frontend is running:
   ```bash
   ps aux | grep vite
   ```

2. Check frontend logs:
   ```bash
   tail -f /home/djscrew/opensite/frontend.log
   ```

3. Restart frontend:
   ```bash
   cd /home/djscrew/opensite/frontend
   npm run dev
   ```

---

## 📱 Mobile Browser Tips

### iPhone Safari:
- ✅ Add to Home Screen for app-like experience
- ✅ Full functionality supported
- ✅ PDF upload works via camera or files
- ⚠️ Use WiFi for large blueprints

### Android Chrome:
- ✅ Add to Home Screen available
- ✅ All features work
- ✅ PDF upload from any app
- ⚠️ Disable data saver for uploads

---

## 🎨 Bookmark These URLs

### For Mobile Devices:
Save these bookmarks for quick access:

1. **Dashboard**: `http://100.83.120.32:3000`
2. **Lead Finder**: `http://100.83.120.32:3000/leads`
3. **Pricing**: `http://100.83.120.32:3000/pricing`
4. **AI Chat**: `http://100.83.120.32:3000/ai`

---

## 🔄 Restart Servers

If you need to restart the servers:

```bash
# Stop servers
pkill -f "node.*server.js"
pkill -f "vite"

# Start servers
cd /home/djscrew/opensite
./start.sh

# Or manually:
cd /home/djscrew/opensite/backend && npm run dev &
cd /home/djscrew/opensite/frontend && npm run dev &
```

---

## 📞 Support Info

**Server**: acer-ai
**Tailscale IP**: 100.83.120.32 (server) / 100.115.136.62 (remote device)
**Network**: cory.nich@ Tailscale network
**OS**: Linux
**Services**:
- Backend: Node.js on port 5001
- Frontend: Vite dev server on port 3000
- Ollama: Running with 5 models

---

## ✨ Benefits of Remote Access

### Business Advantages:
1. **On-site estimates** - Upload blueprints from job site
2. **Quick quotes** - Generate pricing anywhere
3. **Team collaboration** - Multiple devices can access
4. **Work from home** - Full access remotely
5. **Client meetings** - Show dashboard on any device

### Technical Advantages:
1. **No cloud needed** - All processing local
2. **Fast & secure** - Tailscale encrypted tunnel
3. **Easy setup** - No router config
4. **Cross-platform** - Works on any device
5. **Always updated** - One server, all devices in sync

---

**Your OpenSite platform is now accessible from any device on your Tailscale network! 🎉**

Access it now: **http://100.83.120.32:3000**
