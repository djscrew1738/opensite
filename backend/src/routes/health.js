// Health check and system status routes

import express from 'express';
import { aiProvider } from '../services/ai-provider.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const aiStatus = await aiProvider.healthCheck();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ai: aiStatus,
      provider: aiProvider.activeProviderName,
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
