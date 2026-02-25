# AI Optimization Guide

## Overview

OpenSite now includes an advanced AI optimization layer that provides:

- **Connection pooling** - Reuses connections to local AI services
- **Response caching** - Caches identical prompts for 5 minutes
- **Intelligent fallback** - Automatically switches providers if one fails
- **Preloading/warmup** - Keeps connections alive for faster responses
- **Batch processing** - Process multiple leads in parallel
- **Circuit breaker** - Prevents cascading failures
- **Health monitoring** - Real-time provider status

## Quick Start

### 1. Configure Local AI (Recommended for Speed)

**Option A: Ollama (Local)**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull recommended models
ollama pull llama3.1
ollama pull qwen2.5-coder:7b
ollama pull deepseek-r1:1.5b

# Start Ollama (runs on localhost:11434)
ollama serve
```

**Option B: OpenClaw Gateway (Recommended for Advanced Features)**
```bash
# Install OpenClaw
npm install -g openclaw

# Configure OpenClaw with Ollama backend
openclaw gateway init
openclaw gateway set-model qwen2.5-coder:7b

# Start gateway (runs on localhost:18789)
openclaw gateway start
```

### 2. Configure in OpenSite

Go to **Settings > AI** and select your provider:

1. **For Ollama**: Enter `http://localhost:11434`
2. **For OpenClaw**: Enter `http://localhost:18789`

Click "Test" to verify connection.

### 3. Verify Optimization

Go to **Settings > Overview** and check:
- AI Provider status shows "Connected"
- Success Rate is above 90%
- Average Response time is under 2000ms

## Performance Features

### 1. Connection Pooling

Local AI services (Ollama/OpenClaw) maintain a pool of 4 persistent HTTP connections with keep-alive, eliminating connection overhead for each request.

```javascript
// Connections are automatically reused
const response = await aiOptimizer.generate(prompt);
```

### 2. Response Caching

Identical prompts are cached for 5 minutes (configurable), dramatically reducing redundant AI calls.

```javascript
// First call hits the AI service
const result1 = await aiOptimizer.generate("Analyze this lead", { skipCache: false });

// Second identical call returns cached result instantly
const result2 = await aiOptimizer.generate("Analyze this lead");
// result2.cached === true
```

### 3. Intelligent Fallback

If your preferred provider fails, the system automatically tries:
1. OpenClaw (local, fast)
2. Ollama (local, private)
3. Groq (cloud, fast)
4. Anthropic (cloud, premium)

```javascript
// Request will fallback if primary fails
const result = await aiOptimizer.generate(prompt, {
  provider: 'ollama',  // Preferred
  // Falls back to next available if Ollama is down
});
```

### 4. Batch Processing

Score multiple leads efficiently with parallel processing:

```javascript
const results = await aiOptimizer.batchScoreLeads(leads, {
  batchSize: 5  // Process 5 at a time
});
```

### 5. Model Preloading

Keep models warm in memory for instant responses:

```javascript
// Preload model before heavy usage
await aiOptimizer.preloadModel('llama3.1', 'ollama');

// Subsequent calls are faster
```

## Frontend Integration

### useAIStatus Hook

Monitor AI status in real-time:

```javascript
import { useAIStatus } from './hooks/useAIStatus';

function MyComponent() {
  const {
    isReady,           // AI is ready to use
    activeProvider,    // Current provider name
    isFallback,        // Using fallback provider
    successRate,       // Request success percentage
    avgResponseMs,     // Average response time
    switchProvider,    // Change provider
    providers,         // List of all providers
  } = useAIStatus({ polling: true });

  if (!isReady) return <div>AI is initializing...</div>;
  
  return (
    <div>
      <p>Provider: {activeProvider}</p>
      <p>Success Rate: {successRate}%</p>
    </div>
  );
}
```

### useAIStream Hook

Stream AI responses for chat interfaces:

```javascript
import { useAIStream } from './hooks/useAIStatus';

function ChatComponent() {
  const { isStreaming, streamChat, abortStream } = useAIStream();
  const [response, setResponse] = useState('');

  const sendMessage = async (message) => {
    setResponse('');
    
    await streamChat(message, {
      onChunk: (chunk, fullText) => setResponse(fullText),
      onComplete: (fullText) => console.log('Done:', fullText),
      onError: (error) => console.error(error),
    });
  };

  return (
    <div>
      <div>{response}</div>
      {isStreaming && <button onClick={abortStream}>Stop</button>}
    </div>
  );
}
```

### Enhanced ModelSelector

```javascript
import ModelSelector from './components/ai/ModelSelector';

function Settings() {
  const [model, setModel] = useState('');

  return (
    <ModelSelector
      value={model}
      onChange={setModel}
      showProvider={true}
      showPerformance={true}
      allowFallback={true}
      size="md"
    />
  );
}
```

## API Endpoints

### Optimized Generation
```http
POST /api/ai/optimize/generate
{
  "prompt": "Analyze this lead...",
  "options": {
    "provider": "ollama",
    "model": "llama3.1",
    "skipCache": false,
    "cacheTtl": 300000
  }
}
```

### Batch Scoring
```http
POST /api/ai/batch/score
{
  "leads": [{...}, {...}],
  "options": {
    "provider": "ollama"
  }
}
```

### Preload Model
```http
POST /api/ai/preload
{
  "model": "llama3.1",
  "provider": "ollama"
}
```

### Get Optimizer Stats
```http
GET /api/ai/optimizer/stats
```

Response:
```json
{
  "cache": {
    "hits": 45,
    "misses": 12,
    "hitRate": "78.9%",
    "size": 57
  },
  "healthCache": {
    "size": 4,
    "entries": ["ollama", "openclaw", "groq", "anthropic"]
  }
}
```

### Clear Cache
```http
POST /api/ai/optimizer/clear-cache
```

## Performance Tuning

### For Maximum Speed

1. **Use OpenClaw** - Fastest local option with 200k context
2. **Enable caching** - Set `skipCache: false` for repeated prompts
3. **Preload models** - Warm up models before heavy usage
4. **Use batch processing** - Score leads in parallel
5. **Enable connection pooling** - Automatic for local providers

### For Maximum Reliability

1. **Configure multiple providers** - Set up Ollama + Groq as fallback
2. **Monitor circuit breaker** - Check `/api/ai/optimizer/stats`
3. **Use health checks** - Enable polling in `useAIStatus`
4. **Set appropriate timeouts** - 60s for local, 30s for cloud

### For Cost Savings

1. **Prioritize local providers** - Ollama/OpenClaw have no API costs
2. **Use caching aggressively** - 5min default, increase for static content
3. **Batch process leads** - Reduce individual API calls
4. **Use smaller models** - qwen2.5-coder:7b is fast and capable

## Troubleshooting

### High Response Times

1. Check if model is loaded: `ollama ps`
2. Preload the model: `POST /api/ai/preload`
3. Increase connection pool: Check `ai-optimizer.js`
4. Use a faster model: Try `deepseek-r1:1.5b` for speed

### Frequent Failures

1. Check provider health: `GET /api/ai/health`
2. Review circuit breaker: `GET /api/ai/optimizer/stats`
3. Check logs: `tail -f backend/logs/app.log`
4. Clear cache: `POST /api/ai/optimizer/clear-cache`

### Cache Not Working

1. Ensure `skipCache: false` (default)
2. Check cache stats: `GET /api/ai/optimizer/stats`
3. Verify prompts are identical (including whitespace)
4. Clear and restart: `POST /api/ai/optimizer/clear-cache`

## Environment Variables

```bash
# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# OpenClaw
OPENCLAW_URL=http://localhost:18789
OPENCLAW_TOKEN=your-token
OPENCLAW_MODEL=qwen2.5-coder:7b

# Performance
AI_CACHE_TTL=300000        # Cache TTL in ms (5 min)
AI_POOL_SIZE=4             # Connection pool size
AI_WARMUP_INTERVAL=120000  # Warmup interval in ms (2 min)
```

## Monitoring

Monitor these metrics in Settings > Overview:

- **Setup Progress** - Percentage of configured providers
- **AI Requests** - Total requests with success rate
- **Uptime** - Time since last restart
- **Circuit Breaker** - Health state (closed = healthy)
- **Cache Hit Rate** - Percentage of cached responses

For detailed metrics:
```bash
curl http://localhost:5001/api/ai/optimizer/stats
curl http://localhost:5001/api/settings/metrics
```
