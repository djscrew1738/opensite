# OpenSite - Project Context & Instructions

AI-powered business intelligence and operations platform for **CTL Plumbing LLC**. Streamlines lead management, blueprint analysis, and pricing calculations for the DFW Metroplex area.

## 🚀 Project Overview

- **Purpose**: Specialized ERP/CRM for plumbing contractors.
- **Architecture**: Monolith-ish full-stack JS (React + Node.js) with specialized Python background workers.
- **AI Core**: Deeply integrated with **Ollama** (Local AI) supporting multiple models (llama3.1, qwen2.5-coder, deepseek-r1).
- **Data Persistence**: Local **SQLite** database (`tool/data/opensite.db`) using `better-sqlite3`.
- **Infrastructure**: Dockerized services, Nginx proxy, Cloudflare Tunnel/Tailscale for remote access.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, React Flow (xyflow), Three.js, Recharts, Framer Motion.
- **Backend**: Node.js 20, Express, SQLite, Axios, Multer (uploads), Node-cron (jobs).
- **AI**: Ollama (primary), with support for Groq, Anthropic, and OpenClaw gateways.
- **Workers**: Python (RQ/Arq) for blueprint processing (Vision/OCR).
- **Integrations**: Twilio (SMS), Outlook/IMAP (Email Monitoring), Playwright (Web Scraping), Sharp (Image Processing).

## 📁 Directory Structure

- `backend/`: Express.js API server.
    - `src/services/database/`: Modular SQLite service layers.
    - `src/jobs/`: Background tasks (permits, digests).
    - `src/routes/`: API endpoints.
- `frontend/`: React frontend application.
- `workers/`: Python background worker code (plumbing extraction).
- `leadtools/`: Independent lead generation tools (Google Maps, Crawl4AI).
- `database/`: Legacy PostgreSQL schema (keep for future migration reference).
- `tool/data/`: Active SQLite database and system logs.
- `docs/`: Planning and feature documentation.

## 🏃 Building and Running

### Quick Start
```bash
./start.sh
```

### Backend (Dev)
```bash
cd backend
npm install
npm run dev # Starts on port 5001
```

### Frontend (Dev)
```bash
cd frontend
npm install
npm run dev # Starts on port 3000
```

### Docker Deployment
```bash
docker-compose up -d
```

### AI Setup (Ollama)
Ensure Ollama is running and models are pulled:
```bash
ollama pull llama3.1
ollama pull qwen2.5-coder:7b
ollama pull deepseek-r1:1.5b
```

## 🏗️ Development Conventions

- **Database**: Use the modular services in `backend/src/services/database/`. Avoid writing raw SQL in routes.
- **AI Responses**: Use the `aiProvider` service in the backend for model-agnostic AI calls.
- **API Responses**: Always use the `res.success()` and `res.error()` wrappers defined in `backend/src/utils/response.js`.
- **Styling**: TailwindCSS utility classes. Follow the established Dark Mode / CTL Plumbing theme.
- **Environment**: All configuration should be in `.env`. Critical secrets (like `ENCRYPTION_KEY`) are mandatory for startup.

## 🔑 Key Files

- `backend/src/server.js`: API entry point and middleware configuration.
- `backend/src/services/database/core.js`: SQLite schema definition and initialization.
- `frontend/src/App.jsx`: Main React routing and layout.
- `MODELS.md`: Comprehensive guide on AI model selection and usage.
- `PLAN.md`: Current development roadmap and status.

## ⚠️ Known Constraints

- **Storage**: Currently optimized for local/single-server deployment.
- **Memory**: Backend is configured for ~512MB-1GB heap; workers can take up to 6GB for Vision tasks.
- **Concurrency**: SQLite handles concurrent reads well but sequential writes; use transactions for bulk operations.
