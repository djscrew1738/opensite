// AI chat and analysis routes

import express from 'express';
import { ollamaService } from '../services/ollama.js';
import { db } from '../services/database.js';

const router = express.Router();

// Get available models
router.get('/models', async (req, res) => {
  try {
    const result = await ollamaService.listAvailableModels();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      models: result.models,
      defaultModel: ollamaService.defaultModel,
      recommendations: ollamaService.modelRecommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint (non-streaming)
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get conversation history
    const conversation = conversationId ? db.getConversation(conversationId) : null;
    const history = conversation?.messages || [];

    // Generate prompt with context
    const prompt = ollamaService.getChatPrompt(message, history);

    // Get AI response (use specified model or default)
    const modelToUse = model || ollamaService.getRecommendedModel('chat');
    const result = await ollamaService.generate(prompt, { model: modelToUse });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Save conversation
    const newConversationId = conversationId || `conv-${Date.now()}`;
    db.createConversation({
      conversationId: newConversationId,
      role: 'user',
      content: message
    });
    db.createConversation({
      conversationId: newConversationId,
      role: 'assistant',
      content: result.response
    });

    res.json({
      response: result.response,
      conversationId: newConversationId,
      modelUsed: result.model
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

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get conversation history
    const conversation = conversationId ? db.getConversation(conversationId) : null;
    const history = conversation?.messages || [];

    // Generate prompt with context
    const prompt = ollamaService.getChatPrompt(message, history);

    // Save user message
    const newConversationId = conversationId || `conv-${Date.now()}`;
    db.createConversation({
      conversationId: newConversationId,
      role: 'user',
      content: message
    });

    let fullResponse = '';

    // Stream response (use specified model or default)
    const modelToUse = model || ollamaService.getRecommendedModel('chat');
    for await (const chunk of ollamaService.generateStream(prompt, { model: modelToUse })) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
    }

    // Save assistant response
    db.createConversation({
      conversationId: newConversationId,
      role: 'assistant',
      content: fullResponse
    });

    res.write(`data: ${JSON.stringify({ chunk: '', done: true, conversationId: newConversationId, model: modelToUse })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
    res.end();
  }
});

// General analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `${context || 'Analyze the following:'}\n\n${text}`;
    const result = await ollamaService.generate(prompt);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      analysis: result.response,
      model: result.model
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pull a model from Ollama
router.post('/models/pull', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    // Set up SSE for progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await ollamaService.pullModel(name, (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ done: true, error: error.message })}\n\n`);
    res.end();
  }
});

// Delete a model from Ollama
router.delete('/models/:name', async (req, res) => {
  try {
    const modelName = req.params.name;
    const result = await ollamaService.deleteModel(modelName);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: `Model ${modelName} deleted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
