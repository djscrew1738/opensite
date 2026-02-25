#!/bin/bash
# Quick SSL Fix for app.ctlplumbingllc.com

echo "=== Fixing SSL for app.ctlplumbingllc.com ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root: sudo bash fix-ssl.sh"
    exit 1
fi

# Step 1: Obtain SSL Certificate
echo "📋 Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone -d app.ctlplumbingllc.com --agree-tos --non-interactive --email cory.nich@ctlplumbingllc.com

if [ $? -ne 0 ]; then
    echo "❌ SSL certificate issuance failed"
    echo "Common causes:"
    echo "  - Port 80 not accessible from internet (check firewall)"
    echo "  - Domain not pointing to this server"
    exit 1
fi

echo "✅ SSL certificate obtained!"

# Step 2: Switch to SSL nginx config
echo "📋 Configuring nginx for HTTPS..."
rm -f /etc/nginx/sites-enabled/ctlplumbingllc
ln -sf /home/djscrew/opensite/nginx-ssl.conf /etc/nginx/sites-enabled/ctlplumbingllc

# Step 3: Test and reload nginx
echo "📋 Testing nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed"
    exit 1
fi

echo "📋 Reloading nginx..."
systemctl reload nginx

echo ""
echo "=== ✅ FIX COMPLETE ==="
echo ""
echo "Your app should now work at:"
echo "  🔒 https://app.ctlplumbingllc.com"
echo ""
echo "Test it:"
echo "  curl https://app.ctlplumbingllc.com/api/health"
