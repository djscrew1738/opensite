// SQLite Database Service with Persistence
// All data stored in /tool/data folder

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const TOOL_DIR = path.join(process.cwd(), '../../tool');
const DB_PATH = path.join(TOOL_DIR, 'data', '1stein.db');

// Ensure directories exist
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

class DatabaseService {
  constructor() {
    this.db = new Database(DB_PATH, { verbose: console.log });
    this.db.pragma('journal_mode = WAL'); // Better performance
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

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updatedAt);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_estimates_leadId ON estimates(leadId);
    `);

    console.log('✅ Database tables initialized');
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
