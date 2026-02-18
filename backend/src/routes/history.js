import express from 'express';
import { db } from '../services/database.js';

const router = express.Router();

// List all conversations (lightweight summaries)
router.get('/conversations', (req, res) => {
  try {
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
  } catch (error) {
    res.error(error.message, 'FETCH_ERROR', null, 500);
  }
});

// Get full conversation
router.get('/conversations/:id', (req, res) => {
  try {
    const conv = db.getConversation(req.params.id);
    if (!conv) return res.error('Conversation not found', 'NOT_FOUND', null, 404);
    res.success(conv);
  } catch (error) {
    res.error(error.message, 'FETCH_ERROR', null, 500);
  }
});

// Delete conversation
router.delete('/conversations/:id', (req, res) => {
  try {
    const deleted = db.deleteConversation(req.params.id);
    if (!deleted) return res.error('Conversation not found', 'NOT_FOUND', null, 404);
    res.success({ deleted: true });
  } catch (error) {
    res.error(error.message, 'DELETE_ERROR', null, 500);
  }
});

// List all estimates (lightweight summaries)
router.get('/estimates', (req, res) => {
  try {
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
  } catch (error) {
    res.error(error.message, 'FETCH_ERROR', null, 500);
  }
});

// Get full estimate with blueprints
router.get('/estimates/:id', (req, res) => {
  try {
    const estimate = db.getEstimate(req.params.id);
    if (!estimate) return res.error('Estimate not found', 'NOT_FOUND', null, 404);

    // Attach associated blueprints
    const blueprints = db.db.prepare(
      'SELECT id, fileName, createdAt FROM blueprints WHERE estimateId = ?'
    ).all(req.params.id);

    res.success({ ...estimate, blueprints });
  } catch (error) {
    res.error(error.message, 'FETCH_ERROR', null, 500);
  }
});

// Delete estimate
router.delete('/estimates/:id', (req, res) => {
  try {
    const deleted = db.deleteEstimate(req.params.id);
    if (!deleted) return res.error('Estimate not found', 'NOT_FOUND', null, 404);
    res.success({ deleted: true });
  } catch (error) {
    res.error(error.message, 'DELETE_ERROR', null, 500);
  }
});

export default router;
