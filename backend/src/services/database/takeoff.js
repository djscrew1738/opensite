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
  DatabaseService.prototype.createMaterial = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO materials (id, name, category, unit, unitCost, supplier, partNumber, description, notes, markup, createdAt, updatedAt)
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
    
    return await this.getMaterial(id);
  };

  // Get single material
  DatabaseService.prototype.getMaterial = async function(id) {
    return await this.get('SELECT * FROM materials WHERE id = ?', [id]);
  };

  // Get all materials with optional filtering
  DatabaseService.prototype.getAllMaterials = async function(filters = {}) {
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
    
    return await this.all(query, params);
  };

  // Update material
  DatabaseService.prototype.updateMaterial = async function(id, data) {
    const existing = await this.getMaterial(id);
    if (!existing) return null;
    
    // Log price change if unitCost is being updated
    if (data.unitCost !== undefined && data.unitCost !== existing.unitCost) {
      await this.logPriceChange(id, existing.unitCost, data.unitCost);
    }
    
    const now = new Date().toISOString();
    
    await this.run(`
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
    `, [
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
    ]);
    
    return await this.getMaterial(id);
  };

  // Delete material
  DatabaseService.prototype.deleteMaterial = async function(id) {
    const result = await this.run('DELETE FROM materials WHERE id = ?', [id]);
    return result.changes > 0;
  };

  // Get material categories
  DatabaseService.prototype.getMaterialCategories = async function() {
    const rows = await this.all('SELECT DISTINCT category FROM materials ORDER BY category');
    return rows.map(r => r.category);
  };

  // Get material suppliers
  DatabaseService.prototype.getMaterialSuppliers = async function() {
    const rows = await this.all('SELECT DISTINCT supplier FROM materials WHERE supplier IS NOT NULL AND supplier != "" ORDER BY supplier');
    return rows.map(r => r.supplier);
  };

  // Log a price change
  DatabaseService.prototype.logPriceChange = async function(materialId, oldPrice, newPrice) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO price_history (id, materialId, oldPrice, newPrice, changedAt)
      VALUES (?, ?, ?, ?, ?)
    `, [id, materialId, oldPrice, newPrice, now]);
  };

  // Get price history for a material
  DatabaseService.prototype.getPriceHistory = async function(materialId, limit = 50) {
    return await this.all(`
      SELECT * FROM price_history 
      WHERE materialId = ? 
      ORDER BY changedAt DESC 
      LIMIT ?
    `, [materialId, limit]);
  };

  // Bulk create materials (transaction)
  DatabaseService.prototype.bulkCreateMaterials = async function(items) {
    // Note: For now, keeping transactions synchronous for SQLite but making the method async
    // This will need careful handling when fully porting to PostgreSQL
    const now = new Date().toISOString();
    
    if (this.db && this.db.transaction) {
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
      const results = [];
      for (const id of ids) {
        results.push(await this.getMaterial(id));
      }
      return results;
    } else {
      // PostgreSQL or other async-native implementation
      const created = [];
      for (const m of items) {
        created.push(await this.createMaterial(m));
      }
      return created;
    }
  };

  // Bulk delete materials (transaction)
  DatabaseService.prototype.bulkDeleteMaterials = async function(ids) {
    if (this.db && this.db.transaction) {
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
    } else {
      let totalDeleted = 0;
      for (const id of ids) {
        if (await this.deleteMaterial(id)) totalDeleted++;
      }
      return totalDeleted;
    }
  };

  // Bulk update prices (transaction)
  DatabaseService.prototype.bulkUpdatePrices = async function(ids, percentageChange) {
    const now = new Date().toISOString();
    const multiplier = 1 + (percentageChange / 100);

    if (this.db && this.db.transaction) {
      const updateMany = this.db.transaction((materialIds) => {
        const histories = [];
        for (const id of materialIds) {
          // Note: getMaterial is now async in prototype but db.prepare is sync
          const material = this.db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
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
  };

  // ==================== Takeoff Operations ====================

  // Create new takeoff
  DatabaseService.prototype.createTakeoff = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO takeoffs (id, userId, name, blueprintId, projectId, status, notes, totalCost, createdAt, updatedAt)
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
  };

  // Get single takeoff
  DatabaseService.prototype.getTakeoff = async function(id) {
    const takeoff = await this.get('SELECT * FROM takeoffs WHERE id = ?', [id]);
    if (takeoff && takeoff.measurements) {
      try { takeoff.measurements = JSON.parse(takeoff.measurements); } catch (e) {}
    }
    if (takeoff && takeoff.canvasData) {
      try { takeoff.canvasData = JSON.parse(takeoff.canvasData); } catch (e) {}
    }
    return takeoff;
  };

  // Get all takeoffs with optional filtering
  DatabaseService.prototype.getAllTakeoffs = async function(filters = {}) {
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
  };

  // Update takeoff
  DatabaseService.prototype.updateTakeoff = async function(id, data) {
    const existing = await this.getTakeoff(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    await this.run(`
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
    `, [
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
    ]);
    
    return await this.getTakeoff(id);
  };

  // Delete takeoff
  DatabaseService.prototype.deleteTakeoff = async function(id) {
    const result = await this.run('DELETE FROM takeoffs WHERE id = ?', [id]);
    return result.changes > 0;
  };

  // ==================== Takeoff Item Operations ====================

  // Create takeoff item
  DatabaseService.prototype.createTakeoffItem = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO takeoff_items (id, takeoffId, materialId, measurementType, label, quantity, unit, unitCost, totalCost, measurementData, notes, createdAt)
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
    
    // Update takeoff total
    await this.recalculateTakeoffTotal(data.takeoffId);
    
    return await this.getTakeoffItem(id);
  };

  // Get single takeoff item
  DatabaseService.prototype.getTakeoffItem = async function(id) {
    const item = await this.get('SELECT * FROM takeoff_items WHERE id = ?', [id]);
    if (item && item.measurementData) {
      try { item.measurementData = JSON.parse(item.measurementData); } catch (e) {}
    }
    return item;
  };

  // Get all items for a takeoff
  DatabaseService.prototype.getTakeoffItems = async function(takeoffId) {
    const items = await this.all('SELECT * FROM takeoff_items WHERE takeoffId = ?', [takeoffId]);
    return items.map(item => {
      if (item.measurementData) {
        try { item.measurementData = JSON.parse(item.measurementData); } catch (e) {}
      }
      return item;
    });
  };

  // Update takeoff item
  DatabaseService.prototype.updateTakeoffItem = async function(id, data) {
    const existing = await this.getTakeoffItem(id);
    if (!existing) return null;
    
    await this.run(`
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
    `, [
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
    ]);
    
    // Recalculate takeoff total
    const item = await this.getTakeoffItem(id);
    await this.recalculateTakeoffTotal(item.takeoffId);
    
    return await this.getTakeoffItem(id);
  };

  // Delete takeoff item
  DatabaseService.prototype.deleteTakeoffItem = async function(id) {
    const item = await this.getTakeoffItem(id);
    if (!item) return false;
    
    const result = await this.run('DELETE FROM takeoff_items WHERE id = ?', [id]);
    
    // Recalculate takeoff total
    await this.recalculateTakeoffTotal(item.takeoffId);
    
    return result.changes > 0;
  };

  // Recalculate takeoff total from items
  DatabaseService.prototype.recalculateTakeoffTotal = async function(takeoffId) {
    const result = await this.get(`
      SELECT COALESCE(SUM(totalCost), 0) as total FROM takeoff_items WHERE takeoffId = ?
    `, [takeoffId]);
    
    await this.run('UPDATE takeoffs SET totalCost = ? WHERE id = ?', [result.total, takeoffId]);
  };

  // Generate takeoff summary
  DatabaseService.prototype.generateTakeoffSummary = async function(takeoffId) {
    const items = await this.getTakeoffItems(takeoffId);
    
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

  // Find material by name (fuzzy match)
  DatabaseService.prototype.findMaterialByName = async function(name) {
    if (!name) return null;
    
    // 1. Try exact match
    let material = await this.get('SELECT * FROM materials WHERE name = ?', [name]);
    if (material) return material;
    
    // 2. Try LIKE match
    material = await this.get('SELECT * FROM materials WHERE name LIKE ?', [`%${name}%`]);
    if (material) return material;
    
    // 3. Try partial word match
    const words = name.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      material = await this.get('SELECT * FROM materials WHERE name LIKE ?', [`%${words[0]}%`]);
    }
    
    return material;
  };

  // Convert AI analysis to Takeoff
  DatabaseService.prototype.convertAnalysisToTakeoff = async function(projectId, analysisId, userId) {
    const project = await this.get('SELECT * FROM vision_projects WHERE id = ?', [projectId]);
    const analysis = await this.get('SELECT * FROM vision_analyses WHERE id = ?', [analysisId]);
    
    if (!project || !analysis) throw new Error('Project or Analysis not found');
    
    const analysisData = JSON.parse(analysis.result || '{}');
    const scale = project.scale || 1.0; // Defaults to 1:1 if not set
    
    // Create new takeoff
    const takeoff = await this.createTakeoff({
      name: `${project.name} - AI Takeoff (${analysis.passType})`,
      blueprintId: projectId,
      status: 'draft',
      userId: userId
    });
    
    const items = [];
    
    if (analysisData.systems) {
      for (const system of analysisData.systems) {
        for (const region of (system.regions || [])) {
          let quantity = 1;
          let unit = 'EA';
          let measurementType = 'count';
          let measurementData = {};
          
          if (region.type === 'path' && region.points) {
            // Calculate linear distance
            let totalDist = 0;
            for (let i = 0; i < region.points.length - 1; i++) {
              const p1 = region.points[i];
              const p2 = region.points[i+1];
              // normalized distance * scale
              const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
              totalDist += dist;
            }
            // totalDist is normalized (0-1). We need real units.
            // If scale is pixels per foot, we need image dimensions.
            quantity = totalDist * scale;
            unit = 'LF';
            measurementType = 'length';
            measurementData = { points: region.points, normalizedDistance: totalDist };
          } else {
            // Point based (fixture)
            measurementData = { x: region.x, y: region.y };
          }
          
          // Match material
          const material = await this.findMaterialByName(region.label || region.type);
          
          const item = await this.createTakeoffItem({
            takeoffId: takeoff.id,
            materialId: material?.id || null,
            measurementType,
            label: region.label || region.type,
            quantity: Math.round(quantity * 100) / 100,
            unit: material?.unit || unit,
            unitCost: material?.unitCost || 0,
            totalCost: (Math.round(quantity * 100) / 100) * (material?.unitCost || 0),
            measurementData,
            notes: region.details || `AI Detected in ${analysis.passType} pass`
          });
          
          items.push(item);
        }
      }
    }
    
    return { ...takeoff, items };
  };
}

export default addTakeoffOperations;
