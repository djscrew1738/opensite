const fetch = require('node-fetch');
const db = require('../db');
const config = require('../config');

/**
 * Generate embedding for text using Ollama
 */
async function embed(text) {
  const response = await fetch(`${config.ollama.url}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.embedModel,
      prompt: text.substring(0, 8000),
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding failed: ${response.status}`);
  }

  const result = await response.json();
  return result.embedding;
}

/**
 * Embed transcript and store chunks
 */
async function embedSession(sessionId, projectId, transcript) {
  console.log(`[Embeddings] Creating chunks for session ${sessionId}`);
  
  // Split into chunks (simple sentence-based)
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
  const chunks = [];
  
  for (let i = 0; i < sentences.length; i += 3) {
    const chunkText = sentences.slice(i, i + 3).join(' ').trim();
    if (chunkText.length > 20) {
      chunks.push(chunkText);
    }
  }

  // Embed and store each chunk
  for (const chunkText of chunks) {
    try {
      const embedding = await embed(chunkText);
      await db.query(
        `INSERT INTO chunks (session_id, project_id, chunk_type, content, embedding)
         VALUES ($1, $2, 'transcript', $3, $4)`,
        [sessionId, projectId, chunkText, JSON.stringify(embedding)]
      );
    } catch (err) {
      console.error(`[Embeddings] Chunk failed: ${err.message}`);
    }
  }

  console.log(`[Embeddings] Stored ${chunks.length} chunks`);
}

/**
 * Embed summary
 */
async function embedSummary(sessionId, projectId, summary) {
  try {
    const embedding = await embed(summary);
    await db.query(
      `INSERT INTO chunks (session_id, project_id, chunk_type, content, embedding)
       VALUES ($1, $2, 'summary', $3, $4)`,
      [sessionId, projectId, summary, JSON.stringify(embedding)]
    );
    console.log('[Embeddings] Summary embedded');
  } catch (err) {
    console.error(`[Embeddings] Summary embed failed: ${err.message}`);
  }
}

/**
 * Search for similar chunks
 */
async function searchChunks(query, options = {}) {
  const { projectId, limit = 5 } = options;
  
  const embedding = await embed(query);
  
  let sql = `
    SELECT c.*, 
           1 - (c.embedding <=> $1) as similarity
    FROM chunks c
    WHERE c.embedding IS NOT NULL
  `;
  const params = [JSON.stringify(embedding)];
  
  if (projectId) {
    params.push(projectId);
    sql += ` AND c.project_id = $${params.length}`;
  }
  
  sql += ` ORDER BY c.embedding <=> $1 LIMIT $${params.length + 1}`;
  params.push(limit);
  
  const { rows } = await db.query(sql, params);
  return rows;
}

module.exports = { embed, embedSession, embedSummary, searchChunks };
