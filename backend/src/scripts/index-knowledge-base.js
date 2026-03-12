/**
 * Knowledge Base Indexer
 * Scans documentation and project files, chunks them, and stores embeddings in the DB.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { embeddingService } from '../services/ai/embedding-service.js';
import logger from '../services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../../');

const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const TARGET_FILES = [
  path.join(ROOT_DIR, 'GEMINI.md'),
  path.join(ROOT_DIR, 'README.md'),
  path.join(ROOT_DIR, 'PLAN.md'),
  path.join(ROOT_DIR, 'MODELS.md'),
];

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

/**
 * Chunk text into manageable pieces for embedding
 */
function chunkText(text, size = 1500, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.substring(start, end));
    start += size - overlap;
  }
  return chunks;
}

async function indexFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(ROOT_DIR, filePath);
    const title = path.basename(filePath);
    
    logger.info(`[Indexer] Indexing ${relativePath}...`);
    
    // 1. Chunking
    const chunks = chunkText(content);
    
    // 2. Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await embeddingService.generate(chunkContent);
      
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const sql = `
        INSERT INTO knowledge_base 
        (id, title, content, source_type, source_path, embedding, metadata, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        id,
        `${title} (Part ${i + 1})`,
        chunkContent,
        'markdown',
        relativePath,
        JSON.stringify(embedding),
        JSON.stringify({ chunkIndex: i, totalChunks: chunks.length }),
        now,
        now
      ];
      
      await db.run(sql, params);
    }
    
    logger.info(`[Indexer] Successfully indexed ${relativePath} (${chunks.length} chunks)`);
  } catch (err) {
    logger.error(`[Indexer] Failed to index ${filePath}:`, err.message);
  }
}

async function run() {
  logger.info('[Indexer] Starting knowledge base indexing...');
  
  // Clear old index
  await db.run('DELETE FROM knowledge_base');
  
  const allFiles = [...TARGET_FILES, ...findMarkdownFiles(DOCS_DIR)];
  const existingFiles = allFiles.filter(f => fs.existsSync(f));
  
  logger.info(`[Indexer] Found ${existingFiles.length} files to index.`);
  
  for (const file of existingFiles) {
    await indexFile(file);
  }
  
  logger.info('[Indexer] Knowledge base indexing complete.');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal Indexer Error:', err);
  process.exit(1);
});
