# OpenSite Unfinished Work Action Plan

> Prioritized roadmap to complete pending features and technical debt
> Created: 2026-02-27

---

## 🎯 Priority Matrix

| Priority | Impact | Effort | Items |
|----------|--------|--------|-------|
| P0 - Critical | Production blocking | Low-Med | 5 |
| P1 - High | Core feature gaps | Med-High | 8 |
| P2 - Medium | UX/Performance | Med | 6 |
| P3 - Low | Future enhancements | High | 4 |

---

## 🚨 P0 - Critical (Complete First)

### 1. Remove Console Statements from Production
**Why:** Security risk and performance impact in production
**Files:** 22 files affected
**Effort:** 2-3 hours
**Steps:**
1. Replace `console.log` with proper logger (backend) or remove (frontend)
2. Keep only `console.error` for actual errors with error reporting
3. Use `import.meta.env.DEV` guards for debug logs

```bash
# Quick fix script
cd frontend/src && grep -r "console\." --include="*.js" --include="*.jsx" -l | xargs sed -i 's/console\.log/import.meta.env.DEV \&\& console.log/g'
```

### 2. Implement Schedules Table (Unblocks 2 Endpoints)
**Why:** Two API endpoints return 501 errors
**Effort:** 4-6 hours
**Schema:**
```sql
CREATE TABLE schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  user_id INTEGER,
  type TEXT CHECK(type IN ('follow_up', 'meeting', 'inspection')),
  scheduled_date DATETIME,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```
**Unblocks:**
- `GET /api/discovery/tasks/daily`
- `GET /api/discovery/follow-ups/upcoming`

### 3. Replace Mock Data with API Integration
**Why:** Currently using hardcoded data in production
**Locations:**
- `Layout.jsx` - MOCK_JOBS, MOCK_LEADS
- `ControlRoomHeader.jsx` - Fallback mock data
- `LeadPulseHome.jsx` - Mock activity data
- `VisionHome.jsx` - Mock activity data
**Effort:** 6-8 hours

### 4. Complete Tarrant County Permit Adapter
**Why:** Missing permit source for major DFW area
**File:** `backend/src/services/permits/adapters/tarrant.js`
**Effort:** 4-6 hours
**Research needed:** Tarrant County permit API/website structure

### 5. Fix 40+ ESLint Warnings
**Why:** Technical debt, potential bugs
**File:** `docs/archive/FRONTEND_ERROR_AUDIT.md`
**Effort:** 3-4 hours

---

## 🔶 P1 - High Priority (Core Features)

### 6. Implement Real Document Classification (AI)
**Current:** Keyword-based mock
**Target:** Ollama integration
**File:** `backend/src/routes/canvas.js:503-535`
**Effort:** 8-12 hours
**Approach:**
```javascript
// Use existing aiProvider service
const classification = await aiProvider.active.chat([
  { role: 'system', content: 'Classify this document...' },
  { role: 'user', content: documentText }
]);
```

### 7. Implement Real OCR Integration
**Current:** Returns placeholder text
**Target:** Tesseract.js or cloud OCR
**File:** `backend/src/routes/canvas.js:537-555`
**Effort:** 8-12 hours
**Options:**
- Tesseract.js (free, local)
- AWS Textract (paid, high accuracy)
- Google Vision API (paid)

### 8. Integrate Notification Service
**Current:** TODO comment only
**File:** `backend/src/services/monitoring.js:180`
**Effort:** 6-10 hours
**Features:**
- Email alerts (nodemailer)
- Slack webhooks
- In-app notifications

### 9. Implement Geographic Scoring
**Current:** Commented out pending service_areas table
**File:** `backend/src/services/permits/scoring.js:150`
**Effort:** 4-6 hours
**Requires:** Populate `service_areas` table with CTL's service zones

### 10. Complete Discovery Provider Integrations
**Current:** 4 providers pending API keys
**File:** `backend/src/services/discovery/providers.js`
**Providers:**
- Building permits API
- Contractor licenses API
- New construction data
- Planning departments
**Effort:** 2-3 days (depends on API access)

### 11. Blueprint Export Email Feature
**Current:** TODO at `blueprint-export.js:181`
**Effort:** 2-4 hours
**Implementation:** Add nodemailer with PDF attachment

---

## 🔷 P2 - Medium Priority (UX/Performance)

### 12. PostgreSQL Migration Preparation
**Why:** SQLite won't scale for multi-user
**Effort:** 3-5 days
**Tasks:**
- Set up PostgreSQL container
- Create migration script
- Test data integrity
- Update connection handling

### 13. Multi-User Authentication System
**Why:** Required for team usage
**Effort:** 5-7 days
**Components:**
- JWT implementation
- Password hashing (bcrypt)
- Login/Register UI
- Password reset flow
- Session management

### 14. Add ESLint to CI/CD Pipeline
**Why:** Prevent new warnings
**Effort:** 2-3 hours
**File:** `.github/workflows/`

### 15. Create PDF Proposal Generator
**Why:** Professional deliverables for clients
**Effort:** 3-4 days
**Features:**
- Company branding (logo, colors)
- Cost breakdown tables
- Terms & conditions
- Digital signature placeholder

### 16. n8n Workflow Automation
**Why:** Automate business processes
**Effort:** 2-3 days
**Triggers:**
- New lead → Slack notification
- Estimate approved → QuickBooks invoice
- Permit found → Email alert

---

## 🟢 P3 - Low Priority (Future Enhancements)

### 17. External Data Integrations
**Effort:** 2-3 days each
- **Zillow API** - Property details enrichment
- **Google Maps** - Site map thumbnails
- **Weather API** - Project planning forecasts

### 18. AI-Powered Takeoff v2
**Effort:** 2-3 weeks
- Auto-fixture detection (train custom model)
- Wall/pipe auto-tracing
- Scale detection from blueprint legends

### 19. QuickBooks Online Integration
**Effort:** 1 week
- Sync projects to QBO
- Generate invoices
- Track payments

### 20. Multi-Tenant Data Scoping
**Effort:** 1 week
- Add `companyId` to all tables
- Middleware for tenant isolation
- SaaS readiness

---

## 📅 Suggested Timeline

### Week 1: Critical Fixes
- [ ] P0.1 - Remove console statements
- [ ] P0.2 - Implement schedules table
- [ ] P0.5 - Fix ESLint warnings

### Week 2: Core Completeness
- [ ] P0.3 - Replace mock data
- [ ] P0.4 - Tarrant County adapter
- [ ] P1.8 - Notification service

### Week 3: AI Features
- [ ] P1.6 - Document classification
- [ ] P1.7 - OCR integration
- [ ] P1.9 - Geographic scoring

### Week 4: Production Prep
- [ ] P1.11 - Blueprint email export
- [ ] P2.12 - PostgreSQL migration start
- [ ] P2.13 - Auth system design

### Month 2: Scale & Polish
- [ ] P2.12 - Complete PostgreSQL migration
- [ ] P2.13 - Complete auth system
- [ ] P2.15 - PDF proposal generator

### Month 3: Advanced Features
- [ ] P3.17 - External integrations
- [ ] P3.18 - AI takeoff v2 (research)
- [ ] P1.10 - Discovery providers

---

## 🛠️ Implementation Order by File

```
PRIORITY 0 (This Week)
├── frontend/src/
│   ├── components/layout/Layout.jsx          # Remove MOCK_JOBS, MOCK_LEADS
│   ├── components/layout/ControlRoomHeader.jsx # Remove mock fallback
│   ├── pages/LeadPulseHome.jsx               # Remove mock activity
│   └── pages/Vision.jsx                      # Remove mock activity
├── backend/src/
│   ├── services/database/core.js             # Add schedules table
│   ├── routes/discovery-enhanced.js          # Implement 501 endpoints
│   └── services/permits/adapters/tarrant.js  # Complete adapter

PRIORITY 1 (Next 2 Weeks)
├── backend/src/
│   ├── routes/canvas.js                      # AI classification, OCR
│   ├── services/monitoring.js                # Notification integration
│   ├── services/permits/scoring.js           # Geographic scoring
│   ├── services/discovery/providers.js       # Complete providers
│   └── routes/blueprint-export.js            # Email feature

PRIORITY 2 (Month 2)
├── database/
│   └── postgres-migration/                   # Migration scripts
├── backend/src/
│   ├── services/database/postgres/           # PG implementation
│   ├── routes/auth.js                        # Auth endpoints
│   └── services/notifications/               # Email service
└── frontend/src/
    ├── pages/Auth.jsx                        # Login/Register UI
    └── components/proposals/                 # PDF generator

PRIORITY 3 (Month 3+)
├── integrations/
│   ├── zillow/                               # Property API
│   ├── quickbooks/                           # Accounting sync
│   └── n8n/                                  # Workflow automation
└── ai-models/
    └── takeoff-v2/                           # Custom CV models
```

---

## 💰 Cost Estimates (If Using External Services)

| Service | Monthly Cost | Usage |
|---------|-------------|-------|
| AWS Textract OCR | ~$0.0015/page | Blueprint processing |
| Google Vision API | ~$1.50/1000 images | Document classification |
| SendGrid Email | Free tier: 100/day | Notifications |
| Zillow API | $0 (with attribution) | Property enrichment |
| QuickBooks Online | $30/month | Accounting sync |
| PostgreSQL RDS | ~$15/month (t3.micro) | Database hosting |

---

## ✅ Success Criteria

### P0 Complete When:
- [ ] Zero console.log in production build
- [ ] `/api/discovery/tasks/daily` returns 200
- [ ] No hardcoded mock data in Layout.jsx
- [ ] Tarrant County permits appearing in database
- [ ] Zero ESLint warnings

### P1 Complete When:
- [ ] Document classification uses AI (not keywords)
- [ ] OCR extracts real text from PDFs
- [ ] Email alerts sent for critical errors
- [ ] Geographic scores in permit data
- [ ] At least 2 discovery providers active

### Production Ready When:
- [ ] PostgreSQL database active
- [ ] Multi-user auth working
- [ ] All P0 and P1 items complete
- [ ] Load testing passed (100 concurrent users)

---

## 📝 Notes

- **Effort estimates** assume 1 full-time developer
- **Dependencies:** P2.12 (PostgreSQL) blocks P2.13 (Auth), P3.20 (Multi-tenant)
- **Risk:** P1.10 (Discovery providers) depends on external API approvals
- **Recommendation:** Complete P0 items before any new feature development

---

*Plan created: 2026-02-27*
*Next review: After P0 completion*
