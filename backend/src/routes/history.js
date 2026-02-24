import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';

const router = express.Router();

// Apply authentication to all history routes
router.use(authenticateToken);

// List all conversations (lightweight summaries) with pagination
router.get('/conversations', tryCatch(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const result = await db.getAllConversations({ search: req.query.search, userId: req.user.id, limit, offset });
  const summaries = result.conversations.map(conv => {
    const firstUserMsg = conv.messages.find(m => m.role === 'user');
    return {
      id: conv.id,
      preview: firstUserMsg ? firstUserMsg.content.slice(0, 120) : '(empty conversation)',
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  });
  res.success(summaries, null, paginationMeta(page, limit, result.total));
}));

// Get full conversation
router.get('/conversations/:id', tryCatch(async (req, res) => {
  const conv = await db.getConversation(req.params.id);
  if (!conv) {
    return res.error('Conversation not found', 'NOT_FOUND', null, 404);
  }

  // Security check
  /* Ownership check disabled for company-wide access */

  res.success(conv);
}));

// Delete conversation
router.delete('/conversations/:id', tryCatch(async (req, res) => {
  const conv = await db.getConversation(req.params.id);
  if (!conv) {
    return res.error('Conversation not found', 'NOT_FOUND', null, 404);
  }

  // Security check
  /* Ownership check disabled for company-wide access */

  const deleted = await db.deleteConversation(req.params.id);
  res.success({ deleted: true }, 'Conversation deleted successfully');
}));

// List all estimates (lightweight summaries) with pagination
router.get('/estimates', tryCatch(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const result = await db.getAllEstimates({ search: req.query.search, userId: req.user.id, limit, offset });

  // Batch-fetch QuickBooks mappings to avoid N+1 queries
  const estimateIds = result.estimates.map(e => e.id);
  const qboMappings = estimateIds.length > 0
    ? await db.all(
        `SELECT entityId, qboId FROM quickbooks_mappings WHERE entityType = 'estimate' AND entityId IN (${estimateIds.map(() => '?').join(',')})`,
        estimateIds
      )
    : [];
  const qboMap = new Map(qboMappings.map(m => [m.entityId, m.qboId]));

  const summaries = result.estimates.map(est => ({
    id: est.id,
    sqft: est.sqft,
    units: est.units,
    stories: est.stories,
    bathrooms: est.bathrooms,
    total: est.total,
    perUnit: est.perUnit,
    margin: est.margin,
    blueprintFileNames: est.blueprintFileNames || null,
    createdAt: est.createdAt,
    qboId: qboMap.get(est.id) || null
  }));
  res.success(summaries, null, paginationMeta(page, limit, result.total));
}));

// Get full estimate with blueprints
router.get('/estimates/:id', tryCatch(async (req, res) => {
  const estimate = await db.getEstimate(req.params.id);
  if (!estimate) {
    return res.error('Estimate not found', 'NOT_FOUND', null, 404);
  }

  // Security check
  /* Ownership check disabled for company-wide access */

  // Use database wrapper method instead of direct db.db.prepare
  const blueprints = await db.getBlueprintsByEstimateId(req.params.id);
  const qboMapping = await db.getQuickBooksMapping(req.params.id, 'estimate');

  res.success({ ...estimate, blueprints, qboId: qboMapping?.qboId || null });
}));

// Delete estimate
router.delete('/estimates/:id', tryCatch(async (req, res) => {
  const estimate = await db.getEstimate(req.params.id);
  if (!estimate) {
    return res.error('Estimate not found', 'NOT_FOUND', null, 404);
  }

  // Security check
  /* Ownership check disabled for company-wide access */

  const deleted = await db.deleteEstimate(req.params.id);
  res.success({ deleted: true }, 'Estimate deleted successfully');
}));

export default router;
