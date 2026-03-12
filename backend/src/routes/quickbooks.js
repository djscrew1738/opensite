/**
 * QuickBooks Online Integration Routes
 */

import express from 'express';
import { quickBooksService } from '../services/integrations/quickbooks.js';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Secure all routes
router.use(authenticateToken);

/**
 * GET /api/integrations/qb/status - Connection status
 */
router.get('/status', tryCatch(async (req, res) => {
  const account = await quickBooksService.getActiveAccount();
  
  res.success({
    connected: !!account,
    available: quickBooksService.isAvailable(),
    company: account?.companyName || null,
    environment: quickBooksService.environment,
    realmId: account?.realmId || null,
    lastUpdated: account?.updatedAt || null
  });
}));

/**
 * GET /api/integrations/qb/connect - Start OAuth flow
 */
router.get('/connect', 
  requirePermission(PERMISSIONS.SETTINGS_UPDATE),
  tryCatch(async (req, res) => {
    if (!quickBooksService.isAvailable()) {
      return res.error('QuickBooks not configured in server environment', 'NOT_CONFIGURED', {
        required: ['QB_CLIENT_ID', 'QB_CLIENT_SECRET']
      }, 503);
    }

    const authUrl = quickBooksService.getAuthorizationUrl();
    res.success({ authorizationUrl: authUrl });
  })
);

/**
 * GET /api/integrations/qb/callback - OAuth redirect handler
 */
router.get('/callback', tryCatch(async (req, res) => {
  const { code, realmId, error, error_description } = req.query;

  if (error) {
    logger.error('[quickbooks] OAuth callback error:', { error, error_description });
    return res.redirect(`/settings/integrations?qb_error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code || !realmId) {
    return res.redirect('/settings/integrations?qb_error=Missing authorization code or realmId');
  }

  try {
    await quickBooksService.exchangeCode(code, realmId);
    logger.info('[quickbooks] Successfully connected account', { realmId });
    return res.redirect('/settings/integrations?qb_success=connected');
  } catch (err) {
    logger.error('[quickbooks] Token exchange failed:', err.message);
    return res.redirect(`/settings/integrations?qb_error=${encodeURIComponent(err.message)}`);
  }
}));

/**
 * POST /api/integrations/qb/disconnect - Revoke tokens
 */
router.post('/disconnect',
  requirePermission(PERMISSIONS.SETTINGS_UPDATE),
  tryCatch(async (req, res) => {
    await quickBooksService.disconnect();
    res.success({ message: 'QuickBooks disconnected and tokens revoked' });
  })
);

/**
 * GET /api/integrations/qb/customers - Search QBO customers
 */
router.get('/customers',
  requirePermission(PERMISSIONS.LEADS_READ),
  tryCatch(async (req, res) => {
    const { search } = req.query;
    
    let qbQuery = 'SELECT * FROM Customer';
    if (search) {
      // Use escaped single quotes for safe LIKE query
      const escapedSearch = String(search).replace(/'/g, "\\'");
      qbQuery += ` WHERE DisplayName LIKE '%${escapedSearch}%'`;
    }
    qbQuery += ' MAXRESULTS 50';
    
    const result = await quickBooksService.apiRequest(
      `/query?query=${encodeURIComponent(qbQuery)}`
    );
    
    res.success({
      customers: result.QueryResponse?.Customer || []
    });
  })
);

/**
 * POST /api/integrations/qb/invoices - Create invoice from estimate
 */
router.post('/invoices',
  requirePermission(PERMISSIONS.ESTIMATES_CREATE),
  tryCatch(async (req, res) => {
    const { estimateId } = req.body;

    if (!estimateId) {
      return res.error('Estimate ID is required', 'VALIDATION_ERROR', null, 400);
    }

    const estimate = await db.getEstimate(estimateId);
    if (!estimate) return res.error('Estimate not found', 'NOT_FOUND', null, 404);

    const lead = await db.getLead(estimate.leadId);
    if (!lead) return res.error('Lead associated with estimate not found', 'NOT_FOUND', null, 404);

    const invoice = await quickBooksService.createInvoice(estimate, lead);

    // Save mapping and update estimate
    await db.setQuickBooksMapping(estimateId, invoice.Id, 'invoice');
    await db.updateEstimate(estimateId, {
      quickbooksInvoiceId: invoice.Id,
      quickbooksInvoiceUrl: invoice.InvoiceLink || null
    });

    res.status(201).success({
      invoiceId: invoice.Id,
      estimateId,
      message: 'Invoice successfully created in QuickBooks'
    });
  })
);

/**
 * GET /api/integrations/qb/invoices - List recent QBO invoices
 */
router.get('/invoices',
  requirePermission(PERMISSIONS.ESTIMATES_READ),
  tryCatch(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const invoices = await quickBooksService.getInvoices(limit);
    
    res.success({
      invoices,
      count: invoices.length
    });
  })
);

/**
 * POST /api/integrations/qb/sync-all - Batch sync estimates
 */
router.post('/sync-all',
  requirePermission(PERMISSIONS.ADMIN_MANAGE),
  tryCatch(async (req, res) => {
    const { estimateIds } = req.body;
    
    if (!Array.isArray(estimateIds) || estimateIds.length === 0) {
      return res.error('Array of estimate IDs required', 'VALIDATION_ERROR', null, 400);
    }

    const results = { created: [], errors: [] };

    for (const id of estimateIds) {
      try {
        const est = await db.getEstimate(id);
        if (!est) {
          results.errors.push({ id, error: 'Not found' });
          continue;
        }

        const lead = await db.getLead(est.leadId);
        const invoice = await quickBooksService.createInvoice(est, lead);
        
        await db.setQuickBooksMapping(id, invoice.Id, 'invoice');
        await db.updateEstimate(id, { quickbooksInvoiceId: invoice.Id });

        results.created.push({ id, invoiceId: invoice.Id });
      } catch (err) {
        results.errors.push({ id, error: err.message });
      }
    }

    res.success({
      results,
      summary: {
        total: estimateIds.length,
        success: results.created.length,
        failed: results.errors.length
      }
    });
  })
);

export default router;
