// SQLite Database Service with Persistence
// All data stored in /tool/data folder

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const TOOL_DIR = path.join(process.cwd(), '../../tool');
const DB_PATH = path.join(TOOL_DIR, 'data', 'opensite.db');

// Ensure directories exist
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

class DatabaseService {
  constructor() {
    this.db = new Database(DB_PATH);
    // Performance pragmas
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');    // 64MB page cache
    this.db.pragma('mmap_size = 268435456');  // 256MB memory-mapped I/O
    this.db.pragma('temp_store = MEMORY');    // Keep temp tables in RAM
    this.db.pragma('wal_autocheckpoint = 1000');
    this.initializeTables();
  }

  initializeTables() {
    // Leads table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
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
        updatedAt TEXT NOT NULL
      )
    `);

    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
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
        FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE SET NULL
      )
    `);

    // Estimates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS estimates (
        id TEXT PRIMARY KEY,
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
        FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE SET NULL
      )
    `);

    // Conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        messages TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Blueprints table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS blueprints (
        id TEXT PRIMARY KEY,
        fileName TEXT NOT NULL,
        filePath TEXT,
        extractedData TEXT,
        aiAnalysis TEXT,
        estimateId TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (estimateId) REFERENCES estimates(id) ON DELETE SET NULL
      )
    `);

    // Materials catalog table - plumbing materials database
    this.db.exec(`
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
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Takeoffs table - material takeoff reports
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS takeoffs (
        id TEXT PRIMARY KEY,
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
        FOREIGN KEY (blueprintId) REFERENCES blueprints(id) ON DELETE SET NULL,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL
      )
    `);

    // Takeoff line items - individual items in a takeoff
    this.db.exec(`
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

    // Price history table - tracks material cost changes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS price_history (
        id TEXT PRIMARY KEY,
        materialId TEXT NOT NULL,
        oldPrice REAL NOT NULL,
        newPrice REAL NOT NULL,
        changedAt TEXT NOT NULL,
        FOREIGN KEY (materialId) REFERENCES materials(id) ON DELETE CASCADE
      )
    `);

    // Add new columns to materials if they don't exist
    this.safeAddColumn('materials', 'isFavorite', 'INTEGER DEFAULT 0');
    this.safeAddColumn('materials', 'usageCount', 'INTEGER DEFAULT 0');
    this.safeAddColumn('materials', 'lastUsedAt', 'TEXT');
    this.safeAddColumn('materials', 'markup', 'REAL DEFAULT 0');

    // Data sources for permit ingestion
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL,
        apiBaseUrl TEXT NOT NULL,
        datasetId TEXT,
        adapterType TEXT NOT NULL,
        fieldMapping TEXT DEFAULT '{}',
        isActive INTEGER DEFAULT 1,
        lastFetchAt TEXT,
        lastFetchCount INTEGER DEFAULT 0,
        fetchErrors INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Permits table - normalized permit data from all sources
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceId INTEGER,
        sourcePermitId TEXT,
        permitNumber TEXT,
        issuedDate TEXT,
        appliedDate TEXT,
        expiryDate TEXT,
        permitType TEXT,
        permitCategory TEXT,
        description TEXT,
        address TEXT,
        city TEXT,
        zipCode TEXT,
        county TEXT,
        contractorName TEXT,
        contractorLicense TEXT,
        applicantName TEXT,
        ownerName TEXT,
        estimatedCost REAL,
        squareFootage INTEGER,
        stories INTEGER,
        units INTEGER,
        workType TEXT,
        occupancyType TEXT,
        latitude REAL,
        longitude REAL,
        leadScore INTEGER DEFAULT 0,
        leadTier TEXT DEFAULT 'unscored',
        leadStatus TEXT DEFAULT 'new',
        leadNotes TEXT,
        contactedAt TEXT,
        quotedAt TEXT,
        wonAt TEXT,
        aiClassification TEXT,
        aiScoredAt TEXT,
        rawData TEXT,
        fingerprint TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (sourceId) REFERENCES data_sources(id),
        UNIQUE(sourceId, sourcePermitId)
      )
    `);

    // Builders/contractors table with intelligence
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS builders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        company TEXT,
        normalizedName TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        licenseNumber TEXT,
        totalPermits INTEGER DEFAULT 0,
        permitsLast30d INTEGER DEFAULT 0,
        permitsLast90d INTEGER DEFAULT 0,
        avgProjectCost REAL,
        primaryZipCodes TEXT,
        projectTypes TEXT,
        firstPermitDate TEXT,
        lastPermitDate TEXT,
        activityTrend TEXT,
        hasPlumber INTEGER DEFAULT 0,
        knownPlumber TEXT,
        plumberConfidence REAL,
        relationshipStatus TEXT DEFAULT 'unknown',
        relationshipNotes TEXT,
        priorityRank INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Many-to-many: permits ↔ builders
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permit_builder_map (
        permitId INTEGER NOT NULL,
        builderId INTEGER NOT NULL,
        role TEXT NOT NULL,
        PRIMARY KEY (permitId, builderId, role),
        FOREIGN KEY (permitId) REFERENCES permits(id) ON DELETE CASCADE,
        FOREIGN KEY (builderId) REFERENCES builders(id) ON DELETE CASCADE
      )
    `);

    // Permit notifications log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permit_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        permitId INTEGER,
        channel TEXT NOT NULL,
        recipient TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending',
        externalId TEXT,
        errorMessage TEXT,
        sentAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (permitId) REFERENCES permits(id)
      )
    `);

    // Builder contact log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS builder_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        builderId INTEGER NOT NULL,
        contactType TEXT,
        notes TEXT,
        outcome TEXT,
        followUpDate TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (builderId) REFERENCES builders(id) ON DELETE CASCADE
      )
    `);

    // Proposals (optional for future)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        permitId INTEGER,
        builderId INTEGER,
        proposalNumber TEXT,
        tier TEXT DEFAULT 'production',
        totalAmount REAL,
        fixtureConfig TEXT,
        pdfPath TEXT,
        status TEXT DEFAULT 'draft',
        sentAt TEXT,
        respondedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (permitId) REFERENCES permits(id),
        FOREIGN KEY (builderId) REFERENCES builders(id)
      )
    `);

    // Discovery runs table - tracks each pipeline execution
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS discovery_runs (
        id TEXT PRIMARY KEY,
        keyword TEXT NOT NULL,
        city TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        stage TEXT DEFAULT 'queued',
        progress INTEGER DEFAULT 0,
        totalFound INTEGER DEFAULT 0,
        enriched INTEGER DEFAULT 0,
        scored INTEGER DEFAULT 0,
        jobId TEXT,
        error TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Discovery leads table - consolidated with progressive enrichment
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
        emails TEXT DEFAULT '[]',
        extractedPhones TEXT DEFAULT '[]',
        servicesOffered TEXT DEFAULT '[]',
        aboutSummary TEXT,
        enrichmentStatus TEXT DEFAULT 'pending',
        icpScore INTEGER DEFAULT 0,
        icpTier TEXT DEFAULT 'unscored',
        icpReasoning TEXT,
        plumbingRelevance REAL DEFAULT 0,
        outreachSubject TEXT,
        outreachBody TEXT,
        contactStatus TEXT DEFAULT 'new',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (runId) REFERENCES discovery_runs(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_estimates_leadId ON estimates(leadId);
      CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
      CREATE INDEX IF NOT EXISTS idx_materials_favorite ON materials(isFavorite);
      CREATE INDEX IF NOT EXISTS idx_materials_usage ON materials(usageCount);
      CREATE INDEX IF NOT EXISTS idx_materials_supplier ON materials(supplier);
      CREATE INDEX IF NOT EXISTS idx_takeoffs_status ON takeoffs(status);
      CREATE INDEX IF NOT EXISTS idx_takeoff_items_takeoffId ON takeoff_items(takeoffId);
      CREATE INDEX IF NOT EXISTS idx_price_history_materialId ON price_history(materialId);

      -- Permit indexes
      CREATE INDEX IF NOT EXISTS idx_permits_issued_date ON permits(issuedDate);
      CREATE INDEX IF NOT EXISTS idx_permits_lead_score ON permits(leadScore DESC);
      CREATE INDEX IF NOT EXISTS idx_permits_lead_status ON permits(leadStatus);
      CREATE INDEX IF NOT EXISTS idx_permits_lead_tier ON permits(leadTier);
      CREATE INDEX IF NOT EXISTS idx_permits_permit_type ON permits(permitType);
      CREATE INDEX IF NOT EXISTS idx_permits_zip_code ON permits(zipCode);
      CREATE INDEX IF NOT EXISTS idx_permits_contractor ON permits(contractorName);
      CREATE INDEX IF NOT EXISTS idx_permits_fingerprint ON permits(fingerprint);
      CREATE INDEX IF NOT EXISTS idx_permits_lat_lng ON permits(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_builders_normalized_name ON builders(normalizedName);
      CREATE INDEX IF NOT EXISTS idx_builders_company ON builders(company);
      CREATE INDEX IF NOT EXISTS idx_builders_activity ON builders(activityTrend);
      CREATE INDEX IF NOT EXISTS idx_builders_relationship ON builders(relationshipStatus);
      CREATE INDEX IF NOT EXISTS idx_permit_notifications_status ON permit_notifications(status);
      CREATE INDEX IF NOT EXISTS idx_permit_notifications_permit ON permit_notifications(permitId);

      -- Discovery indexes
      CREATE INDEX IF NOT EXISTS idx_discovery_runs_status ON discovery_runs(status);
      CREATE INDEX IF NOT EXISTS idx_discovery_leads_runId ON discovery_leads(runId);
      CREATE INDEX IF NOT EXISTS idx_discovery_leads_icpScore ON discovery_leads(icpScore DESC);
      CREATE INDEX IF NOT EXISTS idx_discovery_leads_icpTier ON discovery_leads(icpTier);
      CREATE INDEX IF NOT EXISTS idx_discovery_leads_contactStatus ON discovery_leads(contactStatus);
      CREATE INDEX IF NOT EXISTS idx_discovery_leads_domainHash ON discovery_leads(domainHash);
    `);

    // Add zone columns to discovery_runs if missing
    this.safeAddColumn('discovery_runs', 'lat', 'REAL');
    this.safeAddColumn('discovery_runs', 'lng', 'REAL');
    this.safeAddColumn('discovery_runs', 'radius', 'INTEGER');
    this.safeAddColumn('discovery_runs', 'zone', 'TEXT');

    // Settings table - key-value pairs for app configuration
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Seed default plumbing materials if empty
    this.seedDefaultMaterials();

    // Seed default data sources if empty
    this.seedDefaultDataSources();

    // Seed default settings if empty
    this.seedDefaultSettings();

    // Ensure google_places_api_key exists for existing DBs
    if (!this.getSetting('google_places_api_key')) {
      this.setSetting('google_places_api_key', process.env.GOOGLE_PLACES_API_KEY || '');
    }

    console.log('Database tables initialized');
  }

  // Lead operations
  createLead(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO leads (id, name, company, email, phone, location, projectType, value, score, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.company || '',
      data.email || '',
      data.phone || '',
      data.location || '',
      data.projectType || '',
      data.value || 0,
      data.score || null,
      data.status || null,
      data.notes || '',
      now,
      now
    );

    return this.getLead(id);
  }

  getLead(id) {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE id = ?');
    return stmt.get(id);
  }

  getAllLeads(filters = {}) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR company LIKE ? OR location LIKE ?)';
      const search = `%${filters.search}%`;
      params.push(search, search, search);
    }

    query += ' ORDER BY updatedAt DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  updateLead(id, data) {
    const lead = this.getLead(id);
    if (!lead) return null;

    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = this.db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.getLead(id);
  }

  deleteLead(id) {
    const stmt = this.db.prepare('DELETE FROM leads WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Project operations
  createProject(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, leadId, phase, progress, value, startDate, estimatedCompletion, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.leadId || null,
      data.phase || 'rough-in',
      data.progress || 0,
      data.value || 0,
      data.startDate || now,
      data.estimatedCompletion || null,
      data.status || 'active',
      now,
      now
    );

    return this.getProject(id);
  }

  getProject(id) {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id);
  }

  getAllProjects() {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC');
    return stmt.all();
  }

  updateProject(id, data) {
    const project = this.getProject(id);
    if (!project) return null;

    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = this.db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return this.getProject(id);
  }

  // Estimate operations
  createEstimate(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO estimates (
        id, leadId, sqft, bathrooms, units, stories,
        lavatories, barSinks, tubs, showerBases, mudPans,
        washingMachines, toilets, waterSoftenerPreplumb, kitchenFaucets,
        total, perUnit, breakdown, margin, analysis, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.leadId || null,
      data.sqft,
      data.bathrooms,
      data.units,
      data.stories,
      data.lavatories || 0,
      data.barSinks || 0,
      data.tubs || 0,
      data.showerBases || 0,
      data.mudPans || 0,
      data.washingMachines || 0,
      data.toilets || 0,
      data.waterSoftenerPreplumb || 0,
      data.kitchenFaucets || 0,
      data.total,
      data.perUnit,
      JSON.stringify(data.breakdown),
      data.margin,
      data.analysis || null,
      now
    );

    return this.getEstimate(id);
  }

  getEstimate(id) {
    const stmt = this.db.prepare('SELECT * FROM estimates WHERE id = ?');
    const estimate = stmt.get(id);
    if (estimate && estimate.breakdown) {
      estimate.breakdown = JSON.parse(estimate.breakdown);
    }
    return estimate;
  }

  // Conversation operations
  createConversation(data) {
    const id = data.conversationId || uuidv4();
    const existing = this.getConversation(id);
    const now = new Date().toISOString();

    if (existing) {
      const messages = JSON.parse(existing.messages);
      messages.push({
        role: data.role,
        content: data.content,
        timestamp: now
      });

      const stmt = this.db.prepare('UPDATE conversations SET messages = ?, updatedAt = ? WHERE id = ?');
      stmt.run(JSON.stringify(messages), now, id);
    } else {
      const messages = [{
        role: data.role,
        content: data.content,
        timestamp: now
      }];

      const stmt = this.db.prepare('INSERT INTO conversations (id, messages, createdAt, updatedAt) VALUES (?, ?, ?, ?)');
      stmt.run(id, JSON.stringify(messages), now, now);
    }

    return this.getConversation(id);
  }

  getConversation(id) {
    const stmt = this.db.prepare('SELECT * FROM conversations WHERE id = ?');
    const conv = stmt.get(id);
    if (conv && conv.messages) {
      conv.messages = JSON.parse(conv.messages);
    }
    return conv;
  }

  // History operations
  getAllConversations(search) {
    let query = 'SELECT * FROM conversations';
    const params = [];
    if (search) {
      query += ' WHERE messages LIKE ?';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY updatedAt DESC';
    const rows = this.db.prepare(query).all(...params);
    return rows.map(row => {
      row.messages = JSON.parse(row.messages);
      return row;
    });
  }

  deleteConversation(id) {
    return this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id).changes > 0;
  }

  getAllEstimates(search) {
    let query = `
      SELECT e.*, GROUP_CONCAT(b.fileName) as blueprintFileNames
      FROM estimates e
      LEFT JOIN blueprints b ON b.estimateId = e.id
    `;
    const params = [];
    if (search) {
      query += ' WHERE e.breakdown LIKE ? OR e.analysis LIKE ? OR b.fileName LIKE ?';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ' GROUP BY e.id ORDER BY e.createdAt DESC';
    const rows = this.db.prepare(query).all(...params);
    return rows.map(row => {
      if (row.breakdown) row.breakdown = JSON.parse(row.breakdown);
      return row;
    });
  }

  deleteEstimate(id) {
    this.db.prepare('UPDATE blueprints SET estimateId = NULL WHERE estimateId = ?').run(id);
    return this.db.prepare('DELETE FROM estimates WHERE id = ?').run(id).changes > 0;
  }

  // Dashboard stats
  getDashboardStats() {
    const hotLeads = this.db.prepare(`
      SELECT * FROM leads WHERE status = 'hot' ORDER BY score DESC LIMIT 3
    `).all();

    const pipelineValue = this.db.prepare(`
      SELECT SUM(value) as total FROM leads WHERE status = 'hot'
    `).get();

    const activeProjects = this.db.prepare(`
      SELECT * FROM projects WHERE status = 'active' ORDER BY updatedAt DESC
    `).all();

    const totalLeads = this.db.prepare('SELECT COUNT(*) as count FROM leads').get();

    return {
      pipelineValue: pipelineValue.total || 0,
      activeProjectsCount: activeProjects.length,
      activeProjects,
      hotLeadsCount: hotLeads.length,
      hotLeads,
      totalLeads: totalLeads.count
    };
  }

  // Blueprint operations
  createBlueprint(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO blueprints (id, fileName, filePath, extractedData, aiAnalysis, estimateId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.fileName,
      data.filePath || null,
      JSON.stringify(data.extractedData || {}),
      data.aiAnalysis || null,
      data.estimateId || null,
      now
    );

    return this.getBlueprint(id);
  }

  getBlueprint(id) {
    const stmt = this.db.prepare('SELECT * FROM blueprints WHERE id = ?');
    const blueprint = stmt.get(id);
    if (blueprint && blueprint.extractedData) {
      blueprint.extractedData = JSON.parse(blueprint.extractedData);
    }
    return blueprint;
  }

  // Helper to safely add a column if it doesn't exist
  safeAddColumn(table, column, type) {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = columns.some(c => c.name === column);
    if (!exists) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`Added column ${column} to ${table}`);
    }
  }

  // ==================== Material Operations ====================

  seedDefaultMaterials() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM materials').get();
    if (count.count > 0) return;

    const now = new Date().toISOString();
    const defaults = [
      // Pipe & Fittings
      { name: '1/2" PEX Pipe (per ft)', category: 'pipe', unit: 'ft', unitCost: 0.55, supplier: 'Ferguson' },
      { name: '3/4" PEX Pipe (per ft)', category: 'pipe', unit: 'ft', unitCost: 0.85, supplier: 'Ferguson' },
      { name: '1" PEX Pipe (per ft)', category: 'pipe', unit: 'ft', unitCost: 1.25, supplier: 'Ferguson' },
      { name: '1-1/2" PVC DWV (per ft)', category: 'pipe', unit: 'ft', unitCost: 1.45, supplier: 'Ferguson' },
      { name: '2" PVC DWV (per ft)', category: 'pipe', unit: 'ft', unitCost: 2.10, supplier: 'Ferguson' },
      { name: '3" PVC DWV (per ft)', category: 'pipe', unit: 'ft', unitCost: 3.75, supplier: 'Ferguson' },
      { name: '4" PVC DWV (per ft)', category: 'pipe', unit: 'ft', unitCost: 5.20, supplier: 'Ferguson' },
      { name: '3/4" Copper Type L (per ft)', category: 'pipe', unit: 'ft', unitCost: 4.50, supplier: 'Ferguson' },
      // Fittings
      { name: '1/2" PEX Elbow', category: 'fittings', unit: 'ea', unitCost: 1.85, supplier: 'Ferguson' },
      { name: '3/4" PEX Elbow', category: 'fittings', unit: 'ea', unitCost: 2.45, supplier: 'Ferguson' },
      { name: '1/2" PEX Tee', category: 'fittings', unit: 'ea', unitCost: 2.15, supplier: 'Ferguson' },
      { name: '3/4" x 1/2" PEX Reducer', category: 'fittings', unit: 'ea', unitCost: 2.85, supplier: 'Ferguson' },
      { name: '2" PVC 90 Elbow', category: 'fittings', unit: 'ea', unitCost: 1.95, supplier: 'Ferguson' },
      { name: '3" PVC 90 Elbow', category: 'fittings', unit: 'ea', unitCost: 3.50, supplier: 'Ferguson' },
      { name: '3" PVC Wye', category: 'fittings', unit: 'ea', unitCost: 5.25, supplier: 'Ferguson' },
      { name: '4" x 3" PVC Reducer', category: 'fittings', unit: 'ea', unitCost: 4.75, supplier: 'Ferguson' },
      // Fixtures
      { name: 'Standard Toilet (floor mount)', category: 'fixtures', unit: 'ea', unitCost: 185.00, supplier: 'Ferguson' },
      { name: 'Lavatory Sink (drop-in)', category: 'fixtures', unit: 'ea', unitCost: 95.00, supplier: 'Ferguson' },
      { name: 'Kitchen Sink (SS double)', category: 'fixtures', unit: 'ea', unitCost: 165.00, supplier: 'Ferguson' },
      { name: 'Bathtub (standard)', category: 'fixtures', unit: 'ea', unitCost: 275.00, supplier: 'Ferguson' },
      { name: 'Shower Base (36x36)', category: 'fixtures', unit: 'ea', unitCost: 195.00, supplier: 'Ferguson' },
      { name: 'Bar Sink', category: 'fixtures', unit: 'ea', unitCost: 125.00, supplier: 'Ferguson' },
      { name: 'Washing Machine Box', category: 'fixtures', unit: 'ea', unitCost: 45.00, supplier: 'Ferguson' },
      { name: 'Water Softener Loop', category: 'fixtures', unit: 'ea', unitCost: 35.00, supplier: 'Ferguson' },
      // Valves
      { name: '1/2" Ball Valve', category: 'valves', unit: 'ea', unitCost: 8.50, supplier: 'Ferguson' },
      { name: '3/4" Ball Valve', category: 'valves', unit: 'ea', unitCost: 12.75, supplier: 'Ferguson' },
      { name: '1" Ball Valve', category: 'valves', unit: 'ea', unitCost: 18.50, supplier: 'Ferguson' },
      { name: 'Pressure Reducing Valve', category: 'valves', unit: 'ea', unitCost: 45.00, supplier: 'Ferguson' },
      { name: 'Check Valve 3/4"', category: 'valves', unit: 'ea', unitCost: 15.00, supplier: 'Ferguson' },
      // Water Heaters
      { name: '40 Gal Gas Water Heater', category: 'water_heater', unit: 'ea', unitCost: 485.00, supplier: 'Ferguson' },
      { name: '50 Gal Gas Water Heater', category: 'water_heater', unit: 'ea', unitCost: 575.00, supplier: 'Ferguson' },
      { name: 'Tankless Gas Water Heater', category: 'water_heater', unit: 'ea', unitCost: 1250.00, supplier: 'Ferguson' },
      // Gas
      { name: '1/2" Black Iron Pipe (per ft)', category: 'gas', unit: 'ft', unitCost: 2.85, supplier: 'Ferguson' },
      { name: '3/4" Black Iron Pipe (per ft)', category: 'gas', unit: 'ft', unitCost: 3.95, supplier: 'Ferguson' },
      { name: '1/2" Gas Flex Connector', category: 'gas', unit: 'ea', unitCost: 18.50, supplier: 'Ferguson' },
      { name: 'Gas Shutoff Valve 1/2"', category: 'gas', unit: 'ea', unitCost: 12.00, supplier: 'Ferguson' },
      // Misc
      { name: 'Pipe Hanger / Strap', category: 'misc', unit: 'ea', unitCost: 0.75, supplier: 'Ferguson' },
      { name: 'Teflon Tape', category: 'misc', unit: 'ea', unitCost: 1.50, supplier: 'Ferguson' },
      { name: 'PVC Cement + Primer', category: 'misc', unit: 'ea', unitCost: 12.00, supplier: 'Ferguson' },
      { name: 'Copper Solder + Flux', category: 'misc', unit: 'ea', unitCost: 15.00, supplier: 'Ferguson' },
    ];

    const stmt = this.db.prepare(`
      INSERT INTO materials (id, name, category, unit, unitCost, supplier, partNumber, description, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        stmt.run(
          uuidv4(), item.name, item.category, item.unit, item.unitCost,
          item.supplier || '', '', '', '', now, now
        );
      }
    });

    insertMany(defaults);
    console.log(`Seeded ${defaults.length} default plumbing materials`);
  }

  createMaterial(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO materials (id, name, category, unit, unitCost, supplier, partNumber, description, notes, markup, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.name, data.category, data.unit, data.unitCost || 0,
      data.supplier || '', data.partNumber || '', data.description || '', data.notes || '',
      data.markup || 0, now, now);
    return this.getMaterial(id);
  }

  getMaterial(id) {
    return this.db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
  }

  getAllMaterials(filters = {}) {
    let query = 'SELECT * FROM materials WHERE 1=1';
    const params = [];
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.search) {
      query += ' AND (name LIKE ? OR supplier LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s);
    }
    query += ' ORDER BY category, name';
    return this.db.prepare(query).all(...params);
  }

  updateMaterial(id, data) {
    const existing = this.getMaterial(id);
    if (!existing) return null;

    // Track price changes
    if (data.unitCost !== undefined && Number(data.unitCost) !== existing.unitCost) {
      this.logPriceChange(id, existing.unitCost, Number(data.unitCost));
    }

    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(val);
      }
    }
    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);
    this.db.prepare(`UPDATE materials SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return this.getMaterial(id);
  }

  deleteMaterial(id) {
    return this.db.prepare('DELETE FROM materials WHERE id = ?').run(id).changes > 0;
  }

  getMaterialCategories() {
    return this.db.prepare('SELECT DISTINCT category FROM materials ORDER BY category').all()
      .map(r => r.category);
  }

  // Get unique suppliers from materials
  getMaterialSuppliers() {
    return this.db.prepare(
      "SELECT DISTINCT supplier FROM materials WHERE supplier != '' AND supplier IS NOT NULL ORDER BY supplier"
    ).all().map(r => r.supplier);
  }

  // Toggle favorite status
  toggleMaterialFavorite(id) {
    const material = this.getMaterial(id);
    if (!material) return null;
    const newVal = material.isFavorite ? 0 : 1;
    this.db.prepare('UPDATE materials SET isFavorite = ?, updatedAt = ? WHERE id = ?')
      .run(newVal, new Date().toISOString(), id);
    return this.getMaterial(id);
  }

  // Get favorite materials
  getFavoriteMaterials() {
    return this.db.prepare('SELECT * FROM materials WHERE isFavorite = 1 ORDER BY name').all();
  }

  // Get recently used materials
  getRecentlyUsedMaterials(limit = 10) {
    return this.db.prepare(
      'SELECT * FROM materials WHERE lastUsedAt IS NOT NULL ORDER BY lastUsedAt DESC LIMIT ?'
    ).all(limit);
  }

  // Get most used materials
  getMostUsedMaterials(limit = 10) {
    return this.db.prepare(
      'SELECT * FROM materials WHERE usageCount > 0 ORDER BY usageCount DESC LIMIT ?'
    ).all(limit);
  }

  // Increment material usage count
  incrementMaterialUsage(id) {
    const now = new Date().toISOString();
    this.db.prepare(
      'UPDATE materials SET usageCount = usageCount + 1, lastUsedAt = ?, updatedAt = ? WHERE id = ?'
    ).run(now, now, id);
  }

  // Duplicate a material
  duplicateMaterial(id) {
    const original = this.getMaterial(id);
    if (!original) return null;
    return this.createMaterial({
      name: `${original.name} (copy)`,
      category: original.category,
      unit: original.unit,
      unitCost: original.unitCost,
      supplier: original.supplier,
      partNumber: original.partNumber,
      description: original.description,
      notes: original.notes,
      markup: original.markup || 0
    });
  }

  // Bulk delete materials
  bulkDeleteMaterials(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const result = this.db.prepare(`DELETE FROM materials WHERE id IN (${placeholders})`).run(...ids);
    return result.changes;
  }

  // Bulk update material prices by percentage
  bulkUpdatePrices(ids, percentageChange) {
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
  }

  // Bulk import materials from array
  bulkCreateMaterials(items) {
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
  }

  // Log a price change in history
  logPriceChange(materialId, oldPrice, newPrice) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.prepare(
      'INSERT INTO price_history (id, materialId, oldPrice, newPrice, changedAt) VALUES (?, ?, ?, ?, ?)'
    ).run(id, materialId, oldPrice, newPrice, now);
  }

  // Get price history for a material
  getPriceHistory(materialId, limit = 50) {
    return this.db.prepare(
      'SELECT * FROM price_history WHERE materialId = ? ORDER BY changedAt DESC LIMIT ?'
    ).all(materialId, limit);
  }

  // Get material stats
  getMaterialStats() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
    const totalValue = this.db.prepare('SELECT SUM(unitCost) as total FROM materials').get().total || 0;
    const byCategory = this.db.prepare(
      'SELECT category, COUNT(*) as count, AVG(unitCost) as avgCost FROM materials GROUP BY category ORDER BY count DESC'
    ).all();
    const favorites = this.db.prepare('SELECT COUNT(*) as count FROM materials WHERE isFavorite = 1').get().count;
    const suppliers = this.db.prepare(
      "SELECT COUNT(DISTINCT supplier) as count FROM materials WHERE supplier != '' AND supplier IS NOT NULL"
    ).get().count;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentPriceChanges = this.db.prepare(
      'SELECT COUNT(*) as count FROM price_history WHERE changedAt > ?'
    ).get(thirtyDaysAgo).count;

    return { total, totalValue, byCategory, favorites, suppliers, recentPriceChanges };
  }

  // Advanced material search with multiple filters
  searchMaterials(filters = {}) {
    let query = 'SELECT * FROM materials WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.search) {
      query += ' AND (name LIKE ? OR supplier LIKE ? OR partNumber LIKE ? OR description LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }
    if (filters.supplier) {
      query += ' AND supplier = ?';
      params.push(filters.supplier);
    }
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      query += ' AND unitCost >= ?';
      params.push(Number(filters.minPrice));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      query += ' AND unitCost <= ?';
      params.push(Number(filters.maxPrice));
    }
    if (filters.favorites) {
      query += ' AND isFavorite = 1';
    }
    if (filters.recentlyUsed) {
      query += ' AND lastUsedAt IS NOT NULL';
    }

    // Sorting
    const sortMap = {
      name: 'name ASC',
      name_desc: 'name DESC',
      cost: 'unitCost ASC',
      cost_desc: 'unitCost DESC',
      category: 'category ASC, name ASC',
      supplier: 'supplier ASC, name ASC',
      usage: 'usageCount DESC',
      recent: 'lastUsedAt DESC',
      updated: 'updatedAt DESC'
    };
    const sortClause = sortMap[filters.sort] || 'category ASC, name ASC';
    query += ` ORDER BY ${sortClause}`;

    return this.db.prepare(query).all(...params);
  }

  // ==================== Takeoff Operations ====================

  createTakeoff(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO takeoffs (id, name, blueprintId, projectId, status, measurements, scale, canvasData, notes, totalCost, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.blueprintId || null, data.projectId || null,
      data.status || 'draft', JSON.stringify(data.measurements || []),
      JSON.stringify(data.scale || {}), JSON.stringify(data.canvasData || {}),
      data.notes || '', data.totalCost || 0, now, now);
    return this.getTakeoff(id);
  }

  getTakeoff(id) {
    const takeoff = this.db.prepare('SELECT * FROM takeoffs WHERE id = ?').get(id);
    if (takeoff) {
      takeoff.measurements = JSON.parse(takeoff.measurements || '[]');
      takeoff.scale = JSON.parse(takeoff.scale || '{}');
      takeoff.canvasData = JSON.parse(takeoff.canvasData || '{}');
    }
    return takeoff;
  }

  getAllTakeoffs(filters = {}) {
    let query = 'SELECT id, name, blueprintId, projectId, status, totalCost, notes, createdAt, updatedAt FROM takeoffs WHERE 1=1';
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
  }

  updateTakeoff(id, data) {
    const existing = this.getTakeoff(id);
    if (!existing) return null;
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt') {
        if (key === 'measurements' || key === 'scale' || key === 'canvasData') {
          updates.push(`${key} = ?`);
          params.push(JSON.stringify(val));
        } else {
          updates.push(`${key} = ?`);
          params.push(val);
        }
      }
    }
    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);
    this.db.prepare(`UPDATE takeoffs SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return this.getTakeoff(id);
  }

  deleteTakeoff(id) {
    this.db.prepare('DELETE FROM takeoff_items WHERE takeoffId = ?').run(id);
    return this.db.prepare('DELETE FROM takeoffs WHERE id = ?').run(id).changes > 0;
  }

  // ==================== Takeoff Item Operations ====================

  createTakeoffItem(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO takeoff_items (id, takeoffId, materialId, measurementType, label, quantity, unit, unitCost, totalCost, measurementData, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.takeoffId, data.materialId || null, data.measurementType,
      data.label || '', data.quantity || 0, data.unit || '', data.unitCost || 0,
      data.totalCost || 0, JSON.stringify(data.measurementData || {}), data.notes || '', now);
    return this.getTakeoffItem(id);
  }

  getTakeoffItem(id) {
    const item = this.db.prepare('SELECT * FROM takeoff_items WHERE id = ?').get(id);
    if (item && item.measurementData) {
      item.measurementData = JSON.parse(item.measurementData);
    }
    return item;
  }

  getTakeoffItems(takeoffId) {
    const items = this.db.prepare(
      'SELECT ti.*, m.name as materialName, m.category as materialCategory FROM takeoff_items ti LEFT JOIN materials m ON ti.materialId = m.id WHERE ti.takeoffId = ? ORDER BY ti.createdAt'
    ).all(takeoffId);
    return items.map(item => {
      if (item.measurementData) item.measurementData = JSON.parse(item.measurementData);
      return item;
    });
  }

  updateTakeoffItem(id, data) {
    const existing = this.getTakeoffItem(id);
    if (!existing) return null;
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt' && key !== 'takeoffId') {
        if (key === 'measurementData') {
          updates.push(`${key} = ?`);
          params.push(JSON.stringify(val));
        } else {
          updates.push(`${key} = ?`);
          params.push(val);
        }
      }
    }
    params.push(id);
    this.db.prepare(`UPDATE takeoff_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return this.getTakeoffItem(id);
  }

  deleteTakeoffItem(id) {
    return this.db.prepare('DELETE FROM takeoff_items WHERE id = ?').run(id).changes > 0;
  }

  // Generate takeoff summary - aggregate items by material
  generateTakeoffSummary(takeoffId) {
    const items = this.getTakeoffItems(takeoffId);
    const summary = {};
    let grandTotal = 0;

    for (const item of items) {
      const key = item.materialId || `custom_${item.label}`;
      if (!summary[key]) {
        summary[key] = {
          materialId: item.materialId,
          materialName: item.materialName || item.label,
          materialCategory: item.materialCategory || 'uncategorized',
          unit: item.unit,
          unitCost: item.unitCost,
          totalQuantity: 0,
          totalCost: 0,
          items: []
        };
      }
      summary[key].totalQuantity += item.quantity;
      summary[key].totalCost += item.totalCost;
      summary[key].items.push(item);
      grandTotal += item.totalCost;
    }

    // Update takeoff total
    this.db.prepare('UPDATE takeoffs SET totalCost = ?, updatedAt = ? WHERE id = ?')
      .run(grandTotal, new Date().toISOString(), takeoffId);

    return {
      items: Object.values(summary),
      grandTotal,
      itemCount: items.length
    };
  }

  // ==================== Permit Operations ====================

  seedDefaultDataSources() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM data_sources').get();
    if (count.count > 0) return;

    const now = new Date().toISOString();
    const sources = [
      {
        name: 'fort_worth',
        displayName: 'City of Fort Worth — Issued Building Permits',
        apiBaseUrl: 'https://data.fortworthtexas.gov/resource',
        datasetId: '9c4v-ngai',
        adapterType: 'socrata',
        fieldMapping: JSON.stringify({
          permit_number: 'permit_number',
          issued_date: 'issued_date',
          permit_type: 'permit_type_mapped',
          description: 'description',
          address: 'address',
          city: 'city',
          zip_code: 'zip_code',
          contractor_name: 'contractor_company_name',
          applicant_name: 'applicant_name',
          estimated_cost: 'estimated_cost',
          square_footage: 'square_footage',
          work_type: 'work_type',
          latitude: 'latitude',
          longitude: 'longitude',
          status: 'status'
        })
      },
      {
        name: 'fort_worth_accela',
        displayName: 'City of Fort Worth — Accela Portal (Real-time)',
        apiBaseUrl: 'https://aca-prod.accela.com/CFW',
        datasetId: null,
        adapterType: 'accela',
        fieldMapping: '{}'
      },
      {
        name: 'tarrant_county',
        displayName: 'Tarrant County',
        apiBaseUrl: 'https://data.tarrantcounty.com/resource',
        datasetId: null,
        adapterType: 'socrata',
        fieldMapping: '{}'
      },
      {
        name: 'arlington',
        displayName: 'City of Arlington',
        apiBaseUrl: 'https://data.arlingtontx.gov/resource',
        datasetId: null,
        adapterType: 'socrata',
        fieldMapping: '{}'
      }
    ];

    const stmt = this.db.prepare(`
      INSERT INTO data_sources (name, displayName, apiBaseUrl, datasetId, adapterType, fieldMapping, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const source of sources) {
      stmt.run(
        source.name,
        source.displayName,
        source.apiBaseUrl,
        source.datasetId,
        source.adapterType,
        source.fieldMapping,
        now,
        now
      );
    }

    console.log(`Seeded ${sources.length} data sources`);
  }

  // Get all data sources
  getAllDataSources() {
    return this.db.prepare('SELECT * FROM data_sources ORDER BY displayName').all();
  }

  // Get active data sources
  getActiveDataSources() {
    return this.db.prepare('SELECT * FROM data_sources WHERE isActive = 1 ORDER BY displayName').all();
  }

  // Update data source fetch status
  updateDataSourceFetchStatus(id, count, hasError = false) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE data_sources
      SET lastFetchAt = ?, lastFetchCount = ?, fetchErrors = fetchErrors + ?, updatedAt = ?
      WHERE id = ?
    `);
    stmt.run(now, count, hasError ? 1 : 0, now, id);
  }

  // Create or update permit (with deduplication)
  upsertPermit(data) {
    const now = new Date().toISOString();

    // Check for existing permit
    const existing = this.db.prepare(
      'SELECT id FROM permits WHERE sourceId = ? AND sourcePermitId = ?'
    ).get(data.sourceId, data.sourcePermitId);

    if (existing) {
      // Update existing
      const updates = [];
      const params = [];

      for (const [key, val] of Object.entries(data)) {
        if (key !== 'id' && key !== 'createdAt' && key !== 'sourceId' && key !== 'sourcePermitId') {
          if (key === 'aiClassification' || key === 'rawData') {
            updates.push(`${key} = ?`);
            params.push(typeof val === 'string' ? val : JSON.stringify(val));
          } else {
            updates.push(`${key} = ?`);
            params.push(val);
          }
        }
      }

      updates.push('updatedAt = ?');
      params.push(now);
      params.push(existing.id);

      this.db.prepare(`UPDATE permits SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return this.getPermit(existing.id);
    } else {
      // Insert new
      const stmt = this.db.prepare(`
        INSERT INTO permits (
          sourceId, sourcePermitId, permitNumber, issuedDate, appliedDate, expiryDate,
          permitType, permitCategory, description, address, city, zipCode, county,
          contractorName, contractorLicense, applicantName, ownerName,
          estimatedCost, squareFootage, stories, units, workType, occupancyType,
          latitude, longitude, leadScore, leadTier, leadStatus,
          aiClassification, rawData, fingerprint, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.sourceId,
        data.sourcePermitId,
        data.permitNumber || null,
        data.issuedDate || null,
        data.appliedDate || null,
        data.expiryDate || null,
        data.permitType || null,
        data.permitCategory || null,
        data.description || null,
        data.address || null,
        data.city || null,
        data.zipCode || null,
        data.county || null,
        data.contractorName || null,
        data.contractorLicense || null,
        data.applicantName || null,
        data.ownerName || null,
        data.estimatedCost || null,
        data.squareFootage || null,
        data.stories || null,
        data.units || null,
        data.workType || null,
        data.occupancyType || null,
        data.latitude || null,
        data.longitude || null,
        data.leadScore || 0,
        data.leadTier || 'unscored',
        data.leadStatus || 'new',
        data.aiClassification ? JSON.stringify(data.aiClassification) : null,
        data.rawData ? JSON.stringify(data.rawData) : null,
        data.fingerprint || null,
        now,
        now
      );

      return this.getPermit(result.lastInsertRowid);
    }
  }

  // Get single permit
  getPermit(id) {
    const permit = this.db.prepare('SELECT * FROM permits WHERE id = ?').get(id);
    if (permit) {
      if (permit.aiClassification) permit.aiClassification = JSON.parse(permit.aiClassification);
      if (permit.rawData) permit.rawData = JSON.parse(permit.rawData);
    }
    return permit;
  }

  // Get all permits with filters
  getAllPermits(filters = {}) {
    let query = 'SELECT * FROM permits WHERE 1=1';
    const params = [];

    if (filters.tier) {
      query += ' AND leadTier = ?';
      params.push(filters.tier);
    }

    if (filters.status) {
      query += ' AND leadStatus = ?';
      params.push(filters.status);
    }

    if (filters.category) {
      query += ' AND permitCategory = ?';
      params.push(filters.category);
    }

    if (filters.zipCode) {
      query += ' AND zipCode = ?';
      params.push(filters.zipCode);
    }

    if (filters.minScore !== undefined) {
      query += ' AND leadScore >= ?';
      params.push(filters.minScore);
    }

    if (filters.startDate) {
      query += ' AND issuedDate >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND issuedDate <= ?';
      params.push(filters.endDate);
    }

    if (filters.search) {
      query += ' AND (contractorName LIKE ? OR address LIKE ? OR description LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY leadScore DESC, issuedDate DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const permits = this.db.prepare(query).all(...params);
    return permits.map(p => {
      if (p.aiClassification) p.aiClassification = JSON.parse(p.aiClassification);
      if (p.rawData) p.rawData = JSON.parse(p.rawData);
      return p;
    });
  }

  // Update permit
  updatePermit(id, data) {
    const existing = this.getPermit(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt') {
        if (key === 'aiClassification' || key === 'rawData') {
          updates.push(`${key} = ?`);
          params.push(typeof val === 'string' ? val : JSON.stringify(val));
        } else {
          updates.push(`${key} = ?`);
          params.push(val);
        }
      }
    }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db.prepare(`UPDATE permits SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return this.getPermit(id);
  }

  // Get permit summary stats
  getPermitSummary() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM permits').get().count;
    const hot = this.db.prepare("SELECT COUNT(*) as count FROM permits WHERE leadTier = 'hot'").get().count;
    const warm = this.db.prepare("SELECT COUNT(*) as count FROM permits WHERE leadTier = 'warm'").get().count;
    const cold = this.db.prepare("SELECT COUNT(*) as count FROM permits WHERE leadTier = 'cold'").get().count;
    const unscored = this.db.prepare("SELECT COUNT(*) as count FROM permits WHERE leadTier = 'unscored'").get().count;

    const today = new Date().toISOString().split('T')[0];
    const newToday = this.db.prepare(
      'SELECT COUNT(*) as count FROM permits WHERE DATE(createdAt) = ?'
    ).get(today).count;

    const byStatus = this.db.prepare(`
      SELECT leadStatus, COUNT(*) as count
      FROM permits
      GROUP BY leadStatus
    `).all();

    return {
      total,
      hot,
      warm,
      cold,
      unscored,
      newToday,
      byStatus
    };
  }

  // Get permits within radius (Haversine formula)
  getPermitsNearLocation(lat, lng, radiusMiles) {
    const permits = this.db.prepare(
      'SELECT * FROM permits WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
    ).all();

    return permits.filter(p => {
      const distance = this.calculateDistance(lat, lng, p.latitude, p.longitude);
      return distance <= radiusMiles;
    });
  }

  // Haversine distance calculation
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // ==================== Builder Operations ====================

  // Create or update builder
  upsertBuilder(data) {
    const now = new Date().toISOString();
    const normalizedName = data.name ? data.name.toLowerCase().trim() : '';

    // Check for existing builder
    const existing = this.db.prepare(
      'SELECT id FROM builders WHERE normalizedName = ?'
    ).get(normalizedName);

    if (existing) {
      return this.getBuilder(existing.id);
    }

    // Insert new
    const stmt = this.db.prepare(`
      INSERT INTO builders (
        name, company, normalizedName, phone, email, website, licenseNumber,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name || null,
      data.company || null,
      normalizedName,
      data.phone || null,
      data.email || null,
      data.website || null,
      data.licenseNumber || null,
      now,
      now
    );

    return this.getBuilder(result.lastInsertRowid);
  }

  // Get single builder
  getBuilder(id) {
    const builder = this.db.prepare('SELECT * FROM builders WHERE id = ?').get(id);
    if (builder) {
      if (builder.primaryZipCodes) builder.primaryZipCodes = JSON.parse(builder.primaryZipCodes);
      if (builder.projectTypes) builder.projectTypes = JSON.parse(builder.projectTypes);
    }
    return builder;
  }

  // Get all builders
  getAllBuilders(filters = {}) {
    let query = 'SELECT * FROM builders WHERE 1=1';
    const params = [];

    if (filters.search) {
      query += ' AND (name LIKE ? OR company LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s);
    }

    if (filters.activityTrend) {
      query += ' AND activityTrend = ?';
      params.push(filters.activityTrend);
    }

    if (filters.hasPlumber !== undefined) {
      query += ' AND hasPlumber = ?';
      params.push(filters.hasPlumber ? 1 : 0);
    }

    query += ' ORDER BY totalPermits DESC';

    const builders = this.db.prepare(query).all(...params);
    return builders.map(b => {
      if (b.primaryZipCodes) b.primaryZipCodes = JSON.parse(b.primaryZipCodes);
      if (b.projectTypes) b.projectTypes = JSON.parse(b.projectTypes);
      return b;
    });
  }

  // Update builder
  updateBuilder(id, data) {
    const existing = this.getBuilder(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt') {
        if (key === 'primaryZipCodes' || key === 'projectTypes') {
          updates.push(`${key} = ?`);
          params.push(JSON.stringify(val));
        } else {
          updates.push(`${key} = ?`);
          params.push(val);
        }
      }
    }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db.prepare(`UPDATE builders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return this.getBuilder(id);
  }

  // Link permit to builder
  linkPermitBuilder(permitId, builderId, role) {
    try {
      this.db.prepare(`
        INSERT OR IGNORE INTO permit_builder_map (permitId, builderId, role)
        VALUES (?, ?, ?)
      `).run(permitId, builderId, role);
      return true;
    } catch (err) {
      console.error('Error linking permit to builder:', err);
      return false;
    }
  }

  // Get builders for a permit
  getPermitBuilders(permitId) {
    return this.db.prepare(`
      SELECT b.*, pbm.role
      FROM builders b
      JOIN permit_builder_map pbm ON b.id = pbm.builderId
      WHERE pbm.permitId = ?
    `).all(permitId);
  }

  // Get permits for a builder
  getBuilderPermits(builderId) {
    return this.db.prepare(`
      SELECT p.*, pbm.role
      FROM permits p
      JOIN permit_builder_map pbm ON p.id = pbm.permitId
      WHERE pbm.builderId = ?
      ORDER BY p.issuedDate DESC
    `).all(builderId);
  }

  // ==================== City & Search Operations ====================

  getCitiesWithCounts() {
    return this.db.prepare(`
      SELECT city, COUNT(*) as permitCount,
             SUM(CASE WHEN leadTier = 'hot' THEN 1 ELSE 0 END) as hotCount,
             SUM(CASE WHEN leadTier = 'warm' THEN 1 ELSE 0 END) as warmCount,
             MAX(issuedDate) as lastPermitDate
      FROM permits
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY permitCount DESC
    `).all();
  }

  getCityStats(city) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const totalPermits = this.db.prepare(
      'SELECT COUNT(*) as count FROM permits WHERE LOWER(city) = LOWER(?)'
    ).get(city).count;

    const permitsThisWeek = this.db.prepare(
      'SELECT COUNT(*) as count FROM permits WHERE LOWER(city) = LOWER(?) AND issuedDate >= ?'
    ).get(city, weekAgo).count;

    const topBuilders = this.db.prepare(`
      SELECT contractorName, COUNT(*) as permitCount,
             SUM(estimatedCost) as totalValue
      FROM permits
      WHERE LOWER(city) = LOWER(?) AND contractorName IS NOT NULL AND contractorName != ''
      GROUP BY contractorName
      ORDER BY permitCount DESC
      LIMIT 10
    `).all(city);

    const byTier = this.db.prepare(`
      SELECT leadTier, COUNT(*) as count
      FROM permits WHERE LOWER(city) = LOWER(?)
      GROUP BY leadTier
    `).all(city);

    const avgCost = this.db.prepare(
      'SELECT AVG(estimatedCost) as avg FROM permits WHERE LOWER(city) = LOWER(?) AND estimatedCost > 0'
    ).get(city).avg || 0;

    const recentPermits = this.db.prepare(`
      SELECT id, permitNumber, contractorName, address, estimatedCost, leadScore, leadTier, issuedDate
      FROM permits WHERE LOWER(city) = LOWER(?)
      ORDER BY issuedDate DESC LIMIT 20
    `).all(city);

    return { city, totalPermits, permitsThisWeek, topBuilders, byTier, avgCost, recentPermits };
  }

  unifiedSearch(query, type) {
    const results = { permits: [], leads: [], builders: [] };
    const s = `%${query}%`;

    if (!type || type === 'permits' || type === 'all') {
      results.permits = this.db.prepare(`
        SELECT id, permitNumber, contractorName, address, city, estimatedCost,
               leadScore, leadTier, leadStatus, issuedDate, permitType,
               'permit' as resultType
        FROM permits
        WHERE contractorName LIKE ? OR address LIKE ? OR city LIKE ? OR description LIKE ? OR permitNumber LIKE ?
        ORDER BY leadScore DESC LIMIT 25
      `).all(s, s, s, s, s);
    }

    if (!type || type === 'leads' || type === 'all') {
      results.leads = this.db.prepare(`
        SELECT id, name, company, location, email, phone, score, status,
               projectType, value, 'lead' as resultType
        FROM leads
        WHERE name LIKE ? OR company LIKE ? OR location LIKE ? OR email LIKE ?
        ORDER BY score DESC LIMIT 25
      `).all(s, s, s, s);
    }

    if (!type || type === 'builders' || type === 'all') {
      results.builders = this.db.prepare(`
        SELECT id, name, company, totalPermits, permitsLast30d, permitsLast90d,
               activityTrend, hasPlumber, avgProjectCost, 'builder' as resultType
        FROM builders
        WHERE name LIKE ? OR company LIKE ?
        ORDER BY totalPermits DESC LIMIT 25
      `).all(s, s);
    }

    return results;
  }

  // Create notification log entry
  createPermitNotification(data) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO permit_notifications (
        permitId, channel, recipient, message, status, externalId, errorMessage, sentAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.permitId || null,
      data.channel,
      data.recipient || null,
      data.message || null,
      data.status || 'pending',
      data.externalId || null,
      data.errorMessage || null,
      data.sentAt || null,
      now
    );

    return result.lastInsertRowid;
  }

  // Update notification status
  updateNotificationStatus(id, status, externalId = null, errorMessage = null) {
    const sentAt = status === 'sent' ? new Date().toISOString() : null;
    this.db.prepare(`
      UPDATE permit_notifications
      SET status = ?, externalId = ?, errorMessage = ?, sentAt = ?
      WHERE id = ?
    `).run(status, externalId, errorMessage, sentAt, id);
  }

  // ==================== Discovery Operations ====================

  createDiscoveryRun(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO discovery_runs (id, keyword, city, status, stage, progress, jobId, lat, lng, radius, zone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.keyword, data.city, 'pending', 'queued', 0, data.jobId || null,
      data.lat || null, data.lng || null, data.radius || null, data.zone || null,
      now, now
    );
    return this.getDiscoveryRun(id);
  }

  getDiscoveryRun(id) {
    return this.db.prepare('SELECT * FROM discovery_runs WHERE id = ?').get(id);
  }

  getAllDiscoveryRuns() {
    return this.db.prepare('SELECT * FROM discovery_runs ORDER BY createdAt DESC').all();
  }

  updateDiscoveryRun(id, data) {
    const existing = this.getDiscoveryRun(id);
    if (!existing) return null;
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        params.push(val);
      }
    }
    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);
    this.db.prepare(`UPDATE discovery_runs SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return this.getDiscoveryRun(id);
  }

  deleteDiscoveryRun(id) {
    this.db.prepare('DELETE FROM discovery_leads WHERE runId = ?').run(id);
    return this.db.prepare('DELETE FROM discovery_runs WHERE id = ?').run(id).changes > 0;
  }

  createDiscoveryLead(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO discovery_leads (
        id, runId, businessName, address, website, phone, rating, reviewCount,
        category, placeId, domainHash, emails, extractedPhones, servicesOffered,
        aboutSummary, enrichmentStatus, icpScore, icpTier, icpReasoning,
        plumbingRelevance, outreachSubject, outreachBody, contactStatus,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.runId, data.businessName || null, data.address || null,
      data.website || null, data.phone || null, data.rating || null,
      data.reviewCount || null, data.category || null, data.placeId || null,
      data.domainHash || null,
      JSON.stringify(data.emails || []),
      JSON.stringify(data.extractedPhones || []),
      JSON.stringify(data.servicesOffered || []),
      data.aboutSummary || null, data.enrichmentStatus || 'pending',
      data.icpScore || 0, data.icpTier || 'unscored', data.icpReasoning || null,
      data.plumbingRelevance || 0, data.outreachSubject || null,
      data.outreachBody || null, data.contactStatus || 'new', now, now
    );
    return this.getDiscoveryLead(id);
  }

  getDiscoveryLead(id) {
    const lead = this.db.prepare('SELECT * FROM discovery_leads WHERE id = ?').get(id);
    if (lead) {
      lead.emails = JSON.parse(lead.emails || '[]');
      lead.extractedPhones = JSON.parse(lead.extractedPhones || '[]');
      lead.servicesOffered = JSON.parse(lead.servicesOffered || '[]');
    }
    return lead;
  }

  getDiscoveryLeadsByRun(runId, filters = {}) {
    let query = 'SELECT * FROM discovery_leads WHERE runId = ?';
    const params = [runId];
    if (filters.tier) {
      query += ' AND icpTier = ?';
      params.push(filters.tier);
    }
    if (filters.status) {
      query += ' AND contactStatus = ?';
      params.push(filters.status);
    }
    query += ' ORDER BY icpScore DESC';
    const leads = this.db.prepare(query).all(...params);
    return leads.map(lead => {
      lead.emails = JSON.parse(lead.emails || '[]');
      lead.extractedPhones = JSON.parse(lead.extractedPhones || '[]');
      lead.servicesOffered = JSON.parse(lead.servicesOffered || '[]');
      return lead;
    });
  }

  updateDiscoveryLead(id, data) {
    const existing = this.getDiscoveryLead(id);
    if (!existing) return null;
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt' && key !== 'runId') {
        if (key === 'emails' || key === 'extractedPhones' || key === 'servicesOffered') {
          updates.push(`${key} = ?`);
          params.push(JSON.stringify(val));
        } else {
          updates.push(`${key} = ?`);
          params.push(val);
        }
      }
    }
    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);
    this.db.prepare(`UPDATE discovery_leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return this.getDiscoveryLead(id);
  }

  getDiscoveryLeadByDomainHash(domainHash) {
    const lead = this.db.prepare('SELECT * FROM discovery_leads WHERE domainHash = ? LIMIT 1').get(domainHash);
    if (lead) {
      lead.emails = JSON.parse(lead.emails || '[]');
      lead.extractedPhones = JSON.parse(lead.extractedPhones || '[]');
      lead.servicesOffered = JSON.parse(lead.servicesOffered || '[]');
    }
    return lead;
  }

  // ==================== Settings Operations ====================

  seedDefaultSettings() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM settings').get();
    if (count.count > 0) return;

    const now = new Date().toISOString();
    const defaults = {
      ollama_url: process.env.OLLAMA_URL || 'http://localhost:11434',
      ollama_model: process.env.OLLAMA_MODEL || 'llama3.1',
      ollama_temperature: '0.7',
      company_name: process.env.COMPANY_NAME || 'CTL Plumbing LLC',
      service_area: process.env.SERVICE_AREA || 'DFW Metroplex',
      specialization: 'Commercial and Multi-family Plumbing',
      serper_api_key: process.env.SERPER_API_KEY || '',
      google_places_api_key: process.env.GOOGLE_PLACES_API_KEY || '',
    };

    const stmt = this.db.prepare('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)');
    for (const [key, value] of Object.entries(defaults)) {
      stmt.run(key, value, now);
    }
    console.log('Seeded default settings');
  }

  getSetting(key) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  getAllSettings() {
    const rows = this.db.prepare('SELECT key, value FROM settings ORDER BY key').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  setSetting(key, value) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
    `).run(key, String(value), now);
  }

  setSettings(obj) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
    `);
    const updateMany = this.db.transaction((entries) => {
      for (const [key, value] of entries) {
        stmt.run(key, String(value), now);
      }
    });
    updateMany(Object.entries(obj));
  }

  // ==================== City & Search Operations ====================

  getCitiesWithCounts() {
    return this.db.prepare(`
      SELECT
        city,
        COUNT(*) as totalPermits,
        SUM(CASE WHEN leadTier = 'hot' THEN 1 ELSE 0 END) as hotCount,
        SUM(CASE WHEN leadTier = 'warm' THEN 1 ELSE 0 END) as warmCount,
        MAX(issuedDate) as lastPermitDate
      FROM permits
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY totalPermits DESC
    `).all();
  }

  getCityStats(city) {
    const total = this.db.prepare(
      'SELECT COUNT(*) as count FROM permits WHERE city = ?'
    ).get(city).count;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thisWeek = this.db.prepare(
      'SELECT COUNT(*) as count FROM permits WHERE city = ? AND issuedDate >= ?'
    ).get(city, sevenDaysAgo).count;

    const avgCostRow = this.db.prepare(
      'SELECT AVG(estimatedCost) as avg FROM permits WHERE city = ? AND estimatedCost IS NOT NULL AND estimatedCost > 0'
    ).get(city);
    const avgCost = avgCostRow.avg || 0;

    const tierBreakdown = this.db.prepare(`
      SELECT leadTier, COUNT(*) as count
      FROM permits WHERE city = ?
      GROUP BY leadTier
    `).all(city);

    const topBuilders = this.db.prepare(`
      SELECT contractorName, COUNT(*) as permitCount, SUM(estimatedCost) as totalValue
      FROM permits
      WHERE city = ? AND contractorName IS NOT NULL AND contractorName != ''
      GROUP BY contractorName
      ORDER BY permitCount DESC
      LIMIT 10
    `).all(city);

    return {
      city,
      totalPermits: total,
      permitsThisWeek: thisWeek,
      avgCost: Math.round(avgCost),
      tierBreakdown,
      topBuilders
    };
  }

  unifiedSearch(query, type) {
    const results = { permits: [], leads: [], builders: [] };
    const q = `%${query}%`;

    if (!type || type === 'permits') {
      results.permits = this.db.prepare(`
        SELECT id, contractorName, address, city, leadScore, leadTier, permitType, 'permit' as resultType
        FROM permits
        WHERE contractorName LIKE ? OR address LIKE ? OR city LIKE ? OR description LIKE ?
        ORDER BY leadScore DESC
        LIMIT 20
      `).all(q, q, q, q);
    }

    if (!type || type === 'leads') {
      results.leads = this.db.prepare(`
        SELECT id, name, company, location, score, status, 'lead' as resultType
        FROM leads
        WHERE name LIKE ? OR company LIKE ? OR location LIKE ?
        ORDER BY score DESC NULLS LAST
        LIMIT 20
      `).all(q, q, q);
    }

    if (!type || type === 'builders') {
      results.builders = this.db.prepare(`
        SELECT id, name, company, totalPermits, activityTrend, hasPlumber, 'builder' as resultType
        FROM builders
        WHERE name LIKE ? OR company LIKE ?
        ORDER BY totalPermits DESC
        LIMIT 20
      `).all(q, q);
    }

    return results;
  }

  // Backup database
  backup() {
    const backupPath = path.join(TOOL_DIR, 'data', `backup-${Date.now()}.db`);
    this.db.backup(backupPath);
    console.log(`✅ Database backed up to: ${backupPath}`);
    return backupPath;
  }

  // Close database
  close() {
    this.db.close();
  }
}

// Singleton instance
export const db = new DatabaseService();
