# OpenSite Lead Finder v2.0

Intelligent construction permit lead generation for CTL Plumbing LLC. Automatically ingests building permits from multiple city/county APIs, scores them with AI, detects builder patterns, and pushes hot leads directly to you.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Fort Worth  │    │   Tarrant   │    │  Arlington  │
│  Socrata API │    │  County API │    │  Socrata API│
└──────┬───────┘    └──────┬──────┘    └──────┬──────┘
       │                   │                  │
       └───────────┬───────┴──────────────────┘
                   │
           ┌───────▼────────┐
           │ Source Adapters │  ← Normalize to unified schema
           └───────┬────────┘
                   │
           ┌───────▼────────┐
           │   PostgreSQL    │  ← permits, builders, contacts
           │   + PostGIS     │
           └───────┬────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
   │ Ollama │ │Builder │ │ Express  │
   │Scoring │ │Rollup  │ │ REST API │
   └────┬───┘ └───┬────┘ └───┬──────┘
        │         │           │
   ┌────▼─────────▼───┐  ┌───▼──────┐
   │  Notifications   │  │ OpenSite   │
   │  SMS + Email     │  │Dashboard │
   └──────────────────┘  └──────────┘
```

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Ollama running locally (for AI scoring)

### 2. Database Setup

```bash
# Create database
createdb opensite

# Enable PostGIS (if not already)
psql -d opensite -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run schema
psql -d opensite -f db/schema.sql
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials, API tokens, etc.
```

### 4. Install & Run

```bash
npm install

# Test the Fort Worth adapter first (no DB required)
node src/test-adapters.js

# Run full ingestion
npm run ingest

# Start the full system (scheduler + API)
npm start
```

## Three Phases

### Phase 1: Core Infrastructure
- **PostgreSQL schema** with PostGIS for geographic queries
- **Multi-source adapter system** — plug in new cities by writing an adapter
- **Fort Worth adapter** fully functional (Socrata API)
- **Tarrant County / Arlington adapters** — templates ready for dataset IDs
- **Deduplication** via SHA256 fingerprints
- **Builder auto-linking** — contractors and applicants linked to builder profiles

### Phase 2: AI Scoring + Builder Intelligence
- **Ollama scoring engine** — analyzes each permit for plumbing relevance
- **Lead scoring (1-100)** with hot/warm/cold tiers
- **Fallback rule-based scoring** when Ollama is unavailable
- **Builder intelligence rollup** — activity trends, project patterns, plumber detection
- **Prospect identification** — active builders without established plumber relationships

### Phase 3: Notifications + Dashboard API
- **SMS alerts** via Twilio for hot leads (score 80+)
- **Daily email digest** with HTML report of all new leads
- **REST API** (Express) serving leads, builders, stats to the OpenSite dashboard
- **Lead status tracking** — new → contacted → quoted → won/lost
- **Conversion funnel** and geographic heatmap endpoints

## CLI Commands

```bash
npm start                    # Full system: scheduler + API
npm run dev                  # Dev mode with file watching
npm run ingest               # Run ingestion only
npm run score                # Run AI scoring only
npm run rollup               # Run builder intelligence rollup
npm run digest               # Send daily email digest
npm run api                  # Start API server only
node src/index.js --run-now  # Immediate ingest then start scheduler
node src/index.js --run-now --days 30  # Backfill 30 days
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/summary` | Aggregate stats for dashboard |
| GET | `/api/leads` | List leads (filterable by tier, status, zip, score) |
| GET | `/api/leads/:id` | Single lead detail with builder info |
| PATCH | `/api/leads/:id/status` | Update lead status |
| GET | `/api/builders` | List builders (filterable by trend, relationship) |
| GET | `/api/builders/prospects` | Top prospects (active, no plumber) |
| PATCH | `/api/builders/:id` | Update builder relationship/notes |
| GET | `/api/sources` | Data source status |
| GET | `/api/stats/ingestion` | Ingestion volume over time |
| GET | `/api/stats/funnel` | Lead conversion funnel |
| GET | `/api/stats/geo` | Geographic distribution by zip |

## Adding a New City

1. Find the city's open data portal and building permit dataset
2. Write an adapter in `src/adapters/` extending `BaseAdapter`
3. Register it in `src/adapters/registry.js`
4. Add a row to `data_sources` table with the API URL, dataset ID, and field mapping
5. Set `is_active = TRUE`

Most Texas cities use Socrata, so the Tarrant County/Arlington templates should work as starting points.

## Schedule (Default, Central Time)

| Time | Job |
|------|-----|
| 6:00 AM | Permit ingestion + AI scoring + SMS alerts |
| 8:00 AM | Daily email digest |
| Sunday 2:00 AM | Builder intelligence rollup |

## Project Structure

```
lead-finder/
├── db/
│   └── schema.sql              # Full PostgreSQL schema
├── src/
│   ├── index.js                # Main entry + scheduler
│   ├── config.js               # Environment config
│   ├── db.js                   # Database connection + helpers
│   ├── adapters/
│   │   ├── base.js             # Base adapter class
│   │   ├── registry.js         # Adapter registry
│   │   ├── fortworth.js        # Fort Worth (active)
│   │   ├── tarrant.js          # Tarrant County (template)
│   │   └── arlington.js        # Arlington (template)
│   ├── scoring/
│   │   └── ollama.js           # AI lead scoring
│   ├── builders/
│   │   └── intelligence.js     # Builder stats rollup
│   ├── notifications/
│   │   ├── dispatcher.js       # Hot lead alert dispatcher
│   │   ├── sms.js              # Twilio SMS
│   │   └── email.js            # Email digest
│   ├── api/
│   │   └── server.js           # Express REST API
│   ├── jobs/
│   │   ├── ingest.js           # Ingestion pipeline
│   │   ├── score-permits.js    # Standalone scoring runner
│   │   ├── builder-rollup.js   # Standalone rollup runner
│   │   └── daily-digest.js     # Standalone digest runner
│   ├── utils/
│   │   └── logger.js           # Winston logger
│   └── test-adapters.js        # Adapter test (no DB needed)
├── .env.example
├── package.json
└── README.md
```
