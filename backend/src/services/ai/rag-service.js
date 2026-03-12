/**
 * AI RAG Service (Retrieval-Augmented Generation)
 * Provides context from the local database (Materials, Leads, Blueprints) to the AI.
 */

import { db } from '../database.js';
import { embeddingService } from './embedding-service.js';
import logger from '../logger.js';

class RAGService {
  constructor() {
    this.maxContextChunks = 5;
  }

  /**
   * Searches for context related to a query
   * pulls from multiple sources and returns a synthesized context string.
   */
  async getContext(query, options = {}) {
    try {
      const sources = options.sources || ['materials', 'leads', 'blueprints', 'knowledge'];
      const results = [];

      if (sources.includes('materials')) {
        const materials = await this._searchMaterials(query);
        results.push(...materials.map(m => `MATERIAL: ${m.name} - ${m.unitCost}/${m.unit} (${m.category})`));
      }

      if (sources.includes('leads')) {
        const leads = await this._searchLeads(query);
        results.push(...leads.map(l => `LEAD: ${l.name} - ${l.projectType} (${l.status}) at ${l.location}`));
      }

      if (sources.includes('blueprints')) {
        const blueprints = await this._searchBlueprints(query);
        results.push(...blueprints.map(b => `BLUEPRINT (${b.fileName}): ${b.aiAnalysis?.substring(0, 500)}`));
      }

      if (sources.includes('knowledge')) {
        const knowledge = await this._searchKnowledge(query);
        results.push(...knowledge.map(k => `KNOWLEDGE (${k.title}): ${k.content}`));
      }

      return results.join('\n---\n');
    } catch (err) {
      logger.error('[RAGService] Context retrieval failed:', err.message);
      return '';
    }
  }

  /**
   * Search knowledge base using vector similarity
   */
  async _searchKnowledge(query) {
    try {
      const queryEmbedding = await embeddingService.generate(query);
      const allEntries = await db.all('SELECT id, title, content, embedding FROM knowledge_base');

      const scored = allEntries.map(entry => {
        try {
          const entryEmbedding = JSON.parse(entry.embedding);
          const similarity = this._cosineSimilarity(queryEmbedding, entryEmbedding);
          return { ...entry, similarity };
        } catch (e) {
          return { ...entry, similarity: 0 };
        }
      });

      // Sort by similarity and take top 5
      return scored
        .sort((a, b) => b.similarity - a.similarity)
        .filter(s => s.similarity > 0.6) // Threshold for relevance
        .slice(0, 5);
    } catch (err) {
      logger.error('[RAGService] Knowledge search failed:', err.message);
      return [];
    }
  }

  /**
   * Simple cosine similarity calculation
   */
  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * SQLite keyword-based search for materials
   */
  async _searchMaterials(query) {
    // Simple but effective SQL for context retrieval
    const sql = `
      SELECT name, category, unit, unitCost 
      FROM materials 
      WHERE name LIKE ? OR category LIKE ? OR description LIKE ?
      LIMIT 10
    `;
    const searchStr = `%${query}%`;
    return await db.all(sql, [searchStr, searchStr, searchStr]);
  }

  /**
   * SQLite keyword-based search for leads
   */
  async _searchLeads(query) {
    const sql = `
      SELECT name, projectType, location, status 
      FROM leads 
      WHERE name LIKE ? OR projectType LIKE ? OR notes LIKE ?
      LIMIT 5
    `;
    const searchStr = `%${query}%`;
    return await db.all(sql, [searchStr, searchStr, searchStr]);
  }

  /**
   * Search for analyzed blueprints
   */
  async _searchBlueprints(query) {
    const sql = `
      SELECT fileName, aiAnalysis 
      FROM blueprints 
      WHERE fileName LIKE ? OR aiAnalysis LIKE ?
      LIMIT 3
    `;
    const searchStr = `%${query}%`;
    return await db.all(sql, [searchStr, searchStr]);
  }
}

export const ragService = new RAGService();
export default ragService;
