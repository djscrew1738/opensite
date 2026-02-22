// Canvas Database Service - SQLite persistence for visual workspaces
import { db } from './database.js';

// Initialize canvas tables
export function initCanvasTables() {
  // Workspaces / Canvases
  db.exec(`
    CREATE TABLE IF NOT EXISTS canvas_workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      project_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      view_state TEXT -- JSON: { x, y, zoom }
    )
  `);

  // Nodes (Documents, Entities, Sticky Notes, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS canvas_nodes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'document', 'person', 'organization', 'location', 'date', 'amount', 'job', 'permit', 'sticky', 'finding'
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      width REAL DEFAULT 200,
      height REAL DEFAULT 120,
      data TEXT NOT NULL, -- JSON: node-specific data
      style TEXT, -- JSON: visual styling
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE
    )
  `);

  // Edges / Connections between nodes
  db.exec(`
    CREATE TABLE IF NOT EXISTS canvas_edges (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      label TEXT,
      type TEXT DEFAULT 'solid', -- 'solid', 'dashed', 'conflict'
      data TEXT, -- JSON: additional edge data
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (source) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (target) REFERENCES canvas_nodes(id) ON DELETE CASCADE
    )
  `);

  // Findings / Pins
  db.exec(`
    CREATE TABLE IF NOT EXISTS canvas_findings (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      node_id TEXT, -- optional: finding attached to a specific node
      type TEXT NOT NULL, -- 'info', 'warning', 'critical'
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

  // Documents (metadata for document nodes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS canvas_documents (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL, -- 'pdf', 'png', 'jpg', etc.
      file_size INTEGER,
      category TEXT, -- 'blueprint', 'w9', 'receipt', 'contract', 'permit', 'other'
      ocr_text TEXT,
      page_count INTEGER DEFAULT 1,
      thumbnail_path TEXT,
      ai_classification_confidence REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES canvas_workspaces(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_nodes_workspace ON canvas_nodes(workspace_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_edges_workspace ON canvas_edges(workspace_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_findings_workspace ON canvas_findings(workspace_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_node ON canvas_documents(node_id)`);
}

// Workspace CRUD
export function createWorkspace(data) {
  const stmt = db.prepare(`
    INSERT INTO canvas_workspaces (id, name, description, project_id, view_state)
    VALUES (?, ?, ?, ?, ?)
  `);
  const id = data.id || generateId();
  stmt.run(
    id,
    data.name,
    data.description || null,
    data.project_id || null,
    JSON.stringify(data.view_state || { x: 0, y: 0, zoom: 1 })
  );
  return getWorkspace(id);
}

export function getWorkspace(id) {
  const row = db.prepare('SELECT * FROM canvas_workspaces WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    view_state: JSON.parse(row.view_state || '{}')
  };
}

export function getWorkspaces(projectId = null) {
  let query = 'SELECT * FROM canvas_workspaces';
  let params = [];
  
  if (projectId) {
    query += ' WHERE project_id = ?';
    params.push(projectId);
  }
  
  query += ' ORDER BY updated_at DESC';
  
  const rows = db.prepare(query).all(...params);
  return rows.map(row => ({
    ...row,
    view_state: JSON.parse(row.view_state || '{}')
  }));
}

export function updateWorkspace(id, data) {
  const sets = [];
  const values = [];
  
  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.view_state !== undefined) { sets.push('view_state = ?'); values.push(JSON.stringify(data.view_state)); }
  
  if (sets.length === 0) return getWorkspace(id);
  
  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.prepare(`UPDATE canvas_workspaces SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getWorkspace(id);
}

export function deleteWorkspace(id) {
  db.prepare('DELETE FROM canvas_workspaces WHERE id = ?').run(id);
  return { deleted: true };
}

// Node CRUD
export function createNode(data) {
  const stmt = db.prepare(`
    INSERT INTO canvas_nodes (id, workspace_id, type, position_x, position_y, width, height, data, style)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const id = data.id || generateId();
  stmt.run(
    id,
    data.workspace_id,
    data.type,
    data.position?.x || 0,
    data.position?.y || 0,
    data.width || 200,
    data.height || 120,
    JSON.stringify(data.data || {}),
    JSON.stringify(data.style || {})
  );
  return getNode(id);
}

export function getNode(id) {
  const row = db.prepare('SELECT * FROM canvas_nodes WHERE id = ?').get(id);
  if (!row) return null;
  return deserializeNode(row);
}

export function getNodesByWorkspace(workspaceId) {
  const rows = db.prepare('SELECT * FROM canvas_nodes WHERE workspace_id = ?').all(workspaceId);
  return rows.map(deserializeNode);
}

export function updateNode(id, data) {
  const sets = [];
  const values = [];
  
  if (data.position?.x !== undefined) { sets.push('position_x = ?'); values.push(data.position.x); }
  if (data.position?.y !== undefined) { sets.push('position_y = ?'); values.push(data.position.y); }
  if (data.width !== undefined) { sets.push('width = ?'); values.push(data.width); }
  if (data.height !== undefined) { sets.push('height = ?'); values.push(data.height); }
  if (data.data !== undefined) { sets.push('data = ?'); values.push(JSON.stringify(data.data)); }
  if (data.style !== undefined) { sets.push('style = ?'); values.push(JSON.stringify(data.style)); }
  
  if (sets.length === 0) return getNode(id);
  
  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.prepare(`UPDATE canvas_nodes SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getNode(id);
}

export function updateNodePositions(workspaceId, nodes) {
  const stmt = db.prepare(`
    UPDATE canvas_nodes 
    SET position_x = ?, position_y = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND workspace_id = ?
  `);
  
  const updateWorkspace = db.prepare(`
    UPDATE canvas_workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  
  const transaction = db.transaction((nodeList) => {
    for (const node of nodeList) {
      stmt.run(node.position.x, node.position.y, node.id, workspaceId);
    }
    updateWorkspace.run(workspaceId);
  });
  
  transaction(nodes);
  return true;
}

export function deleteNode(id) {
  db.prepare('DELETE FROM canvas_nodes WHERE id = ?').run(id);
  return { deleted: true };
}

// Edge CRUD
export function createEdge(data) {
  const stmt = db.prepare(`
    INSERT INTO canvas_edges (id, workspace_id, source, target, label, type, data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const id = data.id || generateId();
  stmt.run(
    id,
    data.workspace_id,
    data.source,
    data.target,
    data.label || null,
    data.type || 'solid',
    JSON.stringify(data.data || {})
  );
  return getEdge(id);
}

export function getEdge(id) {
  const row = db.prepare('SELECT * FROM canvas_edges WHERE id = ?').get(id);
  if (!row) return null;
  return deserializeEdge(row);
}

export function getEdgesByWorkspace(workspaceId) {
  const rows = db.prepare('SELECT * FROM canvas_edges WHERE workspace_id = ?').all(workspaceId);
  return rows.map(deserializeEdge);
}

export function updateEdge(id, data) {
  const sets = [];
  const values = [];
  
  if (data.label !== undefined) { sets.push('label = ?'); values.push(data.label); }
  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.data !== undefined) { sets.push('data = ?'); values.push(JSON.stringify(data.data)); }
  
  if (sets.length === 0) return getEdge(id);
  
  values.push(id);
  db.prepare(`UPDATE canvas_edges SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getEdge(id);
}

export function deleteEdge(id) {
  db.prepare('DELETE FROM canvas_edges WHERE id = ?').run(id);
  return { deleted: true };
}

// Finding / Pin CRUD
export function createFinding(data) {
  const stmt = db.prepare(`
    INSERT INTO canvas_findings (id, workspace_id, node_id, type, title, description, position_x, position_y)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const id = data.id || generateId();
  stmt.run(
    id,
    data.workspace_id,
    data.node_id || null,
    data.type,
    data.title,
    data.description || null,
    data.position?.x || null,
    data.position?.y || null
  );
  return getFinding(id);
}

export function getFinding(id) {
  return db.prepare('SELECT * FROM canvas_findings WHERE id = ?').get(id);
}

export function getFindingsByWorkspace(workspaceId) {
  return db.prepare('SELECT * FROM canvas_findings WHERE workspace_id = ? ORDER BY created_at DESC').all(workspaceId);
}

export function updateFinding(id, data) {
  const sets = [];
  const values = [];
  
  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.resolved !== undefined) { sets.push('resolved = ?'); values.push(data.resolved ? 1 : 0); }
  if (data.position?.x !== undefined) { sets.push('position_x = ?'); values.push(data.position.x); }
  if (data.position?.y !== undefined) { sets.push('position_y = ?'); values.push(data.position.y); }
  
  if (sets.length === 0) return getFinding(id);
  
  values.push(id);
  db.prepare(`UPDATE canvas_findings SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getFinding(id);
}

export function deleteFinding(id) {
  db.prepare('DELETE FROM canvas_findings WHERE id = ?').run(id);
  return { deleted: true };
}

// Document CRUD
export function createDocument(data) {
  const stmt = db.prepare(`
    INSERT INTO canvas_documents (
      id, node_id, workspace_id, filename, file_path, file_type, file_size, 
      category, ocr_text, page_count, thumbnail_path, ai_classification_confidence
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const id = data.id || generateId();
  stmt.run(
    id,
    data.node_id,
    data.workspace_id,
    data.filename,
    data.file_path,
    data.file_type,
    data.file_size || null,
    data.category || 'other',
    data.ocr_text || null,
    data.page_count || 1,
    data.thumbnail_path || null,
    data.ai_classification_confidence || null
  );
  return getDocument(id);
}

export function getDocument(id) {
  return db.prepare('SELECT * FROM canvas_documents WHERE id = ?').get(id);
}

export function getDocumentByNode(nodeId) {
  return db.prepare('SELECT * FROM canvas_documents WHERE node_id = ?').get(nodeId);
}

export function updateDocument(id, data) {
  const sets = [];
  const values = [];
  
  if (data.category !== undefined) { sets.push('category = ?'); values.push(data.category); }
  if (data.ocr_text !== undefined) { sets.push('ocr_text = ?'); values.push(data.ocr_text); }
  if (data.thumbnail_path !== undefined) { sets.push('thumbnail_path = ?'); values.push(data.thumbnail_path); }
  
  if (sets.length === 0) return getDocument(id);
  
  values.push(id);
  db.prepare(`UPDATE canvas_documents SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getDocument(id);
}

// Full canvas state operations
export function getFullCanvas(workspaceId) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;
  
  return {
    workspace,
    nodes: getNodesByWorkspace(workspaceId),
    edges: getEdgesByWorkspace(workspaceId),
    findings: getFindingsByWorkspace(workspaceId)
  };
}

export function saveFullCanvas(workspaceId, data) {
  const transaction = db.transaction((canvasData) => {
    // Update workspace
    if (canvasData.workspace) {
      updateWorkspace(workspaceId, canvasData.workspace);
    }
    
    // Nodes are updated individually via updateNodePositions for drag operations
    // But we can batch update other node properties here if needed
  });
  
  transaction(data);
  return getFullCanvas(workspaceId);
}

// Helpers
function generateId() {
  return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function deserializeNode(row) {
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
}

function deserializeEdge(row) {
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
}

export default {
  initCanvasTables,
  createWorkspace,
  getWorkspace,
  getWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  createNode,
  getNode,
  getNodesByWorkspace,
  updateNode,
  updateNodePositions,
  deleteNode,
  createEdge,
  getEdge,
  getEdgesByWorkspace,
  updateEdge,
  deleteEdge,
  createFinding,
  getFinding,
  getFindingsByWorkspace,
  updateFinding,
  deleteFinding,
  createDocument,
  getDocument,
  getDocumentByNode,
  updateDocument,
  getFullCanvas,
  saveFullCanvas
};
