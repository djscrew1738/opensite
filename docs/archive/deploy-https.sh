#!/bin/bash
# Deploy HTTPS for OpenSite
# Run this script after updating DNS to point to this server

set -e

APP_DIR="/home/djscrew/opensite"
DOMAIN="app.ctlplumbingllc.com"
PUBLIC_IP=$(curl -s ifconfig.me)

echo "=============================================="
echo "  OpenSite HTTPS Deployment"
echo "=============================================="
echo ""
echo "Domain: $DOMAIN"
echo "Server IP: $PUBLIC_IP"
echo ""

# Check if DNS is correctly configured
echo "Step 1: Checking DNS configuration..."
DNS_IP=$(dig +short $DOMAIN @8.8.8.8 2>/dev/null || echo "")

if [ "$DNS_IP" != "$PUBLIC_IP" ]; then
    echo ""
    echo "⚠️  WARNING: DNS not pointing to this server!"
    echo "   Current DNS: $DNS_IP"
    echo "   Expected:    $PUBLIC_IP"
    echo ""
    echo "Please update your DNS in Cloudflare:"
    echo "  1. Go to https://dash.cloudflare.com"
    echo "  2. Select 'ctlplumbingllc.com'"
    echo "  3. Go to DNS > Records"
    echo "  4. Update 'app' A record to: $PUBLIC_IP"
    echo "  5. Disable Proxy (gray cloud icon)"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to abort..."
fi

# Stop nginx temporarily for certbot
echo ""
echo "Step 2: Stopping Nginx for SSL certificate..."
sudo systemctl stop nginx || true

# Obtain SSL certificate
echo ""
echo "Step 3: Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone -d $DOMAIN --agree-tos --non-interactive --email admin@$DOMAIN || {
    echo ""
    echo "❌ SSL certificate issuance failed!"
    echo "Common causes:"
    echo "  - DNS not pointing to this server"
    echo "  - Port 80 blocked by firewall"
    echo "  - Another service using port 80"
    echo ""
    echo "Starting Nginx back up..."
    sudo systemctl start nginx
    exit 1
}

# Verify certificate was created
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "❌ Certificate files not found!"
    sudo systemctl start nginx
    exit 1
fi

echo "✅ SSL certificate obtained!"

# Update Nginx configuration
echo ""
echo "Step 4: Configuring Nginx with SSL..."
sudo cp $APP_DIR/nginx-ssl.conf /etc/nginx/sites-available/default

# Test Nginx configuration
echo ""
echo "Step 5: Testing Nginx configuration..."
sudo nginx -t || {
    echo "❌ Nginx configuration test failed!"
    sudo systemctl start nginx
    exit 1
}

# Start Nginx
echo ""
echo "Step 6: Starting Nginx..."
sudo systemctl start nginx

# Setup auto-renewal
echo ""
echo "Step 7: Setting up certificate auto-renewal..."
if ! grep -q "certbot renew" /etc/crontab 2>/dev/null; then
    echo "0 3 * * * root certbot renew --quiet --deploy-hook 'systemctl reload nginx'" | sudo tee -a /etc/crontab > /dev/null
    echo "✅ Auto-renewal configured (daily at 3 AM)"
else
    echo "✅ Auto-renewal already configured"
fi

# Update environment files
echo ""
echo "Step 8: Updating environment configuration..."

# Backend .env
cat > $APP_DIR/backend/.env << EOF
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
CORS_ORIGIN=https://$DOMAIN,http://$DOMAIN,http://100.83.120.32:3000,http://localhost:3000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/opensite
EOF

# Frontend .env.production
cat > $APP_DIR/frontend/.env.production << EOF
VITE_API_URL=https://$DOMAIN/api
EOF

echo "✅ Environment files updated"

# Restart backend to pick up new CORS settings
echo ""
echo "Step 9: Restarting backend service..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2
cd $APP_DIR/backend && npm run dev > $APP_DIR/backend.log 2>&1 &
echo "✅ Backend restarted"

echo ""
echo "=============================================="
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Your app is now available at:"
echo "  🔒 https://$DOMAIN"
echo ""
echo "Test these URLs:"
echo "  • https://$DOMAIN (Main app)"
echo "  • https://$DOMAIN/api/health (API health)"
echo ""
echo "Notes:"
echo "  • SSL certificates auto-renew daily at 3 AM"
echo "  • Tailscale access still works: http://100.83.120.32:3000"
echo "  • View logs: tail -f $APP_DIR/backend.log"
echo ""
