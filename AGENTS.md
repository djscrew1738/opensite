# OpenSite - AGENTS.md

> AI coding agent guide for the OpenSite project - CTL Plumbing Intelligence Platform.
> This document provides essential context for AI agents working on this codebase.

---

## Project Overview

**OpenSite** is an AI-powered business intelligence dashboard for **CTL Plumbing LLC**, designed to streamline plumbing business operations in the DFW Metroplex (Dallas-Fort Worth).

**Current Version:** 1.1.2  
**Company:** CTL Plumbing LLC  
**Service Area:** DFW Metroplex  

### Core Features

| Feature | Description |
|---------|-------------|
| **Lead Management** | AI-powered lead scoring (0-100) with hot/warm/cold classification |
| **Pricing Calculations** | 3-tier pricing model (Production/Custom/Premium) with automatic adjustments |
| **Blueprint Analysis** | AI-powered blueprint upload, tile generation, and plumbing extraction |
| **Permit Discovery** | Automated permit tracking and lead discovery from municipal data |
| **Canvas Workspace** | Visual workspace for project planning and blueprint annotation |
| **AI Assistant** | Multi-provider AI chat with streaming responses |
| **Email Watcher** | Outlook-based email monitoring with keyword alerts |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework with hooks and functional components |
| Vite | 7.3.1 | Build tool and dev server |
| TailwindCSS | 3.4.0 | Styling with custom "Dark Forge" design system |
| React Router | 6.21.1 | Client-side routing with lazy loading |
| Tanstack Query | 5.17.9 | Server state management |
| Zustand | 5.0.11 | Client state management |
| Framer Motion | 12.34.3 | Animations and transitions |
| Recharts | 2.12.7 | Data visualization charts |
| Three.js / React Three Fiber | 0.183.1 | 3D visualization |
| React Flow (xyflow) | 12.10.1 | Canvas node editor |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime (ES Modules) |
| Express.js | 4.18.2 | Web framework |
| better-sqlite3 | 12.6.2 | SQLite database (synchronous API) |
| Winston | 3.19.0 | Logging with daily rotation |
| Multer | 1.4.5-lts.1 | File uploads (max 100MB) |
| node-cron | 3.0.3 | Background job scheduling |
| Helmet | 8.1.0 | Security headers |
| express-rate-limit | 8.2.1 | Rate limiting |

### AI Providers (Multi-Provider Support)
The backend supports multiple AI providers with automatic fallback:

| Provider | Type | Priority | Default Model |
|----------|------|----------|---------------|
| OpenClaw | Local Gateway | 1 | configurable |
| Groq | Cloud API | 2 | llama-4-* |
| OpenAI | Cloud API | 3 | gpt-4o |
| Anthropic | Cloud API | 4 | claude-haiku-20240307 |
| Ollama | Local | 5 | llama3.1 |

### Infrastructure & Services
- **Docker & Docker Compose** - Containerization with PostgreSQL, Redis, ChromaDB
- **Redis** - Job queue caching (ARQ worker)
- **ChromaDB** - Vector storage for embeddings
- **nginx** - Reverse proxy & static serving
- **PM2** - Process management in production
- **Let's Encrypt** - SSL certificates

---

## Project Structure

```
/home/djscrew/opensite/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── server.js          # Main entry point - Express app setup
│   │   ├── routes/            # API route handlers (Express routers)
│   │   │   ├── ai.js          # AI chat and generation endpoints
│   │   │   ├── auth.js        # JWT authentication
│   │   │   ├── canvas.js      # Canvas workspace API
│   │   │   ├── discovery.js   # Lead discovery pipeline
│   │   │   ├── discovery-enhanced.js # Export, analytics, follow-ups
│   │   │   ├── leads.js       # Lead CRUD operations
│   │   │   ├── permits.js     # Permit tracking from municipal sources
│   │   │   ├── settings.js    # App settings CRUD
│   │   │   ├── upload.js      # File uploads with Multer
│   │   │   ├── vision.js      # Deep-zoom viewer for blueprints
│   │   │   └── ...            # Other routes (estimates, projects, etc.)
│   │   ├── services/          # Business logic and data access
│   │   │   ├── ai-provider.js # Multi-provider AI manager with fallback
│   │   │   ├── database/      # Modular database layer
│   │   │   │   ├── core.js    # SQLite connection and schema
│   │   │   │   ├── index.js   # Database service singleton
│   │   │   │   ├── users.js   # User queries
│   │   │   │   ├── leads.js   # Lead queries
│   │   │   │   └── ...        # Other database modules
│   │   │   ├── discovery/     # Discovery pipeline services
│   │   │   │   ├── pipeline.js # Main discovery orchestration
│   │   │   │   ├── mapsScraper.js # Google Maps scraping
│   │   │   │   ├── discoveryScorer.js # AI lead scoring
│   │   │   │   └── ...        # Other discovery services
│   │   │   ├── permits/       # Permit data services
│   │   │   │   ├── adapters/  # Municipal data adapters
│   │   │   │   ├── ingestion.js # Permit data ingestion
│   │   │   │   └── scoring.js # Permit lead scoring
│   │   │   ├── emailWatcher/  # Email monitoring service
│   │   │   ├── logger.js      # Winston logger with daily rotation
│   │   │   └── cache.js       # In-memory caching
│   │   ├── middleware/        # Express middleware
│   │   │   ├── security.js    # Helmet, rate limiting, CORS
│   │   │   ├── auth.js        # Admin token authentication
│   │   │   ├── validation.js  # Input sanitization
│   │   │   └── logging.js     # Request logging
│   │   ├── jobs/              # Background job handlers
│   │   │   └── permit-jobs.js # Cron jobs for permit processing
│   │   ├── utils/             # Utility functions
│   │   │   ├── response.js    # Standardized API responses
│   │   │   ├── encryption.js  # AES-256-GCM encryption
│   │   │   └── auth.js        # JWT utilities
│   │   └── config/            # Configuration
│   ├── package.json           # Dependencies and scripts
│   └── .env                   # Environment config (created from .env.example)
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── App.jsx            # Root component with routing
│   │   ├── main.jsx           # Entry point
│   │   ├── pages/             # Route-level page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Jobs.jsx       # Main jobs hub
│   │   │   ├── LeadFinder.jsx
│   │   │   ├── AIAssistant.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Documents.jsx
│   │   │   └── Canvas.jsx     # Full-screen canvas workspace
│   │   ├── components/        # Reusable UI components
│   │   │   ├── layout/        # Layout components (Sidebar, Layout, etc.)
│   │   │   ├── ui/            # Base UI primitives (Button, Card, Modal)
│   │   │   ├── dashboard/     # Dashboard-specific components
│   │   │   ├── jobs/          # Job-related components
│   │   │   ├── leads/         # Lead-related components
│   │   │   ├── plans/         # Plans/estimating components
│   │   │   ├── settings/      # Settings components
│   │   │   └── ...            # Other component categories
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useTheme.js    # Dark/light mode context
│   │   │   ├── useToast.js    # Toast notifications
│   │   │   ├── useFieldMode.js # Mobile field mode
│   │   │   └── useAuth.jsx    # Authentication context
│   │   ├── routes/            # Route definitions & prefetching
│   │   │   └── prefetch.js    # Lazy loading and prefetch config
│   │   └── styles/            # CSS and style utilities
│   ├── tailwind.config.js     # Extensive custom theme (Dark Forge)
│   ├── vite.config.js         # Vite configuration with proxy
│   ├── eslint.config.js       # ESLint flat config
│   └── package.json
│
├── workers/                    # Python ARQ worker (background jobs)
│   ├── tasks.py               # Job definitions (PDF processing)
│   ├── settings.py            # ARQ worker configuration
│   └── core/                  # Worker utilities
│       ├── llm/               # LLM client and schemas
│       └── vision/            # PDF tiling and image processing
│
├── database/
│   └── schema.sql             # PostgreSQL schema (future migration)
│
├── docs/                       # Documentation
│
├── n8n-workflows/             # n8n automation workflows
│
├── tool/                       # Runtime data (created at runtime)
│   ├── data/                  # SQLite database, uploads
│   └── logs/                  # Application logs
│
├── docker-compose.yml          # Container orchestration
├── nginx.conf / nginx-ssl.conf # Web server configurations
├── start.sh                    # Quick start script
└── deploy-production.sh        # Production deployment script
```

---

## Development Workflow

### Quick Start (Recommended)

```bash
# One-command setup and start
./start.sh

# This will:
# - Check Node.js (20+) and Ollama installations
# - Install dependencies if missing
# - Pull llama3.1 model if needed
# - Start backend (port 5001) and frontend (port 3000)
# - Tail combined logs
```

### Manual Development

**Backend:**
```bash
cd backend
npm install
npm run dev          # Node.js watch mode on port 5001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # Vite dev server on port 3000
```

### Build for Production
```bash
cd frontend
npm run build        # Output to frontend/dist/
```

### Available npm Scripts

**Backend (`backend/package.json`):**
- `npm run dev` - Development with file watch
- `npm start` - Production mode
- `npm run permits:ingest` - Manual permit data ingestion
- `npm run permits:score` - Manual AI scoring of permits
- `npm run permits:digest` - Send daily digest
- `npm run permits:rollup` - Weekly builder rollup

**Frontend (`frontend/package.json`):**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run preview` - Preview production build
- `npm run storybook` - Start Storybook dev server
- `npm run build-storybook` - Build Storybook

---

## Environment Configuration

Create `backend/.env` from `.env.example`:

```bash
# Required
ENCRYPTION_KEY=<32-byte-key-base64-or-hex>
ADMIN_API_KEY=<random-token-for-admin-routes>
ADMIN_TOKEN=<bearer-token-for-admin-access>

# Server
NODE_ENV=development
PORT=5001

# AI Providers (at least one required)
OPENCLAW_URL=http://localhost:8000/v1
GROQ_API_KEY=<groq-api-key>
ANTHROPIC_API_KEY=<anthropic-key>
OPENAI_API_KEY=<openai-key>
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Optional: Notifications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TELEGRAM_BOT_TOKEN=

# Frontend URL (for CORS)
CORS_ORIGIN=http://localhost:3000

# Permit Jobs
PERMIT_JOBS_ENABLED=true
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Generate admin token:**
```bash
node -e "console.log('atk_' + require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Code Style & Conventions

### JavaScript/Node.js (Backend)

- **ES Modules** - Use `import/export`, NOT `require/module.exports`
- **Type:** Module specified in `package.json` (`"type": "module"`)
- **Async/Await** - Prefer over raw promises
- **Error Handling** - Use standardized response wrapper:

```javascript
// Success response
res.success(data, 'Optional message');

// Error response
res.error('Message', 'ERROR_CODE', details, statusCode);
```

- **Logging** - Use Winston logger imported from `services/logger.js`:

```javascript
import logger from '../services/logger.js';
logger.info('Event occurred', { context: 'value' });
logger.warn('Warning condition');
logger.error('Error occurred', { error: err.message });
```

### React (Frontend)

- **Functional Components** with hooks
- **PropTypes not used** - Project relies on JSX runtime
- **Custom Hooks** - Extract reusable logic to `hooks/`
- **Component Organization:**
  - One component per file
  - Named exports for components
  - Lazy loading for route components
- **Styling:** TailwindCSS utility classes
  - Use custom design tokens from `tailwind.config.js`
  - Dark mode first (`.dark` class on root)

### Design System ("Dark Forge")

The project uses a custom dark-themed design system:

**Key Color Tokens:**
| Token | Value | Usage |
|-------|-------|-------|
| `surface.primary` | `#0A0B0D` | App background |
| `surface.card` | `#111318` | Card backgrounds |
| `surface.elevated` | `#181C24` | Modals, panels |
| `accent.DEFAULT` | `#3B82F6` | Primary actions (electric blue) |
| `success.DEFAULT` | `#10B981` | Success states |
| `warning.DEFAULT` | `#F59E0B` | Warnings |
| `danger.DEFAULT` | `#EF4444` | Errors |
| `text.primary` | `#F8FAFC` | Primary text |
| `text.secondary` | `#CBD5E1` | Secondary text |

**Typography:**
- Font: Inter (system-ui fallback)
- Scale: display (40px), heading (24px), subheading (18px), label/body (15px)

**Always use Tailwind classes, avoid inline styles.**

---

## API Patterns

### Route Structure

Routes follow Express router pattern in `backend/src/routes/`:

```javascript
import { Router } from 'express';
const router = Router();

// List
router.get('/', (req, res) => { ... });

// Get one
router.get('/:id', (req, res) => { ... });

// Create
router.post('/', (req, res) => { ... });

// Update
router.put('/:id', (req, res) => { ... });

// Delete
router.delete('/:id', (req, res) => { ... });

export default router;
```

### Response Format

All API responses use standardized wrapper:

```javascript
// Success (2xx)
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": { timestamp: "..." }
}

// Error (4xx/5xx)
{
  "success": false,
  "error": {
    "message": "Human readable message",
    "code": "ERROR_CODE",
    "details": { ... },
    "timestamp": "..."
  }
}
```

### Rate Limiting

Different endpoints have different rate limits:

| Endpoint Type | Window | Max Requests |
|---------------|--------|--------------|
| General API | 15 min | 500 |
| AI Chat | 1 min | 10 |
| Upload | 1 hour | 10 |
| Discovery | 15 min | 5 |
| Auth | 15 min | 5 |

---

## Database

**Current:** SQLite (better-sqlite3) with synchronous API

**Location:** `tool/data/opensite.db` (relative to project root)

**Key Tables:**
- `users` - User accounts with password hashes
- `leads` - Lead information with AI scores
- `projects` - Project tracking
- `estimates` - Pricing calculations
- `conversations` - AI chat history
- `settings` - Application configuration (key-value)
- `permits` - Permit data from municipal sources
- `notifications` - User notification log
- `canvas_nodes`, `canvas_edges` - Canvas workspace data

**Access Pattern:**
```javascript
import { db } from '../services/database.js';

// Query
const rows = db.query('SELECT * FROM leads WHERE status = ?', ['hot']);

// Transaction
const result = db.transaction(() => {
  // multiple statements
  return value;
})();

// Using specific modules
import { usersDb } from '../services/database/users.js';
const user = usersDb.findByEmail(email);
```

**Note:** PostgreSQL schema exists in `database/schema.sql` for future migration.

---

## AI Provider System

The backend uses a multi-provider AI system with automatic fallback:

**Priority Order:**
1. **OpenClaw** (local gateway, preferred)
2. **Groq** (cloud, fastest)
3. **OpenAI** (cloud, standard)
4. **Anthropic** (cloud, best quality)
5. **Ollama** (local, basic)

**Usage:**
```javascript
import { aiProvider } from '../services/ai-provider.js';

// Chat completion
const response = await aiProvider.active.chat(messages, options);

// Check provider status
const providers = await aiProvider.getAvailableProviders();

// Get current config
const config = aiProvider.getConfig();
```

**Configuration stored in SQLite `settings` table:**
- `ai_provider` - Active provider name
- `groq_api_key`, `anthropic_api_key`, `openai_api_key` - Provider credentials
- `openclaw_url` - OpenClaw gateway URL

---

## Security Considerations

### Authentication
- **JWT tokens** for user sessions (stored in localStorage)
- **Admin endpoints** require `Authorization: Bearer <ADMIN_TOKEN>` header
- Admin token configured via `ADMIN_TOKEN` env var

### Data Protection
- Email passwords encrypted with **AES-256-GCM** using `ENCRYPTION_KEY`
- Input sanitization middleware removes HTML/JS from inputs
- Helmet security headers enabled
- CORS restricted to configured origin in production

### Rate Limiting
Applied per endpoint type (see API Patterns). Rate limit headers included in responses.

### File Uploads
- Max file size: **100MB**
- Stored in `tool/data/uploads/`
- Multer handles multipart/form-data

---

## Testing

**Note:** No formal test framework is currently configured for the main application.
Testing is primarily manual:

1. **Health Check:** `curl http://localhost:5001/api/health`
2. **Frontend:** Manual testing via browser at `http://localhost:3000`
3. **API Testing:** Use curl or Postman against `http://localhost:5001/api/*`

**Storybook** is configured for component development:
```bash
cd frontend
npm run storybook
```

**Vitest** and Playwright are included in devDependencies for future testing implementation.

---

## Deployment

### Production Deployment Script
```bash
sudo ./deploy-production.sh
```

This script:
1. Updates system packages
2. Installs Node.js 20.x, nginx, certbot
3. Builds frontend and backend
4. Configures nginx with SSL
5. Starts backend with PM2
6. Sets up SSL auto-renewal
7. Configures health check cron

### Docker Deployment
```bash
# Development
docker-compose up -d

# With AI worker stack (uncomment in docker-compose.yml)
docker-compose up -d redis-plumber chromadb-plumber
```

### Key Production URLs
- **Frontend:** https://app.ctlplumbingllc.com
- **API:** https://app.ctlplumbingllc.com/api
- **Health:** https://app.ctlplumbingllc.com/api/health

---

## Background Jobs

**Permit Jobs** (Node.js cron via `node-cron`):
- Ingest: Daily at 6:00 AM CT
- Scoring: Daily at 6:05 AM CT
- Alerts: Daily at 6:10 AM CT
- Digest: Daily at 8:00 AM CT
- Rollup: Weekly at 2:00 AM Sunday

**Python Worker** (ARQ + Redis):
- Blueprint PDF processing
- Vision analysis pipeline
- Long-running AI tasks

Enable/disable jobs via environment:
```bash
PERMIT_JOBS_ENABLED=false  # Disable permit jobs
EMAIL_WATCHER_ENABLED=false  # Disable email watcher
```

---

## Common Tasks

### Adding a New API Route
1. Create file in `backend/src/routes/my-route.js`
2. Implement router with endpoints
3. Import and register in `backend/src/server.js`:
   ```javascript
   import myRoute from './routes/my-route.js';
   app.use('/api/my-route', myRoute);
   ```

### Adding a New Page
1. Create component in `frontend/src/pages/MyPage.jsx`
2. Add import to `frontend/src/App.jsx`:
   ```javascript
   const MyPage = lazy(pageImports.myPage);
   ```
3. Add route in Routes component
4. Add prefetch entry in `frontend/src/routes/prefetch.js`

### Modifying the Database Schema
1. Edit `database/schema.sql` for PostgreSQL reference
2. Update `backend/src/services/database/core.js` initialization
3. Add migration logic if needed for existing SQLite databases

### Adding an AI Provider
1. Create service in `backend/src/services/my-provider.js`
2. Implement required methods: `chat()`, `getMetrics()`, `healthCheck()`
3. Register in `backend/src/services/ai-provider.js`

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
tail -f backend.log

# Verify database
cd backend && node -e "import('./src/services/database.js').then(m => console.log('DB OK'))"

# Check port 5001
lsof -i :5001
```

### AI not responding
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check AI provider health
curl http://localhost:5001/api/health
```

### Frontend build fails
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Key Documentation Files

- `README.md` - User-facing quick start documentation
- `MODELS.md` - AI model selection guide
- `DEPLOY.md` - Detailed deployment instructions
- `QUICK_START.md` - Quick reference card
- `UI_UX_AUDIT_REPORT.md` - Design system documentation
- `CHANGELOG.md` - Version history
- `AGENTS.md` - This file (AI agent guide)

---

## Contact & Support

- **Organization:** CTL Plumbing LLC
- **Service Area:** DFW Metroplex
- **Logs:** `backend.log`, `frontend.log` in project root
- **Data:** `tool/data/` directory

---

*Last updated: 2026-02-23*
