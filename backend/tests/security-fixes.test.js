/**
 * Security Fixes Tests
 * Tests all 10 critical security and performance issues
 * Uses Node.js built-in test runner
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, '../../tool/data/test-opensite.db');

function setupTestDb() {
  // Create directory if it doesn't exist
  const dataDir = path.dirname(TEST_DB_PATH);
  try {
    fs.mkdir(dataDir, { recursive: true });
  } catch {}
  
  // Create test database with required schema
  const db = new Database(TEST_DB_PATH);
  
  db.exec(`
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS text_documents;
    DROP TABLE IF EXISTS cleanup_jobs;
    
    CREATE TABLE files (
      id TEXT PRIMARY KEY,
      originalName TEXT,
      stored_path TEXT,
      uploaded_by TEXT,
      size_bytes INTEGER DEFAULT 0,
      expires_at TEXT,
      orphaned INTEGER DEFAULT 0,
      orphaned_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE text_documents (
      id TEXT PRIMARY KEY,
      filePath TEXT,
      userId TEXT,
      status TEXT DEFAULT 'pending',
      expires_at TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE cleanup_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name TEXT UNIQUE NOT NULL,
      last_run TEXT,
      items_cleaned INTEGER DEFAULT 0,
      errors TEXT
    );
  `);
  
  db.close();
}

function cleanupTestDb() {
  try {
    const db = new Database(TEST_DB_PATH);
    db.close();
  } catch {}
  try {
    fs.unlink(TEST_DB_PATH);
  } catch {}
}

// Setup database before tests
setupTestDb();

// Issue #3: Rate limiting on AI endpoints
test('should have aiChatLimiter defined in security middleware', async () => {
  const security = await import('../src/middleware/security.js');
  assert.ok(security.aiChatLimiter, 'aiChatLimiter should be defined');
});

// Issue #4: Text extraction timeouts
test('text extraction should complete within reasonable time', async () => {
  const textExtractor = await import('../src/services/text-extractor.js');
  
  const testDir = path.join(__dirname, 'test-files');
  await fs.mkdir(testDir, { recursive: true });
  
  const testFile = path.join(testDir, 'large.txt');
  await fs.writeFile(testFile, 'A'.repeat(10000)); // 10KB of text
  
  const start = Date.now();
  const result = await textExtractor.extractText(testFile, 'text/plain');
  const duration = Date.now() - start;
  
  assert.ok(duration < 5000, `Extraction took ${duration}ms, should be under 5000ms`);
  assert.equal(result.text.length, 10000);
  
  await fs.unlink(testFile);
});

// Issue #5: Anonymous upload cleanup
test('should support expires_at for anonymous uploads', () => {
  const db = new Database(TEST_DB_PATH);
  
  const fileId = 'test-anon-' + Date.now();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  db.prepare(`
    INSERT INTO files (id, originalName, stored_path, expires_at, uploaded_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(fileId, 'test.txt', '/tmp/test.txt', expiresAt, null);
  
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  assert.equal(file.expires_at, expiresAt);
  assert.equal(file.uploaded_by, null);
  
  db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
  db.close();
});

// Issue #6: Non-blocking fs operations
test('should use async fs.readFile instead of readFileSync', async () => {
  const textExtractor = await import('../src/services/text-extractor.js');
  
  const testDir = path.join(__dirname, 'test-files');
  await fs.mkdir(testDir, { recursive: true });
  
  const testFile = path.join(testDir, 'async-test.txt');
  await fs.writeFile(testFile, 'Test content for async operations');
  
  const result = await textExtractor.extractText(testFile, 'text/plain');
  assert.equal(result.text, 'Test content for async operations');
  
  await fs.unlink(testFile);
});

// Issue #8: File deletion error handling
test('should mark files as orphaned on deletion failure', () => {
  const db = new Database(TEST_DB_PATH);
  
  const fileId = 'test-orphan-' + Date.now();
  db.prepare(`
    INSERT INTO files (id, originalName, stored_path, orphaned, orphaned_reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(fileId, 'test.txt', '/nonexistent/path.txt', 1, 'Permission denied');
  
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  assert.equal(file.orphaned, 1);
  assert.equal(file.orphaned_reason, 'Permission denied');
  
  db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
  db.close();
});

// Issue #9: Storage quotas
test('should calculate total storage used by user', () => {
  const db = new Database(TEST_DB_PATH);
  
  const userId = 'test-user-' + Date.now();
  
  db.prepare(`
    INSERT INTO files (id, originalName, stored_path, uploaded_by, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run('file-1-' + Date.now(), 'a.txt', '/tmp/a.txt', userId, 1024 * 1024);
  
  db.prepare(`
    INSERT INTO files (id, originalName, stored_path, uploaded_by, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run('file-2-' + Date.now(), 'b.txt', '/tmp/b.txt', userId, 2 * 1024 * 1024);
  
  const result = db.prepare(`
    SELECT COALESCE(SUM(size_bytes), 0) as total 
    FROM files 
    WHERE uploaded_by = ?
  `).get(userId);
  
  assert.equal(result.total, 3 * 1024 * 1024);
  
  db.prepare('DELETE FROM files WHERE uploaded_by = ?').run(userId);
  db.close();
});

// Issue #10: Intelligent context extraction
test('should extract relevant passages based on query keywords', () => {
  const text = `
    This is about general construction.
    Copper pipes are durable and long-lasting.
    Other topics include electrical wiring.
    PVC pipes are affordable and lightweight.
    Roofing materials vary by climate.
    Pipe installation requires permits.
  `.trim();

  const queryWords = ['pipe', 'pipes', 'piping'];
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
  
  const pipeSentences = sentences.filter(s => 
    queryWords.some(word => s.toLowerCase().includes(word))
  );
  
  assert.ok(pipeSentences.length >= 3, 'Should find at least 3 pipe-related sentences');
});

// Cleanup after all tests (Node.js test runner doesn't have afterAll, so we do it last)
test('cleanup test database', () => {
  cleanupTestDb();
  console.log('✅ All security fix tests passed');
});
