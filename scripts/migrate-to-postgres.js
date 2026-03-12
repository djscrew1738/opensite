#!/usr/bin/env node
/**
 * Database Migration Script: SQLite to PostgreSQL
 * 
 * Usage:
 *   export DATABASE_URL=postgres://user:pass@localhost:5432/opensite
 *   node scripts/migrate-to-postgres.js
 */

import { DatabaseService as SQLiteService } from '../backend/src/services/database/core.js';
import { DatabaseService as PostgresService } from '../backend/src/services/database/postgres-core.js';
import logger from '../backend/src/services/logger.js';
import { randomUUID } from 'crypto';

const BATCH_SIZE = 100;

class DatabaseMigrator {
  constructor() {
    this.sqlite = null;
    this.postgres = null;
    this.stats = {
      tables: {},
      errors: []
    };
  }

  async connect() {
    logger.info('Connecting to databases...');
    
    // Connect to SQLite
    this.sqlite = new SQLiteService();
    
    // Connect to PostgreSQL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable required');
    }
    
    this.postgres = new PostgresService();
    
    logger.info('Connected to both databases');
  }

  async migrate() {
    const startTime = Date.now();
    
    try {
      await this.connect();
      
      // Migrate in order of dependencies
      await this.migrateTable('users', this.migrateUsers.bind(this));
      await this.migrateTable('leads', this.migrateLeads.bind(this));
      await this.migrateTable('projects', this.migrateProjects.bind(this));
      await this.migrateTable('estimates', this.migrateEstimates.bind(this));
      await this.migrateTable('blueprints', this.migrateBlueprints.bind(this));
      await this.migrateTable('materials', this.migrateMaterials.bind(this));
      await this.migrateTable('permits', this.migratePermits.bind(this));
      await this.migrateTable('conversations', this.migrateConversations.bind(this));
      await this.migrateTable('schedules', this.migrateSchedules.bind(this));
      await this.migrateTable('service_areas', this.migrateServiceAreas.bind(this));
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      logger.info('Migration completed', { duration: `${duration}s`, stats: this.stats });
      
      this.printSummary();
      
    } catch (err) {
      logger.error('Migration failed:', err.message);
      throw err;
    } finally {
      await this.close();
    }
  }

  async migrateTable(name, migrationFn) {
    logger.info(`Migrating ${name}...`);
    try {
      const count = await migrationFn();
      this.stats.tables[name] = { status: 'success', count };
      logger.info(`✓ ${name}: ${count} rows migrated`);
    } catch (err) {
      this.stats.tables[name] = { status: 'error', error: err.message };
      this.stats.errors.push({ table: name, error: err.message });
      logger.error(`✗ ${name} failed:`, err.message);
    }
  }

  async migrateUsers() {
    const users = this.sqlite.db.prepare('SELECT * FROM users').all();
    
    for (const user of users) {
      await this.postgres.query(`
        INSERT INTO users (id, username, email, password_hash, role, is_active, last_login_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        user.id, user.username, user.email, user.passwordHash, 
        user.role, user.isActive === 1, user.lastLoginAt, user.createdAt, user.updatedAt
      ]);
    }
    
    return users.length;
  }

  async migrateLeads() {
    const leads = this.sqlite.db.prepare('SELECT * FROM leads').all();
    
    for (const lead of leads) {
      await this.postgres.query(`
        INSERT INTO leads (id, user_id, name, company, email, phone, location, project_type, value, score, status, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO NOTHING
      `, [
        lead.id, lead.userId, lead.name, lead.company, lead.email, 
        lead.phone, lead.location, lead.projectType, lead.value, 
        lead.score, lead.status, lead.notes, lead.createdAt, lead.updatedAt
      ]);
    }
    
    return leads.length;
  }

  async migrateProjects() {
    const projects = this.sqlite.db.prepare('SELECT * FROM projects').all();
    
    for (const project of projects) {
      await this.postgres.query(`
        INSERT INTO projects (id, user_id, name, lead_id, phase, progress, value, start_date, estimated_completion, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        project.id, project.userId, project.name, project.leadId,
        project.phase, project.progress, project.value, project.startDate,
        project.estimatedCompletion, project.status, project.createdAt, project.updatedAt
      ]);
    }
    
    return projects.length;
  }

  async migrateEstimates() {
    const estimates = this.sqlite.db.prepare('SELECT * FROM estimates').all();
    
    for (const est of estimates) {
      await this.postgres.query(`
        INSERT INTO estimates (
          id, user_id, lead_id, sqft, bathrooms, units, stories, 
          lavatories, bar_sinks, tubs, shower_bases, mud_pans,
          washing_machines, toilets, water_softener_preplumb, kitchen_faucets,
          total, per_unit, breakdown, margin, analysis, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO NOTHING
      `, [
        est.id, est.userId, est.leadId, est.sqft, est.bathrooms, est.units, est.stories,
        est.lavatories, est.barSinks, est.tubs, est.showerBases, est.mudPans,
        est.washingMachines, est.toilets, est.waterSoftenerPreplumb, est.kitchenFaucets,
        est.total, est.perUnit, est.breakdown, est.margin, est.analysis, est.createdAt
      ]);
    }
    
    return estimates.length;
  }

  async migrateBlueprints() {
    const blueprints = this.sqlite.db.prepare('SELECT * FROM blueprints').all();
    
    for (const bp of blueprints) {
      await this.postgres.query(`
        INSERT INTO blueprints (id, user_id, file_name, file_path, extracted_data, ai_analysis, estimate_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        bp.id, bp.userId, bp.fileName, bp.filePath, 
        bp.extractedData, bp.aiAnalysis, bp.estimateId, bp.createdAt
      ]);
    }
    
    return blueprints.length;
  }

  async migrateMaterials() {
    const materials = this.sqlite.db.prepare('SELECT * FROM materials').all();
    
    for (const mat of materials) {
      await this.postgres.query(`
        INSERT INTO materials (id, name, category, unit, unit_cost, supplier, part_number, description, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        mat.id, mat.name, mat.category, mat.unit, mat.unitCost,
        mat.supplier, mat.partNumber, mat.description, mat.notes,
        mat.createdAt, mat.updatedAt
      ]);
    }
    
    return materials.length;
  }

  async migratePermits() {
    const permits = this.sqlite.db.prepare('SELECT * FROM permits').all();
    
    for (const permit of permits) {
      await this.postgres.query(`
        INSERT INTO permits (id, permit_number, address, city, state, zip, contractor, contractor_phone, estimated_cost, issued_date, status, description, source_id, tier, lead_score, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        permit.id, permit.permitNumber, permit.address, permit.city, permit.state,
        permit.zip, permit.contractor, permit.contractorPhone, permit.estimatedCost,
        permit.issuedDate, permit.status, permit.description, permit.sourceId,
        permit.tier, permit.leadScore, permit.createdAt, permit.updatedAt
      ]);
    }
    
    return permits.length;
  }

  async migrateConversations() {
    const convs = this.sqlite.db.prepare('SELECT * FROM conversations').all();
    
    for (const conv of convs) {
      await this.postgres.query(`
        INSERT INTO conversations (id, user_id, messages, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [
        conv.id, conv.userId, conv.messages, conv.createdAt, conv.updatedAt
      ]);
    }
    
    return convs.length;
  }

  async migrateSchedules() {
    const schedules = this.sqlite.db.prepare('SELECT * FROM schedules').all();
    
    for (const sched of schedules) {
      await this.postgres.query(`
        INSERT INTO schedules (id, lead_id, user_id, type, title, description, scheduled_date, scheduled_time, duration_minutes, status, priority, notes, completed_at, completed_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING
      `, [
        sched.id, sched.lead_id, sched.user_id, sched.type, sched.title,
        sched.description, sched.scheduled_date, sched.scheduled_time,
        sched.duration_minutes, sched.status, sched.priority, sched.notes,
        sched.completed_at, sched.completed_by, sched.created_at, sched.updated_at
      ]);
    }
    
    return schedules.length;
  }

  async migrateServiceAreas() {
    const areas = this.sqlite.db.prepare('SELECT * FROM service_areas').all();
    
    for (const area of areas) {
      await this.postgres.query(`
        INSERT INTO service_areas (id, name, type, city, zipcode, county, state, center_lat, center_lng, radius_miles, priority, is_active, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [
        area.id, area.name, area.type, area.city, area.zipcode,
        area.county, area.state, area.center_lat, area.center_lng,
        area.radius_miles, area.priority, area.is_active === 1,
        area.notes, area.created_at, area.updated_at
      ]);
    }
    
    return areas.length;
  }

  printSummary() {
    console.log('\n========================================');
    console.log('  DATABASE MIGRATION SUMMARY');
    console.log('========================================\n');
    
    let totalMigrated = 0;
    let totalErrors = 0;
    
    for (const [table, info] of Object.entries(this.stats.tables)) {
      const status = info.status === 'success' ? '✓' : '✗';
      const count = info.count || 0;
      
      if (info.status === 'success') {
        totalMigrated += count;
        console.log(`  ${status} ${table}: ${count} rows`);
      } else {
        totalErrors++;
        console.log(`  ${status} ${table}: FAILED - ${info.error}`);
      }
    }
    
    console.log('\n----------------------------------------');
    console.log(`  Total migrated: ${totalMigrated} rows`);
    console.log(`  Errors: ${totalErrors} tables`);
    console.log('========================================\n');
    
    if (totalErrors > 0) {
      console.log('Errors encountered:');
      this.stats.errors.forEach(e => console.log(`  - ${e.table}: ${e.error}`));
      process.exit(1);
    }
  }

  async close() {
    if (this.postgres) {
      await this.postgres.close();
    }
    // SQLite closes automatically
  }
}

// Run migration
const migrator = new DatabaseMigrator();
migrator.migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
