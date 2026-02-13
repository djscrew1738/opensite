# 1stein Quick Start Guide

## ✅ Installation Complete

All dependencies have been installed successfully:
- **Backend**: 87 packages (Express, Ollama integration, APIs)
- **Frontend**: 247 packages (React 19, Vite, TailwindCSS)

## 🚀 Start the Application

### Option 1: Quick Start Script (Recommended)
```bash
cd /home/djscrew/1stein
./start.sh
```

This will:
- Check system requirements
- Verify Ollama installation
- Start both backend and frontend
- Display access URLs

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /home/djscrew/1stein/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/djscrew/1stein/frontend
npm run dev
```

## 🌐 Access Points

Once running:
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5001/api/health
- **Ollama**: http://localhost:11434 (must be running separately)

## 🤖 Ollama Setup (for AI features)

If Ollama is not installed:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama server
ollama serve

# Pull llama3.1 model (in another terminal)
ollama pull llama3.1
```

### Plumbing Worker Stack

Before you start the plumbing extraction worker, run `scripts/optimize_server.sh` on the host where Ollama is running. The script pins `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_KEEP_ALIVE=24h`, and keeps the server alive with `ollama serve`.

Then bring up the plumbing stack:
```bash
docker-compose up -d redis-plumber chromadb-plumber worker-plumber
```

The backend route `/api/plumbing/extract` will save uploads to `data/uploads` and enqueue `process_pdf` onto `redis-plumber`.

## 📋 Quick Verification Checklist

1. ✅ Backend running on port 5001
2. ✅ Frontend running on port 3000
3. ✅ Can access dashboard at http://localhost:3000
4. ✅ Settings page shows Ollama status (may be disconnected if not running)
5. ✅ Can create a test lead
6. ✅ Can calculate a pricing estimate
7. ⚠️  AI features require Ollama to be running

## 🎯 First Steps

1. **Open Dashboard** - http://localhost:3000
2. **Navigate to Lead Finder** - Add a test lead
3. **Try Pricing Calculator** - Enter sample project details
4. **Check Settings** - Verify system status

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check if port 5001 is in use
lsof -i :5001

# View backend logs
tail -f /home/djscrew/1stein/backend.log
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# View frontend logs
tail -f /home/djscrew/1stein/frontend.log
```

### Ollama not connected
- Make sure Ollama is installed and running: `ollama serve`
- Check if llama3.1 model is available: `ollama list`
- AI features will use fallback rule-based scoring if Ollama is unavailable

## 📚 Full Documentation

See `README.md` for comprehensive documentation including:
- API endpoints
- Feature descriptions
- Database migration guide
- Docker deployment
- Advanced configuration

## 🎊 You're Ready!

The 1stein Platform is fully implemented and ready for CTL Plumbing LLC operations!
