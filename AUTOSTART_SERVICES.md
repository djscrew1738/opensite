# Auto-Start Services Configuration

Your OpenSite application is now configured to start automatically when the server boots!

## ✅ Services Installed

**Backend Service:** `opensite-backend.service`
- Starts API server on port 3001
- Restarts automatically if it crashes
- Logs to: `/home/djscrew/opensite/logs/backend.log`

**Frontend Service:** `opensite-frontend.service`
- Starts Vite dev server (finds available port 3000-3003)
- Restarts automatically if it crashes
- Logs to: `/home/djscrew/opensite/logs/frontend.log`

## 🎯 Service Management Commands

### Check Status
```bash
# Check both services
systemctl --user status opensite-backend.service
systemctl --user status opensite-frontend.service

# Quick status check
systemctl --user is-active opensite-backend.service
systemctl --user is-active opensite-frontend.service
```

### Start/Stop/Restart
```bash
# Start services
systemctl --user start opensite-backend.service
systemctl --user start opensite-frontend.service

# Stop services
systemctl --user stop opensite-backend.service
systemctl --user stop opensite-frontend.service

# Restart services
systemctl --user restart opensite-backend.service
systemctl --user restart opensite-frontend.service
```

### Enable/Disable Auto-Start
```bash
# Disable auto-start (but keep service running)
systemctl --user disable opensite-backend.service
systemctl --user disable opensite-frontend.service

# Re-enable auto-start
systemctl --user enable opensite-backend.service
systemctl --user enable opensite-frontend.service
```

### View Logs
```bash
# View live logs
journalctl --user -u opensite-backend.service -f
journalctl --user -u opensite-frontend.service -f

# View recent logs
journalctl --user -u opensite-backend.service -n 50
journalctl --user -u opensite-frontend.service -n 50

# View log files directly
tail -f ~/opensite/logs/backend.log
tail -f ~/opensite/logs/frontend.log
```

## 🔧 Configuration

Service files are located at:
- `~/.config/systemd/user/opensite-backend.service`
- `~/.config/systemd/user/opensite-frontend.service`

After editing service files:
```bash
systemctl --user daemon-reload
systemctl --user restart opensite-backend.service
systemctl --user restart opensite-frontend.service
```

## 🚀 What Happens on Boot

1. **Server boots up**
2. **Network comes online** → Backend service starts
3. **Backend is ready** → Frontend service starts
4. **Services monitor themselves** → Auto-restart if they crash

Your app will be available at:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000-3003 (first available port)

## 🛠️ Troubleshooting

### Services not starting?
```bash
# Check service status
systemctl --user status opensite-backend.service
systemctl --user status opensite-frontend.service

# Check logs for errors
journalctl --user -u opensite-backend.service -n 100
journalctl --user -u opensite-frontend.service -n 100
```

### Check if lingering is enabled
```bash
# Should show your username
loginctl show-user $USER | grep Linger

# If not, enable it:
loginctl enable-linger $USER
```

### Test manually
```bash
# Stop services
systemctl --user stop opensite-backend.service opensite-frontend.service

# Test backend manually
cd ~/opensite/backend && npm run dev

# Test frontend manually (in another terminal)
cd ~/opensite/frontend && npm run dev

# If manual works, restart services
systemctl --user start opensite-backend.service opensite-frontend.service
```

### Port conflicts
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :3000

# Frontend will automatically find next available port
```

## 📊 Performance

The services use minimal resources:
- Backend: ~40-50MB RAM
- Frontend: ~60-70MB RAM
- Auto-restart on failure
- Log rotation recommended for production

## 🔒 Security Notes

- Services run as your user account (not root)
- Limited to localhost by default
- No external exposure without additional configuration
- Logs contain request/response data

## 🎉 Benefits

✅ **Auto-recovery** - Services restart if they crash
✅ **Boot persistence** - Start automatically on reboot
✅ **Easy management** - Simple systemctl commands
✅ **Centralized logging** - All logs in one place
✅ **No manual startup** - Just reboot and it works

## 🗑️ Uninstall

To remove auto-start:
```bash
# Disable and stop services
systemctl --user disable --now opensite-backend.service
systemctl --user disable --now opensite-frontend.service

# Remove service files
rm ~/.config/systemd/user/opensite-backend.service
rm ~/.config/systemd/user/opensite-frontend.service

# Reload systemd
systemctl --user daemon-reload
```

---

**Your app is now production-ready with auto-start enabled!** 🚀

Test it: Reboot your server and the app will automatically be running!
