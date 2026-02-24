// Database Service - Core Module for PostgreSQL
// Base DatabaseService class for PostgreSQL using pg

import pg from 'pg';
import pkg from 'pg-pool';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Database Service class for PostgreSQL
 * Handles connection, initialization, and core utilities
 */
export class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    this.initializeTables();
  }

  /**
   * Convert SQLite style '?' placeholders to PostgreSQL style '$1', '$2', etc.
   */
  _convertSql(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  /**
   * Initialize all database tables
   * This matches the schema in core.js but adapted for PostgreSQL
   */
  async initializeTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          passwordHash TEXT NOT NULL,
          role TEXT DEFAULT 'viewer',
          isActive INTEGER DEFAULT 1,
          lastLoginAt TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // QuickBooks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS quickbooks_accounts (
          id TEXT PRIMARY KEY,
          realmId TEXT,
          accessToken TEXT,
          refreshToken TEXT,
          tokenExpiresAt TEXT,
          refreshExpiresAt TEXT,
          companyName TEXT,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Leads table
      await client.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          userId TEXT,
          name TEXT NOT NULL,
          company TEXT,
          email TEXT,
          phone TEXT,
          location TEXT,
          projectType TEXT,
          value REAL DEFAULT 0,
          score INTEGER,
          status TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Projects table
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          userId TEXT,
          name TEXT NOT NULL,
          leadId TEXT,
          phase TEXT DEFAULT 'rough-in',
          progress INTEGER DEFAULT 0,
          value REAL DEFAULT 0,
          startDate TEXT,
          estimatedCompletion TEXT,
          status TEXT DEFAULT 'active',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE SET NULL
        )
      `);

      // Estimates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS estimates (
          id TEXT PRIMARY KEY,
          userId TEXT,
          leadId TEXT,
          sqft REAL,
          bathrooms REAL,
          units INTEGER,
          stories INTEGER,
          lavatories INTEGER DEFAULT 0,
          barSinks INTEGER DEFAULT 0,
          tubs INTEGER DEFAULT 0,
          showerBases INTEGER DEFAULT 0,
          mudPans INTEGER DEFAULT 0,
          washingMachines INTEGER DEFAULT 0,
          toilets INTEGER DEFAULT 0,
          waterSoftenerPreplumb INTEGER DEFAULT 0,
          kitchenFaucets INTEGER DEFAULT 0,
          total REAL,
          perUnit REAL,
          breakdown TEXT,
          margin TEXT,
          analysis TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE SET NULL
        )
      `);

      // Conversations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          userId TEXT,
          messages TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Blueprints table
      await client.query(`
        CREATE TABLE IF NOT EXISTS blueprints (
          id TEXT PRIMARY KEY,
          userId TEXT,
          fileName TEXT NOT NULL,
          filePath TEXT,
          extractedData TEXT,
          aiAnalysis TEXT,
          estimateId TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (estimateId) REFERENCES estimates(id) ON DELETE SET NULL
        )
      `);

      // Materials catalog table
      await client.query(`
        CREATE TABLE IF NOT EXISTS materials (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          unit TEXT NOT NULL,
          unitCost REAL DEFAULT 0,
          supplier TEXT,
          partNumber TEXT,
          description TEXT,
          notes TEXT,
          isFavorite INTEGER DEFAULT 0,
          usageCount INTEGER DEFAULT 0,
          lastUsedAt TEXT,
          markup REAL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Takeoffs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS takeoffs (
          id TEXT PRIMARY KEY,
          userId TEXT,
          name TEXT NOT NULL,
          blueprintId TEXT,
          projectId TEXT,
          status TEXT DEFAULT 'draft',
          measurements TEXT,
          scale TEXT,
          canvasData TEXT,
          notes TEXT,
          totalCost REAL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (blueprintId) REFERENCES blueprints(id) ON DELETE SET NULL,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL
        )
      `);

      // Takeoff line items
      await client.query(`
        CREATE TABLE IF NOT EXISTS takeoff_items (
          id TEXT PRIMARY KEY,
          takeoffId TEXT NOT NULL,
          materialId TEXT,
          measurementType TEXT NOT NULL,
          label TEXT,
          quantity REAL DEFAULT 0,
          unit TEXT,
          unitCost REAL DEFAULT 0,
          totalCost REAL DEFAULT 0,
          measurementData TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (takeoffId) REFERENCES takeoffs(id) ON DELETE CASCADE,
          FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE SET NULL
        )
      `);

      // Price history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS price_history (
          id TEXT PRIMARY KEY,
          materialId TEXT NOT NULL,
          oldPrice REAL NOT NULL,
          newPrice REAL NOT NULL,
          changedAt TEXT NOT NULL,
          FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE CASCADE
        )
      `);

      // Permits table
      await client.query(`
        CREATE TABLE IF NOT EXISTS permits (
          id TEXT PRIMARY KEY,
          permitNumber TEXT,
          address TEXT,
          city TEXT,
          state TEXT DEFAULT 'TX',
          zip TEXT,
          contractor TEXT,
          contractorPhone TEXT,
          estimatedCost REAL DEFAULT 0,
          issuedDate TEXT,
          status TEXT DEFAULT 'new',
          description TEXT,
          sourceId TEXT,
          tier TEXT DEFAULT 'unscored',
          leadScore INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Data sources table
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_sources (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT,
          config TEXT,
          createdAt TEXT NOT NULL
        )
      `);

      // Discovery runs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS discovery_runs (
          id TEXT PRIMARY KEY,
          keyword TEXT,
          city TEXT,
          lat REAL,
          lng REAL,
          radius REAL,
          zone TEXT,
          totalFound INTEGER DEFAULT 0,
          enriched INTEGER DEFAULT 0,
          scored INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          stage TEXT DEFAULT 'pending',
          progress INTEGER DEFAULT 0,
          jobId TEXT,
          error TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Discovery leads table
      await client.query(`
        CREATE TABLE IF NOT EXISTS discovery_leads (
          id TEXT PRIMARY KEY,
          runId TEXT NOT NULL,
          businessName TEXT,
          address TEXT,
          website TEXT,
          phone TEXT,
          rating REAL,
          reviewCount INTEGER,
          category TEXT,
          placeId TEXT,
          domainHash TEXT,
          emails TEXT,
          extractedPhones TEXT,
          servicesOffered TEXT,
          aboutSummary TEXT,
          icpScore INTEGER DEFAULT 0,
          icpTier TEXT DEFAULT 'unscored',
          icpReasoning TEXT,
          plumbingRelevance INTEGER DEFAULT 0,
          outreachSubject TEXT,
          outreachBody TEXT,
          enrichmentStatus TEXT DEFAULT 'pending',
          createdAt TEXT NOT NULL,
          FOREIGN KEY (runId) REFERENCES discovery_runs(id) ON DELETE CASCADE
        )
      `);

      // Email alerts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_alerts (
          id TEXT PRIMARY KEY,
          messageId TEXT,
          fromAddress TEXT,
          fromName TEXT,
          subject TEXT,
          matchedKeywords TEXT,
          snippet TEXT,
          smsSent INTEGER DEFAULT 0,
          smsExternalId TEXT,
          receivedAt TEXT NOT NULL
        )
      `);

      // Canvas tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS canvas_workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          project_id TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          view_state TEXT
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS canvas_nodes (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          type TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL DEFAULT 200,
          height REAL DEFAULT 120,
          data TEXT NOT NULL,
          style TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS canvas_edges (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          source TEXT NOT NULL,
          target TEXT NOT NULL,
          label TEXT,
          type TEXT DEFAULT 'solid',
          data TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (source) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (target) REFERENCES canvas_nodes(id) ON DELETE CASCADE
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS canvas_findings (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          node_id TEXT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          position_x REAL,
          position_y REAL,
          resolved INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (node_id) REFERENCES canvas_nodes(id) ON DELETE SET NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS canvas_documents (
          id TEXT PRIMARY KEY,
          node_id TEXT NOT NULL,
          workspace_id TEXT NOT NULL,
          filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER,
          category TEXT,
          ocr_text TEXT,
          page_count INTEGER DEFAULT 1,
          thumbnail_path TEXT,
          ai_classification_confidence REAL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE
        )
      `);

      // Vision tables (used in vision.js)
      await client.query(`
        CREATE TABLE IF NOT EXISTS vision_projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          originalFile TEXT NOT NULL,
          fileType TEXT,
          width INTEGER,
          height INTEGER,
          tileDir TEXT,
          dziPath TEXT,
          pageCount INTEGER DEFAULT 1,
          currentPage INTEGER DEFAULT 1,
          metadata TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS vision_layers (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT,
          visible INTEGER DEFAULT 1,
          minZoom REAL,
          maxZoom REAL,
          data TEXT,
          style TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (projectId) REFERENCES vision_projects(id) ON DELETE CASCADE
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS vision_analyses (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          passType TEXT,
          model TEXT,
          result TEXT,
          status TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (projectId) REFERENCES vision_projects(id) ON DELETE CASCADE
        )
      `);

      // Fixtures table (Detected plumbing fixtures)
      await client.query(`
        CREATE TABLE IF NOT EXISTS fixtures (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          blueprint_id TEXT,
          type TEXT NOT NULL,
          x_coord REAL,
          y_coord REAL,
          page_number INTEGER DEFAULT 1,
          confidence REAL,
          metadata TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE
        )
      `);

      // Pipe Runs table (Estimated routing)
      await client.query(`
        CREATE TABLE IF NOT EXISTS pipe_runs (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          blueprint_id TEXT,
          material TEXT NOT NULL,
          diameter TEXT,
          length_ft REAL,
          start_fixture_id TEXT,
          end_fixture_id TEXT,
          system_type TEXT,
          code_compliance TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE,
          FOREIGN KEY (start_fixture_id) REFERENCES fixtures(id) ON DELETE SET NULL,
          FOREIGN KEY (end_fixture_id) REFERENCES fixtures(id) ON DELETE SET NULL
        )
      `);

      // Material Estimates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS material_estimates (
          id TEXT PRIMARY KEY,
          estimate_id TEXT,
          material_id TEXT,
          quantity REAL NOT NULL,
          unit TEXT,
          unit_cost REAL,
          total_cost REAL,
          tier TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
          FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
        )
      `);

      // Analysis Jobs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS analysis_jobs (
          id TEXT PRIMARY KEY,
          blueprint_id TEXT,
          job_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          progress INTEGER DEFAULT 0,
          result TEXT,
          error TEXT,
          started_at TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE
        )
      `);

      // Indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_projects_leadId ON projects(leadId)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_estimates_leadId ON estimates(leadId)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_nodes_workspace ON canvas_nodes(workspace_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_edges_workspace ON canvas_edges(workspace_id)');
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Error initializing PostgreSQL tables:', e);
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query that returns multiple rows
   */
  async all(sql, params = []) {
    const res = await this.pool.query(this._convertSql(sql), params);
    return res.rows;
  }

  /**
   * Execute a query that returns a single row
   */
  async get(sql, params = []) {
    const res = await this.pool.query(this._convertSql(sql), params);
    return res.rows[0] || null;
  }

  /**
   * Execute a query that doesn't return rows (INSERT, UPDATE, DELETE)
   */
  async run(sql, params = []) {
    const res = await this.pool.query(this._convertSql(sql), params);
    return {
      changes: res.rowCount,
      lastInsertRowid: null
    };
  }

  /**
   * Execute SQL directly
   */
  async query(sql, params = []) {
    const res = await this.pool.query(this._convertSql(sql), params);
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    if (isSelect) {
      return res.rows;
    }
    return {
      changes: res.rowCount,
      lastInsertRowid: null
    };
  }

  /**
   * Execute SQL directly (legacy)
   */
  async exec(sql) {
    return await this.pool.query(sql);
  }

  /**
   * Close the database connection
   */
  async close() {
    await this.pool.end();
  }
}

export default DatabaseService;
