# Plan: Optimize Ollama Integration + Interactive Settings

## A. Ollama Service Optimization (backend/src/services/ollama.js)

1. **Retry with exponential backoff** — wrap `generate()` and `generateStream()` with retry logic (3 attempts, 1s/2s/4s backoff). Currently zero retries.

2. **Circuit breaker** — track consecutive failures. After 5 failures, short-circuit requests for 30s before trying again. Prevents hammering a dead Ollama instance.

3. **Persistent axios instance with keep-alive** — create one axios instance with `keepAlive: true` and connection pooling instead of creating fresh connections per request.

4. **Smarter health polling** — add `getStatus()` method that returns richer data (uptime, request count, avg response time, last error). Track metrics in-memory.

5. **Configurable parameters** — make `baseUrl`, `defaultModel`, `temperature` mutable at runtime via a `configure()` method (called from new settings API).

## B. Backend Settings API (new: backend/src/routes/settings.js)

Create a `settings` table in SQLite for persisting UI-configurable settings:

```
GET  /api/settings          — get all settings
PUT  /api/settings          — update settings (partial merge)
POST /api/ai/models/pull    — pull/download a model from Ollama
DELETE /api/ai/models/:name — delete a model from Ollama
```

Settings stored as key-value pairs:
- `ollama_url` (default: http://localhost:11434)
- `ollama_model` (default: llama3.1)
- `ollama_temperature` (default: 0.7)
- `company_name` (default: CTL Plumbing LLC)
- `service_area` (default: DFW Metroplex)
- `specialization` (default: Commercial and Multi-family Plumbing)
- `serper_api_key` (default: empty — for discovery pipeline)

On backend startup, load settings from DB and apply to ollamaService.

## C. Rewrite Settings Page (frontend/src/pages/Settings.jsx)

Complete redesign with interactive sections:

### Section 1: AI Configuration
- Ollama URL input (editable, with test connection button)
- Default model selector (existing, keep)
- Temperature slider (0.0 - 1.0 with labels: Precise / Balanced / Creative)
- Model management: pull new models, delete existing (with confirmation)
- Connection status badge (existing, improve)

### Section 2: Business Profile
- Editable company name, service area, specialization inputs
- Save button with success toast

### Section 3: API Keys
- Serper.dev API key input (masked, with test button)
- Status badge showing if key is configured

### Section 4: Model Library
- Cards for each installed model with size, last modified
- "Set as Default" button per model
- "Delete" button per model (with confirmation)
- "Pull New Model" input + button at top

### Section 5: System Info
- Version, ports, DB path
- Cache stats and "Clear Cache" button
- Ollama metrics (if available): requests served, avg response time

## D. Files to Create/Modify

**Create:**
- `backend/src/routes/settings.js` — new settings CRUD API

**Modify:**
- `backend/src/services/ollama.js` — retry, circuit breaker, keep-alive, runtime config, metrics
- `backend/src/services/database.js` — add settings table + CRUD methods
- `backend/src/server.js` — mount settings routes, load settings on startup
- `backend/src/routes/ai.js` — add model pull/delete endpoints
- `frontend/src/pages/Settings.jsx` — full redesign with interactive controls
- `frontend/src/api/client.js` — add settings + model management API methods
- `frontend/src/hooks/useOllama.js` — return richer status data
