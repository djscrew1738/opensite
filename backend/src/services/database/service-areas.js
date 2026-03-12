// Service Areas Database Operations
// Geographic service area management for permit scoring

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Add service area operations to DatabaseService prototype
 * @param {typeof import('./core.js').DatabaseService} DatabaseService 
 */
export default function addServiceAreaOperations(DatabaseService) {
  
  /**
   * Create a new service area
   */
  DatabaseService.prototype.createServiceArea = async function(area) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO service_areas (
          id, name, type, city, zipcode, county, state,
          center_lat, center_lng, radius_miles, priority,
          is_active, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        area.name,
        area.type,
        area.city || null,
        area.zipcode || null,
        area.county || 'Tarrant',
        area.state || 'TX',
        area.center_lat || null,
        area.center_lng || null,
        area.radius_miles || null,
        area.priority || 1,
        area.is_active !== false ? 1 : 0,
        area.notes || null,
        now,
        now
      ]);
      
      return await this.getServiceAreaById(id);
    } catch (error) {
      logger.error('Failed to create service area', { error: error.message });
      throw error;
    }
  };

  /**
   * Get service area by ID
   */
  DatabaseService.prototype.getServiceAreaById = async function(id) {
    try {
      const row = await this.get('SELECT * FROM service_areas WHERE id = ?', [id]);
      if (row) row.is_active = Boolean(row.is_active);
      return row;
    } catch (error) {
      return null;
    }
  };

  /**
   * Update service area
   */
  DatabaseService.prototype.updateServiceArea = async function(id, updates) {
    const allowedFields = [
      'name', 'type', 'city', 'zipcode', 'county', 'state',
      'center_lat', 'center_lng', 'radius_miles', 'priority',
      'is_active', 'notes'
    ];
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    }
    
    if (fields.length === 0) {
      return await this.getServiceAreaById(id);
    }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    try {
      const result = await this.run(`
        UPDATE service_areas SET ${fields.join(', ')} WHERE id = ?
      `, values);
      
      if (result.changes === 0) return null;
      return await this.getServiceAreaById(id);
    } catch (error) {
      logger.error(`Failed to update service area: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Delete service area
   */
  DatabaseService.prototype.deleteServiceArea = async function(id) {
    try {
      const result = await this.run('DELETE FROM service_areas WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      return false;
    }
  };

  /**
   * Get all service areas
   */
  DatabaseService.prototype.getAllServiceAreas = async function(options = {}) {
    const { activeOnly = true, type } = options;
    
    let sql = 'SELECT * FROM service_areas WHERE 1=1';
    const params = [];
    
    if (activeOnly) {
      sql += ' AND is_active = 1';
    }
    
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY priority DESC, name';
    
    try {
      const rows = await this.all(sql, params);
      return rows.map(r => ({ ...r, is_active: Boolean(r.is_active) }));
    } catch (error) {
      return [];
    }
  };

  /**
   * Get service areas by city
   */
  DatabaseService.prototype.getServiceAreasByCity = async function(city) {
    try {
      const rows = await this.all(`
        SELECT * FROM service_areas 
        WHERE city = ? AND is_active = 1
        ORDER BY priority DESC
      `, [city]);
      return rows.map(r => ({ ...r, is_active: true }));
    } catch (error) {
      return [];
    }
  };

  /**
   * Get service areas by zipcode
   */
  DatabaseService.prototype.getServiceAreasByZipcode = async function(zipcode) {
    try {
      const rows = await this.all(`
        SELECT * FROM service_areas 
        WHERE zipcode = ? AND is_active = 1
        ORDER BY priority DESC
      `, [zipcode]);
      return rows.map(r => ({ ...r, is_active: true }));
    } catch (error) {
      return [];
    }
  };

  /**
   * Seed default DFW service areas
   */
  DatabaseService.prototype.seedDefaultServiceAreas = async function() {
    try {
      const existing = await this.get('SELECT COUNT(*) as count FROM service_areas');
      if (existing.count > 0) {
        return { seeded: false, reason: 'Service areas already exist' };
      }

      const defaultAreas = [
        { name: 'Fort Worth Core', type: 'city', city: 'Fort Worth', priority: 10 },
        { name: 'Arlington Core', type: 'city', city: 'Arlington', priority: 10 },
        { name: 'Mansfield Area', type: 'city', city: 'Mansfield', priority: 8 },
        { name: 'Keller Area', type: 'city', city: 'Keller', priority: 8 },
        { name: 'Grapevine Area', type: 'city', city: 'Grapevine', priority: 7 },
        { name: 'Southlake Area', type: 'city', city: 'Southlake', priority: 7 },
        { name: 'North Richland Hills', type: 'city', city: 'North Richland Hills', priority: 7 },
        { name: 'Hurst/Euless/Bedford', type: 'city', city: 'Hurst', priority: 7 },
        { name: 'Grand Prairie', type: 'city', city: 'Grand Prairie', priority: 6 },
        { name: 'Colleyville', type: 'city', city: 'Colleyville', priority: 6 }
      ];

      const now = new Date().toISOString();
      
      for (const area of defaultAreas) {
        await this.run(`
          INSERT INTO service_areas (id, name, type, city, county, state, priority, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `, [uuidv4(), area.name, area.type, area.city, 'Tarrant', 'TX', area.priority, now, now]);
      }

      return { 
        seeded: true, 
        count: defaultAreas.length,
        areas: defaultAreas.map(a => a.city)
      };
    } catch (error) {
      logger.error('Seeding failed', { error: error.message });
      throw error;
    }
  };
}
