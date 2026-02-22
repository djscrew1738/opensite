import express from 'express';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// List all conversations (lightweight summaries)
router.get('/conversations', tryCatch(async (req, res) => {
  const conversations = db.getAllConversations(req.query.search);
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
  const conv = db.getConversation(req.params.id);
  if (!conv) {
    return res.error('Conversation not found', 'NOT_FOUND', null, 404);
  }
  res.success(conv);
}));

// Delete conversation
router.delete('/conversations/:id', tryCatch(async (req, res) => {
  const deleted = db.deleteConversation(req.params.id);
  if (!deleted) {
    return res.error('Conversation not found', 'NOT_FOUND', null, 404);
  }
  res.success({ deleted: true }, 'Conversation deleted successfully');
}));

// List all estimates (lightweight summaries)
router.get('/estimates', tryCatch(async (req, res) => {
  const estimates = db.getAllEstimates(req.query.search);
  const summaries = estimates.map(est => ({
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
  }));
  res.success(summaries);
}));

// Get full estimate with blueprints
router.get('/estimates/:id', tryCatch(async (req, res) => {
  const estimate = db.getEstimate(req.params.id);
  if (!estimate) {
    return res.error('Estimate not found', 'NOT_FOUND', null, 404);
  }

  // Use database wrapper method instead of direct db.db.prepare
  const blueprints = db.getBlueprintsByEstimateId(req.params.id);

  res.success({ ...estimate, blueprints });
}));

// Delete estimate
router.delete('/estimates/:id', tryCatch(async (req, res) => {
  const deleted = db.deleteEstimate(req.params.id);
  if (!deleted) {
    return res.error('Estimate not found', 'NOT_FOUND', null, 404);
  }
  res.success({ deleted: true }, 'Estimate deleted successfully');
}));

export default router;
