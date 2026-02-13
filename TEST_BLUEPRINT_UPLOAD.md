# Testing Phase 1 Blueprint Analysis

## 🧪 How to Test the New Dashboard

### Step 1: Open the Application

Navigate to: **http://localhost:3003/pricing**

You should see:
- The pricing calculator form on the left
- Blueprint upload section at the top
- Empty dashboard on the right saying "Enter project details..."

### Step 2: Upload a Blueprint PDF

**Option A: Upload a Real Blueprint**
1. Click the blueprint upload area
2. Select any plumbing blueprint PDF from your computer
3. Wait 2-3 minutes for AI analysis (you'll see a progress indicator)

**Option B: Create a Test Blueprint**
If you don't have a real blueprint, you can:
1. Create a simple PDF with project details in any word processor
2. Include text like:
   - "2 units"
   - "1500 sq ft"
   - "2 bathrooms"
   - "4 toilets"
   - "4 lavatories"
   - "2 showers"
3. Save as PDF and upload

**Option C: Manual Entry (Quick Test)**
You can also test without a PDF:
1. Fill out the form manually:
   - Square Footage: 3000
   - Bathrooms: 4
   - Units: 2
   - Stories: 2
   - Toilets: 4
   - Lavatories: 4
   - Tubs: 2
   - Shower Bases: 2
2. Click "Calculate Estimate"

### Step 3: Explore the Dashboard

Once data is loaded, you'll see 5 tabs:

#### 📊 **Overview Tab**
Should display:
- ✅ Animated metric cards (sqft, units, bathrooms, stories)
- ✅ Complexity score with progress bar (0-100)
- ✅ Complexity level badge (Simple/Medium/Complex)
- ✅ Complexity factors as tags
- ✅ Total project cost in green card

**What to Check:**
- Numbers animate from 0 to target value
- Complexity bar fills smoothly
- All cards render without errors

#### 📈 **Fixtures Tab**
Should display:
- ✅ Interactive bar chart with fixture types
- ✅ Different colors for each fixture type
- ✅ Summary stats at bottom (total fixtures, types, most common, per-unit avg)

**What to Try:**
- Hover over bars to see tooltips
- Click a bar to filter/highlight it
- Click "Clear Filter" to reset

#### 💰 **Cost Analysis Tab**
Should display:
- ✅ Donut chart with phase breakdown (orange/purple/cyan)
- ✅ Phase details list below chart
- ✅ Materials bar chart (if data available)
- ✅ Labor by phase bar chart

**What to Check:**
- Donut chart shows percentages
- Colors match phases (rough-in=orange, top-out=purple, trim=cyan)
- Hover for detailed tooltips

#### ⏱️ **Timeline Tab**
Should display:
- ✅ Gantt-style horizontal timeline
- ✅ Phase cards with task lists
- ✅ Labor hours per phase
- ✅ Critical path items (if any)

**What to Check:**
- Timeline bar shows relative phase durations
- Each phase card has tasks
- Colors match other visualizations

#### 💡 **AI Insights Tab**
Should display:
- ✅ Collapsible sections (click to expand/collapse)
- ✅ Plumbing requirements (pipes, water heater, drainage)
- ✅ Project timeline with phases
- ✅ Green recommendation cards
- ✅ Yellow risk cards with mitigation
- ✅ Blue compliance notes
- ✅ Labor estimate summary

**What to Try:**
- Click section headers to expand/collapse
- Verify all sections have content
- Check markdown rendering

### Step 4: Test Export

Click the export buttons in the top-right:

**Export as Image:**
- ✅ Should download a PNG file
- ✅ Image should contain current tab content
- ✅ Quality should be readable

**Export as PDF:**
- ✅ Should download a PDF file
- ✅ PDF should contain current tab content
- ✅ Should be shareable/printable

### Step 5: Test Responsiveness

**Desktop (1920px):**
- All tabs should display side-by-side
- Charts should be full-width
- No horizontal scrolling

**Tablet (768px):**
- Tabs should scroll horizontally if needed
- Charts should resize properly
- Touch interactions should work

**Mobile (375px):**
- Tabs should be scrollable
- All content should be readable
- No overlapping elements

## 🔍 What to Look For

### ✅ Success Indicators:
- No console errors (press F12 to check)
- All charts render smoothly
- Numbers animate without flickering
- Tab switching is instant
- Export works without errors
- Colors are consistent across tabs

### ❌ Potential Issues:
- Missing recharts → Package not installed
- Missing markdown → Package not installed
- Slow rendering → Check console for errors
- Export fails → Check browser compatibility
- Data not showing → Check backend logs

## 🐛 Troubleshooting

### Charts Not Displaying
```bash
cd ~/1stein/frontend
npm list recharts react-markdown
```
If missing, reinstall:
```bash
npm install recharts react-markdown remark-gfm --legacy-peer-deps
```

### API Not Responding
```bash
systemctl --user status 1stein-backend.service
journalctl --user -u 1stein-backend.service -n 50
```

### Frontend Not Loading
```bash
systemctl --user status 1stein-frontend.service
journalctl --user -u 1stein-frontend.service -n 50
```

### Console Errors
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

## 📸 Document Your Results

Take screenshots of:
1. Overview tab with animated metrics
2. Fixtures tab with bar chart
3. Cost Analysis with donut chart
4. Timeline with Gantt view
5. AI Insights with expanded sections
6. Exported PDF

## ✅ Success Criteria

Phase 1 is working correctly if:
- ✅ All 5 tabs display content
- ✅ Charts are interactive
- ✅ No console errors
- ✅ Export generates files
- ✅ Responsive on all screen sizes
- ✅ Animation is smooth

## 🎯 Next Steps After Testing

Once confirmed working:
1. Test with various blueprint sizes
2. Gather user feedback
3. Plan Phase 2 (Blueprint Viewer)
4. Consider performance optimizations
5. Add analytics tracking

---

**Ready to test!** Open http://localhost:3003/pricing and start exploring! 🚀
