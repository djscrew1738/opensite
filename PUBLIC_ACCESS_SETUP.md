# Public HTTPS Access Setup

This guide explains how to make your OpenSite app publicly accessible at `https://app.ctlplumbingllc.com`.

## Current Status

| Setting | Value |
|---------|-------|
| Domain | `app.ctlplumbingllc.com` |
| Current DNS (Tailscale) | `100.83.120.32` (private) |
| Public IP | `207.213.187.25` |
| DNS Provider | Cloudflare |

## ⚠️ Prerequisites

Before running the deployment script, you **MUST** update your DNS:

### Step 1: Update DNS in Cloudflare

1. Go to https://dash.cloudflare.com
2. Select your domain: **ctlplumbingllc.com**
3. Navigate to **DNS** → **Records**
4. Find the `app` A record (currently pointing to `100.83.120.32`)
5. **Change it to**: `207.213.187.25`
6. **Important**: Set Proxy status to **DNS only** (gray cloud ☁️, NOT orange)
7. Click **Save**

### Step 2: Verify DNS Propagation

Wait 1-5 minutes for DNS to propagate, then verify:

```bash
dig +short app.ctlplumbingllc.com
```

Should return: `207.213.187.25`

### Step 3: Run Deployment Script

Once DNS is updated, run:

```bash
cd /home/djscrew/opensite
sudo ./deploy-https.sh
```

This script will:
- ✅ Obtain SSL certificate from Let's Encrypt
- ✅ Configure Nginx for HTTPS
- ✅ Set up auto-renewal
- ✅ Update backend CORS settings
- ✅ Restart services

## What Happens After

Your app will be available at:

| URL | Access |
|-----|--------|
| `https://app.ctlplumbingllc.com` | ✅ Public HTTPS (recommended) |
| `http://100.83.120.32:3000` | ✅ Tailscale (still works) |
| `http://localhost:3000` | ✅ Local only |

## Troubleshooting

### DNS Not Propagating
```bash
# Check from different DNS servers
dig +short app.ctlplumbingllc.com @8.8.8.8
dig +short app.ctlplumbingllc.com @1.1.1.1
```

### SSL Certificate Fails
Common causes:
1. DNS still pointing to wrong IP
2. Port 80 blocked by firewall
3. Cloudflare proxy enabled (orange cloud)

Fix:
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# Restart deployment
sudo ./deploy-https.sh
```

### Certificate Renewal
Auto-renewal is configured. To manually renew:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Reverting to Tailscale Only
If you want to go back to Tailscale-only access:
1. Update DNS back to `100.83.120.32`
2. Restore original nginx config: `sudo cp nginx.conf /etc/nginx/sites-available/default`
3. Reload nginx: `sudo systemctl reload nginx`

## Security Considerations

✅ **Enabled:**
- SSL/TLS encryption
- HSTS headers
- Security headers (XSS, CSRF protection)
- Auto certificate renewal

⚠️ **Notes:**
- App is now publicly accessible (anyone with the URL can access)
- Consider adding authentication if needed
- All traffic is encrypted via HTTPS

## Files Modified

| File | Purpose |
|------|---------|
| `/etc/nginx/sites-available/default` | Nginx HTTPS config |
| `/etc/letsencrypt/live/app.ctlplumbingllc.com/` | SSL certificates |
| `backend/.env` | CORS settings |
| `frontend/.env.production` | API URL |

## Support

If issues persist:
1. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
2. Check backend logs: `tail -f /home/djscrew/opensite/backend.log`
3. Verify services: `sudo systemctl status nginx`
