// SQLite Database Service - Core Module
// Base DatabaseService class with initialization and schema creation

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate path from backend/src/services/database/core.js to tool/data
// backend/src/services/database/core.js -> backend/ -> opensite/ -> tool/
const TOOL_DIR = path.join(__dirname, '../../../../tool');
const DB_PATH = path.join(TOOL_DIR, 'data', 'opensite.db');

// Ensure directories exist
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

/**
 * Base Database Service class
 * Handles connection, initialization, and core utilities
 */
export class DatabaseService {
  constructor() {
    try {
      this.db = new Database(DB_PATH);
      // Performance pragmas — tuned for low memory
      this.db.pragma('busy_timeout = 5000');
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = -8000');     // 8MB page cache
      this.db.pragma('mmap_size = 67108864');   // 64MB mmap
      this.db.pragma('temp_store = MEMORY');
      this.db.pragma('wal_autocheckpoint = 1000');
      
      // Prepared statement cache for frequently used queries
      this._statementCache = new Map();
      this._statementCacheMaxSize = 100;
      
      this.initializeTables();
      logger.info('Database initialized successfully', { path: DB_PATH });
    } catch (error) {
      logger.error('Fatal: Database initialization failed', { 
        error: error.message, path: DB_PATH 
      });
      if (error.message.includes('SQLITE_CANTOPEN')) {
        throw new Error(`Cannot open database at ${DB_PATH}. Check permissions.`);
      }
      if (error.message.includes('SQLITE_CORRUPT')) {
        throw new Error(`Database corrupted. Restore from backup.`);
      }
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Get cached prepared statement or create new one
   * Improves performance for repeated queries
   */
  _getCachedStatement(sql) {
    // Simple LRU cache for prepared statements
    if (this._statementCache.has(sql)) {
      const stmt = this._statementCache.get(sql);
      // Move to end (most recently used)
      this._statementCache.delete(sql);
      this._statementCache.set(sql, stmt);
      return stmt;
    }
    
    // Create new statement
    const stmt = this.db.prepare(sql);
    
    // Evict oldest if at capacity
    if (this._statementCache.size >= this._statementCacheMaxSize) {
      const firstKey = this._statementCache.keys().next().value;
      const oldStmt = this._statementCache.get(firstKey);
      try { oldStmt.finalize(); } catch (e) { /* ignore */ }
      this._statementCache.delete(firstKey);
    }
    
    this._statementCache.set(sql, stmt);
    return stmt;
  }

  /**
   * Clear statement cache (useful after schema changes)
   */
  _clearStatementCache() {
    for (const [sql, stmt] of this._statementCache) {
      try { stmt.finalize(); } catch (e) { /* ignore */ }
    }
    this._statementCache.clear();
  }

  /**
   * Initialize all database tables
   * This is the central schema definition
   */
  initializeTables() {
    // Users table
    this.db.exec(`
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

    // Settings key/value store
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // QuickBooks table
    this.db.exec(`
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

    // Leads table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        userId TEXT,
        name TEXT NOT NULL,
        company TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        projectType TEXT,
        value REAL DEFAULT 0 CHECK (value >= 0),
        score INTEGER,
        status TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        userId TEXT,
        name TEXT NOT NULL,
        leadId TEXT,
        phase TEXT DEFAULT 'rough-in',
        progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        value REAL DEFAULT 0 CHECK (value >= 0),
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS estimates (
        id TEXT PRIMARY KEY,
        userId TEXT,
        leadId TEXT,
        sqft REAL CHECK (sqft >= 0),
        bathrooms REAL CHECK (bathrooms >= 0),
        units INTEGER CHECK (units >= 0),
        stories INTEGER CHECK (stories >= 0),
        lavatories INTEGER DEFAULT 0 CHECK (lavatories >= 0),
        barSinks INTEGER DEFAULT 0 CHECK (barSinks >= 0),
        tubs INTEGER DEFAULT 0 CHECK (tubs >= 0),
        showerBases INTEGER DEFAULT 0 CHECK (showerBases >= 0),
        mudPans INTEGER DEFAULT 0 CHECK (mudPans >= 0),
        washingMachines INTEGER DEFAULT 0 CHECK (washingMachines >= 0),
        toilets INTEGER DEFAULT 0 CHECK (toilets >= 0),
        waterSoftenerPreplumb INTEGER DEFAULT 0 CHECK (waterSoftenerPreplumb >= 0),
        kitchenFaucets INTEGER DEFAULT 0 CHECK (kitchenFaucets >= 0),
        total REAL CHECK (total >= 0),
        perUnit REAL CHECK (perUnit >= 0),
        breakdown TEXT,
        margin TEXT,
        analysis TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE SET NULL
      )
    `);

    // Conversations table
    this.db.exec(`
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
    this.db.exec(`
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL,
        unitCost REAL DEFAULT 0 CHECK (unitCost >= 0),
        supplier TEXT,
        partNumber TEXT,
        description TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Takeoffs table
    this.db.exec(`
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
        totalCost REAL DEFAULT 0 CHECK (totalCost >= 0),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (blueprintId) REFERENCES blueprints(id) ON DELETE SET NULL,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL
      )
    `);

    // Takeoff line items
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS takeoff_items (
        id TEXT PRIMARY KEY,
        takeoffId TEXT NOT NULL,
        materialId TEXT,
        measurementType TEXT NOT NULL,
        label TEXT,
        quantity REAL DEFAULT 0 CHECK (quantity >= 0),
        unit TEXT,
        unitCost REAL DEFAULT 0 CHECK (unitCost >= 0),
        totalCost REAL DEFAULT 0 CHECK (totalCost >= 0),
        measurementData TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (takeoffId) REFERENCES takeoffs(id) ON DELETE CASCADE,
        FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE SET NULL
      )
    `);

    // Price history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS price_history (
        id TEXT PRIMARY KEY,
        materialId TEXT NOT NULL,
        oldPrice REAL NOT NULL CHECK (oldPrice >= 0),
        newPrice REAL NOT NULL CHECK (newPrice >= 0),
        changedAt TEXT NOT NULL,
        FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE CASCADE
      )
    `);

    // Permits table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permits (
        id TEXT PRIMARY KEY,
        permitNumber TEXT,
        address TEXT,
        city TEXT,
        state TEXT DEFAULT 'TX',
        zip TEXT,
        contractor TEXT,
        contractorPhone TEXT,
        estimatedCost REAL DEFAULT 0 CHECK (estimatedCost >= 0),
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        config TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Discovery runs table
    this.db.exec(`
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
    this.db.exec(`
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
    this.db.exec(`
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

    // Email watcher accounts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_accounts (
        id TEXT PRIMARY KEY,
        email_address TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TEXT,
        isActive INTEGER DEFAULT 1,
        lastCheckedAt TEXT,
        lastError TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Email alert rules table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_alert_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        keywords TEXT NOT NULL,
        channels TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Vision tables (used in vision.js)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vision_projects (
        id TEXT PRIMARY KEY,
        userId TEXT,
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
        scale REAL, -- Pixels per foot or similar
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    this.db.exec(`
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

    this.db.exec(`
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
    this.db.exec(`
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
    this.db.exec(`
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS material_estimates (
        id TEXT PRIMARY KEY,
        estimate_id TEXT,
        material_id TEXT,
        quantity REAL NOT NULL CHECK (quantity >= 0),
        unit TEXT,
        unit_cost REAL CHECK (unit_cost >= 0),
        total_cost REAL CHECK (total_cost >= 0),
        tier TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
      )
    `);

    // Analysis Jobs table
    this.db.exec(`
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
      );

      -- Blueprint analysis results (AECVision + Floorplan + AI combined)
      CREATE TABLE IF NOT EXISTS blueprint_analysis (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        blueprint_id TEXT REFERENCES blueprints(id) ON DELETE SET NULL,
        job_id TEXT REFERENCES analysis_jobs(id) ON DELETE SET NULL,
        results TEXT NOT NULL, -- JSON: { fixtures, pipeEstimates, materialTakeoff, confidence }
        analyzed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1,
        metadata TEXT -- JSON: { source, processing_time_ms, services_used }
      );

      -- Blueprint analysis history (versioning)
      CREATE TABLE IF NOT EXISTS blueprint_analysis_history (
        id TEXT PRIMARY KEY,
        analysis_id TEXT REFERENCES blueprint_analysis(id) ON DELETE CASCADE,
        results TEXT NOT NULL,
        analyzed_at TEXT NOT NULL,
        version INTEGER NOT NULL,
        metadata TEXT
      );

      -- Material takeoff cache
      CREATE TABLE IF NOT EXISTS material_takeoff_cache (
        id TEXT PRIMARY KEY,
        analysis_id TEXT REFERENCES blueprint_analysis(id) ON DELETE CASCADE,
        takeoff_data TEXT NOT NULL, -- JSON: { items, total_cost, labor_hours }
        generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT,
        metadata TEXT
      )
    `);

    // DocVault: Text documents table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS text_documents (
        id TEXT PRIMARY KEY,
        userId TEXT,
        filename TEXT NOT NULL,
        originalName TEXT NOT NULL,
        mimeType TEXT,
        fileSize INTEGER,
        filePath TEXT,
        extractedText TEXT,
        summary TEXT,
        entities TEXT,
        pageCount INTEGER,
        wordCount INTEGER,
        status TEXT DEFAULT 'uploaded',
        errorMessage TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_text_documents_user ON text_documents(userId);
      CREATE INDEX IF NOT EXISTS idx_text_documents_status ON text_documents(status);
      CREATE INDEX IF NOT EXISTS idx_text_documents_created ON text_documents(createdAt DESC);
    `);

    // DocVault: Document chat messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_chat_messages (
        id TEXT PRIMARY KEY,
        documentId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Knowledge Base: Vector-enabled documentation storage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source_type TEXT NOT NULL, -- 'markdown', 'system', 'project'
        source_path TEXT,
        embedding TEXT, -- JSON array of floats
        metadata TEXT,  -- JSON object
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_kb_source_type ON knowledge_base(source_type);
      CREATE INDEX IF NOT EXISTS idx_kb_title ON knowledge_base(title);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_doc_chat_document ON document_chat_messages(documentId, createdAt);
    `);

    // Universal Upload: files table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        stored_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        pipeline_status TEXT NOT NULL DEFAULT 'pending',
        vision_project_id TEXT,
        docvault_id TEXT,
        uploaded_by TEXT,
        job_id TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Universal Upload: job_files junction table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_files (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        file_id TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(job_id, file_id)
      )
    `);

    // Schedules table (for follow-ups and tasks)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        lead_id TEXT,
        user_id TEXT,
        type TEXT NOT NULL CHECK(type IN ('follow_up', 'meeting', 'inspection', 'call', 'email')),
        title TEXT NOT NULL,
        description TEXT,
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT,
        duration_minutes INTEGER DEFAULT 30,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled', 'overdue')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        notes TEXT,
        completed_at TEXT,
        completed_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Schedule reminders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schedule_reminders (
        id TEXT PRIMARY KEY,
        schedule_id TEXT NOT NULL,
        reminder_type TEXT NOT NULL CHECK(reminder_type IN ('email', 'sms', 'push', 'in_app')),
        minutes_before INTEGER NOT NULL,
        sent_at TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
      )
    `);

    // Service areas table (for geographic scoring)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS service_areas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('radius', 'city', 'zipcode', 'county')),
        city TEXT,
        zipcode TEXT,
        county TEXT DEFAULT 'Tarrant',
        state TEXT DEFAULT 'TX',
        center_lat REAL,
        center_lng REAL,
        radius_miles REAL,
        priority INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // In-app notifications table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('info', 'warning', 'success', 'error', 'alert')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        entity_type TEXT,
        entity_id TEXT,
        read INTEGER DEFAULT 0,
        read_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Add new columns to materials if they don't exist
    this.safeAddColumn('vision_analyses', 'lastError', 'TEXT');
    this.safeAddColumn('vision_projects', 'lastAnalyzedAt', 'TEXT');
    this.safeAddColumn('materials', 'isFavorite', 'INTEGER DEFAULT 0');
    this.safeAddColumn('materials', 'usageCount', 'INTEGER DEFAULT 0');
    this.safeAddColumn('materials', 'lastUsedAt', 'TEXT');
    this.safeAddColumn('materials', 'markup', 'REAL DEFAULT 0');

    // Create indexes
    this.createIndexes();
    
    // Add constraints
    this.addConstraints();

    // Add userId to existing tables
    this.safeAddColumn('leads', 'userId', 'TEXT REFERENCES users(id) ON DELETE SET NULL');
    this.safeAddColumn('projects', 'userId', 'TEXT REFERENCES users(id) ON DELETE SET NULL');
    this.safeAddColumn('estimates', 'userId', 'TEXT REFERENCES users(id) ON DELETE SET NULL');
    this.safeAddColumn('takeoffs', 'userId', 'TEXT REFERENCES users(id) ON DELETE SET NULL');
    this.safeAddColumn('blueprints', 'userId', 'TEXT REFERENCES users(id) ON DELETE SET NULL');
    this.safeAddColumn('conversations', 'userId', 'TEXT REFERENCES users(id) ON DELETE SET NULL');
    
    // Initialize settings table (from settings.js mixin)
    if (this.initializeSettingsTable) {
      this.initializeSettingsTable();
    }
  }

  /**
   * Create database indexes for performance
   */
  createIndexes() {
    this.db.exec(`
      -- Leads indexes
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON leads(createdAt);
      
      -- Projects indexes
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_leadId ON projects(leadId);
      
      -- Estimates indexes
      CREATE INDEX IF NOT EXISTS idx_estimates_leadId ON estimates(leadId);
      CREATE INDEX IF NOT EXISTS idx_estimates_createdAt ON estimates(createdAt);
      
      -- Materials indexes
      CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
      CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
      
      -- Takeoff indexes
      CREATE INDEX IF NOT EXISTS idx_takeoffs_status ON takeoffs(status);
      CREATE INDEX IF NOT EXISTS idx_takeoffs_projectId ON takeoffs(projectId);
      CREATE INDEX IF NOT EXISTS idx_takeoff_items_takeoffId ON takeoff_items(takeoffId);
      
      -- Price history
      CREATE INDEX IF NOT EXISTS idx_price_history_materialId ON price_history(materialId);
      
      -- Blueprints
      CREATE INDEX IF NOT EXISTS idx_blueprints_estimateId ON blueprints(estimateId);
      
      -- Blueprint analysis
      CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_projectId ON blueprint_analysis(project_id);
      CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_blueprintId ON blueprint_analysis(blueprint_id);
      CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_jobId ON blueprint_analysis(job_id);
      CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_analyzedAt ON blueprint_analysis(analyzed_at);
      
      -- Blueprint analysis history
      CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_history_analysisId ON blueprint_analysis_history(analysis_id);
      
      -- Material takeoff cache
      CREATE INDEX IF NOT EXISTS idx_material_takeoff_cache_analysisId ON material_takeoff_cache(analysis_id);
      CREATE INDEX IF NOT EXISTS idx_material_takeoff_cache_expiresAt ON material_takeoff_cache(expires_at);
      
      -- Conversations
      CREATE INDEX IF NOT EXISTS idx_conversations_updatedAt ON conversations(updatedAt);
      
      -- Permits (only if table exists with columns)
      CREATE INDEX IF NOT EXISTS idx_permits_city ON permits(city);
      CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);
      CREATE INDEX IF NOT EXISTS idx_permits_issuedDate ON permits(issuedDate);
      
      -- Discovery (only if tables exist)
      CREATE INDEX IF NOT EXISTS idx_discovery_leads_runId ON discovery_leads(runId);
      
      -- Email alerts (only if table exists)
      CREATE INDEX IF NOT EXISTS idx_email_alerts_receivedAt ON email_alerts(receivedAt);

      -- Files indexes
      CREATE INDEX IF NOT EXISTS idx_files_job_id ON files(job_id);
      CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
      CREATE INDEX IF NOT EXISTS idx_files_pipeline_status ON files(pipeline_status);
      CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

      -- Job files indexes
      CREATE INDEX IF NOT EXISTS idx_job_files_job_id ON job_files(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_files_file_id ON job_files(file_id);

      -- Schedules indexes
      CREATE INDEX IF NOT EXISTS idx_schedules_lead_id ON schedules(lead_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
      CREATE INDEX IF NOT EXISTS idx_schedules_type ON schedules(type);
      CREATE INDEX IF NOT EXISTS idx_schedules_date_status ON schedules(scheduled_date, status);

      -- Schedule reminders indexes
      CREATE INDEX IF NOT EXISTS idx_schedule_reminders_schedule_id ON schedule_reminders(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_reminders_status ON schedule_reminders(status);

      -- Service areas indexes
      CREATE INDEX IF NOT EXISTS idx_service_areas_type ON service_areas(type);
      CREATE INDEX IF NOT EXISTS idx_service_areas_city ON service_areas(city);
      CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(is_active);

      -- Notifications indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);
    
    // Create conditional indexes separately to handle missing columns gracefully
    try {
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_permits_tier ON permits(tier)');
    } catch (e) {
      // Column may not exist in older databases
    }
    
    try {
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_discovery_leads_domainHash ON discovery_leads(domainHash)');
    } catch (e) {
      // Column may not exist
    }
    
    try {
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_email_alerts_messageId ON email_alerts(messageId)');
    } catch (e) {
      // Column may not exist
    }
  }

  /**
   * Add uniqueness constraints and foreign key updates
   * Run after table creation to ensure data integrity
   */
  addConstraints() {
    // SQLite doesn't support ALTER TABLE ADD CONSTRAINT for unique constraints
    // We create unique indexes instead
    this.db.exec(`
      -- Unique constraints (using unique indexes)
      CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique ON leads(email) WHERE email IS NOT NULL AND email != '';
      
      -- Note: For pricing_tiers unique constraint on tier identifier,
      -- add: CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_tiers_tier ON pricing_tiers(tier);
      -- when that table is created
    `);
  }

  /**
   * Helper to safely add a column if it doesn't exist
   */
  safeAddColumn(table, column, type) {
    try {
      const tableInfo = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(table);
      if (!tableInfo) return;
      
      const columns = this.db.prepare(`PRAGMA table_info(${table})`).all();
      const exists = columns.some(c => c.name === column);
      if (!exists) {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
        logger.info(`Added column ${column} to ${table}`);
      }
    } catch (error) {
      logger.error(`Failed to add column ${column} to ${table}`, { error: error.message });
      // Don't throw - allow initialization to continue
    }
  }

  /**
   * Close the database connection
   */
  close() {
    try {
      if (this.db && this.db.open) {
        this.db.close();
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database', { error: error.message });
    }
  }

  /**
   * Backup the database
   */
  backup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(TOOL_DIR, 'data', 'backups');
      const backupPath = path.join(backupDir, `opensite-backup-${timestamp}.db`);
      
      fs.mkdirSync(backupDir, { recursive: true });
      this.db.backup(backupPath);
      
      if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size === 0) {
        throw new Error('Backup file creation failed');
      }
      
      logger.info('Database backup created', { path: backupPath });
      return backupPath;
    } catch (error) {
      logger.error('Backup failed', { error: error.message });
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Remove backups older than maxAgeDays, keeping at least minKeep recent ones.
   */
  pruneBackups(maxAgeDays = 14, minKeep = 3) {
    const backupDir = path.join(TOOL_DIR, 'data', 'backups');
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('opensite-backup-') && f.endsWith('.db'))
      .sort()
      .reverse(); // newest first

    const cutoff = Date.now() - (maxAgeDays * 86400000);
    const removed = [];

    files.forEach((file, i) => {
      if (i < minKeep) return; // always keep minKeep newest
      const stat = fs.statSync(path.join(backupDir, file));
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(path.join(backupDir, file));
        removed.push(file);
      }
    });

    if (removed.length > 0) {
      logger.info(`Pruned ${removed.length} old backups`);
    }
    return removed;
  }

  /**
   * List existing backup files with size and age.
   */
  listBackups() {
    const backupDir = path.join(TOOL_DIR, 'data', 'backups');
    if (!fs.existsSync(backupDir)) return [];

    return fs.readdirSync(backupDir)
      .filter(f => f.startsWith('opensite-backup-') && f.endsWith('.db'))
      .map(file => {
        const stat = fs.statSync(path.join(backupDir, file));
        return {
          file,
          size: `${Math.round(stat.size / 1024)}KB`,
          created: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.created.localeCompare(a.created));
  }

  /**
   * Check if database connection is open
   */
  _checkConnection() {
    if (!this.db || !this.db.open) {
      throw new Error('Database connection is not open');
    }
  }

  /**
   * Classify database errors into user-friendly messages
   */
  _classifyError(error, sql) {
    const message = error.message || '';
    if (message.includes('UNIQUE constraint failed')) {
      const match = message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
      return new Error(`Duplicate entry in ${match?.[1] || 'record'}`);
    }
    if (message.includes('FOREIGN KEY constraint failed')) {
      return new Error('Referenced record does not exist');
    }
    if (message.includes('NOT NULL constraint failed')) {
      const match = message.match(/NOT NULL constraint failed: (\w+)\.(\w+)/);
      return new Error(`Required field missing: ${match?.[2] || 'field'}`);
    }
    return error;
  }

  /**
   * Execute a query that returns multiple rows
   * Uses prepared statement cache for better performance
   */
  async all(sql, params = []) {
    this._checkConnection();
    try {
      const stmt = this._getCachedStatement(sql);
      return stmt.all(...params);
    } catch (error) {
      logger.error('Query failed (all)', { sql: sql.substring(0, 200), error: error.message });
      throw this._classifyError(error, sql);
    }
  }

  /**
   * Execute a query that returns a single row
   * Uses prepared statement cache for better performance
   */
  async get(sql, params = []) {
    this._checkConnection();
    try {
      const stmt = this._getCachedStatement(sql);
      return stmt.get(...params);
    } catch (error) {
      logger.error('Query failed (get)', { sql: sql.substring(0, 200), error: error.message });
      throw this._classifyError(error, sql);
    }
  }

  /**
   * Execute a query that doesn't return rows (INSERT, UPDATE, DELETE)
   * Uses prepared statement cache for better performance
   */
  async run(sql, params = []) {
    this._checkConnection();
    try {
      const stmt = this._getCachedStatement(sql);
      return stmt.run(...params);
    } catch (error) {
      logger.error('Query failed (run)', { sql: sql.substring(0, 200), error: error.message });
      throw this._classifyError(error, sql);
    }
  }

  /**
   * Execute SQL directly (for backward compatibility)
   * @param {string} sql - SQL statement to execute
   */
  exec(sql) {
    return this.db.exec(sql);
  }

  /**
   * Universal query method (proxies to run or all)
   */
  async query(sql, params = []) {
    const isSelect = sql.trim().toLowerCase().startsWith('select');
    if (isSelect) {
      return this.all(sql, params);
    }
    return this.run(sql, params);
  }

  /**
   * Prepare a SQL statement (for backward compatibility)
   * @param {string} sql - SQL statement to prepare
   */
  prepare(sql) {
    return this.db.prepare(sql);
  }

  /**
   * Create a transaction (for backward compatibility)
   * @param {Function} fn - Function to wrap in a transaction
   */
  transaction(fn) {
    return this.db.transaction(fn);
  }
}

export default DatabaseService;
