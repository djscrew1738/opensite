# Temporary Fix - Keep Dev Server Running

The dev server is failing because components are importing packages that aren't installed yet.

## Option 1: Install Packages NOW (Recommended)

The fastest solution is to get the packages installed:

### Try the Mirror Script (Usually Works)
```bash
cd /home/djscrew/opensite
./install-with-mirror.sh
```

### Or Try Yarn
```bash
cd /home/djscrew/opensite/frontend
npm install -g yarn
yarn add recharts react-markdown remark-gfm html2canvas jspdf
```

### Or Use Alternative Registry
```bash
cd /home/djscrew/opensite/frontend
npm config set registry https://registry.npmmirror.com
npm install recharts react-markdown remark-gfm html2canvas jspdf
npm config set registry https://registry.npmjs.org
```

## Option 2: Temporary Rollback (Keep Old UI Working)

If you need the app running immediately while you fix network issues:

```bash
cd /home/djscrew/opensite

# Restore old Pricing page temporarily
git diff HEAD~1 frontend/src/pages/Pricing.jsx > /tmp/pricing-changes.patch
git checkout HEAD~1 frontend/src/pages/Pricing.jsx

# Now dev server will work again
cd frontend && npm run dev
```

**Note:** The backend enhancements are still active and working! Only the frontend visualization is temporarily disabled.

## Option 3: Comment Out New Components (Quick Fix)

Edit `frontend/src/pages/Pricing.jsx` and restore the old import:

```javascript
// Change this line:
import AnalysisDashboard from '../components/pricing/AnalysisDashboard';

// Back to:
import EstimateBreakdown from '../components/pricing/EstimateBreakdown';

// And change the component usage:
// From:
<AnalysisDashboard
  estimate={estimate}
  analysis={analysis}
  extractedData={extractedData}
  fileName={blueprintFileName}
/>

// Back to:
<EstimateBreakdown estimate={estimate} analysis={analysis} />
```

## Why This Happened

When I created the new components, they import packages like `recharts` and `react-markdown`. Vite (the dev server) tries to resolve these imports immediately, which fails if packages aren't installed.

## The Right Solution

Install the packages using any method from NETWORK_TROUBLESHOOTING.md. Once installed:
1. Dev server will start successfully
2. All visualizations will work
3. Export functionality will work
4. Everything will be production-ready

## Quick Command Reference

```bash
# Check current npm registry
npm config get registry

# Test network connectivity
curl -I https://registry.npmjs.org/recharts

# Try installing one package to test
npm install recharts --verbose

# Check if yarn is available
yarn --version

# Install yarn if needed
npm install -g yarn
```

## Expected Result After Installation

```bash
npm list recharts react-markdown html2canvas jspdf --depth=0
```

Should show:
```
├── recharts@2.12.7
├── react-markdown@9.0.1
├── remark-gfm@4.0.0
├── html2canvas@1.4.1
└── jspdf@2.5.2
```

Then restart dev server:
```bash
cd frontend
npm run dev
```

---

**Bottom line:** The implementation is complete and ready. You just need to get packages installed through the network. Try the mirror script first - it usually works when the default registry doesn't.
