#!/bin/bash

# Production Deployment Script for ctlplumbingllc.com
# Run this script on your server at 100.83.120.32

set -e

echo "🚀 Starting production deployment for ctlplumbingllc.com..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="ctlplumbingllc.com"
APP_DOMAIN="app.ctlplumbingllc.com"
EMAIL="admin@ctlplumbingllc.com"  # Change this to your email
PROJECT_DIR="/home/djscrew/opensite"
NGINX_CONF="/etc/nginx/sites-available/ctlplumbingllc.com"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y
print_status "System updated"

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y nginx certbot python3-certbot-nginx curl software-properties-common
print_status "Packages installed"

# Install Node.js 20.x if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    print_status "Node.js installed"
else
    print_status "Node.js already installed"
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 already installed"
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm ci
npm run build
print_status "Frontend built"

cd "$PROJECT_DIR"

# Build backend
echo "🏗️  Building backend..."
cd backend
npm ci
print_status "Backend dependencies installed"

cd "$PROJECT_DIR"

# Setup nginx configuration
echo "🌐 Configuring nginx..."

# Check if SSL certificates exist
if [ -d "/etc/letsencrypt/live/$APP_DOMAIN" ]; then
    print_status "SSL certificates found, using SSL configuration"
    cp nginx-ssl.conf "$NGINX_CONF"
else
    print_warning "SSL certificates not found, using HTTP configuration initially"
    cp nginx.conf "$NGINX_CONF"
fi

# Enable site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t
print_status "Nginx configuration valid"

# Reload nginx
systemctl reload nginx
print_status "Nginx reloaded"

# Obtain SSL certificates if not present
if [ ! -d "/etc/letsencrypt/live/$APP_DOMAIN" ]; then
    echo "🔒 Obtaining SSL certificates from Let's Encrypt..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$APP_DOMAIN" --agree-tos --non-interactive --email "$EMAIL"
    
    # Update nginx to use SSL configuration
    cp nginx-ssl.conf "$NGINX_CONF"
    nginx -t && systemctl reload nginx
    print_status "SSL certificates obtained and nginx updated"
else
    print_status "SSL certificates already exist"
fi

# Setup auto-renewal for SSL
echo "🔒 Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
print_status "SSL auto-renewal configured"

# Start/Restart backend with PM2
echo "🚀 Starting backend service..."
cd "$PROJECT_DIR/backend"

# Check if backend is already running
if pm2 describe opensite-backend &> /dev/null; then
    pm2 restart opensite-backend
else
    pm2 start server.js --name opensite-backend -- --port 5001
fi

pm2 save
print_status "Backend started with PM2"

# Setup PM2 startup script
pm2 startup systemd -u djscrew --hp /home/djscrew
print_status "PM2 startup script configured"

# Create a simple health check script
cat > /usr/local/bin/opensite-health-check.sh << 'EOF'
#!/bin/bash
# Health check script for OpenSite

if ! curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "Backend is down, restarting..."
    pm2 restart opensite-backend
fi

if ! curl -f http://localhost > /dev/null 2>&1; then
    echo "Nginx is down, restarting..."
    systemctl restart nginx
fi
EOF

chmod +x /usr/local/bin/opensite-health-check.sh

# Add health check to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/opensite-health-check.sh") | crontab -
print_status "Health check cron job added"

# Final status
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Your application is now available at:"
echo "  • https://ctlplumbingllc.com"
echo "  • https://app.ctlplumbingllc.com"
echo ""
echo "Backend API: http://localhost:5001"
echo ""
echo "Useful commands:"
echo "  • View logs: pm2 logs opensite-backend"
echo "  • Restart backend: pm2 restart opensite-backend"
echo "  • Restart nginx: systemctl restart nginx"
echo "  • Check nginx config: nginx -t"
echo ""
echo "SSL certificates will auto-renew via cron."
echo ""
