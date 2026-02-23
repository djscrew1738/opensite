# Cloudflare Tunnel Setup for ctlplumbingllc.com

## ✅ Current Status: TUNNEL ALREADY RUNNING!

Your Cloudflare tunnel is **already active and serving traffic**!

### Tunnel Details
- **Name:** jobpulse
- **ID:** 675053e2-b4cf-4570-a2cd-fc58a3abeb82
- **Status:** 🟢 Active (4 connections to Cloudflare edge)
- **Origin:** https://localhost:443 (your nginx server)

### Configured Hostnames
The tunnel is currently routing:
- ✅ `app.cbrnholdings.com` → Your local server
- ✅ `app.ctlplumbingllc.com` → Your local server

## 🔍 Verify Tunnel is Working

```bash
# Check if tunnel is running
ps aux | grep cloudflared

# Check tunnel status
cloudflared tunnel info jobpulse

# Check tunnel list
cloudflared tunnel list
```

## 🌐 Access Your Application

**Through Cloudflare Tunnel:**
- https://app.ctlplumbingllc.com (via Cloudflare)

**Direct (local):**
- https://localhost (self-signed cert)

## 📋 Current Configuration

**File:** `~/.cloudflared/config.yml`

```yaml
tunnel: 675053e2-b4cf-4570-a2cd-fc58a3abeb82
credentials-file: /home/djscrew/.cloudflared/675053e2-b4cf-4570-a2cd-fc58a3abeb82.json

ingress:
  - hostname: app.cbrnholdings.com
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  - hostname: app.ctlplumbingllc.com
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

## 🚀 Add More Domains

To add additional hostnames (e.g., `ctlplumbingllc.com` without subdomain):

```bash
# Edit the config
nano ~/.cloudflared/config.yml
```

Add to the ingress rules:
```yaml
ingress:
  - hostname: ctlplumbingllc.com
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  - hostname: www.ctlplumbingllc.com
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  # ... existing hostnames
  - service: http_status:404
```

Then restart the tunnel:
```bash
# Kill existing tunnel processes
pkill cloudflared

# Start tunnel again
cloudflared tunnel run jobpulse
```

## 🔄 Run as System Service

To run the tunnel automatically on boot:

```bash
# Install as a service
sudo cloudflared service install

# Or create a systemd service manually
sudo tee /etc/systemd/system/cloudflared-jobpulse.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel for jobpulse
After=network.target

[Service]
Type=simple
User=djscrew
ExecStart=/usr/local/bin/cloudflared tunnel run jobpulse
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-jobpulse
sudo systemctl start cloudflared-jobpulse

# Check status
sudo systemctl status cloudflared-jobpulse
```

## 🌟 Benefits of Cloudflare Tunnel

✅ **No port forwarding needed** - Works behind NAT/firewall  
✅ **Automatic SSL** - HTTPS out of the box via Cloudflare  
✅ **DDoS protection** - Cloudflare's network protection  
✅ **No certificate management** - Cloudflare handles SSL  
✅ **Secure** - Encrypted tunnel, no exposed ports  

## 🔧 Troubleshooting

### Tunnel won't start
```bash
# Check credentials file exists
ls -la ~/.cloudflared/*.json

# Test tunnel without running
cloudflared tunnel ingress validate

# Run with debug logging
cloudflared tunnel run jobpulse --log-level debug
```

### DNS not resolving
Ensure DNS records in Cloudflare dashboard point to the tunnel:
1. Login to https://dash.cloudflare.com
2. Select your domain (ctlplumbingllc.com)
3. Go to DNS settings
4. Records should be CNAME to your tunnel ID

### Connection refused
Make sure your local server is running:
```bash
# Test local connection
curl https://localhost --insecure

# Check nginx
sudo systemctl status nginx
```

## 📊 Tunnel Metrics

View real-time metrics:
```bash
cloudflared tunnel info jobpulse
```

## 🔒 Security Notes

- Tunnel uses authenticated connection to Cloudflare
- Credentials stored in `~/.cloudflared/`
- Origin certificate validation disabled (`noTLSVerify: true`) - uses self-signed certs locally
- All traffic encrypted between client ↔ Cloudflare ↔ Origin

## ✅ Next Steps

1. **Test the tunnel:**
   ```bash
   curl https://app.ctlplumbingllc.com
   ```

2. **Add root domain** (ctlplumbingllc.com without subdomain):
   - Edit `~/.cloudflared/config.yml`
   - Add hostname entry
   - Restart tunnel

3. **Setup systemd service** for auto-start on boot

4. **Monitor in Cloudflare dashboard:**
   - https://dash.cloudflare.com → Zero Trust → Tunnels

---

**Status:** 🟢 Tunnel Active and Routing Traffic
