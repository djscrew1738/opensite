// AI chat and analysis routes — Groq, Anthropic, Ollama, OpenClaw

import express from 'express';
import { aiProvider } from '../services/ai-provider.js';
import { aiOptimizer } from '../services/ai-optimizer.js';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth-jwt.js';

/**
 * Generate a unique conversation ID
 * Uses timestamp + random bytes to prevent collisions under concurrent requests
 */
function generateConversationId() {
  return `conv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

const router = express.Router();

// Apply authentication to all AI routes
router.use(authenticateToken);

/* ── GET /api/ai/models ─────────────────────────────────────────────── */
router.get('/models', tryCatch(async (req, res) => {
  const result = await aiProvider.listAvailableModels();

  if (!result.success) {
    return res.error(result.error, 'PROVIDER_ERROR', null, 503);
  }

  res.success({
    models: result.models,
    defaultModel: aiProvider.defaultModel,
    recommendations: aiProvider.modelRecommendations,
    provider: aiProvider.activeProviderName,
    providers: aiProvider.getAvailableProviders(),
  });
}));

/* ── GET /api/ai/providers ──────────────────────────────────────────── */
router.get('/providers', tryCatch(async (req, res) => {
  const providers = await aiProvider.getAvailableProviders();
  res.success({
    providers,
    active: aiProvider.activeProviderName,
  });
}));

/* ── POST /api/ai/providers/switch ─────────────────────────────────── */
router.post('/providers/switch', tryCatch(async (req, res) => {
  const { provider } = req.body;
  if (!provider) {
    return res.error('Provider name is required', 'VALIDATION_ERROR', null, 400);
  }

  aiProvider.setProvider(provider);
  await db.setSetting('ai_provider', provider);

  const health = await aiProvider.healthCheck();
  logger.info('AI provider switched', { provider, connected: health.connected });

  res.success({
    provider: aiProvider.activeProviderName,
    health,
    config: aiProvider.getConfig(),
  }, `Switched to ${provider}`);
}));

/* ── POST /api/ai/chat ──────────────────────────────────────────────── */
router.post('/chat', tryCatch(async (req, res) => {
  const { message, conversationId, model } = req.body;
  if (!message?.trim()) {
    return res.error('Message is required', 'VALIDATION_ERROR', null, 400);
  }

  // Load conversation history from DB
  const conversation = conversationId ? await db.getConversation(conversationId) : null;
  const history = conversation?.messages || [];

  const newConvId = conversationId || generateConversationId();
  const modelToUse = model || aiProvider.getRecommendedModel('chat');

  // Use structured chat generation (system + messages array)
  const result = await aiProvider.generateChat(message.trim(), history, { model: modelToUse });

  if (!result.success) {
    logger.warn('AI chat generation failed', { error: result.error, provider: aiProvider.activeProviderName });
    return res.error(result.error || 'AI generation failed', 'AI_ERROR', null, 503);
  }

  // Persist conversation
  await db.createConversation({ conversationId: newConvId, userId: req.user.id, role: 'user', content: message.trim() });
  await db.createConversation({ conversationId: newConvId, userId: req.user.id, role: 'assistant', content: result.response });

  logger.info('AI chat completed', {
    provider: aiProvider.activeProviderName,
    model: modelToUse,
    durationMs: result.durationMs,
  });

  res.success({
    response: result.response,
    conversationId: newConvId,
    modelUsed: result.model || modelToUse,
    provider: aiProvider.activeProviderName,
    usage: result.usage,
  });
}));

/* ── POST /api/ai/chat/stream ───────────────────────────────────────── */
router.post('/chat/stream', async (req, res) => {
  const { message, conversationId, model } = req.body;

  if (!message?.trim()) {
    return res.error('Message is required', 'VALIDATION_ERROR', null, 400);
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
  const cleanup = () => clearInterval(heartbeat);

  req.on('close', cleanup);

  try {
    const conversation = conversationId ? await db.getConversation(conversationId) : null;
    const history = conversation?.messages || [];
    const newConvId = conversationId || generateConversationId();
    const modelToUse = model || aiProvider.getRecommendedModel('chat');

    // Save user message first
    await db.createConversation({ conversationId: newConvId, userId: req.user.id, role: 'user', content: message.trim() });

    let fullResponse = '';

    for await (const result of aiProvider.generateChatStream(message.trim(), history, { model: modelToUse })) {
      // Handle both object format { chunk, provider } and string format
      const chunkText = typeof result === 'string' ? result : result?.chunk;
      if (chunkText && typeof chunkText === 'string') {
        fullResponse += chunkText;
        res.write(`data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`);
      }
    }

    // Save assistant response
    if (fullResponse) {
      await db.createConversation({ conversationId: newConvId, userId: req.user.id, role: 'assistant', content: fullResponse });
    }

    res.write(`data: ${JSON.stringify({
      chunk: '',
      done: true,
      conversationId: newConvId,
      model: modelToUse,
      provider: aiProvider.activeProviderName,
    })}\n\n`);
  } catch (error) {
    logger.error('AI chat stream error', { error: error.message });
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
  } finally {
    cleanup();
    res.end();
  }
});

/* ── POST /api/ai/analyze ───────────────────────────────────────────── */
router.post('/analyze', tryCatch(async (req, res) => {
  const { text, context, model } = req.body;
  if (!text?.trim()) {
    return res.error('Text is required', 'VALIDATION_ERROR', null, 400);
  }

  const prompt = context ? `${context}\n\n${text}` : text;
  const result = await aiProvider.generate(prompt, { model });

  if (!result.success) {
    return res.error(result.error || 'Analysis failed', 'AI_ERROR', null, 503);
  }

  res.success({
    analysis: result.response,
    model: result.model,
    provider: aiProvider.activeProviderName,
    usage: result.usage,
  });
}));

/* ── GET /api/ai/health ─────────────────────────────────────────────── */
router.get('/health', tryCatch(async (req, res) => {
  const health = await aiProvider.healthCheck();
  const config = aiProvider.getConfig();

  res.success({
    ...health,
    provider: aiProvider.activeProviderName,
    config,
    metrics: aiProvider.getMetrics(),
  });
}));

/* ── POST /api/ai/models/pull ───────────────────────────────────────── */
router.post('/models/pull', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.error('Model name is required', 'VALIDATION_ERROR', null, 400);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const result = await aiProvider.pullModel(name, (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });
    res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ done: true, error: error.message })}\n\n`);
  } finally {
    res.end();
  }
});

/* ── DELETE /api/ai/models/:name ────────────────────────────────────── */
router.delete('/models/:name', tryCatch(async (req, res) => {
  // Validate model name to prevent injection
  const MODEL_NAME_REGEX = /^[a-zA-Z0-9._:\-\/]+$/;
  if (!MODEL_NAME_REGEX.test(req.params.name)) {
    return res.error('Invalid model name. Only alphanumeric characters, dots, underscores, colons, hyphens, and slashes are allowed.', 'VALIDATION_ERROR', null, 400);
  }

  const result = await aiProvider.deleteModel(req.params.name);

  if (!result.success) {
    return res.error(result.error, 'DELETE_FAILED', null, 400);
  }

  res.success({ deleted: true, model: req.params.name }, `Model ${req.params.name} deleted`);
}));

/* ── POST /api/ai/optimize/generate ─────────────────────────────────── */
router.post('/optimize/generate', tryCatch(async (req, res) => {
  const { prompt, options = {} } = req.body;
  
  if (!prompt?.trim()) {
    return res.error('Prompt is required', 'VALIDATION_ERROR', null, 400);
  }

  const result = await aiOptimizer.generate(prompt, options);
  
  if (!result.success) {
    return res.error(result.error, 'AI_ERROR', null, 503);
  }

  res.success({
    response: result.response,
    model: result.model,
    provider: result.provider,
    isFallback: result.isFallback,
    cached: result.cached || false,
    durationMs: result.durationMs,
  });
}));

/* ── POST /api/ai/optimize/chat ─────────────────────────────────────── */
router.post('/optimize/chat', tryCatch(async (req, res) => {
  const { message, history = [], options = {} } = req.body;
  
  if (!message?.trim()) {
    return res.error('Message is required', 'VALIDATION_ERROR', null, 400);
  }

  const result = await aiOptimizer.generateChat(message, history, options);
  
  if (!result.success) {
    return res.error(result.error, 'AI_ERROR', null, 503);
  }

  res.success({
    response: result.response,
    provider: result.provider,
    cached: result.cached || false,
  });
}));

/* ── POST /api/ai/batch/score ───────────────────────────────────────── */
router.post('/batch/score', tryCatch(async (req, res) => {
  const { leads, options = {} } = req.body;
  
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.error('Leads array is required', 'VALIDATION_ERROR', null, 400);
  }

  const results = await aiOptimizer.batchScoreLeads(leads, options);
  
  res.success({
    results,
    processed: results.length,
    successful: results.filter(r => r.success).length,
  });
}));

/* ── POST /api/ai/preload ───────────────────────────────────────────── */
router.post('/preload', tryCatch(async (req, res) => {
  const { model, provider = 'ollama' } = req.body;
  
  if (!model) {
    return res.error('Model name is required', 'VALIDATION_ERROR', null, 400);
  }

  const result = await aiOptimizer.preloadModel(model, provider);
  
  if (!result.success) {
    return res.error(result.error, 'PRELOAD_FAILED', null, 400);
  }

  res.success(result, `Model ${model} preloaded`);
}));

/* ── GET /api/ai/optimizer/stats ────────────────────────────────────── */
router.get('/optimizer/stats', tryCatch(async (req, res) => {
  res.success(aiOptimizer.getStats());
}));

/* ── POST /api/ai/optimizer/clear-cache ─────────────────────────────── */
router.post('/optimizer/clear-cache', tryCatch(async (req, res) => {
  aiOptimizer.clearCaches();
  res.success({}, 'AI cache cleared');
}));

export default router;
