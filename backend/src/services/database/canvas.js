// Canvas Operations Module
// Adds visual workspace CRUD operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Canvas operations mixin
 * Adds visual workspace-related methods to DatabaseService
 */
export function addCanvasOperations(DatabaseService) {
  /**
   * Initialize canvas tables
   */
  DatabaseService.prototype.initializeCanvasTables = async function() {
    try {
      // Workspaces
      await this.exec(`
        CREATE TABLE IF NOT EXISTS canvas_workspaces (
          id TEXT PRIMARY KEY,
          userId TEXT,
          name TEXT NOT NULL,
          description TEXT,
          project_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          view_state TEXT,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Nodes
      await this.exec(`
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE
        )
      `);

      // Edges
      await this.exec(`
        CREATE TABLE IF NOT EXISTS canvas_edges (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          source TEXT NOT NULL,
          target TEXT NOT NULL,
          label TEXT,
          type TEXT DEFAULT 'solid',
          data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (source) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (target) REFERENCES canvas_nodes(id) ON DELETE CASCADE
        )
      `);

      // Findings
      await this.exec(`
        CREATE TABLE IF NOT EXISTS canvas_findings (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          node_id TEXT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          position_x REAL,
          position_y REAL,
          resolved BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (node_id) REFERENCES canvas_nodes(id) ON DELETE SET NULL
        )
      `);

      // Documents
      await this.exec(`
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE
        )
      `);

      // Indexes
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_nodes_workspace ON canvas_nodes(workspace_id)`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_edges_workspace ON canvas_edges(workspace_id)`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_findings_workspace ON canvas_findings(workspace_id)`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_documents_node ON canvas_documents(node_id)`);
      
    } catch (error) {
      logger.error('Failed to initialize canvas tables', { error: error.message });
    }
  };

  // --- Workspace Operations ---

  DatabaseService.prototype.createWorkspace = async function(data) {
    const id = data.id || `ws_${uuidv4()}`;
    try {
      await this.run(`
        INSERT INTO canvas_workspaces (id, userId, name, description, project_id, view_state)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || null,
        data.name,
        data.description || null,
        data.project_id || null,
        JSON.stringify(data.view_state || { x: 0, y: 0, zoom: 1 })
      ]);
      return await this.getWorkspace(id);
    } catch (error) {
      logger.error('Failed to create workspace', { error: error.message });
      throw error;
    }
  };

  DatabaseService.prototype.getWorkspace = async function(id) {
    try {
      const row = await this.get('SELECT * FROM canvas_workspaces WHERE id = ?', [id]);
      if (!row) return null;
      return { ...row, view_state: JSON.parse(row.view_state || '{}') };
    } catch (error) {
      return null;
    }
  };

  DatabaseService.prototype.getWorkspaces = async function(projectId = null, userId = null) {
    let query = 'SELECT * FROM canvas_workspaces WHERE 1=1';
    const params = [];
    if (projectId) { query += ' AND project_id = ?'; params.push(projectId); }
    if (userId) { query += ' AND userId = ?'; params.push(userId); }
    query += ' ORDER BY updated_at DESC';
    
    try {
      const rows = await this.all(query, params);
      return rows.map(row => ({ ...row, view_state: JSON.parse(row.view_state || '{}') }));
    } catch (error) {
      return [];
    }
  };

  DatabaseService.prototype.updateWorkspace = async function(id, data) {
    const fields = [];
    const params = [];
    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.view_state !== undefined) { fields.push('view_state = ?'); params.push(JSON.stringify(data.view_state)); }
    
    if (fields.length === 0) return await this.getWorkspace(id);
    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    await this.run(`UPDATE canvas_workspaces SET ${fields.join(', ')} WHERE id = ?`, params);
    return await this.getWorkspace(id);
  };

  DatabaseService.prototype.deleteWorkspace = async function(id) {
    await this.run('DELETE FROM canvas_workspaces WHERE id = ?', [id]);
    return true;
  };

  // --- Node Operations ---

  DatabaseService.prototype.createNode = async function(data) {
    const id = data.id || `node_${uuidv4()}`;
    await this.run(`
      INSERT INTO canvas_nodes (id, workspace_id, type, position_x, position_y, width, height, data, style)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.workspace_id,
      data.type,
      data.position?.x || 0,
      data.position?.y || 0,
      data.width || 200,
      data.height || 120,
      JSON.stringify(data.data || {}),
      JSON.stringify(data.style || {})
    ]);
    return await this.getNode(id);
  };

  DatabaseService.prototype.getNode = async function(id) {
    const row = await this.get('SELECT * FROM canvas_nodes WHERE id = ?', [id]);
    return row ? this._deserializeNode(row) : null;
  };

  DatabaseService.prototype.getNodesByWorkspace = async function(workspaceId) {
    const rows = await this.all('SELECT * FROM canvas_nodes WHERE workspace_id = ?', [workspaceId]);
    return rows.map(r => this._deserializeNode(r));
  };

  DatabaseService.prototype.updateNode = async function(id, data) {
    const fields = [];
    const params = [];
    if (data.position?.x !== undefined) { fields.push('position_x = ?'); params.push(data.position.x); }
    if (data.position?.y !== undefined) { fields.push('position_y = ?'); params.push(data.position.y); }
    if (data.width !== undefined) { fields.push('width = ?'); params.push(data.width); }
    if (data.height !== undefined) { fields.push('height = ?'); params.push(data.height); }
    if (data.data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(data.data)); }
    if (data.style !== undefined) { fields.push('style = ?'); params.push(JSON.stringify(data.style)); }
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      await this.run(`UPDATE canvas_nodes SET ${fields.join(', ')} WHERE id = ?`, params);
    }
    return await this.getNode(id);
  };

  DatabaseService.prototype.updateNodePositions = async function(workspaceId, nodes) {
    const now = new Date().toISOString();
    try {
      if (this.db && typeof this.db.transaction === 'function') {
        const stmt = this.db.prepare('UPDATE canvas_nodes SET position_x = ?, position_y = ?, updated_at = ? WHERE id = ? AND workspace_id = ?');
        const updateWs = this.db.prepare('UPDATE canvas_workspaces SET updated_at = ? WHERE id = ?');
        
        const batch = this.db.transaction((items) => {
          for (const node of items) {
            stmt.run(node.position.x, node.position.y, now, node.id, workspaceId);
          }
          updateWs.run(now, workspaceId);
        });
        batch(nodes);
      } else {
        for (const node of nodes) {
          await this.run('UPDATE canvas_nodes SET position_x = ?, position_y = ?, updated_at = ? WHERE id = ? AND workspace_id = ?', 
            [node.position.x, node.position.y, now, node.id, workspaceId]);
        }
        await this.run('UPDATE canvas_workspaces SET updated_at = ? WHERE id = ?', [now, workspaceId]);
      }
      return true;
    } catch (error) {
      logger.error('Failed batch update node positions', { error: error.message });
      return false;
    }
  };

  DatabaseService.prototype.deleteNode = async function(id) {
    await this.run('DELETE FROM canvas_nodes WHERE id = ?', [id]);
    return true;
  };

  // --- Edge Operations ---

  DatabaseService.prototype.createEdge = async function(data) {
    const id = data.id || `edge_${uuidv4()}`;
    await this.run(`
      INSERT INTO canvas_edges (id, workspace_id, source, target, label, type, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, data.workspace_id, data.source, data.target, data.label || null, data.type || 'solid', JSON.stringify(data.data || {})
    ]);
    return await this.getEdge(id);
  };

  DatabaseService.prototype.getEdge = async function(id) {
    const row = await this.get('SELECT * FROM canvas_edges WHERE id = ?', [id]);
    return row ? this._deserializeEdge(row) : null;
  };

  DatabaseService.prototype.getEdgesByWorkspace = async function(workspaceId) {
    const rows = await this.all('SELECT * FROM canvas_edges WHERE workspace_id = ?', [workspaceId]);
    return rows.map(r => this._deserializeEdge(r));
  };

  DatabaseService.prototype.deleteEdge = async function(id) {
    await this.run('DELETE FROM canvas_edges WHERE id = ?', [id]);
    return true;
  };

  // --- Finding Operations ---

  DatabaseService.prototype.createFinding = async function(data) {
    const id = data.id || `find_${uuidv4()}`;
    await this.run(`
      INSERT INTO canvas_findings (id, workspace_id, node_id, type, title, description, position_x, position_y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, data.workspace_id, data.node_id || null, data.type, data.title, data.description || null, data.position?.x || null, data.position?.y || null
    ]);
    return await this.getFinding(id);
  };

  DatabaseService.prototype.getFinding = async function(id) {
    return await this.get('SELECT * FROM canvas_findings WHERE id = ?', [id]);
  };

  DatabaseService.prototype.getFindingsByWorkspace = async function(workspaceId) {
    return await this.all('SELECT * FROM canvas_findings WHERE workspace_id = ? ORDER BY created_at DESC', [workspaceId]);
  };

  DatabaseService.prototype.updateFinding = async function(id, data) {
    const fields = [];
    const params = [];
    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.resolved !== undefined) { fields.push('resolved = ?'); params.push(data.resolved ? 1 : 0); }
    
    if (fields.length === 0) return await this.getFinding(id);
    params.push(id);
    await this.run(`UPDATE canvas_findings SET ${fields.join(', ')} WHERE id = ?`, params);
    return await this.getFinding(id);
  };

  DatabaseService.prototype.deleteFinding = async function(id) {
    await this.run('DELETE FROM canvas_findings WHERE id = ?', [id]);
    return true;
  };

  // --- Document Operations ---

  DatabaseService.prototype.createDocument = async function(data) {
    const id = data.id || `doc_${uuidv4()}`;
    await this.run(`
      INSERT INTO canvas_documents (
        id, node_id, workspace_id, filename, file_path, file_type, file_size, 
        category, ocr_text, page_count, thumbnail_path, ai_classification_confidence
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, data.node_id, data.workspace_id, data.filename, data.file_path, data.file_type, data.file_size || null, 
      data.category || 'other', data.ocr_text || null, data.page_count || 1, data.thumbnail_path || null, data.ai_classification_confidence || null
    ]);
    return await this.getDocument(id);
  };

  DatabaseService.prototype.getDocument = async function(id) {
    return await this.get('SELECT * FROM canvas_documents WHERE id = ?', [id]);
  };

  DatabaseService.prototype.getDocumentByNode = async function(nodeId) {
    return await this.get('SELECT * FROM canvas_documents WHERE node_id = ?', [nodeId]);
  };

  DatabaseService.prototype.updateDocument = async function(id, data) {
    const fields = [];
    const params = [];
    if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
    if (data.ocr_text !== undefined) { fields.push('ocr_text = ?'); params.push(data.ocr_text); }
    if (data.thumbnail_path !== undefined) { fields.push('thumbnail_path = ?'); params.push(data.thumbnail_path); }
    
    if (fields.length === 0) return await this.getDocument(id);
    params.push(id);
    await this.run(`UPDATE canvas_documents SET ${fields.join(', ')} WHERE id = ?`, params);
    return await this.getDocument(id);
  };

  // --- Composite Operations ---

  DatabaseService.prototype.getFullCanvas = async function(workspaceId) {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return null;
    
    return {
      workspace,
      nodes: await this.getNodesByWorkspace(workspaceId),
      edges: await this.getEdgesByWorkspace(workspaceId),
      findings: await this.getFindingsByWorkspace(workspaceId)
    };
  };

  // --- Internal Helpers ---

  DatabaseService.prototype._deserializeNode = function(row) {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      type: row.type,
      position: { x: row.position_x, y: row.position_y },
      width: row.width,
      height: row.height,
      data: JSON.parse(row.data || '{}'),
      style: JSON.parse(row.style || '{}'),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  };

  DatabaseService.prototype._deserializeEdge = function(row) {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      source: row.source,
      target: row.target,
      label: row.label,
      type: row.type,
      data: JSON.parse(row.data || '{}'),
      created_at: row.created_at
    };
  };
}

export default addCanvasOperations;
