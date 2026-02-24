const express = require('express');
const fetch = require('node-fetch');
const db = require('../db');
const config = require('../config');
const { searchChunks } = require('../services/embeddings');

const router = express.Router();

const SYSTEM_PROMPT = `You are a helpful AI assistant. You have access to transcripts and summaries from past recordings.

When answering:
- Use ONLY the provided context from recordings
- Be concise and direct
- If you don't have enough information, say so
- Cite specific recordings when possible`;

/**
 * POST /api/chat
 * RAG-powered chat
 */
router.post('/', async (req, res) => {
  try {
    const { message, project_id, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    console.log(`[Chat] Query: "${message.substring(0, 60)}..."`);

    // Search for relevant context
    const chunks = await searchChunks(message, { projectId: project_id, limit: 6 });
    
    let context = '';
    if (chunks.length > 0) {
      context = '\n\nRELEVANT CONTEXT:\n\n';
      for (const chunk of chunks) {
        context += `[${chunk.chunk_type}]: ${chunk.content}\n\n`;
      }
    }

    // Build messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message + context },
    ];

    // Get response from Ollama
    const response = await fetch(`${config.ollama.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollama.model,
        messages,
        stream: false,
        options: { temperature: 0.5, num_predict: 1024 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.status}`);
    }

    const result = await response.json();
    const reply = result.message?.content || 'Sorry, I could not generate a response.';

    // Save to history
    await db.query(`INSERT INTO chat_messages (role, content) VALUES ('user', $1)`, [message]);
    await db.query(`INSERT INTO chat_messages (role, content) VALUES ('assistant', $1)`, [reply]);

    res.json({
      reply,
      sources: chunks.map(c => ({
        type: c.chunk_type,
        content: c.content.substring(0, 200),
        similarity: parseFloat(c.similarity?.toFixed(3) || 0),
      })),
    });

  } catch (err) {
    console.error('[Chat] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
