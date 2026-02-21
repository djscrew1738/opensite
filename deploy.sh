#!/bin/bash
# OpenSite Deployment Script for app.ctlplumbingllc.com

set -e

echo "🚀 Starting OpenSite deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root for nginx operations
if [ "$EUID" -ne 0 ]; then 
  echo -e "${YELLOW}Note: Run with sudo for full deployment including nginx${NC}"
fi

echo -e "${GREEN}✓${NC} Pulling latest changes..."
git pull origin main

echo -e "${GREEN}✓${NC} Installing backend dependencies..."
cd backend
npm ci --production
cd ..

echo -e "${GREEN}✓${NC} Installing frontend dependencies..."
cd frontend
npm ci
cd ..

echo -e "${GREEN}✓${NC} Building frontend for production..."
cd frontend
npm run build
cd ..

echo -e "${GREEN}✓${NC} Stopping existing backend..."
pkill -f "node.*server.js" || true
sleep 2

echo -e "${GREEN}✓${NC} Starting backend with production config..."
cd backend
if [ -f .env.production ]; then
  cp .env.production .env
fi
nohup node src/server.js > ../backend.log 2>&1 &
cd ..

echo -e "${GREEN}✓${NC} Waiting for backend to start..."
sleep 3
curl -s http://localhost:5001/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Status: {d[\"data\"][\"status\"]}')" || echo "Backend may still be starting..."

# Only run nginx operations if we have permissions
if [ "$EUID" -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Updating nginx configuration..."
  cp nginx.conf /etc/nginx/sites-available/app.ctlplumbingllc.com
  ln -sf /etc/nginx/sites-available/app.ctlplumbingllc.com /etc/nginx/sites-enabled/
  
  echo -e "${GREEN}✓${NC} Testing nginx configuration..."
  nginx -t
  
  echo -e "${GREEN}✓${NC} Reloading nginx..."
  systemctl reload nginx
else
  echo -e "${YELLOW}!${NC} Skipping nginx updates (requires sudo)"
  echo -e "   Run: sudo cp nginx.conf /etc/nginx/sites-available/app.ctlplumbingllc.com"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Application URLs:"
echo "  - Frontend: https://app.ctlplumbingllc.com"
echo "  - API: https://app.ctlplumbingllc.com/api"
echo "  - Webhook: https://app.ctlplumbingllc.com/webhook/"
echo ""
echo "Next steps:"
echo "  1. Ensure DNS points to this server"
echo "  2. Configure SSL certificates (Certbot)"
echo "  3. Start n8n: n8n start"
echo "  4. Import workflows from n8n-workflows/"
echo ""
