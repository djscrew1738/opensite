#!/bin/bash

# Deployment Status Check Script
# Run this to verify everything is working correctly

echo "🔍 Checking deployment status for ctlplumbingllc.com..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

echo "=== System Services ==="

# Check nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓${NC} Nginx is running"
else
    echo -e "${RED}✗${NC} Nginx is not running"
    echo "  Fix: sudo systemctl start nginx"
fi

# Check backend
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is responding"
else
    echo -e "${RED}✗${NC} Backend is not responding"
    echo "  Fix: cd /home/djscrew/opensite/backend && pm2 restart opensite-backend"
fi

echo ""
echo "=== SSL Certificates ==="

if [ -d "/etc/letsencrypt/live/app.ctlplumbingllc.com" ]; then
    echo -e "${GREEN}✓${NC} SSL certificates exist"
    
    # Check expiry
    expiry=$(sudo openssl x509 -dates -noout -in /etc/letsencrypt/live/app.ctlplumbingllc.com/fullchain.pem | grep notAfter | cut -d= -f2)
    echo "  Expires: $expiry"
else
    echo -e "${RED}✗${NC} SSL certificates not found"
    echo "  Fix: sudo certbot --nginx -d ctlplumbingllc.com -d app.ctlplumbingllc.com"
fi

echo ""
echo "=== HTTP/HTTPS Connectivity ==="

# Check HTTP
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓${NC} HTTP is responding"
else
    echo -e "${RED}✗${NC} HTTP is not responding"
fi

# Check HTTPS (if certificates exist)
if [ -d "/etc/letsencrypt/live/app.ctlplumbingllc.com" ]; then
    if curl -s -o /dev/null -w "%{http_code}" https://localhost --insecure | grep -q "200"; then
        echo -e "${GREEN}✓${NC} HTTPS is responding"
    else
        echo -e "${RED}✗${NC} HTTPS is not responding"
    fi
fi

echo ""
echo "=== File Structure ==="

# Check frontend build
if [ -d "/home/djscrew/opensite/frontend/dist" ]; then
    echo -e "${GREEN}✓${NC} Frontend build exists"
    echo "  Size: $(du -sh /home/djscrew/opensite/frontend/dist | cut -f1)"
else
    echo -e "${RED}✗${NC} Frontend build not found"
    echo "  Fix: cd /home/djscrew/opensite/frontend && npm run build"
fi

# Check nginx config
if [ -f "/etc/nginx/sites-available/ctlplumbingllc.com" ]; then
    echo -e "${GREEN}✓${NC} Nginx config exists"
else
    echo -e "${RED}✗${NC} Nginx config not found"
fi

echo ""
echo "=== Domain Resolution ==="

# Check if domain resolves to this server
server_ip=$(hostname -I | awk '{print $1}')
dns_ip=$(dig +short ctlplumbingllc.com | head -1)

if [ "$server_ip" = "$dns_ip" ]; then
    echo -e "${GREEN}✓${NC} DNS correctly points to this server ($server_ip)"
else
    echo -e "${YELLOW}⚠${NC} DNS may not be configured correctly"
    echo "  Server IP: $server_ip"
    echo "  DNS IP: $dns_ip"
fi

echo ""
echo "=== Resources ==="

# Disk space
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 80 ]; then
    echo -e "${GREEN}✓${NC} Disk usage: ${disk_usage}%"
else
    echo -e "${RED}✗${NC} Disk usage: ${disk_usage}% (consider cleaning up)"
fi

# Memory usage
mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$mem_usage" -lt 80 ]; then
    echo -e "${GREEN}✓${NC} Memory usage: ${mem_usage}%"
else
    echo -e "${YELLOW}⚠${NC} Memory usage: ${mem_usage}%"
fi

echo ""
echo "=========================================="
echo "Check complete!"
echo ""
echo "If all checks show ✓, your site should be accessible at:"
echo "  https://ctlplumbingllc.com"
echo "=========================================="
