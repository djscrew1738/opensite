# 🤖 AI Assistant

A voice-powered recording and AI summarization system inspired by the Max project.

## Features

- 🎙️ **Audio Recording & Transcription** - Upload audio, get transcripts via Whisper
- 🧠 **AI Summarization** - Structured summaries with action items using Ollama
- 💬 **RAG Chat** - Query your recordings with semantic search
- 📁 **Projects** - Organize recordings by project
- ✅ **Action Items** - Extracted automatically from transcripts

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Server  │────▶│  PostgreSQL │
│  (Mobile/   │     │   (Node.js)  │     │  + pgvector │
│    Web)     │◀────│              │◀────│             │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ Whisper │  │  Ollama │  │  LLM    │
        │(Speech) │  │ (Chat)  │  │(Embed)  │
        └─────────┘  └─────────┘  └─────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Ollama running locally with models:
  ```bash
  ollama pull llama3.1:8b
  ollama pull nomic-embed-text
  ```

### 1. Clone & Configure

```bash
cd ai-assistant
cp .env.example .env
# Edit .env with your settings
```

### 2. Start Services

```bash
docker compose up -d
```

### 3. Verify

```bash
./test.sh
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/status` | System stats |
| POST | `/api/upload/audio` | Upload audio file |
| POST | `/api/upload/attachment` | Upload file attachment |
| GET | `/api/sessions` | List sessions |
| GET | `/api/sessions/:id` | Session details |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| POST | `/api/chat` | RAG chat |

All `/api/*` endpoints require `x-api-key` header.

## Example Usage

### Upload Audio

```bash
curl -X POST http://localhost:3210/api/upload/audio \
  -H "x-api-key: your-key" \
  -F "audio=@recording.ogg" \
  -F "title=Meeting Notes"
```

### Chat

```bash
curl -X POST http://localhost:3210/api/chat \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "What were the key decisions?"}'
```

## Development

```bash
cd api
npm install
npm run dev
```

## License

MIT
