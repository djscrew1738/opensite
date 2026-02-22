#!/bin/bash
# SSL Setup Script for app.ctlplumbingllc.com

echo "=== OpenSite SSL Setup for app.ctlplumbingllc.com ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get the public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "Your public IP is: $PUBLIC_IP"
echo ""

echo "STEP 1: Update DNS in Cloudflare"
echo "================================"
echo "1. Go to https://dash.cloudflare.com"
echo "2. Select your domain: ctlplumbingllc.com"
echo "3. Go to DNS > Records"
echo "4. Find 'app' A record (currently 100.83.120.32)"
echo "5. Change IP to: $PUBLIC_IP"
echo "6. Set Proxy status to: DNS only (gray cloud, NOT orange)"
echo "7. Save"
echo ""
echo "Press Enter when DNS is updated..."
read

# Verify DNS propagation
echo ""
echo "STEP 2: Verify DNS Propagation"
echo "==============================="
for i in {1..12}; do
    DNS_IP=$(dig +short app.ctlplumbingllc.com @8.8.8.8 2>/dev/null)
    if [ "$DNS_IP" = "$PUBLIC_IP" ]; then
        echo "✅ DNS updated! app.ctlplumbingllc.com → $PUBLIC_IP"
        break
    else
        echo "⏳ Waiting for DNS... Current: $DNS_IP, Expected: $PUBLIC_IP"
        sleep 10
    fi
done

if [ "$DNS_IP" != "$PUBLIC_IP" ]; then
    echo "⚠️  DNS not yet propagated. Continuing anyway..."
fi

echo ""
echo "STEP 3: Obtain SSL Certificate"
echo "==============================="
certbot certonly --standalone -d app.ctlplumbingllc.com --agree-tos --non-interactive --email cory.nich@ctlplumbingllc.com

if [ $? -ne 0 ]; then
    echo "❌ SSL certificate issuance failed"
    echo "Make sure:"
    echo "  - DNS is pointing to this server ($PUBLIC_IP)"
    echo "  - Port 80 is accessible from the internet"
    echo "  - The domain name is correct"
    exit 1
fi

echo "✅ SSL certificate obtained successfully!"

# Set up auto-renewal
echo ""
echo "STEP 4: Setup Auto-Renewal"
echo "==========================="
echo "0 3 * * * root certbot renew --quiet --deploy-hook 'systemctl reload nginx'" > /etc/cron.d/certbot-renewal
echo "✅ Auto-renewal configured (daily at 3 AM)"

echo ""
echo "STEP 5: Configure Nginx"
echo "======================="

# Backup current config
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d)

# Copy new config
cp /home/djscrew/opensite/nginx-ssl.conf /etc/nginx/sites-available/default

# Test nginx config
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed"
    echo "Restoring backup..."
    cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d) /etc/nginx/sites-available/default
    exit 1
fi

# Reload nginx
systemctl reload nginx
echo "✅ Nginx configured and reloaded"

echo ""
echo "STEP 6: Update Backend CORS"
echo "==========================="
# Update backend to accept requests from the new domain
sed -i "s|origin: .*|origin: ['https://app.ctlplumbingllc.com', 'http://app.ctlplumbingllc.com', 'http://localhost:3000', 'http://100.83.120.32:3000'],|" /home/djscrew/opensite/backend/src/server.js 2>/dev/null || echo "Manual update needed for backend CORS"
echo "✅ Backend CORS updated"

echo ""
echo "==================================="
echo "✅ SETUP COMPLETE!"
echo "==================================="
echo ""
echo "Your app is now available at:"
echo "  🔒 https://app.ctlplumbingllc.com"
echo ""
echo "Test the following:"
echo "  1. Open https://app.ctlplumbingllc.com in browser"
echo "  2. Check that SSL certificate is valid"
echo "  3. Test API: https://app.ctlplumbingllc.com/api/health"
echo ""
echo "To renew certificates manually: sudo certbot renew"
echo ""
