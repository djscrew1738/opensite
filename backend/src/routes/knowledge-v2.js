/**
 * Knowledge Base API Routes (v2)
 * 
 * Enhanced knowledge base routes with:
 * - Vector-based semantic search (Pinecone/pgvector)
 * - Advanced chunking strategies
 * - Automatic metadata extraction
 * - Batch upload and indexing
 * - Faceted search
 * 
 * Routes:
 * GET    /api/v2/knowledge           - List entries
 * POST   /api/v2/knowledge/search    - Semantic search
 * POST   /api/v2/knowledge/query     - Hybrid semantic + keyword search
 * POST   /api/v2/knowledge           - Create entry
 * POST   /api/v2/knowledge/batch     - Batch create
 * PUT    /api/v2/knowledge/:id       - Update entry
 * DELETE /api/v2/knowledge/:id       - Delete entry
 * POST   /api/v2/knowledge/index     - Reindex all content
 * POST   /api/v2/knowledge/upload    - Upload and index file
 * GET    /api/v2/knowledge/stats     - Statistics
 * GET    /api/v2/knowledge/health    - Health check
 */

import { Router } from 'express';
import { db } from '../services/database/index.js';
import { vectorStoreManager } from '../services/vector/VectorStoreManager.js';
import { semanticSearchService } from '../services/ai/semantic-search-service.js';
import { chunkingService } from '../services/chunking-service.js';
import { metadataTaggingService } from '../services/metadata-tagging-service.js';
import { ocrPreprocessingService } from '../services/ocr-preprocessing-service.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';
import { upload } from '../config/multer.js';
import logger from '../services/logger.js';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

/**
 * GET /api/v2/knowledge
 * List knowledge base entries with pagination and filtering
 */
router.get('/', authenticateToken, tryCatch(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    source,
    sourceType,
    tags,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];

  if (source) {
    conditions.push('source = ?');
    params.push(source);
  }
  if (sourceType) {
    conditions.push('source_type = ?');
    params.push(sourceType);
  }
  if (tags) {
    const tagList = tags.split(',');
    conditions.push(`(tags LIKE ? ${tagList.slice(1).map(() => 'OR tags LIKE ?').join('')})`);
    params.push(...tagList.map(t => `%${t.trim()}%`));
  }
  if (search) {
    conditions.push('(title LIKE ? OR content LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = db.query(
    `SELECT COUNT(*) as total FROM knowledge_base ${whereClause}`,
    params
  );
  const total = countResult[0]?.total || 0;

  // Get entries
  const entries = db.query(
    `SELECT 
      id, external_id, title, content_preview, 
      source, source_type, tags, metadata,
      created_at, updated_at
     FROM knowledge_base 
     ${whereClause}
     ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  res.success({
    entries: entries.map(e => ({
      ...e,
      metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * POST /api/v2/knowledge/search
 * Pure semantic search using vector similarity
 */
router.post('/search', authenticateToken, tryCatch(async (req, res) => {
  const {
    query,
    topK = 10,
    threshold = 0.7,
    filters = {},
    sources = []
  } = req.body;

  if (!query || typeof query !== 'string') {
    return res.error('Query is required', 'VALIDATION_ERROR', null, 400);
  }

  const results = await vectorStoreManager.search(query, {
    topK,
    threshold,
    filter: filters,
    sources
  });

  res.success({
    query,
    results,
    total: results.length
  });
}));

/**
 * POST /api/v2/knowledge/query
 * Hybrid search (semantic + keyword) with optional reranking
 */
router.post('/query', authenticateToken, tryCatch(async (req, res) => {
  const {
    query,
    topK = 10,
    useHybrid = true,
    rerank = false,
    filters = {},
    sources = [],
    facets = false
  } = req.body;

  if (!query || typeof query !== 'string') {
    return res.error('Query is required', 'VALIDATION_ERROR', null, 400);
  }

  // Perform search
  const searchResults = await semanticSearchService.search(query, {
    topK,
    useHybrid,
    rerank,
    filters,
    sources
  });

  // Optionally get facets
  let facetResults = null;
  if (facets) {
    facetResults = await semanticSearchService.facetedSearch(query, {
      filters,
      topK: 5
    });
  }

  res.success({
    ...searchResults,
    facets: facetResults?.facets || null
  });
}));

/**
 * POST /api/v2/knowledge
 * Create a new knowledge base entry
 */
router.post('/', authenticateToken, tryCatch(async (req, res) => {
  const {
    title,
    content,
    source = 'manual',
    sourceType = 'text',
    metadata = {},
    autoChunk = true,
    generateMetadata = true
  } = req.body;

  if (!content || typeof content !== 'string') {
    return res.error('Content is required', 'VALIDATION_ERROR', null, 400);
  }

  const externalId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const finalTitle = title || content.slice(0, 100);
  const contentPreview = content.slice(0, 500);

  // Generate enhanced metadata
  let enhancedMetadata = metadata;
  if (generateMetadata) {
    try {
      enhancedMetadata = await metadataTaggingService.generateMetadata(content, {
        existingMetadata: metadata
      });
    } catch (error) {
      logger.warn('[KnowledgeV2] Metadata generation failed:', error.message);
    }
  }

  // Save to database
  db.query(
    `INSERT INTO knowledge_base 
     (external_id, title, content, content_preview, source, source_type, tags, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      externalId,
      finalTitle,
      content,
      contentPreview,
      source,
      sourceType,
      JSON.stringify(enhancedMetadata.tags || []),
      JSON.stringify(enhancedMetadata)
    ]
  );

  // Chunk and index for vector search
  let chunks = [];
  if (autoChunk) {
    chunks = chunkingService.autoChunk(content, {
      chunkSize: 1000,
      chunkOverlap: 200
    });
  } else {
    chunks = [{ id: 'chunk_0', content }];
  }

  // Prepare vectors for indexing
  const vectors = chunks.map((chunk, i) => ({
    id: `${externalId}_chunk_${i}`,
    content: chunk.content,
    metadata: {
      ...enhancedMetadata,
      parentId: externalId,
      chunkIndex: i,
      totalChunks: chunks.length,
      title: finalTitle
    },
    source: externalId,
    sourceType
  }));

  // Index in vector store
  await vectorStoreManager.upsert(vectors);

  res.success({
    id: externalId,
    title: finalTitle,
    chunksIndexed: chunks.length,
    metadata: enhancedMetadata
  }, 'Knowledge entry created', 201);
}));

/**
 * POST /api/v2/knowledge/batch
 * Batch create knowledge entries
 */
router.post('/batch', authenticateToken, tryCatch(async (req, res) => {
  const { items, options = {} } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.error('Items array is required', 'VALIDATION_ERROR', null, 400);
  }

  const results = [];
  const errors = [];

  for (const item of items) {
    try {
      // Process each item similar to single create
      const externalId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate metadata if enabled
      let metadata = item.metadata || {};
      if (options.generateMetadata !== false) {
        metadata = await metadataTaggingService.generateMetadata(item.content, {
          existingMetadata: metadata
        });
      }

      // Save to DB
      db.query(
        `INSERT INTO knowledge_base 
         (external_id, title, content, content_preview, source, source_type, tags, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          externalId,
          item.title || item.content.slice(0, 100),
          item.content,
          item.content.slice(0, 500),
          item.source || 'batch',
          item.sourceType || 'text',
          JSON.stringify(metadata.tags || []),
          JSON.stringify(metadata)
        ]
      );

      // Chunk and index
      const chunks = options.autoChunk !== false 
        ? chunkingService.autoChunk(item.content)
        : [{ id: 'chunk_0', content: item.content }];

      const vectors = chunks.map((chunk, i) => ({
        id: `${externalId}_chunk_${i}`,
        content: chunk.content,
        metadata: {
          ...metadata,
          parentId: externalId,
          chunkIndex: i,
          totalChunks: chunks.length
        },
        source: externalId,
        sourceType: item.sourceType || 'text'
      }));

      await vectorStoreManager.upsert(vectors);

      results.push({ id: externalId, success: true });
    } catch (error) {
      errors.push({ item, error: error.message });
      results.push({ success: false, error: error.message });
    }
  }

  res.success({
    processed: results.length,
    successful: results.filter(r => r.success).length,
    failed: errors.length,
    errors: errors.slice(0, 10) // Limit error details
  });
}));

/**
 * GET /api/v2/knowledge/:id
 * Get single entry by ID
 */
router.get('/:id', authenticateToken, tryCatch(async (req, res) => {
  const { id } = req.params;

  const entry = db.query(
    `SELECT * FROM knowledge_base WHERE external_id = ? OR id = ?`,
    [id, id]
  );

  if (!entry || entry.length === 0) {
    return res.error('Entry not found', 'NOT_FOUND', null, 404);
  }

  const result = entry[0];
  result.metadata = typeof result.metadata === 'string' 
    ? JSON.parse(result.metadata) 
    : result.metadata;

  res.success(result);
}));

/**
 * PUT /api/v2/knowledge/:id
 * Update entry
 */
router.put('/:id', authenticateToken, tryCatch(async (req, res) => {
  const { id } = req.params;
  const { title, content, metadata } = req.body;

  // Check if exists
  const existing = db.query(
    `SELECT id FROM knowledge_base WHERE external_id = ? OR id = ?`,
    [id, id]
  );

  if (!existing || existing.length === 0) {
    return res.error('Entry not found', 'NOT_FOUND', null, 404);
  }

  const updates = [];
  const params = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (content !== undefined) {
    updates.push('content = ?');
    updates.push('content_preview = ?');
    params.push(content, content.slice(0, 500));
  }
  if (metadata !== undefined) {
    updates.push('metadata = ?');
    params.push(JSON.stringify(metadata));
  }

  if (updates.length === 0) {
    return res.error('No fields to update', 'VALIDATION_ERROR', null, 400);
  }

  params.push(id, id);

  db.query(
    `UPDATE knowledge_base SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE external_id = ? OR id = ?`,
    params
  );

  // Reindex if content changed
  if (content !== undefined) {
    await vectorStoreManager.deleteBySource(id);
    
    const chunks = chunkingService.autoChunk(content);
    const vectors = chunks.map((chunk, i) => ({
      id: `${id}_chunk_${i}`,
      content: chunk.content,
      metadata: { ...metadata, parentId: id, chunkIndex: i },
      source: id,
      sourceType: 'text'
    }));
    
    await vectorStoreManager.upsert(vectors);
  }

  res.success({ id }, 'Entry updated');
}));

/**
 * DELETE /api/v2/knowledge/:id
 * Delete entry
 */
router.delete('/:id', authenticateToken, tryCatch(async (req, res) => {
  const { id } = req.params;

  // Delete from vector store first
  await vectorStoreManager.deleteBySource(id);

  // Delete from database
  db.query(
    `DELETE FROM knowledge_base WHERE external_id = ? OR id = ?`,
    [id, id]
  );

  res.success({ id }, 'Entry deleted');
}));

/**
 * POST /api/v2/knowledge/upload
 * Upload and index a file
 */
router.post('/upload', authenticateToken, upload.single('file'), tryCatch(async (req, res) => {
  if (!req.file) {
    return res.error('No file uploaded', 'VALIDATION_ERROR', null, 400);
  }

  const { autoChunk = 'true', generateMetadata = 'true' } = req.body;
  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    // Read file content (basic text extraction - could be enhanced)
    let content = '';
    const ext = path.extname(fileName).toLowerCase();

    if (['.txt', '.md', '.csv', '.json'].includes(ext)) {
      content = await fs.readFile(filePath, 'utf-8');
    } else {
      // For other formats, we'd need proper parsers (PDF, DOCX, etc.)
      // For now, store as binary with placeholder content
      content = `[Binary file: ${fileName}]`;
    }

    // Create knowledge entry
    const externalId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileSize = (await fs.stat(filePath)).size;

    let metadata = {
      fileName,
      fileSize,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    if (generateMetadata === 'true') {
      metadata = await metadataTaggingService.generateMetadata(content, {
        existingMetadata: metadata
      });
    }

    // Save to DB
    db.query(
      `INSERT INTO knowledge_base 
       (external_id, title, content, content_preview, source, source_type, tags, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        externalId,
        fileName,
        content,
        content.slice(0, 500),
        'upload',
        ext.replace('.', '') || 'unknown',
        JSON.stringify(metadata.tags || []),
        JSON.stringify(metadata)
      ]
    );

    // Index chunks if text content
    if (content.startsWith('[') === false && autoChunk === 'true') {
      const chunks = chunkingService.autoChunk(content);
      const vectors = chunks.map((chunk, i) => ({
        id: `${externalId}_chunk_${i}`,
        content: chunk.content,
        metadata: { ...metadata, parentId: externalId, chunkIndex: i },
        source: externalId,
        sourceType: 'upload'
      }));

      await vectorStoreManager.upsert(vectors);
    }

    res.success({
      id: externalId,
      fileName,
      chunksIndexed: autoChunk === 'true' ? content.split('\n\n').length : 0,
      metadata
    }, 'File uploaded and indexed', 201);

  } finally {
    // Cleanup uploaded file
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn('[KnowledgeV2] Failed to cleanup uploaded file:', error.message);
    }
  }
}));

/**
 * POST /api/v2/knowledge/index
 * Trigger reindexing of all knowledge base content
 */
router.post('/index', authenticateToken, tryCatch(async (req, res) => {
  const { source, dryRun = false } = req.body;

  // Get all entries to reindex
  let sql = 'SELECT * FROM knowledge_base';
  const params = [];

  if (source) {
    sql += ' WHERE source = ?';
    params.push(source);
  }

  const entries = db.query(sql, params);

  if (dryRun) {
    return res.success({
      wouldIndex: entries.length,
      sources: [...new Set(entries.map(e => e.source))]
    }, 'Dry run - no changes made');
  }

  // Clear existing vectors for these sources
  const sources = [...new Set(entries.map(e => e.external_id))];
  for (const src of sources) {
    await vectorStoreManager.deleteBySource(src);
  }

  // Reindex each entry
  let totalChunks = 0;
  const errors = [];

  for (const entry of entries) {
    try {
      const content = entry.content;
      const chunks = chunkingService.autoChunk(content);

      const vectors = chunks.map((chunk, i) => ({
        id: `${entry.external_id}_chunk_${i}`,
        content: chunk.content,
        metadata: {
          parentId: entry.external_id,
          title: entry.title,
          chunkIndex: i,
          totalChunks: chunks.length
        },
        source: entry.external_id,
        sourceType: entry.source_type
      }));

      await vectorStoreManager.upsert(vectors);
      totalChunks += chunks.length;
    } catch (error) {
      errors.push({ entry: entry.external_id, error: error.message });
    }
  }

  res.success({
    entriesIndexed: entries.length,
    totalChunks,
    errors: errors.length > 0 ? errors : undefined
  }, 'Reindexing complete');
}));

/**
 * GET /api/v2/knowledge/stats
 * Get knowledge base statistics
 */
router.get('/stats', authenticateToken, tryCatch(async (req, res) => {
  // Database stats
  const dbStats = db.query(`
    SELECT 
      COUNT(*) as totalEntries,
      COUNT(DISTINCT source) as uniqueSources,
      COUNT(DISTINCT source_type) as uniqueTypes
    FROM knowledge_base
  `)[0];

  // Vector store stats
  const vectorStats = await vectorStoreManager.getStats();

  // Recent entries
  const recent = db.query(`
    SELECT external_id, title, source, created_at
    FROM knowledge_base
    ORDER BY created_at DESC
    LIMIT 5
  `);

  res.success({
    database: {
      totalEntries: dbStats.totalEntries,
      uniqueSources: dbStats.uniqueSources,
      uniqueTypes: dbStats.uniqueTypes
    },
    vectors: vectorStats,
    recentEntries: recent
  });
}));

/**
 * GET /api/v2/knowledge/health
 * Health check for vector services
 */
router.get('/health', tryCatch(async (req, res) => {
  const health = await vectorStoreManager.healthCheck();
  res.success(health);
}));

export default router;
