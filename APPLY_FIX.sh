#!/bin/bash
# Apply temporary SSL fix - Run with sudo

echo "=== Applying SSL Fix ==="

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run: sudo bash APPLY_FIX.sh"
    exit 1
fi

# Switch to temp SSL config
rm -f /etc/nginx/sites-enabled/ctlplumbingllc
ln -sf /home/djscrew/opensite/nginx-temp-ssl.conf /etc/nginx/sites-enabled/ctlplumbingllc

# Test nginx config
echo "Testing nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx config test failed"
    exit 1
fi

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

echo ""
echo "=== ✅ TEMPORARY SSL APPLIED ==="
echo ""
echo "⚠️  WARNING: Using self-signed certificate!"
echo "   Browsers will show a security warning."
echo "   Click 'Advanced' -> 'Proceed' to access the site."
echo ""
echo "🌐 Your app is now available at:"
echo "   https://app.ctlplumbingllc.com"
echo ""
echo "📋 To get proper SSL certificates, run:"
echo "   sudo bash /home/djscrew/opensite/fix-ssl.sh"
