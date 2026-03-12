// PostgreSQL Database Service - Core Module
// Implements the same interface as SQLite DatabaseService for seamless switching

import pg from 'pg';
import { randomUUID } from 'crypto';
import logger from '../logger.js';

const { Pool } = pg;

/**
 * PostgreSQL Database Service class
 * Mirrors the SQLite DatabaseService interface for drop-in replacement
 */
export class DatabaseService {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable required for PostgreSQL');
    }
    
    this.pool = new Pool({
      connectionString,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000, // 30 second global timeout
    });
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('PostgreSQL pool error:', err.message);
    });
    
    this.isPostgres = true;
    
    // Initialize
    this.initialize().catch(err => {
      logger.error('PostgreSQL initialization failed:', err.message);
      throw err;
    });
  }
  
  /**
   * Initialize database connection and schema
   */
  async initialize() {
    try {
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT version()');
      logger.info('PostgreSQL connected', { version: result.rows[0].version.split(' ')[1] });
      client.release();
      
      // Initialize tables
      await this.initializeTables();
      
      // Initialize materialized views
      await this.initializeMaterializedViews();
      
      logger.info('PostgreSQL database initialized successfully');
    } catch (error) {
      logger.error('PostgreSQL initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Get client from pool (for transactions)
   */
  async getClient() {
    return this.pool.connect();
  }
  
  /**
   * Execute a query
   */
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (err) {
      logger.error('PostgreSQL query failed:', err.message, { sql: sql.slice(0, 100) });
      throw err;
    }
  }
  
  /**
   * Execute a single row query
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }
  
  /**
   * Execute within a transaction
   */
  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  
  /**
   * Initialize all database tables
   */
  async initializeTables() {
    // Enable UUID extension
    await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Users table
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'viewer',
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Settings table
    await this.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Leads table
    await this.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        location VARCHAR(500),
        project_type VARCHAR(100),
        value DECIMAL(15,2) DEFAULT 0,
        score INTEGER,
        status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Projects table
    await this.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        phase VARCHAR(100) DEFAULT 'rough-in',
        progress INTEGER DEFAULT 0,
        value DECIMAL(15,2) DEFAULT 0,
        start_date DATE,
        estimated_completion DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Estimates table
    await this.query(`
      CREATE TABLE IF NOT EXISTS estimates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        sqft DECIMAL(10,2),
        bathrooms DECIMAL(5,2),
        units INTEGER,
        stories INTEGER,
        lavatories INTEGER DEFAULT 0,
        bar_sinks INTEGER DEFAULT 0,
        tubs INTEGER DEFAULT 0,
        shower_bases INTEGER DEFAULT 0,
        mud_pans INTEGER DEFAULT 0,
        washing_machines INTEGER DEFAULT 0,
        toilets INTEGER DEFAULT 0,
        water_softener_preplumb INTEGER DEFAULT 0,
        kitchen_faucets INTEGER DEFAULT 0,
        total DECIMAL(15,2),
        per_unit DECIMAL(15,2),
        breakdown JSONB,
        margin JSONB,
        analysis TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Conversations table
    await this.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Blueprints table
    await this.query(`
      CREATE TABLE IF NOT EXISTS blueprints (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        file_name VARCHAR(500) NOT NULL,
        file_path VARCHAR(1000),
        extracted_data JSONB,
        ai_analysis JSONB,
        estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Materials table
    await this.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        unit_cost DECIMAL(10,2) DEFAULT 0,
        supplier VARCHAR(255),
        part_number VARCHAR(100),
        description TEXT,
        notes TEXT,
        is_favorite BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMP,
        markup DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Permits table
    await this.query(`
      CREATE TABLE IF NOT EXISTS permits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        permit_number VARCHAR(100),
        address VARCHAR(500),
        city VARCHAR(100),
        state VARCHAR(10) DEFAULT 'TX',
        zip VARCHAR(20),
        contractor VARCHAR(255),
        contractor_phone VARCHAR(50),
        estimated_cost DECIMAL(15,2) DEFAULT 0,
        issued_date DATE,
        status VARCHAR(50) DEFAULT 'new',
        description TEXT,
        source_id VARCHAR(100),
        tier VARCHAR(50) DEFAULT 'unscored',
        lead_score INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Schedules table
    await this.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('follow_up', 'meeting', 'inspection', 'call', 'email')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME,
        duration_minutes INTEGER DEFAULT 30,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        notes TEXT,
        completed_at TIMESTAMP,
        completed_by UUID REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Service areas table
    await this.query(`
      CREATE TABLE IF NOT EXISTS service_areas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('radius', 'city', 'zipcode', 'county')),
        city VARCHAR(100),
        zipcode VARCHAR(20),
        county VARCHAR(100) DEFAULT 'Tarrant',
        state VARCHAR(10) DEFAULT 'TX',
        center_lat DECIMAL(10, 8),
        center_lng DECIMAL(11, 8),
        radius_miles DECIMAL(8, 2),
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Notifications table
    await this.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'alert')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        entity_type VARCHAR(100),
        entity_id UUID,
        read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await this.createIndexes();
    
    // Add constraints
    await this.addConstraints();
    
    logger.info('PostgreSQL tables initialized');
  }
  
  /**
   * Initialize Materialized Views for performance
   */
  async initializeMaterializedViews() {
    try {
      // Jobs per month statistics
      await this.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS jobs_per_month AS
        SELECT 
            DATE_TRUNC('month', created_at) AS month,
            COUNT(*) AS job_count,
            SUM(value) AS total_value,
            status
        FROM projects
        GROUP BY 1, status
        ORDER BY 1 DESC
      `);
      
      // Create unique index for concurrent refresh
      await this.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_per_month_unique 
        ON jobs_per_month(month, status)
      `);
      
      logger.info('PostgreSQL materialized views initialized');
    } catch (err) {
      logger.error('Failed to initialize materialized views:', err.message);
      // Don't fail the whole initialization if this fails
    }
  }

  /**
   * Refresh a materialized view
   */
  async refreshMaterializedView(name, concurrently = true) {
    try {
      // Concurently only works if there's a unique index
      const concurrentFlag = concurrently ? 'CONCURRENTLY' : '';
      await this.query(`REFRESH MATERIALIZED VIEW ${concurrentFlag} ${name}`);
      logger.info(`Materialized view ${name} refreshed`);
      return true;
    } catch (err) {
      logger.error(`Failed to refresh materialized view ${name}:`, err.message);
      return false;
    }
  }
  
  /**
   * Add database constraints (PostgreSQL version)
   */
  async addConstraints() {
    // Leads constraints
    await this.safeAddConstraint('leads', 'value_positive', 'CHECK (value >= 0)');
    
    // Projects constraints
    await this.safeAddConstraint('projects', 'value_positive', 'CHECK (value >= 0)');
    await this.safeAddConstraint('projects', 'progress_range', 'CHECK (progress BETWEEN 0 AND 100)');
    
    // Materials constraints
    await this.safeAddConstraint('materials', 'unit_cost_positive', 'CHECK (unit_cost >= 0)');
    await this.safeAddConstraint('materials', 'markup_positive', 'CHECK (markup >= 0)');
    
    // Estimates constraints
    await this.safeAddConstraint('estimates', 'total_positive', 'CHECK (total >= 0)');
    await this.safeAddConstraint('estimates', 'sqft_positive', 'CHECK (sqft >= 0)');
    
    // Permits constraints
    await this.safeAddConstraint('permits', 'estimated_cost_positive', 'CHECK (estimated_cost >= 0)');
  }

  /**
   * Helper to safely add a constraint if it doesn't exist
   */
  async safeAddConstraint(table, name, definition) {
    try {
      // PostgreSQL doesn't have ALTER TABLE ADD CONSTRAINT IF NOT EXISTS
      // We check for existence first
      const checkResult = await this.query(`
        SELECT 1 FROM pg_constraint 
        WHERE conname = $1 
        AND conrelid = $2::regclass
      `, [name, table]);

      if (checkResult.length === 0) {
        await this.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} ${definition}`);
        logger.info(`Added constraint ${name} to ${table}`);
      }
    } catch (err) {
      logger.warn(`Failed to add constraint ${name} to ${table}:`, err.message);
    }
  }

  /**
   * Create database indexes
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)',
      'CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_permits_city ON permits(city)',
      'CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status)',
      'CREATE INDEX IF NOT EXISTS idx_schedules_lead_id ON schedules(lead_id)',
      'CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date)',
      'CREATE INDEX IF NOT EXISTS idx_service_areas_type ON service_areas(type)',
      'CREATE INDEX IF NOT EXISTS idx_service_areas_city ON service_areas(city)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
    ];
    
    for (const sql of indexes) {
      try {
        await this.query(sql);
      } catch (err) {
        logger.warn('Failed to create index:', err.message);
      }
    }
  }
  
  /**
   * Safe column addition (PostgreSQL version)
   */
  async safeAddColumn(table, column, type) {
    try {
      await this.query(`
        ALTER TABLE ${table} 
        ADD COLUMN IF NOT EXISTS ${column} ${type}
      `);
    } catch (err) {
      logger.warn(`Failed to add column ${table}.${column}:`, err.message);
    }
  }
  
  /**
   * Close pool (for graceful shutdown)
   */
  async close() {
    await this.pool.end();
    logger.info('PostgreSQL pool closed');
  }
}

export default DatabaseService;
