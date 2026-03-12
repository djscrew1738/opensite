// Material Takeoff routes
// Handles materials CRUD, takeoff CRUD, takeoff items, and report generation

import express from 'express';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all takeoff routes
router.use(authenticateToken);

/**
 * Sanitize a CSV cell value to prevent formula injection
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  
  const strValue = String(value);
  if (/^[\+\-=\@\t\r\n]/.test(strValue)) return "'" + strValue;
  return strValue;
}

// ==================== Materials ====================

/**
 * GET /takeoff/materials - List materials with advanced filtering
 */
router.get('/materials', tryCatch(async (req, res) => {
  const { category, search, supplier, minPrice, maxPrice, favorites, recentlyUsed, sort } = req.query;
  const { page, limit, offset } = parsePagination(req.query, { limit: 100 });

  // Use advanced search
  const allMaterials = await db.searchMaterials({
    category, search, supplier,
    minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
    favorites: favorites === 'true' || favorites === '1',
    recentlyUsed: recentlyUsed === 'true' || recentlyUsed === '1',
    sort
  });

  const total = allMaterials.length;
  const materials = allMaterials.slice(offset, offset + limit);
  
  res.success({ materials, total }, null, paginationMeta(page, limit, total));
}));

/**
 * GET /takeoff/materials/categories - List unique categories
 */
router.get('/materials/categories', tryCatch(async (req, res) => {
  const categories = await db.getMaterialCategories();
  res.success({ categories });
}));

/**
 * GET /takeoff/materials/suppliers - List unique suppliers
 */
router.get('/materials/suppliers', tryCatch(async (req, res) => {
  const suppliers = await db.getMaterialSuppliers();
  res.success({ suppliers });
}));

/**
 * GET /takeoff/materials/stats - Material analytics
 */
router.get('/materials/stats', tryCatch(async (req, res) => {
  const stats = await db.getMaterialStats();
  res.success(stats);
}));

/**
 * GET /takeoff/materials/favorites - Get favorite materials
 */
router.get('/materials/favorites', tryCatch(async (req, res) => {
  const materials = await db.getFavoriteMaterials();
  res.success({ materials, total: materials.length });
}));

/**
 * GET /takeoff/materials/recent - Recently used materials
 */
router.get('/materials/recent', tryCatch(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const materials = await db.getRecentlyUsedMaterials(limit);
  res.success({ materials, total: materials.length });
}));

/**
 * GET /takeoff/materials/most-used - Popular materials
 */
router.get('/materials/most-used', tryCatch(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const materials = await db.getMostUsedMaterials(limit);
  res.success({ materials, total: materials.length });
}));

/**
 * GET /takeoff/materials/export/csv - Export catalog
 */
router.get('/materials/export/csv', tryCatch(async (req, res) => {
  const { category } = req.query;
  const materials = await db.getAllMaterials({ category });

  const header = ['Name', 'Category', 'Unit', 'Unit Cost', 'Supplier', 'Part Number', 'Description', 'Notes', 'Markup %'];
  const rows = materials.map(m => [
    sanitizeCsvCell(m.name),
    sanitizeCsvCell(m.category),
    sanitizeCsvCell(m.unit),
    m.unitCost,
    sanitizeCsvCell(m.supplier),
    sanitizeCsvCell(m.partNumber),
    sanitizeCsvCell(m.description),
    sanitizeCsvCell(m.notes),
    m.markup || 0
  ]);

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="materials-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
}));

/**
 * POST /takeoff/materials/import - Bulk import
 */
router.post('/materials/import', tryCatch(async (req, res) => {
  const { materials: items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.error('Materials array is required', 'VALIDATION_ERROR', null, 400);
  }

  const created = await db.bulkCreateMaterials(items);
  logger.info('Materials bulk imported', { count: created.length });
  res.success({ materials: created, imported: created.length }, `${created.length} materials imported`);
}));

/**
 * POST /takeoff/materials/bulk-delete - Bulk delete
 */
router.post('/materials/bulk-delete', tryCatch(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.error('Material IDs array is required', 'VALIDATION_ERROR', null, 400);
  }

  const deleted = await db.bulkDeleteMaterials(ids);
  res.success({ deleted }, `${deleted} materials deleted`);
}));

/**
 * POST /takeoff/materials/bulk-price-update - Global price adjustment
 */
router.post('/materials/bulk-price-update', tryCatch(async (req, res) => {
  const { ids, percentageChange } = req.body;

  if (!Array.isArray(ids) || ids.length === 0 || percentageChange === undefined) {
    return res.error('IDs and percentageChange are required', 'VALIDATION_ERROR', null, 400);
  }

  const changes = await db.bulkUpdatePrices(ids, Number(percentageChange));
  res.success({ changes, updated: changes.length }, `${changes.length} material prices updated`);
}));

/**
 * GET /takeoff/materials/:id - Get single material
 */
router.get('/materials/:id', tryCatch(async (req, res) => {
  const material = await db.getMaterial(req.params.id);
  if (!material) return res.error('Material not found', 'NOT_FOUND', null, 404);
  res.success(material);
}));

/**
 * GET /takeoff/materials/:id/price-history - History of price changes
 */
router.get('/materials/:id/price-history', tryCatch(async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const history = await db.getPriceHistory(req.params.id, limit);
  res.success({ history, total: history.length });
}));

/**
 * POST /takeoff/materials - Create material
 */
router.post('/materials', tryCatch(async (req, res) => {
  const { name, category, unit } = req.body;
  if (!name || !category || !unit) {
    return res.error('Name, category, and unit are required', 'VALIDATION_ERROR', null, 400);
  }

  const material = await db.createMaterial(req.body);
  res.success(material, 'Material created successfully');
}));

/**
 * POST /takeoff/materials/:id/duplicate - Clone material
 */
router.post('/materials/:id/duplicate', tryCatch(async (req, res) => {
  const material = await db.duplicateMaterial(req.params.id);
  if (!material) return res.error('Material not found', 'NOT_FOUND', null, 404);
  res.success(material, 'Material duplicated');
}));

/**
 * POST /takeoff/materials/:id/favorite - Toggle favorite
 */
router.post('/materials/:id/favorite', tryCatch(async (req, res) => {
  const material = await db.toggleMaterialFavorite(req.params.id);
  if (!material) return res.error('Material not found', 'NOT_FOUND', null, 404);
  res.success(material);
}));

/**
 * PUT /takeoff/materials/:id - Update material
 */
router.put('/materials/:id', tryCatch(async (req, res) => {
  const material = await db.updateMaterial(req.params.id, req.body);
  if (!material) return res.error('Material not found', 'NOT_FOUND', null, 404);
  res.success(material);
}));

/**
 * DELETE /takeoff/materials/:id - Delete material
 */
router.delete('/materials/:id', tryCatch(async (req, res) => {
  const deleted = await db.deleteMaterial(req.params.id);
  if (!deleted) return res.error('Material not found', 'NOT_FOUND', null, 404);
  res.success({ id: req.params.id }, 'Material deleted');
}));

// ==================== Takeoffs ====================

/**
 * GET /takeoff - List takeoffs
 */
router.get('/', tryCatch(async (req, res) => {
  const { status, blueprintId } = req.query;
  const takeoffs = await db.getAllTakeoffs({ status, blueprintId, userId: req.user.id });
  res.success({ takeoffs, total: takeoffs.length });
}));

/**
 * GET /takeoff/:id - Get takeoff with items
 */
router.get('/:id', tryCatch(async (req, res) => {
  const takeoff = await db.getTakeoff(req.params.id);
  if (!takeoff) return res.error('Takeoff not found', 'NOT_FOUND', null, 404);

  const items = await db.getTakeoffItems(req.params.id);
  res.success({ ...takeoff, items });
}));

/**
 * POST /takeoff - Create takeoff
 */
router.post('/', tryCatch(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.error('Name is required', 'VALIDATION_ERROR', null, 400);

  const takeoff = await db.createTakeoff({ ...req.body, userId: req.user.id });
  res.success(takeoff, 'Takeoff created');
}));

/**
 * PUT /takeoff/:id - Update takeoff
 */
router.put('/:id', tryCatch(async (req, res) => {
  const takeoff = await db.updateTakeoff(req.params.id, req.body);
  if (!takeoff) return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  res.success(takeoff);
}));

/**
 * DELETE /takeoff/:id - Delete takeoff
 */
router.delete('/:id', tryCatch(async (req, res) => {
  const deleted = await db.deleteTakeoff(req.params.id);
  if (!deleted) return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  res.success({ id: req.params.id });
}));

// ==================== Takeoff Items ====================

/**
 * GET /takeoff/:id/items - List items for takeoff
 */
router.get('/:id/items', tryCatch(async (req, res) => {
  const items = await db.getTakeoffItems(req.params.id);
  res.success({ items, total: items.length });
}));

/**
 * POST /takeoff/:id/items - Add item to takeoff
 */
router.post('/:id/items', tryCatch(async (req, res) => {
  const { materialId, measurementType, quantity, unitCost, unit } = req.body;
  if (!measurementType) return res.error('Measurement type required', 'VALIDATION_ERROR', null, 400);

  let resolvedCost = Number(unitCost) || 0;
  let resolvedUnit = unit || '';
  
  if (materialId) {
    const material = await db.getMaterial(materialId);
    if (material) {
      resolvedCost = resolvedCost || material.unitCost;
      resolvedUnit = resolvedUnit || material.unit;
    }
  }

  const qty = Number(quantity) || 0;
  const item = await db.createTakeoffItem({
    ...req.body,
    takeoffId: req.params.id,
    quantity: qty,
    unit: resolvedUnit,
    unitCost: resolvedCost,
    totalCost: qty * resolvedCost
  });

  if (materialId) await db.incrementMaterialUsage(materialId);
  res.success(item, 'Item added');
}));

/**
 * PUT /takeoff/:takeoffId/items/:itemId - Update item
 */
router.put('/:takeoffId/items/:itemId', tryCatch(async (req, res) => {
  const { quantity, unitCost } = req.body;
  const updateData = { ...req.body };
  
  if (quantity !== undefined || unitCost !== undefined) {
    const existing = await db.getTakeoffItem(req.params.itemId);
    if (!existing) return res.error('Item not found', 'NOT_FOUND', null, 404);
    
    const finalQty = quantity !== undefined ? Number(quantity) : existing.quantity;
    const finalCost = unitCost !== undefined ? Number(unitCost) : existing.unitCost;
    updateData.totalCost = finalQty * finalCost;
  }

  const item = await db.updateTakeoffItem(req.params.itemId, updateData);
  if (!item) return res.error('Item not found', 'NOT_FOUND', null, 404);
  res.success(item);
}));

/**
 * DELETE /takeoff/:takeoffId/items/:itemId - Remove item
 */
router.delete('/:takeoffId/items/:itemId', tryCatch(async (req, res) => {
  const deleted = await db.deleteTakeoffItem(req.params.itemId);
  if (!deleted) return res.error('Item not found', 'NOT_FOUND', null, 404);
  res.success({ id: req.params.itemId });
}));

// ==================== Reports ====================

/**
 * GET /takeoff/:id/summary - Report summary
 */
router.get('/:id/summary', tryCatch(async (req, res) => {
  const takeoff = await db.getTakeoff(req.params.id);
  if (!takeoff) return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  
  const summary = await db.generateTakeoffSummary(req.params.id);
  res.success({ takeoff, ...summary });
}));

export default router;
