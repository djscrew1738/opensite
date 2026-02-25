# AI Provider Improvements

## Summary

Enhanced AI integrations with unified provider management, intelligent fallback mechanisms, and circuit breaker patterns for Ollama, Groq, Anthropic, and OpenClaw.

## Changes Made

### 1. New Files Created

#### `/backend/src/services/ai/model-registry.js`
- Central model registry for all AI models across providers
- Capability-based model selection (chat, code, analysis, reasoning, etc.)
- Task-to-model mapping for intelligent routing

#### `/backend/src/services/ai/unified-provider.js`
- Unified AI provider class with automatic failover
- Provider health monitoring with caching
- Recovery monitoring (auto-retry unhealthy providers every 60s)
- Configurable fallback chains
- Provider metrics aggregation

#### `/backend/src/services/ai/index.js`
- Clean exports for all AI services
- Unified and individual provider access

#### `/backend/scripts/test-ai-providers.js`
- Comprehensive test suite for all AI providers
- Tests health checks, generation, streaming, metrics
- Provider status summary with fallback verification

### 2. Service Improvements

#### Groq Service (`/backend/src/services/groq.js`)
- **Fixed**: Uses proper OpenAI-compatible `/chat/completions` endpoint
- **Added**: Structured message support for chat history
- **Added**: Rate limit error handling (429)
- **Added**: Auth error handling (401)
- **Improved**: Circuit breaker with proper state management
- **Added**: Response metrics tracking (tokens, latency)

#### OpenClaw Service (`/backend/src/services/openclaw.js`)
- **Fixed**: Health check now tries API first, falls back to CLI
- **Added**: Three-tier health check (API → CLI → Direct Ollama)
- **Added**: Graceful degradation with partial connectivity status
- **Improved**: Better error messages for missing models
- **Added**: Connection error handling

#### Ollama Service (`/backend/src/services/ollama.js`)
- **Improved**: Refactored to match other provider interfaces
- **Added**: Circuit breaker with exponential backoff retry
- **Added**: Connection pooling optimizations
- **Added**: Metrics tracking
- **Improved**: Better error messages for common issues

### 3. AI Provider Manager (`/backend/src/services/ai-provider.js`)

#### Enhanced Features
- **Automatic Fallback**: Generate with fallback through provider chain
- **Health Monitoring**: Periodic health checks (every 60s)
- **Health Caching**: Cached health status with TTL
- **Provider Chain**: Configurable fallback order
- **Enhanced Metrics**: Per-provider and aggregated metrics
- **Better Logging**: Structured logging throughout

#### New Methods
- `healthCheckAll()` - Check all providers at once
- `getAvailableProviders()` - Detailed provider status with health
- `setFallbackOrder()` - Configure failover priority
- `_getProviderChain()` - Build prioritized provider list
- `_ruleBasedScoring()` - Fallback scoring when AI fails

#### Improved Methods
- `generate()` - Now with automatic provider fallback
- `generateStream()` - Stream with fallback support
- `generateChat()` - Chat with fallback
- `scoreLead()` - Scoring with fallback to rules
- `loadFromSettings()` - Better auto-configuration

### 4. AI Optimizer (`/backend/src/services/ai-optimizer.js`)

- **Fixed**: Replaced console.log with structured logger
- **Improved**: Better log levels (debug for routine, warn for issues)

## Provider Fallback Chain

Default priority: `groq → anthropic → openclaw → ollama`

Configurable via `aiProvider.setFallbackOrder([...])`

## Usage Examples

### Basic Generation with Fallback
```javascript
import { aiProvider } from './services/ai-provider.js';

// Automatically falls through providers on failure
const result = await aiProvider.generate('Hello', {
  temperature: 0.7,
  maxTokens: 100
});

console.log(result.provider);  // Which provider succeeded
console.log(result.isFallback); // Was fallback used?
```

### Check All Provider Health
```javascript
const health = await aiProvider.healthCheckAll();
// { groq: { connected: true }, ollama: { connected: false, error: ... } }
```

### Stream with Fallback
```javascript
for await (const { chunk, provider, isFallback } of aiProvider.generateStream(prompt)) {
  process.stdout.write(chunk);
}
```

### Test All Providers
```bash
cd backend
node scripts/test-ai-providers.js
```

## Testing

Run the test suite to verify all providers:

```bash
node backend/scripts/test-ai-providers.js
```

Expected output:
- Health checks for all providers
- Generation tests
- Streaming tests
- Metrics verification
- Provider status summary

## Configuration

Providers are auto-configured from database settings on startup:
- `ai_provider` - Active provider name
- `groq_api_key` - Groq API key
- `anthropic_api_key` - Anthropic API key
- `ollama_url` - Ollama base URL
- `openclaw_url` - OpenClaw gateway URL

## Benefits

1. **Resilience**: Automatic failover when providers fail
2. **Monitoring**: Health status and metrics for all providers
3. **Flexibility**: Easy to add new providers
4. **Debugging**: Comprehensive test suite
5. **Performance**: Connection pooling and caching
