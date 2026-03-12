// Takeoff and Materials Operations Module
// Adds material and takeoff CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import cache from '../cache.js';
import logger from '../logger.js';

/**
 * Takeoff and Materials operations mixin
 * Adds material and takeoff-related methods to DatabaseService
 */
export function addTakeoffOperations(DatabaseService) {
  // ==================== Material Operations ====================
  
  /**
   * Create new material
   */
  DatabaseService.prototype.createMaterial = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO materials (
          id, name, category, unit, unitCost, supplier, 
          partNumber, description, notes, markup, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ]);
      
      this._invalidateMaterialCache();
      return await this.getMaterial(id);
    } catch (error) {
      logger.error('Failed to create material', { error: error.message, name: data.name });
      throw error;
    }
  };

  /**
   * Get single material
   */
  DatabaseService.prototype.getMaterial = async function(id) {
    const cacheKey = `material:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const material = await this.get('SELECT * FROM materials WHERE id = ?', [id]);
      if (material) {
        cache.set(cacheKey, material, 3600); // Cache for 1 hour
      }
      return material;
    } catch (error) {
      logger.error(`Error getting material: ${id}`, { error: error.message });
      return null;
    }
  };

  /**
   * Get all materials with filtering
   */
  DatabaseService.prototype.getAllMaterials = async function(filters = {}) {
    // Return cached all materials if no filters
    if (Object.keys(filters).length === 0) {
      const cached = cache.get('materials:all');
      if (cached) return cached;
    }

    try {
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
      
      const materials = await this.all(query, params);

      if (Object.keys(filters).length === 0) {
        cache.set('materials:all', materials, 3600);
      }

      return materials;
    } catch (error) {
      logger.error('Error getting all materials', { error: error.message });
      return [];
    }
  };

  /**
   * Advanced material search
   */
  DatabaseService.prototype.searchMaterials = async function(filters = {}) {
    try {
      let query = 'SELECT * FROM materials WHERE 1=1';
      const params = [];

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.supplier) {
        query += ' AND supplier = ?';
        params.push(filters.supplier);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR supplier LIKE ? OR partNumber LIKE ? OR description LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (filters.minPrice !== undefined) {
        query += ' AND unitCost >= ?';
        params.push(filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query += ' AND unitCost <= ?';
        params.push(filters.maxPrice);
      }

      if (filters.favorites) {
        query += ' AND isFavorite = 1';
      }

      // Sorting
      if (filters.sort === 'price-asc') query += ' ORDER BY unitCost ASC';
      else if (filters.sort === 'price-desc') query += ' ORDER BY unitCost DESC';
      else if (filters.sort === 'recent') query += ' ORDER BY lastUsedAt DESC NULLS LAST';
      else if (filters.sort === 'popular') query += ' ORDER BY usageCount DESC';
      else query += ' ORDER BY name ASC';

      return await this.all(query, params);
    } catch (error) {
      logger.error('Error searching materials', { error: error.message, filters });
      return [];
    }
  };

  /**
   * Update material
   */
  DatabaseService.prototype.updateMaterial = async function(id, data) {
    try {
      const existing = await this.getMaterial(id);
      if (!existing) return null;
      
      // Log price change if unitCost is being updated
      if (data.unitCost !== undefined && Number(data.unitCost) !== existing.unitCost) {
        await this.logPriceChange(id, existing.unitCost, data.unitCost);
      }
      
      const now = new Date().toISOString();
      
      const fields = [];
      const params = [];
      const allowedFields = ['name', 'category', 'unit', 'unitCost', 'supplier', 'partNumber', 'description', 'notes', 'markup', 'isFavorite'];
      
      for (const key of allowedFields) {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          params.push(data[key]);
        }
      }
      
      if (fields.length > 0) {
        fields.push('updatedAt = ?');
        params.push(now);
        params.push(id);
        
        await this.run(`
          UPDATE materials SET ${fields.join(', ')}
          WHERE id = ?
        `, params);
      }
      
      this._invalidateMaterialCache(id);
      return await this.getMaterial(id);
    } catch (error) {
      logger.error(`Failed to update material: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete material
   */
  DatabaseService.prototype.deleteMaterial = async function(id) {
    try {
      const result = await this.run('DELETE FROM materials WHERE id = ?', [id]);
      if (result.changes > 0) {
        this._invalidateMaterialCache(id);
      }
      return result.changes > 0;
    } catch (error) {
      logger.error(`Failed to delete material: ${id}`, { error: error.message });
      return false;
    }
  };

  /**
   * Helper to invalidate material caches
   */
  DatabaseService.prototype._invalidateMaterialCache = function(id = null) {
    if (id) cache.del(`material:${id}`);
    cache.del('materials:all');
    cache.del('materials:categories');
    cache.del('materials:suppliers');
    cache.del('materials:favorites');
  };

  /**
   * Get material categories
   */
  DatabaseService.prototype.getMaterialCategories = async function() {
    const cached = cache.get('materials:categories');
    if (cached) return cached;

    try {
      const rows = await this.all('SELECT DISTINCT category FROM materials WHERE category IS NOT NULL ORDER BY category');
      const categories = rows.map(r => r.category);
      cache.set('materials:categories', categories, 3600);
      return categories;
    } catch (error) {
      return [];
    }
  };

  /**
   * Get material suppliers
   */
  DatabaseService.prototype.getMaterialSuppliers = async function() {
    const cached = cache.get('materials:suppliers');
    if (cached) return cached;

    try {
      const rows = await this.all('SELECT DISTINCT supplier FROM materials WHERE supplier IS NOT NULL AND supplier != "" ORDER BY supplier');
      const suppliers = rows.map(r => r.supplier);
      cache.set('materials:suppliers', suppliers, 3600);
      return suppliers;
    } catch (error) {
      return [];
    }
  };

  /**
   * Get favorite materials
   */
  DatabaseService.prototype.getFavoriteMaterials = async function() {
    try {
      return await this.all('SELECT * FROM materials WHERE isFavorite = 1 ORDER BY name');
    } catch (error) {
      return [];
    }
  };

  /**
   * Toggle favorite status
   */
  DatabaseService.prototype.toggleMaterialFavorite = async function(id) {
    try {
      const material = await this.getMaterial(id);
      if (!material) return null;
      
      const newStatus = material.isFavorite ? 0 : 1;
      await this.run('UPDATE materials SET isFavorite = ?, updatedAt = ? WHERE id = ?', [
        newStatus, new Date().toISOString(), id
      ]);
      
      this._invalidateMaterialCache(id);
      return await this.getMaterial(id);
    } catch (error) {
      return null;
    }
  };

  /**
   * Increment usage counter for a material
   */
  DatabaseService.prototype.incrementMaterialUsage = async function(id) {
    try {
      const now = new Date().toISOString();
      await this.run(`
        UPDATE materials SET 
          usageCount = usageCount + 1,
          lastUsedAt = ?,
          updatedAt = ?
        WHERE id = ?
      `, [now, now, id]);
      cache.del(`material:${id}`);
    } catch (error) {
      // Non-critical, just log
      logger.debug(`Failed to increment usage for material ${id}`);
    }
  };

  /**
   * Get recently used materials
   */
  DatabaseService.prototype.getRecentlyUsedMaterials = async function(limit = 10) {
    try {
      return await this.all('SELECT * FROM materials WHERE lastUsedAt IS NOT NULL ORDER BY lastUsedAt DESC LIMIT ?', [limit]);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get most used materials
   */
  DatabaseService.prototype.getMostUsedMaterials = async function(limit = 10) {
    try {
      return await this.all('SELECT * FROM materials WHERE usageCount > 0 ORDER BY usageCount DESC LIMIT ?', [limit]);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get material statistics
   */
  DatabaseService.prototype.getMaterialStats = async function() {
    try {
      const total = await this.get('SELECT COUNT(*) as count FROM materials');
      const categories = await this.get('SELECT COUNT(DISTINCT category) as count FROM materials');
      const suppliers = await this.get('SELECT COUNT(DISTINCT supplier) as count FROM materials');
      const favorites = await this.get('SELECT COUNT(*) as count FROM materials WHERE isFavorite = 1');
      const avgPrice = await this.get('SELECT AVG(unitCost) as avg FROM materials');
      
      return {
        totalMaterials: total.count,
        totalCategories: categories.count,
        totalSuppliers: suppliers.count,
        totalFavorites: favorites.count,
        averageUnitPrice: Math.round((avgPrice.avg || 0) * 100) / 100
      };
    } catch (error) {
      return { totalMaterials: 0 };
    }
  };

  /**
   * Log a price change
   */
  DatabaseService.prototype.logPriceChange = async function(materialId, oldPrice, newPrice) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO price_history (id, materialId, oldPrice, newPrice, changedAt)
        VALUES (?, ?, ?, ?, ?)
      `, [id, materialId, oldPrice, newPrice, now]);
    } catch (error) {
      logger.error('Failed to log price change', { error: error.message, materialId });
    }
  };

  /**
   * Get price history for a material
   */
  DatabaseService.prototype.getPriceHistory = async function(materialId, limit = 50) {
    try {
      return await this.all(`
        SELECT * FROM price_history 
        WHERE materialId = ? 
        ORDER BY changedAt DESC 
        LIMIT ?
      `, [materialId, limit]);
    } catch (error) {
      return [];
    }
  };

  /**
   * Bulk create materials (transactional)
   */
  DatabaseService.prototype.bulkCreateMaterials = async function(items) {
    const now = new Date().toISOString();
    
    try {
      if (this.db && typeof this.db.transaction === 'function') {
        const stmt = this.db.prepare(`
          INSERT INTO materials (id, name, category, unit, unitCost, supplier, partNumber, description, notes, markup, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = this.db.transaction((materials) => {
          const ids = [];
          for (const m of materials) {
            const id = uuidv4();
            stmt.run(
              id, m.name, m.category || 'misc', m.unit || 'ea',
              Number(m.unitCost) || 0, m.supplier || '', m.partNumber || '',
              m.description || '', m.notes || '', Number(m.markup) || 0, now, now
            );
            ids.push(id);
          }
          return ids;
        });

        const createdIds = insertMany(items);
        this._invalidateMaterialCache();
        
        // Return created materials
        const results = [];
        for (const id of createdIds) {
          results.push(await this.getMaterial(id));
        }
        return results;
      } else {
        // Fallback for non-transactional or other DB types
        const created = [];
        for (const m of items) {
          created.push(await this.createMaterial(m));
        }
        return created;
      }
    } catch (error) {
      logger.error('Bulk create materials failed', { error: error.message });
      throw error;
    }
  };

  /**
   * Bulk delete materials
   */
  DatabaseService.prototype.bulkDeleteMaterials = async function(ids) {
    try {
      if (this.db && typeof this.db.transaction === 'function') {
        const deleteStmt = this.db.prepare('DELETE FROM materials WHERE id = ?');
        const deleteMany = this.db.transaction((materialIds) => {
          let totalDeleted = 0;
          for (const id of materialIds) {
            const result = deleteStmt.run(id);
            totalDeleted += result.changes;
          }
          return totalDeleted;
        });
        
        const count = deleteMany(ids);
        this._invalidateMaterialCache();
        return count;
      } else {
        let totalDeleted = 0;
        for (const id of ids) {
          if (await this.deleteMaterial(id)) totalDeleted++;
        }
        return totalDeleted;
      }
    } catch (error) {
      logger.error('Bulk delete materials failed', { error: error.message });
      throw error;
    }
  };

  /**
   * Bulk update prices
   */
  DatabaseService.prototype.bulkUpdatePrices = async function(ids, percentageChange) {
    const now = new Date().toISOString();
    const multiplier = 1 + (percentageChange / 100);

    try {
      if (this.db && typeof this.db.transaction === 'function') {
        const updateMany = this.db.transaction((materialIds) => {
          const histories = [];
          const getStmt = this.db.prepare('SELECT unitCost FROM materials WHERE id = ?');
          const updateStmt = this.db.prepare('UPDATE materials SET unitCost = ?, updatedAt = ? WHERE id = ?');
          const historyStmt = this.db.prepare('INSERT INTO price_history (id, materialId, oldPrice, newPrice, changedAt) VALUES (?, ?, ?, ?, ?)');
          
          for (const id of materialIds) {
            const material = getStmt.get(id);
            if (!material) continue;
            
            const oldPrice = material.unitCost;
            const newPrice = Math.round(oldPrice * multiplier * 100) / 100;

            // Log history
            historyStmt.run(uuidv4(), id, oldPrice, newPrice, now);
            // Update material
            updateStmt.run(newPrice, now, id);

            histories.push({ id, oldPrice, newPrice });
          }
          return histories;
        });

        const results = updateMany(ids);
        this._invalidateMaterialCache();
        return results;
      } else {
        const histories = [];
        for (const id of ids) {
          const material = await this.getMaterial(id);
          if (!material) continue;
          const oldPrice = material.unitCost;
          const newPrice = Math.round(oldPrice * multiplier * 100) / 100;
          await this.updateMaterial(id, { unitCost: newPrice });
          histories.push({ id, oldPrice, newPrice });
        }
        return histories;
      }
    } catch (error) {
      logger.error('Bulk price update failed', { error: error.message });
      throw error;
    }
  };

  /**
   * Duplicate a material
   */
  DatabaseService.prototype.duplicateMaterial = async function(id) {
    try {
      const original = await this.getMaterial(id);
      if (!original) return null;
      
      const duplicateData = {
        ...original,
        name: `${original.name} (Copy)`,
        isFavorite: 0,
        usageCount: 0,
        lastUsedAt: null
      };
      
      return await this.createMaterial(duplicateData);
    } catch (error) {
      return null;
    }
  };

  // ==================== Takeoff Operations ====================

  /**
   * Create new takeoff
   */
  DatabaseService.prototype.createTakeoff = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO takeoffs (
          id, userId, name, blueprintId, projectId, status, 
          notes, totalCost, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || null,
        data.name,
        data.blueprintId || null,
        data.projectId || null,
        data.status || 'draft',
        data.notes || '',
        data.totalCost || 0,
        now,
        now
      ]);
      
      return await this.getTakeoff(id);
    } catch (error) {
      logger.error('Failed to create takeoff', { error: error.message });
      throw error;
    }
  };

  /**
   * Get single takeoff
   */
  DatabaseService.prototype.getTakeoff = async function(id) {
    try {
      const takeoff = await this.get('SELECT * FROM takeoffs WHERE id = ?', [id]);
      if (takeoff) {
        if (takeoff.measurements && typeof takeoff.measurements === 'string') {
          try { takeoff.measurements = JSON.parse(takeoff.measurements); } catch (e) {}
        }
        if (takeoff.canvasData && typeof takeoff.canvasData === 'string') {
          try { takeoff.canvasData = JSON.parse(takeoff.canvasData); } catch (e) {}
        }
      }
      return takeoff;
    } catch (error) {
      return null;
    }
  };

  /**
   * Get all takeoffs with filtering
   */
  DatabaseService.prototype.getAllTakeoffs = async function(filters = {}) {
    try {
      let query = 'SELECT * FROM takeoffs WHERE 1=1';
      const params = [];
      
      if (filters.userId) {
        query += ' AND userId = ?';
        params.push(filters.userId);
      }

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      if (filters.blueprintId) {
        query += ' AND blueprintId = ?';
        params.push(filters.blueprintId);
      }
      
      query += ' ORDER BY updatedAt DESC';
      
      return await this.all(query, params);
    } catch (error) {
      return [];
    }
  };

  /**
   * Update takeoff
   */
  DatabaseService.prototype.updateTakeoff = async function(id, data) {
    try {
      const existing = await this.getTakeoff(id);
      if (!existing) return null;
      
      const now = new Date().toISOString();
      const fields = [];
      const params = [];
      const allowedFields = ['name', 'blueprintId', 'projectId', 'status', 'measurements', 'scale', 'canvasData', 'notes', 'totalCost'];
      
      for (const key of allowedFields) {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          const val = (key === 'measurements' || key === 'canvasData') && typeof data[key] === 'object' 
            ? JSON.stringify(data[key]) 
            : data[key];
          params.push(val);
        }
      }
      
      if (fields.length > 0) {
        fields.push('updatedAt = ?');
        params.push(now);
        params.push(id);
        
        await this.run(`UPDATE takeoffs SET ${fields.join(', ')} WHERE id = ?`, params);
      }
      
      return await this.getTakeoff(id);
    } catch (error) {
      logger.error(`Failed to update takeoff: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete takeoff
   */
  DatabaseService.prototype.deleteTakeoff = async function(id) {
    try {
      // Delete associated items first (cascading cleanup)
      await this.run('DELETE FROM takeoff_items WHERE takeoffId = ?', [id]);
      const result = await this.run('DELETE FROM takeoffs WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  // ==================== Takeoff Item Operations ====================

  /**
   * Create takeoff item
   */
  DatabaseService.prototype.createTakeoffItem = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO takeoff_items (
          id, takeoffId, materialId, measurementType, label, 
          quantity, unit, unitCost, totalCost, measurementData, notes, createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ]);
      
      await this.recalculateTakeoffTotal(data.takeoffId);
      return await this.getTakeoffItem(id);
    } catch (error) {
      logger.error('Failed to create takeoff item', { error: error.message });
      throw error;
    }
  };

  /**
   * Get single takeoff item
   */
  DatabaseService.prototype.getTakeoffItem = async function(id) {
    try {
      const item = await this.get('SELECT * FROM takeoff_items WHERE id = ?', [id]);
      if (item && item.measurementData && typeof item.measurementData === 'string') {
        try { item.measurementData = JSON.parse(item.measurementData); } catch (e) {}
      }
      return item;
    } catch (error) {
      return null;
    }
  };

  /**
   * Get items for a takeoff
   */
  DatabaseService.prototype.getTakeoffItems = async function(takeoffId) {
    try {
      const items = await this.all(`
        SELECT i.*, m.category, m.name as materialName, m.unit as materialUnit
        FROM takeoff_items i
        LEFT JOIN materials m ON i.materialId = m.id
        WHERE i.takeoffId = ?
      `, [takeoffId]);
      
      return items.map(item => {
        if (item.measurementData && typeof item.measurementData === 'string') {
          try { item.measurementData = JSON.parse(item.measurementData); } catch (e) {}
        }
        return item;
      });
    } catch (error) {
      return [];
    }
  };

  /**
   * Update takeoff item
   */
  DatabaseService.prototype.updateTakeoffItem = async function(id, data) {
    try {
      const existing = await this.getTakeoffItem(id);
      if (!existing) return null;
      
      const fields = [];
      const params = [];
      const allowedFields = ['materialId', 'measurementType', 'label', 'quantity', 'unit', 'unitCost', 'totalCost', 'measurementData', 'notes'];
      
      for (const key of allowedFields) {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          const val = key === 'measurementData' && typeof data[key] === 'object' 
            ? JSON.stringify(data[key]) 
            : data[key];
          params.push(val);
        }
      }
      
      if (fields.length > 0) {
        params.push(id);
        await this.run(`UPDATE takeoff_items SET ${fields.join(', ')} WHERE id = ?`, params);
      }
      
      const item = await this.getTakeoffItem(id);
      await this.recalculateTakeoffTotal(item.takeoffId);
      return item;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Delete takeoff item
   */
  DatabaseService.prototype.deleteTakeoffItem = async function(id) {
    try {
      const item = await this.getTakeoffItem(id);
      if (!item) return false;
      
      const result = await this.run('DELETE FROM takeoff_items WHERE id = ?', [id]);
      await this.recalculateTakeoffTotal(item.takeoffId);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  /**
   * Recalculate total cost for a takeoff
   */
  DatabaseService.prototype.recalculateTakeoffTotal = async function(takeoffId) {
    try {
      const result = await this.get('SELECT SUM(totalCost) as total FROM takeoff_items WHERE takeoffId = ?', [takeoffId]);
      const total = result.total || 0;
      await this.run('UPDATE takeoffs SET totalCost = ?, updatedAt = ? WHERE id = ?', [
        total, new Date().toISOString(), takeoffId
      ]);
    } catch (error) {
      logger.error(`Recalculation failed for takeoff ${takeoffId}`, { error: error.message });
    }
  };

  /**
   * Generate takeoff summary grouped by category
   */
  DatabaseService.prototype.generateTakeoffSummary = async function(takeoffId) {
    try {
      const items = await this.getTakeoffItems(takeoffId);
      const byCategory = {};
      let totalCost = 0;
      
      for (const item of items) {
        const category = item.category || 'Uncategorized';
        if (!byCategory[category]) {
          byCategory[category] = { items: [], subtotal: 0 };
        }
        byCategory[category].items.push(item);
        byCategory[category].subtotal += (item.totalCost || 0);
        totalCost += (item.totalCost || 0);
      }
      
      return {
        itemCount: items.length,
        totalCost: Math.round(totalCost * 100) / 100,
        byCategory
      };
    } catch (error) {
      return { itemCount: 0, totalCost: 0, byCategory: {} };
    }
  };

  /**
   * Find material by name (fuzzy)
   */
  DatabaseService.prototype.findMaterialByName = async function(name) {
    if (!name) return null;
    try {
      // Exact match
      let material = await this.get('SELECT * FROM materials WHERE name = ?', [name]);
      if (material) return material;
      
      // Fuzzy LIKE
      material = await this.get('SELECT * FROM materials WHERE name LIKE ?', [`%${name}%`]);
      return material;
    } catch (error) {
      return null;
    }
  };

  /**
   * AI Analysis conversion (remains as is but with better error handling)
   */
  DatabaseService.prototype.convertAnalysisToTakeoff = async function(projectId, analysisId, userId) {
    try {
      const project = await this.get('SELECT * FROM vision_projects WHERE id = ?', [projectId]);
      const analysis = await this.get('SELECT * FROM vision_analyses WHERE id = ?', [analysisId]);
      
      if (!project || !analysis) throw new Error('Source project or analysis not found');
      
      const analysisData = typeof analysis.result === 'string' ? JSON.parse(analysis.result) : analysis.result;
      const scale = project.scale || 1.0;
      
      const takeoff = await this.createTakeoff({
        name: `${project.name} - AI Takeoff (${analysis.passType})`,
        blueprintId: projectId,
        status: 'draft',
        userId: userId
      });
      
      if (analysisData.systems) {
        for (const system of analysisData.systems) {
          for (const region of (system.regions || [])) {
            let quantity = 1;
            let unit = 'EA';
            let measurementType = 'count';
            let measurementData = {};
            
            if (region.type === 'path' && region.points) {
              let totalDist = 0;
              for (let i = 0; i < region.points.length - 1; i++) {
                const p1 = region.points[i];
                const p2 = region.points[i+1];
                totalDist += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
              }
              quantity = totalDist * scale;
              unit = 'LF';
              measurementType = 'length';
              measurementData = { points: region.points, normalizedDistance: totalDist };
            } else {
              measurementData = { x: region.x, y: region.y };
            }
            
            const material = await this.findMaterialByName(region.label || region.type);
            
            await this.createTakeoffItem({
              takeoffId: takeoff.id,
              materialId: material?.id || null,
              measurementType,
              label: region.label || region.type,
              quantity: Math.round(quantity * 100) / 100,
              unit: material?.unit || unit,
              unitCost: material?.unitCost || 0,
              totalCost: (Math.round(quantity * 100) / 100) * (material?.unitCost || 0),
              measurementData,
              notes: region.details || `AI Detected in ${analysis.passType}`
            });
          }
        }
      }
      
      return await this.getTakeoff(takeoff.id);
    } catch (error) {
      logger.error('Conversion from analysis failed', { error: error.message });
      throw error;
    }
  };
}

export default addTakeoffOperations;
