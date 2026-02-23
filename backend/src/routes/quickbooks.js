// QuickBooks Online API Routes

import express from 'express';
import { quickbooksService } from '../services/quickbooks.js';
import { authenticateToken, requireRole } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

/**
 * GET /api/quickbooks/auth
 * Get Authorization URL for OAuth2
 */
router.get('/auth', authenticateToken, requireRole(['admin']), tryCatch(async (req, res) => {
  const url = await quickbooksService.getAuthUrl();
  res.success({ url });
}));

/**
 * GET /api/quickbooks/callback
 * OAuth2 Callback handler
 */
router.get('/callback', tryCatch(async (req, res) => {
  const { url } = req;
  await quickbooksService.exchangeCode(url);
  
  // Redirect back to settings page
  res.redirect('/settings?tab=data&qbo=connected');
}));

/**
 * GET /api/quickbooks/status
 * Check connection status
 */
router.get('/status', authenticateToken, tryCatch(async (req, res) => {
  const status = await quickbooksService.getStatus();
  res.success(status);
}));

/**
 * DELETE /api/quickbooks/account
 * Remove QuickBooks connection
 */
router.delete('/account', authenticateToken, requireRole(['admin']), tryCatch(async (req, res) => {
  const account = await db.getQuickBooksAccount();
  if (account) {
    await db.deleteQuickBooksAccount(account.id);
  }
  res.success({ deleted: true }, 'QuickBooks disconnected');
}));

/**
 * POST /api/quickbooks/sync/estimate/:id
 * Sync local estimate to QuickBooks
 */
router.post('/sync/estimate/:id', authenticateToken, tryCatch(async (req, res) => {
  const { id } = req.params;
  const result = await quickbooksService.syncEstimate(id);
  res.success(result, 'Estimate synced to QuickBooks successfully');
}));

export default router;
