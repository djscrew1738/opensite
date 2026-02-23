import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// Apply authentication to all history routes
router.use(authenticateToken);

// List all conversations (lightweight summaries)
router.get('/conversations', tryCatch(async (req, res) => {
  const conversations = await db.getAllConversations({ search: req.query.search, userId: req.user.id });
  const summaries = conversations.map(conv => {
    const firstUserMsg = conv.messages.find(m => m.role === 'user');
    return {
      id: conv.id,
      preview: firstUserMsg ? firstUserMsg.content.slice(0, 120) : '(empty conversation)',
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  });
  res.success(summaries);
}));

// Get full conversation
router.get('/conversations/:id', tryCatch(async (req, res) => {
  const conv = await db.getConversation(req.params.id);
  if (!conv) {
    return res.error('Conversation not found', 'NOT_FOUND', null, 404);
  }

  // Security check
  if (conv.userId && conv.userId !== req.user.id) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  res.success(conv);
}));

// Delete conversation
router.delete('/conversations/:id', tryCatch(async (req, res) => {
  const conv = await db.getConversation(req.params.id);
  if (!conv) {
    return res.error('Conversation not found', 'NOT_FOUND', null, 404);
  }

  // Security check
  if (conv.userId && conv.userId !== req.user.id) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  const deleted = await db.deleteConversation(req.params.id);
  res.success({ deleted: true }, 'Conversation deleted successfully');
}));

// List all estimates (lightweight summaries)
router.get('/estimates', tryCatch(async (req, res) => {
  const estimates = await db.getAllEstimates({ search: req.query.search, userId: req.user.id });
  const summaries = await Promise.all(estimates.map(async est => {
    const qboMapping = await db.getQuickBooksMapping(est.id, 'estimate');
    return {
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
      qboId: qboMapping?.qboId || null
    };
  }));
  res.success(summaries);
}));

// Get full estimate with blueprints
router.get('/estimates/:id', tryCatch(async (req, res) => {
  const estimate = await db.getEstimate(req.params.id);
  if (!estimate) {
    return res.error('Estimate not found', 'NOT_FOUND', null, 404);
  }

  // Security check
  if (estimate.userId && estimate.userId !== req.user.id) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

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
  if (estimate.userId && estimate.userId !== req.user.id) {
    return res.error('Access denied', 'FORBIDDEN', null, 403);
  }

  const deleted = await db.deleteEstimate(req.params.id);
  res.success({ deleted: true }, 'Estimate deleted successfully');
}));

export default router;
