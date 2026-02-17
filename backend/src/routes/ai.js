// AI chat and analysis routes — supports Ollama (local) and Groq (cloud)

import express from 'express';
import { aiProvider } from '../services/ai-provider.js';
import { db } from '../services/database.js';

const router = express.Router();

// Get available models from active provider
router.get('/models', async (req, res) => {
  try {
    const result = await aiProvider.listAvailableModels();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      models: result.models,
      defaultModel: aiProvider.defaultModel,
      recommendations: aiProvider.modelRecommendations,
      provider: aiProvider.activeProviderName,
      providers: aiProvider.getAvailableProviders(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available providers
router.get('/providers', async (req, res) => {
  try {
    const providers = aiProvider.getAvailableProviders();
    res.json({ providers, active: aiProvider.activeProviderName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Switch active provider
router.post('/providers/switch', async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'Provider name is required' });
    }

    aiProvider.setProvider(provider);
    db.setSetting('ai_provider', provider);

    const health = await aiProvider.healthCheck();
    res.json({
      provider: aiProvider.activeProviderName,
      health,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Chat endpoint (non-streaming)
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversation = conversationId ? db.getConversation(conversationId) : null;
    const history = conversation?.messages || [];
    const prompt = aiProvider.getChatPrompt(message, history);

    const modelToUse = model || aiProvider.getRecommendedModel('chat');
    const result = await aiProvider.generate(prompt, { model: modelToUse });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const newConversationId = conversationId || `conv-${Date.now()}`;
    db.createConversation({ conversationId: newConversationId, role: 'user', content: message });
    db.createConversation({ conversationId: newConversationId, role: 'assistant', content: result.response });

    res.json({
      response: result.response,
      conversationId: newConversationId,
      modelUsed: result.model,
      provider: aiProvider.activeProviderName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Streaming chat endpoint
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, conversationId, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const conversation = conversationId ? db.getConversation(conversationId) : null;
    const history = conversation?.messages || [];
    const prompt = aiProvider.getChatPrompt(message, history);

    const newConversationId = conversationId || `conv-${Date.now()}`;
    db.createConversation({ conversationId: newConversationId, role: 'user', content: message });

    let fullResponse = '';
    const modelToUse = model || aiProvider.getRecommendedModel('chat');

    for await (const chunk of aiProvider.generateStream(prompt, { model: modelToUse })) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
    }

    db.createConversation({ conversationId: newConversationId, role: 'assistant', content: fullResponse });

    res.write(`data: ${JSON.stringify({
      chunk: '',
      done: true,
      conversationId: newConversationId,
      model: modelToUse,
      provider: aiProvider.activeProviderName,
    })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
    res.end();
  }
});

// General analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { text, context, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `${context || 'Analyze the following:'}\n\n${text}`;
    const result = await aiProvider.generate(prompt, { model });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      analysis: result.response,
      model: result.model,
      provider: aiProvider.activeProviderName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pull a model (Ollama only)
router.post('/models/pull', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await aiProvider.pullModel(name, (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ done: true, error: error.message })}\n\n`);
    res.end();
  }
});

// Delete a model (Ollama only)
router.delete('/models/:name', async (req, res) => {
  try {
    const modelName = req.params.name;
    const result = await aiProvider.deleteModel(modelName);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: `Model ${modelName} deleted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
