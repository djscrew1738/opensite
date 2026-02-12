# Network Troubleshooting for NPM Package Installation

## Issue: NPM Registry Timeouts

Your system is experiencing timeouts when connecting to the npm registry. Here are multiple solutions to try.

## Solution 1: Increase NPM Timeouts (Try First)

```bash
cd /home/djscrew/1stein/frontend

# Configure npm with longer timeouts
npm config set fetch-timeout 600000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 300000
npm config set fetch-retries 5

# Now try installing
npm install recharts react-markdown remark-gfm html2canvas jspdf
```

## Solution 2: Use Alternative NPM Registry

### Option A: Taobao Mirror (Fast in many regions)
```bash
cd /home/djscrew/1stein/frontend

npm config set registry https://registry.npmmirror.com
npm install recharts react-markdown remark-gfm html2canvas jspdf

# Switch back to default after
npm config set registry https://registry.npmjs.org
```

### Option B: Cloudflare Registry
```bash
cd /home/djscrew/1stein/frontend

npm config set registry https://registry.npmjs.cf
npm install recharts react-markdown remark-gfm html2canvas jspdf

# Switch back to default after
npm config set registry https://registry.npmjs.org
```

## Solution 3: Install One Package at a Time with Retries

```bash
cd /home/djscrew/1stein/frontend

# Install each package separately with a pause between
npm install recharts && sleep 5 && \
npm install react-markdown && sleep 5 && \
npm install remark-gfm && sleep 5 && \
npm install html2canvas && sleep 5 && \
npm install jspdf

echo "Installation complete!"
```

## Solution 4: Check Network/Firewall

### Check if npm registry is accessible
```bash
curl -I https://registry.npmjs.org/recharts
```

If this fails, you may have:
- Firewall blocking npm registry
- Proxy configuration needed
- VPN interfering with connections

### Configure Proxy (if behind corporate firewall)
```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

## Solution 5: Use Yarn Instead of NPM

Install yarn:
```bash
npm install -g yarn
# or
curl -o- -L https://yarnpkg.com/install.sh | bash
```

Then install packages:
```bash
cd /home/djscrew/1stein/frontend
yarn add recharts react-markdown remark-gfm html2canvas jspdf
```

## Solution 6: Manual Package Download

If all else fails, you can manually download and install packages:

```bash
cd /home/djscrew/1stein/frontend

# Download packages from a working machine or CDN
# Then copy them to node_modules and update package.json

# Or use npx to install from a tarball:
# npx npm-install-offline --tarball ./packages.tar.gz
```

## Solution 7: Offline Installation

### On a machine WITH internet:
```bash
# Create a package bundle
npm pack recharts react-markdown remark-gfm html2canvas jspdf
# This creates .tgz files
```

### Transfer files to your system and install:
```bash
npm install ./recharts-*.tgz
npm install ./react-markdown-*.tgz
npm install ./remark-gfm-*.tgz
npm install ./html2canvas-*.tgz
npm install ./jspdf-*.tgz
```

## Solution 8: Try at Different Time

Network issues might be temporary:
- Try during off-peak hours
- Check if npm registry status: https://status.npmjs.org
- Wait and retry in a few hours

## Solution 9: Use PNPM (Fastest Alternative)

```bash
# Install pnpm
npm install -g pnpm

# Or
curl -fsSL https://get.pnpm.io/install.sh | sh -

cd /home/djscrew/1stein/frontend
pnpm install recharts react-markdown remark-gfm html2canvas jspdf
```

## Verify Installation

After successful installation, verify:

```bash
cd /home/djscrew/1stein/frontend

# Check package.json was updated
grep recharts package.json

# Check node_modules exists
ls node_modules/recharts

# List all installed packages
npm list --depth=0
```

Should show:
```
├── recharts@2.12.7
├── react-markdown@9.0.1
├── remark-gfm@4.0.0
├── html2canvas@1.4.1
└── jspdf@2.5.2
```

## If Still Failing: Workaround

You can test the implementation without charts temporarily:

1. The dashboard will load with sections that don't require charts
2. Overview, AI Insights, and Timeline sections will work
3. Fixture and Cost Analysis tabs need the chart libraries

To test backend functionality:
```bash
# Test the enhanced API response
curl -X POST http://localhost:3001/api/upload/blueprint \
  -F "file=@/path/to/blueprint.pdf"
```

## Contact Network Admin

If in a corporate environment:
1. Request access to `registry.npmjs.org`
2. Request access to `npmjs.com` and subdomains
3. Provide firewall exception for npm package installation

## Alternative: Development in Docker

Create a Dockerfile with packages pre-installed:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-timeout 600000 && \
    npm install recharts react-markdown remark-gfm html2canvas jspdf
COPY . .
CMD ["npm", "run", "dev"]
```

## Getting Help

If none of these work:
1. Check npm debug logs: `~/.npm/_logs/*.log`
2. Run with verbose logging: `npm install recharts --verbose`
3. Check system network settings
4. Try from a different network (mobile hotspot, etc.)

---

**Most Likely Solution:** Solution 1 (increase timeouts) or Solution 2 (use mirror)
**Fastest Alternative:** Solution 5 (use Yarn)
**Nuclear Option:** Solution 7 (offline installation)
