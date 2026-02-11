# 1stein - CTL Plumbing Intelligence Platform

AI-powered business intelligence dashboard for CTL Plumbing LLC, streamlining lead management, blueprint analysis, and pricing calculations.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-20+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🎯 Lead Management
- AI-powered lead scoring (0-100) with hot/warm/cold status
- Advanced search and filtering
- Contact information management
- Project value tracking

### 💰 Pricing Engine
- Instant estimates using CTL's 3-tier pricing model
  - **Production**: $5,600/unit (18-22% margin)
  - **Custom**: $7,200/unit (25-30% margin)
  - **Premium**: $10,200/unit (30-38% margin)
- Automatic adjustments for stories and bathroom density
- Phase breakdown (Rough-in 50%, Top-out 30%, Trim 20%)

### 📊 Blueprint Analysis
- Deep AI analysis for material lists
- Labor hour estimates
- Timeline projections
- Code compliance guidance (DFW area)

### 💼 Business Intelligence
- Pipeline value tracking
- Project phase management
- Hot leads alerts
- Real-time dashboard

### 🤖 AI Assistant
- **Multi-model support** - Choose from multiple AI models
- Local Ollama-powered chat
- CTL context-aware responses
- Streaming responses for real-time interaction
- Cost-free operation (no API fees)
- Specialized models for different tasks

### 🎨 Multi-Model Support
- **llama3.1** - General purpose, lead scoring, business analysis
- **qwen2.5-coder:7b** - Technical analysis, blueprint analysis, coding
- **deepseek-r1:1.5b** - Fast reasoning and quick responses
- **sam860/phi4-mini:3.8b** - Lightweight and very fast
- Model selector in AI Assistant
- Automatic model recommendations per task
- View all models in Settings

**→ See [MODELS.md](MODELS.md) for complete multi-model guide**

---

## Quick Start

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Ollama** - [Download](https://ollama.ai/) (for AI features)

### Installation

1. **Clone or navigate to the repository:**
   ```bash
   cd /home/djscrew/1stein
   ```

2. **Run the quick start script:**
   ```bash
   ./start.sh
   ```

   This script will:
   - Check system requirements
   - Install dependencies
   - Pull the llama3.1 model (if needed)
   - Start both backend and frontend servers

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

---

## Manual Installation

If you prefer manual control:

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend will start on port 5001.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on port 3000.

### Ollama Setup

1. Install Ollama from https://ollama.ai
2. Start Ollama server:
   ```bash
   ollama serve
   ```
3. Pull the llama3.1 model:
   ```bash
   ollama pull llama3.1
   ```

---

## Docker Deployment

For production deployment:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

**Note:** Ollama must be running on the host machine at `http://localhost:11434`

---

## Architecture

```
1stein/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── server.js     # Main server entry
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── data/         # In-memory data store
│   │   └── config/       # Configuration
│   └── package.json
│
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── pages/        # Main pages
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   └── api/          # API client
│   └── package.json
│
├── database/             # PostgreSQL schema (future)
├── docker-compose.yml    # Container orchestration
└── start.sh              # Quick start script
```

---

## API Documentation

### Health Check
```
GET /api/health
```
Returns system status and Ollama connection info.

### Leads
```
GET    /api/leads                  # List all leads
GET    /api/leads/:id              # Get single lead
POST   /api/leads                  # Create lead
PUT    /api/leads/:id              # Update lead
DELETE /api/leads/:id              # Delete lead
POST   /api/leads/:id/score        # AI score lead
```

### Estimates
```
POST /api/estimates/calculate      # Calculate pricing
POST /api/estimates/analyze        # Deep AI analysis
GET  /api/estimates/:id            # Get estimate
```

### Projects
```
GET  /api/projects                 # List projects
POST /api/projects                 # Create project
PUT  /api/projects/:id/phase       # Update phase
```

### AI
```
POST /api/ai/chat                  # Chat (non-streaming)
POST /api/ai/chat/stream           # Chat (streaming)
POST /api/ai/analyze               # General analysis
```

### Dashboard
```
GET /api/dashboard/stats           # Get dashboard stats
GET /api/dashboard/tiers           # Get pricing tiers
```

---

## Configuration

Environment variables (`.env`):

```bash
# Backend
NODE_ENV=development
PORT=5001

# Ollama AI
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Frontend
VITE_API_URL=http://localhost:5001

# Company
COMPANY_NAME=CTL Plumbing LLC
SERVICE_AREA=DFW Metroplex
```

---

## Usage Guide

### 1. Dashboard
- View pipeline value and active projects
- Monitor hot leads requiring immediate attention
- Quick reference to pricing tiers

### 2. Lead Finder
- Add new leads with contact information
- Search and filter by status (hot/warm/cold)
- Click "AI Score" to get intelligent lead qualification
- Edit lead details as needed

### 3. Pricing Calculator
- Enter project details (sqft, bathrooms, units, stories)
- Select pricing tier (Production/Custom/Premium)
- Click "Calculate Estimate" for instant pricing
- Use "AI Deep Analysis" for detailed recommendations

### 4. AI Assistant
- Ask questions about leads, pricing, or materials
- Get code compliance guidance for DFW area
- Receive real-time streaming responses
- Context-aware of CTL's business model

### 5. Settings
- Monitor Ollama connection status
- View company information
- Review pricing tier details
- Check system information

---

## Lead Scoring

AI analyzes leads based on:
- **Project Value**: Higher value = higher score
- **Location**: DFW area prioritized
- **Company Type**: Commercial/multi-family preferred
- **Timeline**: Urgency and readiness

**Scoring Ranges:**
- **80-100 (Hot)**: High-value, qualified, immediate follow-up
- **50-79 (Warm)**: Good potential, nurturing required
- **0-49 (Cold)**: Low priority or unqualified

---

## Pricing Calculations

### Base Calculation
```
Base Price = Units × Tier Price
```

### Adjustments
- **Multi-story**: +15% per story over 2
- **High bathroom density**: +10% if > 1 bathroom per 250 sqft

### Phase Breakdown
- **Rough-in**: 50% of total
- **Top-out**: 30% of total
- **Trim**: 20% of total

---

## Troubleshooting

### Ollama Not Connected

**Problem:** Settings page shows "Disconnected"

**Solutions:**
1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. Start Ollama:
   ```bash
   ollama serve
   ```
3. Verify model is installed:
   ```bash
   ollama list
   ```
4. Pull model if missing:
   ```bash
   ollama pull llama3.1
   ```

### Port Already in Use

**Problem:** Backend or frontend won't start

**Solutions:**
1. Check what's using the port:
   ```bash
   lsof -i :5001  # Backend
   lsof -i :3000  # Frontend
   ```
2. Kill the process or change ports in `.env`

### Dependencies Not Installing

**Problem:** `npm install` fails

**Solutions:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete `node_modules` and `package-lock.json`
3. Retry installation

### AI Responses Slow

**Problem:** Chat takes too long to respond

**Causes:**
- Ollama running on CPU (expected for first response)
- Large model loading into memory

**Solutions:**
- First response always slower (model loading)
- Subsequent responses much faster
- Consider smaller models for faster responses

---

## Future Enhancements

### Phase 2 Features
- [ ] PostgreSQL persistence
- [ ] Zillow API integration
- [ ] Blueprint image analysis (Ollama vision)
- [ ] PDF proposal generation
- [ ] QuickBooks integration
- [ ] n8n workflow automation
- [ ] Google Calendar integration
- [ ] Twilio SMS notifications
- [ ] Receipt processing pipeline
- [ ] Multi-user authentication

---

## Data Storage

Currently uses **in-memory storage** for rapid development.

### Migration to PostgreSQL

When ready to persist data:

1. Set up PostgreSQL database
2. Run schema:
   ```bash
   psql -U postgres -d 1stein -f database/schema.sql
   ```
3. Update backend to use PostgreSQL client
4. Replace `data/store.js` with database queries

Schema is ready at `database/schema.sql`.

---

## Development

### Backend Development
```bash
cd backend
npm run dev  # Auto-restart on changes
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot module replacement
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend (no build needed, uses Node directly)
```

---

## Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- React Router
- React Query
- Axios
- Lucide Icons

**Backend:**
- Node.js 20
- Express.js
- Ollama (llama3.1)
- Axios

**Future:**
- PostgreSQL
- Redis
- Docker

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `tail -f backend.log frontend.log`
3. Verify Ollama status in Settings page
4. Contact system administrator

---

## License

MIT License - CTL Plumbing LLC

---

## Acknowledgments

- Built with [Ollama](https://ollama.ai/) for local AI
- Designed for CTL Plumbing LLC operations in DFW
- Inspired by PlansiteOS architecture

---

**Made with ❤️ for CTL Plumbing LLC**
