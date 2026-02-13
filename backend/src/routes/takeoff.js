// Material Takeoff routes
// Handles materials CRUD, takeoff CRUD, takeoff items, and report generation

import express from 'express';
import { db } from '../services/database.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// ==================== Materials ====================

// Get all materials (with advanced filtering)
router.get('/materials', tryCatch(async (req, res) => {
  const { category, search, supplier, minPrice, maxPrice, favorites, recentlyUsed, sort } = req.query;

  // Use advanced search if any extended filters are present
  if (supplier || minPrice || maxPrice || favorites || recentlyUsed || sort) {
    const materials = db.searchMaterials({
      category, search, supplier,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      favorites: favorites === 'true' || favorites === '1',
      recentlyUsed: recentlyUsed === 'true' || recentlyUsed === '1',
      sort
    });
    return res.success({ materials, total: materials.length });
  }

  const materials = db.getAllMaterials({ category, search });
  res.success({ materials, total: materials.length });
}));

// Get material categories
router.get('/materials/categories', tryCatch(async (req, res) => {
  const categories = db.getMaterialCategories();
  res.success({ categories });
}));

// Get material suppliers
router.get('/materials/suppliers', tryCatch(async (req, res) => {
  const suppliers = db.getMaterialSuppliers();
  res.success({ suppliers });
}));

// Get material stats / analytics
router.get('/materials/stats', tryCatch(async (req, res) => {
  const stats = db.getMaterialStats();
  res.success(stats);
}));

// Get favorite materials
router.get('/materials/favorites', tryCatch(async (req, res) => {
  const materials = db.getFavoriteMaterials();
  res.success({ materials, total: materials.length });
}));

// Get recently used materials
router.get('/materials/recent', tryCatch(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const materials = db.getRecentlyUsedMaterials(limit);
  res.success({ materials, total: materials.length });
}));

// Get most used materials
router.get('/materials/most-used', tryCatch(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const materials = db.getMostUsedMaterials(limit);
  res.success({ materials, total: materials.length });
}));

// Export materials as CSV
router.get('/materials/export/csv', tryCatch(async (req, res) => {
  const { category } = req.query;
  const materials = db.getAllMaterials({ category });

  const header = ['Name', 'Category', 'Unit', 'Unit Cost', 'Supplier', 'Part Number', 'Description', 'Notes', 'Markup %'];
  const rows = materials.map(m => [
    m.name, m.category, m.unit, m.unitCost,
    m.supplier || '', m.partNumber || '', m.description || '', m.notes || '', m.markup || 0
  ]);

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="materials-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
}));

// Bulk import materials
router.post('/materials/import', tryCatch(async (req, res) => {
  const { materials: items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.error('Materials array is required', 'VALIDATION_ERROR', null, 400);
  }

  // Validate each item
  const errors = [];
  items.forEach((item, index) => {
    if (!item.name) errors.push(`Row ${index + 1}: name is required`);
  });

  if (errors.length > 0) {
    return res.error('Validation errors in import data', 'VALIDATION_ERROR', { errors }, 400);
  }

  const created = db.bulkCreateMaterials(items);
  logger.info('Materials bulk imported', { count: created.length });
  res.success({ materials: created, imported: created.length }, `${created.length} materials imported successfully`);
}));

// Bulk delete materials
router.post('/materials/bulk-delete', tryCatch(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.error('Material IDs array is required', 'VALIDATION_ERROR', null, 400);
  }

  const deleted = db.bulkDeleteMaterials(ids);
  logger.info('Materials bulk deleted', { count: deleted, ids });
  res.success({ deleted }, `${deleted} materials deleted`);
}));

// Bulk price update
router.post('/materials/bulk-price-update', tryCatch(async (req, res) => {
  const { ids, percentageChange } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.error('Material IDs array is required', 'VALIDATION_ERROR', null, 400);
  }
  if (percentageChange === undefined || percentageChange === null) {
    return res.error('Percentage change is required', 'VALIDATION_ERROR', null, 400);
  }

  const changes = db.bulkUpdatePrices(ids, Number(percentageChange));
  logger.info('Materials bulk price update', { count: changes.length, percentageChange });
  res.success({ changes, updated: changes.length }, `${changes.length} material prices updated`);
}));

// Get single material
router.get('/materials/:id', tryCatch(async (req, res) => {
  const material = db.getMaterial(req.params.id);
  if (!material) {
    return res.error('Material not found', 'NOT_FOUND', null, 404);
  }
  res.success(material);
}));

// Get price history for a material
router.get('/materials/:id/price-history', tryCatch(async (req, res) => {
  const material = db.getMaterial(req.params.id);
  if (!material) {
    return res.error('Material not found', 'NOT_FOUND', null, 404);
  }
  const limit = Number(req.query.limit) || 50;
  const history = db.getPriceHistory(req.params.id, limit);
  res.success({ history, total: history.length });
}));

// Create material
router.post('/materials', tryCatch(async (req, res) => {
  const { name, category, unit, unitCost, supplier, partNumber, description, notes, markup } = req.body;

  if (!name || !category || !unit) {
    return res.error('Name, category, and unit are required', 'VALIDATION_ERROR', null, 400);
  }

  const material = db.createMaterial({
    name, category, unit,
    unitCost: Number(unitCost) || 0,
    supplier, partNumber, description, notes,
    markup: Number(markup) || 0
  });

  logger.info('Material created', { id: material.id, name });
  res.success(material, 'Material created successfully');
}));

// Duplicate a material
router.post('/materials/:id/duplicate', tryCatch(async (req, res) => {
  const material = db.duplicateMaterial(req.params.id);
  if (!material) {
    return res.error('Material not found', 'NOT_FOUND', null, 404);
  }
  logger.info('Material duplicated', { originalId: req.params.id, newId: material.id });
  res.success(material, 'Material duplicated successfully');
}));

// Toggle material favorite
router.post('/materials/:id/favorite', tryCatch(async (req, res) => {
  const material = db.toggleMaterialFavorite(req.params.id);
  if (!material) {
    return res.error('Material not found', 'NOT_FOUND', null, 404);
  }
  res.success(material, material.isFavorite ? 'Added to favorites' : 'Removed from favorites');
}));

// Update material
router.put('/materials/:id', tryCatch(async (req, res) => {
  const material = db.updateMaterial(req.params.id, req.body);
  if (!material) {
    return res.error('Material not found', 'NOT_FOUND', null, 404);
  }
  res.success(material, 'Material updated successfully');
}));

// Delete material
router.delete('/materials/:id', tryCatch(async (req, res) => {
  const deleted = db.deleteMaterial(req.params.id);
  if (!deleted) {
    return res.error('Material not found', 'NOT_FOUND', null, 404);
  }
  res.success({ id: req.params.id }, 'Material deleted successfully');
}));

// ==================== Takeoffs ====================

// Get all takeoffs
router.get('/', tryCatch(async (req, res) => {
  const { status, blueprintId } = req.query;
  const takeoffs = db.getAllTakeoffs({ status, blueprintId });
  res.success({ takeoffs, total: takeoffs.length });
}));

// Get single takeoff with items
router.get('/:id', tryCatch(async (req, res) => {
  const takeoff = db.getTakeoff(req.params.id);
  if (!takeoff) {
    return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  }
  const items = db.getTakeoffItems(req.params.id);
  res.success({ ...takeoff, items });
}));

// Create takeoff
router.post('/', tryCatch(async (req, res) => {
  const { name, blueprintId, projectId, notes } = req.body;

  if (!name) {
    return res.error('Name is required', 'VALIDATION_ERROR', null, 400);
  }

  const takeoff = db.createTakeoff({ name, blueprintId, projectId, notes });
  logger.info('Takeoff created', { id: takeoff.id, name });
  res.success(takeoff, 'Takeoff created successfully');
}));

// Update takeoff (measurements, canvas data, scale, etc.)
router.put('/:id', tryCatch(async (req, res) => {
  const takeoff = db.updateTakeoff(req.params.id, req.body);
  if (!takeoff) {
    return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  }
  res.success(takeoff, 'Takeoff updated successfully');
}));

// Delete takeoff
router.delete('/:id', tryCatch(async (req, res) => {
  const deleted = db.deleteTakeoff(req.params.id);
  if (!deleted) {
    return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  }
  res.success({ id: req.params.id }, 'Takeoff deleted successfully');
}));

// ==================== Takeoff Items ====================

// Get items for a takeoff
router.get('/:id/items', tryCatch(async (req, res) => {
  const items = db.getTakeoffItems(req.params.id);
  res.success({ items, total: items.length });
}));

// Add item to takeoff
router.post('/:id/items', tryCatch(async (req, res) => {
  const takeoff = db.getTakeoff(req.params.id);
  if (!takeoff) {
    return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  }

  const { materialId, measurementType, label, quantity, unit, unitCost, measurementData, notes } = req.body;

  if (!measurementType) {
    return res.error('Measurement type is required', 'VALIDATION_ERROR', null, 400);
  }

  // If materialId provided, look up unit cost from material
  let resolvedUnitCost = Number(unitCost) || 0;
  let resolvedUnit = unit || '';
  if (materialId) {
    const material = db.getMaterial(materialId);
    if (material) {
      resolvedUnitCost = resolvedUnitCost || material.unitCost;
      resolvedUnit = resolvedUnit || material.unit;
    }
  }

  const qty = Number(quantity) || 0;
  const item = db.createTakeoffItem({
    takeoffId: req.params.id,
    materialId,
    measurementType,
    label,
    quantity: qty,
    unit: resolvedUnit,
    unitCost: resolvedUnitCost,
    totalCost: qty * resolvedUnitCost,
    measurementData,
    notes
  });

  // Track material usage
  if (materialId) {
    db.incrementMaterialUsage(materialId);
  }

  logger.info('Takeoff item added', { takeoffId: req.params.id, itemId: item.id });
  res.success(item, 'Item added to takeoff');
}));

// Update takeoff item
router.put('/:takeoffId/items/:itemId', tryCatch(async (req, res) => {
  const { quantity, unitCost, ...rest } = req.body;
  const qty = quantity !== undefined ? Number(quantity) : undefined;
  const cost = unitCost !== undefined ? Number(unitCost) : undefined;

  const updateData = { ...rest };
  if (qty !== undefined) updateData.quantity = qty;
  if (cost !== undefined) updateData.unitCost = cost;
  if (qty !== undefined || cost !== undefined) {
    const existing = db.getTakeoffItem(req.params.itemId);
    const finalQty = qty !== undefined ? qty : existing.quantity;
    const finalCost = cost !== undefined ? cost : existing.unitCost;
    updateData.totalCost = finalQty * finalCost;
  }

  const item = db.updateTakeoffItem(req.params.itemId, updateData);
  if (!item) {
    return res.error('Item not found', 'NOT_FOUND', null, 404);
  }
  res.success(item, 'Item updated');
}));

// Delete takeoff item
router.delete('/:takeoffId/items/:itemId', tryCatch(async (req, res) => {
  const deleted = db.deleteTakeoffItem(req.params.itemId);
  if (!deleted) {
    return res.error('Item not found', 'NOT_FOUND', null, 404);
  }
  res.success({ id: req.params.itemId }, 'Item deleted');
}));

// ==================== Report Generation ====================

// Generate takeoff summary report
router.get('/:id/summary', tryCatch(async (req, res) => {
  const takeoff = db.getTakeoff(req.params.id);
  if (!takeoff) {
    return res.error('Takeoff not found', 'NOT_FOUND', null, 404);
  }

  const summary = db.generateTakeoffSummary(req.params.id);
  res.success({
    takeoff: {
      id: takeoff.id,
      name: takeoff.name,
      status: takeoff.status,
      createdAt: takeoff.createdAt,
      updatedAt: takeoff.updatedAt
    },
    ...summary
  });
}));

export default router;
