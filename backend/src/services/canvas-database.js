// Canvas Database Service - SQLite persistence for visual workspaces
import { db } from './database.js';

// Initialize canvas tables
export function initCanvasTables() {
  // Workspaces / Canvases
  db.exec(`
    CREATE TABLE IF NOT EXISTS canvas_workspaces (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT NOT NULL,
      description TEXT,
      project_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      view_state TEXT, -- JSON: { x, y, zoom }
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
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
export async function createWorkspace(data) {
  const id = data.id || generateId();
  await db.run(`
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
  return await getWorkspace(id);
}

export async function getWorkspace(id) {
  const row = await db.get('SELECT * FROM canvas_workspaces WHERE id = ?', [id]);
  if (!row) return null;
  return {
    ...row,
    view_state: JSON.parse(row.view_state || '{}')
  };
}

export async function getWorkspaces(projectId = null, userId = null) {
  let query = 'SELECT * FROM canvas_workspaces WHERE 1=1';
  const params = [];
  
  if (projectId) {
    query += ' AND project_id = ?';
    params.push(projectId);
  }

  if (userId) {
    query += ' AND userId = ?';
    params.push(userId);
  }
  
  query += ' ORDER BY updated_at DESC';
  
  const rows = await db.all(query, params);
  return rows.map(row => ({
    ...row,
    view_state: JSON.parse(row.view_state || '{}')
  }));
}

export async function updateWorkspace(id, data) {
  const sets = [];
  const values = [];
  
  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.view_state !== undefined) { sets.push('view_state = ?'); values.push(JSON.stringify(data.view_state)); }
  
  if (sets.length === 0) return await getWorkspace(id);
  
  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await db.run(`UPDATE canvas_workspaces SET ${sets.join(', ')} WHERE id = ?`, values);
  return await getWorkspace(id);
}

export async function deleteWorkspace(id) {
  await db.run('DELETE FROM canvas_workspaces WHERE id = ?', [id]);
  return { deleted: true };
}

// Node CRUD
export async function createNode(data) {
  const id = data.id || generateId();
  await db.run(`
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
  return await getNode(id);
}

export async function getNode(id) {
  const row = await db.get('SELECT * FROM canvas_nodes WHERE id = ?', [id]);
  if (!row) return null;
  return deserializeNode(row);
}

export async function getNodesByWorkspace(workspaceId) {
  const rows = await db.all('SELECT * FROM canvas_nodes WHERE workspace_id = ?', [workspaceId]);
  return rows.map(deserializeNode);
}

export async function updateNode(id, data) {
  const sets = [];
  const values = [];
  
  if (data.position?.x !== undefined) { sets.push('position_x = ?'); values.push(data.position.x); }
  if (data.position?.y !== undefined) { sets.push('position_y = ?'); values.push(data.position.y); }
  if (data.width !== undefined) { sets.push('width = ?'); values.push(data.width); }
  if (data.height !== undefined) { sets.push('height = ?'); values.push(data.height); }
  if (data.data !== undefined) { sets.push('data = ?'); values.push(JSON.stringify(data.data)); }
  if (data.style !== undefined) { sets.push('style = ?'); values.push(JSON.stringify(data.style)); }
  
  if (sets.length === 0) return await getNode(id);
  
  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await db.run(`UPDATE canvas_nodes SET ${sets.join(', ')} WHERE id = ?`, values);
  return await getNode(id);
}

export async function updateNodePositions(workspaceId, nodes) {
  if (db.db && db.db.transaction) {
    const stmt = db.db.prepare(`
      UPDATE canvas_nodes 
      SET position_x = ?, position_y = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND workspace_id = ?
    `);
    
    const updateWorkspace = db.db.prepare(`
      UPDATE canvas_workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    
    const transaction = db.db.transaction((nodeList) => {
      for (const node of nodeList) {
        stmt.run(node.position.x, node.position.y, node.id, workspaceId);
      }
      updateWorkspace.run(workspaceId);
    });
    
    transaction(nodes);
  } else {
    // Async-native (Postgres)
    for (const node of nodes) {
      await db.run('UPDATE canvas_nodes SET position_x = ?, position_y = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND workspace_id = ?', [node.position.x, node.position.y, node.id, workspaceId]);
    }
    await db.run('UPDATE canvas_workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [workspaceId]);
  }
  return true;
}

export async function deleteNode(id) {
  await db.run('DELETE FROM canvas_nodes WHERE id = ?', [id]);
  return { deleted: true };
}

// Edge CRUD
export async function createEdge(data) {
  const id = data.id || generateId();
  await db.run(`
    INSERT INTO canvas_edges (id, workspace_id, source, target, label, type, data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    data.workspace_id,
    data.source,
    data.target,
    data.label || null,
    data.type || 'solid',
    JSON.stringify(data.data || {})
  ]);
  return await getEdge(id);
}

export async function getEdge(id) {
  const row = await db.get('SELECT * FROM canvas_edges WHERE id = ?', [id]);
  if (!row) return null;
  return deserializeEdge(row);
}

export async function getEdgesByWorkspace(workspaceId) {
  const rows = await db.all('SELECT * FROM canvas_edges WHERE workspace_id = ?', [workspaceId]);
  return rows.map(deserializeEdge);
}

export async function updateEdge(id, data) {
  const sets = [];
  const values = [];
  
  if (data.label !== undefined) { sets.push('label = ?'); values.push(data.label); }
  if (data.type !== undefined) { sets.push('type = ?'); values.push(data.type); }
  if (data.data !== undefined) { sets.push('data = ?'); values.push(JSON.stringify(data.data)); }
  
  if (sets.length === 0) return await getEdge(id);
  
  values.push(id);
  await db.run(`UPDATE canvas_edges SET ${sets.join(', ')} WHERE id = ?`, values);
  return await getEdge(id);
}

export async function deleteEdge(id) {
  await db.run('DELETE FROM canvas_edges WHERE id = ?', [id]);
  return { deleted: true };
}

// Finding / Pin CRUD
export async function createFinding(data) {
  const id = data.id || generateId();
  await db.run(`
    INSERT INTO canvas_findings (id, workspace_id, node_id, type, title, description, position_x, position_y)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    data.workspace_id,
    data.node_id || null,
    data.type,
    data.title,
    data.description || null,
    data.position?.x || null,
    data.position?.y || null
  ]);
  return await getFinding(id);
}

export async function getFinding(id) {
  return await db.get('SELECT * FROM canvas_findings WHERE id = ?', [id]);
}

export async function getFindingsByWorkspace(workspaceId) {
  return await db.all('SELECT * FROM canvas_findings WHERE workspace_id = ? ORDER BY created_at DESC', [workspaceId]);
}

export async function updateFinding(id, data) {
  const sets = [];
  const values = [];
  
  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.resolved !== undefined) { sets.push('resolved = ?'); values.push(data.resolved ? 1 : 0); }
  if (data.position?.x !== undefined) { sets.push('position_x = ?'); values.push(data.position.x); }
  if (data.position?.y !== undefined) { sets.push('position_y = ?'); values.push(data.position.y); }
  
  if (sets.length === 0) return await getFinding(id);
  
  values.push(id);
  await db.run(`UPDATE canvas_findings SET ${sets.join(', ')} WHERE id = ?`, values);
  return await getFinding(id);
}

export async function deleteFinding(id) {
  await db.run('DELETE FROM canvas_findings WHERE id = ?', [id]);
  return { deleted: true };
}

// Document CRUD
export async function createDocument(data) {
  const id = data.id || generateId();
  await db.run(`
    INSERT INTO canvas_documents (
      id, node_id, workspace_id, filename, file_path, file_type, file_size, 
      category, ocr_text, page_count, thumbnail_path, ai_classification_confidence
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
  ]);
  return await getDocument(id);
}

export async function getDocument(id) {
  return await db.get('SELECT * FROM canvas_documents WHERE id = ?', [id]);
}

export async function getDocumentByNode(nodeId) {
  return await db.get('SELECT * FROM canvas_documents WHERE node_id = ?', [nodeId]);
}

export async function updateDocument(id, data) {
  const sets = [];
  const values = [];
  
  if (data.category !== undefined) { sets.push('category = ?'); values.push(data.category); }
  if (data.ocr_text !== undefined) { sets.push('ocr_text = ?'); values.push(data.ocr_text); }
  if (data.thumbnail_path !== undefined) { sets.push('thumbnail_path = ?'); values.push(data.thumbnail_path); }
  
  if (sets.length === 0) return await getDocument(id);
  
  values.push(id);
  await db.run(`UPDATE canvas_documents SET ${sets.join(', ')} WHERE id = ?`, values);
  return await getDocument(id);
}

// Full canvas state operations
export async function getFullCanvas(workspaceId) {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) return null;
  
  return {
    workspace,
    nodes: await getNodesByWorkspace(workspaceId),
    edges: await getEdgesByWorkspace(workspaceId),
    findings: await getFindingsByWorkspace(workspaceId)
  };
}

export async function saveFullCanvas(workspaceId, data) {
  if (db.db && db.db.transaction) {
    const transaction = db.db.transaction(async (canvasData) => {
      // Update workspace
      if (canvasData.workspace) {
        await updateWorkspace(workspaceId, canvasData.workspace);
      }
    });
    await transaction(data);
  } else {
    if (data.workspace) {
      await updateWorkspace(workspaceId, data.workspace);
    }
  }
  
  return await getFullCanvas(workspaceId);
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
