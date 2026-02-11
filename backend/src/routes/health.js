// Health check and system status routes

import express from 'express';
import { ollamaService } from '../services/ollama.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const ollamaStatus = await ollamaService.healthCheck();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ollama: ollamaStatus,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
