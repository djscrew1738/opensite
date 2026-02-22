// Takeoff and Materials Operations Module
// Adds material and takeoff CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Takeoff and Materials operations mixin
 * Adds material and takeoff-related methods to DatabaseService
 */
export function addTakeoffOperations(DatabaseService) {
  // ==================== Material Operations ====================
  
  // Create new material
  DatabaseService.prototype.createMaterial = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO materials (id, name, category, unit, unitCost, supplier, partNumber, description, notes, markup, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.category,
      data.unit,
      data.unitCost || 0,
      data.supplier || '',
      data.partNumber || '',
      data.description || '',
      data.notes || '',
      data.markup || 0,
      now,
      now
    );
    
    return this.getMaterial(id);
  };

  // Get single material
  DatabaseService.prototype.getMaterial = function(id) {
    return this.db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
  };

  // Get all materials with optional filtering
  DatabaseService.prototype.getAllMaterials = function(filters = {}) {
    let query = 'SELECT * FROM materials WHERE 1=1';
    const params = [];
    
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.search) {
      query += ' AND (name LIKE ? OR supplier LIKE ? OR partNumber LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY name';
    
    return this.db.prepare(query).all(...params);
  };

  // Update material
  DatabaseService.prototype.updateMaterial = function(id, data) {
    const existing = this.getMaterial(id);
    if (!existing) return null;
    
    // Log price change if unitCost is being updated
    if (data.unitCost !== undefined && data.unitCost !== existing.unitCost) {
      this.logPriceChange(id, existing.unitCost, data.unitCost);
    }
    
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE materials SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        unit = COALESCE(?, unit),
        unitCost = COALESCE(?, unitCost),
        supplier = COALESCE(?, supplier),
        partNumber = COALESCE(?, partNumber),
        description = COALESCE(?, description),
        notes = COALESCE(?, notes),
        markup = COALESCE(?, markup),
        updatedAt = ?
      WHERE id = ?
    `).run(
      data.name,
      data.category,
      data.unit,
      data.unitCost,
      data.supplier,
      data.partNumber,
      data.description,
      data.notes,
      data.markup,
      now,
      id
    );
    
    return this.getMaterial(id);
  };

  // Delete material
  DatabaseService.prototype.deleteMaterial = function(id) {
    const result = this.db.prepare('DELETE FROM materials WHERE id = ?').run(id);
    return result.changes > 0;
  };

  // Get material categories
  DatabaseService.prototype.getMaterialCategories = function() {
    const rows = this.db.prepare('SELECT DISTINCT category FROM materials ORDER BY category').all();
    return rows.map(r => r.category);
  };

  // Get material suppliers
  DatabaseService.prototype.getMaterialSuppliers = function() {
    const rows = this.db.prepare('SELECT DISTINCT supplier FROM materials WHERE supplier IS NOT NULL AND supplier != "" ORDER BY supplier').all();
    return rows.map(r => r.supplier);
  };

  // Log a price change
  DatabaseService.prototype.logPriceChange = function(materialId, oldPrice, newPrice) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO price_history (id, materialId, oldPrice, newPrice, changedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, materialId, oldPrice, newPrice, now);
  };

  // Get price history for a material
  DatabaseService.prototype.getPriceHistory = function(materialId, limit = 50) {
    return this.db.prepare(`
      SELECT * FROM price_history 
      WHERE materialId = ? 
      ORDER BY changedAt DESC 
      LIMIT ?
    `).all(materialId, limit);
  };

  // Bulk create materials (transaction)
  DatabaseService.prototype.bulkCreateMaterials = function(items) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO materials (id, name, category, unit, unitCost, supplier, partNumber, description, notes, markup, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((materials) => {
      const created = [];
      for (const m of materials) {
        const id = uuidv4();
        stmt.run(
          id, m.name, m.category || 'misc', m.unit || 'ea',
          Number(m.unitCost) || 0, m.supplier || '', m.partNumber || '',
          m.description || '', m.notes || '', Number(m.markup) || 0, now, now
        );
        created.push(id);
      }
      return created;
    });

    const ids = insertMany(items);
    return ids.map(id => this.getMaterial(id));
  };

  // Bulk delete materials (transaction)
  DatabaseService.prototype.bulkDeleteMaterials = function(ids) {
    const deleteMany = this.db.transaction((materialIds) => {
      let totalDeleted = 0;
      const deleteStmt = this.db.prepare('DELETE FROM materials WHERE id = ?');
      for (const id of materialIds) {
        const result = deleteStmt.run(id);
        totalDeleted += result.changes;
      }
      return totalDeleted;
    });
    
    return deleteMany(ids);
  };

  // Bulk update prices (transaction)
  DatabaseService.prototype.bulkUpdatePrices = function(ids, percentageChange) {
    const now = new Date().toISOString();
    const multiplier = 1 + (percentageChange / 100);

    const updateMany = this.db.transaction((materialIds) => {
      const histories = [];
      for (const id of materialIds) {
        const material = this.getMaterial(id);
        if (!material) continue;
        const oldPrice = material.unitCost;
        const newPrice = Math.round(oldPrice * multiplier * 100) / 100;

        // Log price change
        this.db.prepare(
          'INSERT INTO price_history (id, materialId, oldPrice, newPrice, changedAt) VALUES (?, ?, ?, ?, ?)'
        ).run(uuidv4(), id, oldPrice, newPrice, now);

        // Update price
        this.db.prepare(
          'UPDATE materials SET unitCost = ?, updatedAt = ? WHERE id = ?'
        ).run(newPrice, now, id);

        histories.push({ id, oldPrice, newPrice });
      }
      return histories;
    });

    return updateMany(ids);
  };

  // ==================== Takeoff Operations ====================

  // Create new takeoff
  DatabaseService.prototype.createTakeoff = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO takeoffs (id, name, blueprintId, projectId, status, notes, totalCost, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.blueprintId || null,
      data.projectId || null,
      data.status || 'draft',
      data.notes || '',
      data.totalCost || 0,
      now,
      now
    );
    
    return this.getTakeoff(id);
  };

  // Get single takeoff
  DatabaseService.prototype.getTakeoff = function(id) {
    const takeoff = this.db.prepare('SELECT * FROM takeoffs WHERE id = ?').get(id);
    if (takeoff && takeoff.measurements) {
      try { takeoff.measurements = JSON.parse(takeoff.measurements); } catch (e) {}
    }
    if (takeoff && takeoff.canvasData) {
      try { takeoff.canvasData = JSON.parse(takeoff.canvasData); } catch (e) {}
    }
    return takeoff;
  };

  // Get all takeoffs with optional filtering
  DatabaseService.prototype.getAllTakeoffs = function(filters = {}) {
    let query = 'SELECT * FROM takeoffs WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.blueprintId) {
      query += ' AND blueprintId = ?';
      params.push(filters.blueprintId);
    }
    
    query += ' ORDER BY updatedAt DESC';
    
    return this.db.prepare(query).all(...params);
  };

  // Update takeoff
  DatabaseService.prototype.updateTakeoff = function(id, data) {
    const existing = this.getTakeoff(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE takeoffs SET
        name = COALESCE(?, name),
        blueprintId = COALESCE(?, blueprintId),
        projectId = COALESCE(?, projectId),
        status = COALESCE(?, status),
        measurements = COALESCE(?, measurements),
        scale = COALESCE(?, scale),
        canvasData = COALESCE(?, canvasData),
        notes = COALESCE(?, notes),
        totalCost = COALESCE(?, totalCost),
        updatedAt = ?
      WHERE id = ?
    `).run(
      data.name,
      data.blueprintId,
      data.projectId,
      data.status,
      data.measurements ? JSON.stringify(data.measurements) : null,
      data.scale,
      data.canvasData ? JSON.stringify(data.canvasData) : null,
      data.notes,
      data.totalCost,
      now,
      id
    );
    
    return this.getTakeoff(id);
  };

  // Delete takeoff
  DatabaseService.prototype.deleteTakeoff = function(id) {
    const result = this.db.prepare('DELETE FROM takeoffs WHERE id = ?').run(id);
    return result.changes > 0;
  };

  // ==================== Takeoff Item Operations ====================

  // Create takeoff item
  DatabaseService.prototype.createTakeoffItem = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO takeoff_items (id, takeoffId, materialId, measurementType, label, quantity, unit, unitCost, totalCost, measurementData, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.takeoffId,
      data.materialId || null,
      data.measurementType,
      data.label || '',
      data.quantity || 0,
      data.unit || '',
      data.unitCost || 0,
      data.totalCost || 0,
      data.measurementData ? JSON.stringify(data.measurementData) : null,
      data.notes || '',
      now
    );
    
    // Update takeoff total
    this.recalculateTakeoffTotal(data.takeoffId);
    
    return this.getTakeoffItem(id);
  };

  // Get single takeoff item
  DatabaseService.prototype.getTakeoffItem = function(id) {
    const item = this.db.prepare('SELECT * FROM takeoff_items WHERE id = ?').get(id);
    if (item && item.measurementData) {
      try { item.measurementData = JSON.parse(item.measurementData); } catch (e) {}
    }
    return item;
  };

  // Get all items for a takeoff
  DatabaseService.prototype.getTakeoffItems = function(takeoffId) {
    const items = this.db.prepare('SELECT * FROM takeoff_items WHERE takeoffId = ?').all(takeoffId);
    return items.map(item => {
      if (item.measurementData) {
        try { item.measurementData = JSON.parse(item.measurementData); } catch (e) {}
      }
      return item;
    });
  };

  // Update takeoff item
  DatabaseService.prototype.updateTakeoffItem = function(id, data) {
    const existing = this.getTakeoffItem(id);
    if (!existing) return null;
    
    this.db.prepare(`
      UPDATE takeoff_items SET
        materialId = COALESCE(?, materialId),
        measurementType = COALESCE(?, measurementType),
        label = COALESCE(?, label),
        quantity = COALESCE(?, quantity),
        unit = COALESCE(?, unit),
        unitCost = COALESCE(?, unitCost),
        totalCost = COALESCE(?, totalCost),
        measurementData = COALESCE(?, measurementData),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      data.materialId,
      data.measurementType,
      data.label,
      data.quantity,
      data.unit,
      data.unitCost,
      data.totalCost,
      data.measurementData ? JSON.stringify(data.measurementData) : null,
      data.notes,
      id
    );
    
    // Recalculate takeoff total
    const item = this.getTakeoffItem(id);
    this.recalculateTakeoffTotal(item.takeoffId);
    
    return this.getTakeoffItem(id);
  };

  // Delete takeoff item
  DatabaseService.prototype.deleteTakeoffItem = function(id) {
    const item = this.getTakeoffItem(id);
    if (!item) return false;
    
    const result = this.db.prepare('DELETE FROM takeoff_items WHERE id = ?').run(id);
    
    // Recalculate takeoff total
    this.recalculateTakeoffTotal(item.takeoffId);
    
    return result.changes > 0;
  };

  // Recalculate takeoff total from items
  DatabaseService.prototype.recalculateTakeoffTotal = function(takeoffId) {
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(totalCost), 0) as total FROM takeoff_items WHERE takeoffId = ?
    `).get(takeoffId);
    
    this.db.prepare('UPDATE takeoffs SET totalCost = ? WHERE id = ?').run(result.total, takeoffId);
  };

  // Generate takeoff summary
  DatabaseService.prototype.generateTakeoffSummary = function(takeoffId) {
    const items = this.getTakeoffItems(takeoffId);
    
    const byCategory = {};
    let totalCost = 0;
    
    for (const item of items) {
      const category = item.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = { items: [], subtotal: 0 };
      }
      byCategory[category].items.push(item);
      byCategory[category].subtotal += item.totalCost || 0;
      totalCost += item.totalCost || 0;
    }
    
    return {
      itemCount: items.length,
      totalCost,
      byCategory
    };
  };
}

export default addTakeoffOperations;
