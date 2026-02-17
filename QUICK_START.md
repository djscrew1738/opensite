# Quick Start - Phase 1 Blueprint Visualization

## Current Status: ✅ Code Complete, 📦 Packages Needed

All code has been implemented and integrated. You just need to install the npm packages.

## Install Packages (Choose One Method)

### Method 1: Run the Install Script
```bash
cd /home/djscrew/opensite
./INSTALL_PACKAGES.sh
```

### Method 2: Manual Installation
```bash
cd /home/djscrew/opensite/frontend

# All at once (may timeout on slow networks):
npm install recharts react-markdown remark-gfm html2canvas jspdf

# Or one package at a time (more reliable):
npm install recharts
npm install react-markdown remark-gfm
npm install html2canvas jspdf
```

### Method 3: Using Yarn (if npm has issues)
```bash
cd /home/djscrew/opensite/frontend
yarn add recharts react-markdown remark-gfm html2canvas jspdf
```

## Verify Installation
```bash
cd /home/djscrew/opensite/frontend
npm list recharts react-markdown html2canvas jspdf
```

You should see these packages listed with their versions.

## Start Testing

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd /home/djscrew/opensite/backend
npm run dev

# Terminal 2 - Frontend (already running on port 3003)
cd /home/djscrew/opensite/frontend
npm run dev
```

### Plumbing Worker Stack

Run `scripts/optimize_server.sh` on the machine running Ollama so the host exports `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_KEEP_ALIVE=24h`, and keeps `ollama serve` alive. Then start the worker infrastructure:

```bash
docker-compose up -d redis-plumber chromadb-plumber worker-plumber
```

### 2. Test the Implementation
1. Open http://localhost:3003/pricing
2. Upload a blueprint PDF file
3. Wait for AI analysis (2-3 minutes)
4. Explore the new dashboard:
   - **Overview Tab**: See project metrics and complexity score
   - **Fixtures Tab**: Interactive bar chart of fixtures
   - **Cost Analysis Tab**: Donut charts and breakdowns
   - **Timeline Tab**: Project phase timeline
   - **AI Insights Tab**: Detailed recommendations and requirements
5. Try exporting to PDF or Image

### 3. What You Should See

**Overview Tab:**
- Animated metric cards (sqft, units, bathrooms, stories)
- Complexity score with progress bar (0-100)
- Total cost estimate

**Fixtures Tab:**
- Bar chart showing all fixture types
- Click bars to filter
- Summary statistics

**Cost Analysis Tab:**
- Donut chart for phase breakdown
- Bar charts for materials
- Phase-wise labor costs

**Timeline Tab:**
- Gantt-style timeline
- Task lists per phase
- Critical path items

**AI Insights Tab:**
- Plumbing requirements
- Project timeline with phases
- Recommendations
- Potential risks with mitigation
- Code compliance notes

## Troubleshooting

### Charts Not Showing
If you see errors about recharts:
```bash
cd frontend
npm uninstall recharts
npm install recharts@2.12.7
```

### Markdown Not Rendering
```bash
cd frontend
npm install react-markdown remark-gfm --force
```

### Build Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm install recharts react-markdown remark-gfm html2canvas jspdf
```

### Network Timeouts
Try these npm configurations:
```bash
npm config set fetch-timeout 300000
npm config set fetch-retry-maxtimeout 300000
npm install recharts react-markdown remark-gfm html2canvas jspdf
```

Or try a different registry:
```bash
npm config set registry https://registry.npmmirror.com
npm install recharts react-markdown remark-gfm html2canvas jspdf
npm config set registry https://registry.npmjs.org
```

## What Was Implemented

### Backend Changes
- ✅ Enhanced AI analysis with structured JSON output
- ✅ Complexity scoring algorithm
- ✅ Rich data structure with materials, labor, timeline
- ✅ Robust JSON parsing

### Frontend Components
- ✅ StatCard - Animated metric cards
- ✅ ProjectOverviewCard - Hero section with metrics
- ✅ FixtureBreakdownChart - Interactive charts
- ✅ CostVisualization - Cost breakdown visualizations
- ✅ AIInsightsPanel - Structured AI insights
- ✅ TimelineVisualizer - Project timeline
- ✅ AnalysisDashboard - Main tabbed container

### Integration
- ✅ Updated Pricing page to use new dashboard
- ✅ Export functionality (PDF and Image)
- ✅ Responsive design
- ✅ Dynamic tab visibility

## Next Steps After Testing

Once Phase 1 is working:
1. Test with multiple different blueprints
2. Verify all visualizations render correctly
3. Test export functionality
4. Check mobile responsiveness
5. Proceed to Phase 2 (Blueprint Viewer with annotations)

See `PHASE1_IMPLEMENTATION.md` for detailed documentation.

---

**Need Help?** Check the troubleshooting section above or see the full implementation guide.
