# OpenSite Roadmap: Phase 3 & 4

## Phase 3: Production Readiness & Enterprise Features

### 1. PostgreSQL Migration
- **Goal**: Transition from SQLite to PostgreSQL for better concurrency, reliability, and scaling in production.
- **Tasks**:
  - [ ] Set up PostgreSQL container in `docker-compose.prod.yml`.
  - [ ] Implement `DatabaseServicePostgres` class matching the current modular interface.
  - [ ] Create data migration script (`scripts/migrate-to-postgres.js`) to move data from `opensite.db` to PG.
  - [ ] Update `.env` with `DATABASE_URL` and connection pooling settings.

### 2. Multi-user Authentication & RBAC
- **Goal**: Secure the application and support multiple users with different permission levels.
- **Tasks**:
  - [ ] Implement JWT-based authentication (using `jsonwebtoken` and `bcrypt`).
  - [ ] Create `users` table with roles: `admin`, `estimator`, `viewer`.
  - [ ] Add `userId` to all major entities (`leads`, `projects`, `takeoffs`, `blueprints`).
  - [ ] Update backend services to scope queries by `userId` or `companyId`.
  - [ ] Implement Auth UI (Login, Profile, Password Reset).

### 3. Multi-tenant Data Scoping
- **Goal**: Ensure data isolation between different plumbing companies if the platform is used as a SaaS.
- **Tasks**:
  - [ ] Add `companyId` to relevant tables.
  - [ ] Implement middleware to enforce tenant isolation at the service level.

## Phase 4: Advanced Operations & Integrations

### 1. External Data Integrations
- **Goal**: Enrich leads and projects with third-party data.
- **Tasks**:
  - [ ] **Zillow API**: Auto-fetch property details (year built, last sale, square footage) when an address is added.
  - [ ] **Google Maps Static API**: Generate site map thumbnails for lead overview cards.
  - [ ] **Weather API**: Integrate local DFW weather forecasts into the Dashboard for project planning.

### 2. Operational Efficiency
- **Goal**: Streamline business workflows and accounting.
- **Tasks**:
  - [ ] **QuickBooks Integration**: Sync projects and estimates to QuickBooks Online for invoicing.
  - [ ] **n8n Workflow Automation**: Create n8n triggers for "New Lead" or "Estimate Approved" to automate notifications and data entry.
  - [ ] **PDF Proposal Generator**: Create professional, brand-aligned PDF proposals with cost breakdowns and company logos.

### 3. Enhanced Vision-AI (Takeoff v2)
- **Goal**: Move from manual measurements to AI-assisted detection.
- **Tasks**:
  - [ ] **Auto-Fixture Detection**: Train/Tune a model to automatically identify and place "Count" markers for toilets, sinks, and drains.
  - [ ] **Wall/Pipe Detection**: Auto-trace wall segments to estimate pipe lengths.
  - [ ] **Global Scaling**: Automatically detect blueprint scale from the legend using OCR.

## 🏁 Completed Phases (For Context)

### Phase 1: Core Intelligence (Ollama, Leads, Basic Pricing)
- [x] Ollama multi-model support.
- [x] Lead scoring and CRM features.
- [x] CTL 3-tier pricing calculator.
- [x] SQLite persistence layer.

### Phase 2: Visual Takeoff & Blueprint Analysis
- [x] Deep Zoom (DZI) blueprint viewer.
- [x] Interactive Canvas for measurements (lengths, areas, counts).
- [x] Material Library and price history tracking.
- [x] AI-powered blueprint analysis with layer generation.
- [x] Background job processing for high-res images.
