// Health check and system status routes

import express from 'express';
import { aiProvider } from '../services/ai-provider.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const aiStatus = await aiProvider.healthCheck();

    res.success({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ai: aiStatus,
      provider: aiProvider.activeProviderName,
      version: '1.0.0'
    });
  } catch (error) {
    return res.error(error.message, 'INTERNAL_ERROR', null, 500);
  }
});

export default router;
