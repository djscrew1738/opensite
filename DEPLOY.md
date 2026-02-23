# Deployment Guide for ctlplumbingllc.com

## Quick Start

### Option 1: Automated Script (Recommended)

1. **SSH into your server:**
   ```bash
   ssh user@100.83.120.32
   ```

2. **Run the deployment script:**
   ```bash
   cd /home/djscrew/opensite
   sudo ./deploy-production.sh
   ```

3. **Enter sudo password when prompted:** `ux4600-420`

### Option 2: Manual Steps

If you prefer manual control, follow these steps:

## Step 1: Build the Application

```bash
cd /home/djscrew/opensite

# Build frontend
cd frontend
npm ci
npm run build

cd ..

# Install backend dependencies
cd backend
npm ci

cd ..
```

## Step 2: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx-ssl.conf /etc/nginx/sites-available/ctlplumbingllc.com

# Enable the site
sudo ln -sf /etc/nginx/sites-available/ctlplumbingllc.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 3: Obtain SSL Certificates

```bash
# Install certbot if not present
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d ctlplumbingllc.com -d www.ctlplumbingllc.com -d app.ctlplumbingllc.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 4: Start Backend Service

```bash
# Using PM2 (recommended)
sudo npm install -g pm2

cd /home/djscrew/opensite/backend
pm2 start server.js --name opensite-backend -- --port 5001
pm2 save
pm2 startup systemd

# Or using Docker
cd /home/djscrew/opensite
docker-compose up -d backend
```

## Step 5: Verify Deployment

```bash
# Check nginx is running
curl -I http://localhost

# Check backend health
curl http://localhost:5001/api/health

# Check HTTPS
curl -I https://ctlplumbingllc.com
```

## DNS Configuration

Ensure your DNS records point to `100.83.120.32`:

```
Type    Host                    Value               TTL
A       ctlplumbingllc.com      100.83.120.32       3600
A       www.ctlplumbingllc.com  100.83.120.32       3600
A       app.ctlplumbingllc.com  100.83.120.32       3600
```

## Troubleshooting

### Nginx Issues

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Backend Issues

```bash
# View PM2 logs
pm2 logs opensite-backend

# Restart backend
pm2 restart opensite-backend

# Check if port 5001 is in use
sudo lsof -i :5001
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew --force-renewal

# View certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Frontend Not Loading

```bash
# Check if build exists
ls -la /home/djscrew/opensite/frontend/dist/

# Rebuild if needed
cd /home/djscrew/opensite/frontend
npm run build
```

## Maintenance

### Update Application

```bash
cd /home/djscrew/opensite
git pull

# Rebuild frontend
cd frontend
npm ci
npm run build

# Restart backend
cd ../backend
pm2 restart opensite-backend

# Reload nginx
sudo systemctl reload nginx
```

### Renew SSL Certificates

Certificates auto-renew via cron, but you can manually renew:

```bash
sudo certbot renew
```

### Check System Status

```bash
# Check all services
sudo systemctl status nginx
pm2 status

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Notes

- SSL certificates are stored in `/etc/letsencrypt/`
- Backend runs on localhost:5001 (not exposed externally)
- Nginx handles SSL termination
- File uploads limited to 100MB
- Security headers configured in nginx

## Support

If you encounter issues:
1. Check the logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify DNS: `dig ctlplumbingllc.com`
3. Check services: `sudo systemctl status nginx && pm2 status`

## Current Status

- [ ] DNS configured
- [ ] Nginx installed
- [ ] SSL certificates obtained
- [ ] Frontend built
- [ ] Backend running
- [ ] Application accessible at https://ctlplumbingllc.com
