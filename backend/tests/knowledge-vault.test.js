/**
 * Knowledge Vault Integration Tests
 * 
 * Tests for:
 * - Vector embedding generation
 * - Chunking strategies
 * - Vector store operations
 * - Semantic search
 * - Metadata extraction
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { vectorEmbeddingService } from '../src/services/vector/VectorEmbeddingService.js';
import { sqliteVectorStore } from '../src/services/vector/SQLiteVectorStore.js';
import { chunkingService } from '../src/services/chunking-service.js';
import { semanticSearchService } from '../src/services/ai/semantic-search-service.js';
import { metadataTaggingService } from '../src/services/metadata-tagging-service.js';

describe('Knowledge Vault', () => {
  
  describe('VectorEmbeddingService', () => {
    it('should generate embeddings for text', async () => {
      const text = 'This is a test sentence for embedding generation.';
      const embedding = await vectorEmbeddingService.generate(text);
      
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      expect(embedding.every(n => typeof n === 'number')).toBe(true);
    });

    it('should generate batch embeddings', async () => {
      const texts = [
        'First test sentence.',
        'Second test sentence.',
        'Third test sentence.'
      ];
      
      const embeddings = await vectorEmbeddingService.generateBatch(texts);
      
      expect(embeddings.length).toBe(texts.length);
      embeddings.forEach(emb => {
        expect(Array.isArray(emb)).toBe(true);
        expect(emb.length).toBeGreaterThan(0);
      });
    });

    it('should calculate cosine similarity', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const vecC = [0, 1, 0];
      
      expect(vectorEmbeddingService.cosineSimilarity(vecA, vecB)).toBe(1);
      expect(vectorEmbeddingService.cosineSimilarity(vecA, vecC)).toBe(0);
    });
  });

  describe('ChunkingService', () => {
    const sampleText = `
# Introduction

This is the first paragraph of the introduction. It contains important information about the topic.

This is the second paragraph. It provides additional context and details.

## Section 1

First paragraph of section 1 with some technical content about plumbing.

Second paragraph of section 1 with more details about pipes and fittings.

## Section 2

Content for section 2 discussing water heaters and installation.

### Subsection

Detailed information about specific procedures.
`;

    it('should split text recursively', () => {
      const chunks = chunkingService.recursiveSplit(sampleText, {
        chunkSize: 200,
        chunkOverlap: 50
      });

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeGreaterThan(0);
        expect(chunk.wordCount).toBeGreaterThan(0);
      });
    });

    it('should detect markdown and chunk appropriately', () => {
      const chunks = chunkingService.splitMarkdown(sampleText);

      expect(chunks.length).toBeGreaterThan(0);
      
      // At least one chunk should have header metadata
      const chunksWithHeaders = chunks.filter(c => c.metadata?.headers?.length > 0);
      expect(chunksWithHeaders.length).toBeGreaterThan(0);
    });

    it('should auto-detect content type', () => {
      const markdown = '# Title\n\nContent here';
      const json = '{"key": "value"}';
      const code = 'function test() {\n  return true;\n}';

      const mdChunks = chunkingService.autoChunk(markdown);
      const jsonChunks = chunkingService.autoChunk(json);
      const codeChunks = chunkingService.autoChunk(code, { language: 'javascript' });

      expect(mdChunks.length).toBeGreaterThan(0);
      expect(jsonChunks.length).toBeGreaterThan(0);
      expect(codeChunks.length).toBeGreaterThan(0);
    });

    it('should calculate chunk statistics', () => {
      const chunks = chunkingService.recursiveSplit(sampleText);
      const stats = chunkingService.getStats(chunks);

      expect(stats).toHaveProperty('totalChunks');
      expect(stats).toHaveProperty('avgChunkSize');
      expect(stats).toHaveProperty('minChunkSize');
      expect(stats).toHaveProperty('maxChunkSize');
      expect(stats.totalChunks).toBe(chunks.length);
    });
  });

  describe('SQLiteVectorStore', () => {
    beforeAll(async () => {
      await sqliteVectorStore.initialize();
    });

    afterAll(async () => {
      // Cleanup test data
      try {
        await sqliteVectorStore.deleteBySource('test');
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it('should upsert and retrieve vectors', async () => {
      const vectors = [
        {
          id: 'test_1',
          values: [0.1, 0.2, 0.3, 0.4, 0.5],
          content: 'Test content 1',
          metadata: { tag: 'test' },
          source: 'test',
          sourceType: 'text'
        },
        {
          id: 'test_2',
          values: [0.2, 0.3, 0.4, 0.5, 0.6],
          content: 'Test content 2',
          metadata: { tag: 'test' },
          source: 'test',
          sourceType: 'text'
        }
      ];

      await sqliteVectorStore.upsert(vectors);
      
      const count = await sqliteVectorStore.count({ source: 'test' });
      expect(count).toBe(2);
    });

    it('should search vectors by similarity', async () => {
      const queryVector = [0.1, 0.2, 0.3, 0.4, 0.5];
      const results = await sqliteVectorStore.query(queryVector, {
        topK: 5,
        threshold: 0.5,
        filter: { source: 'test' }
      });

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('score');
        expect(results[0].score).toBeGreaterThanOrEqual(0.5);
      }
    });
  });

  describe('MetadataTaggingService', () => {
    it('should extract tags from content', async () => {
      const content = `
        Plumbing specifications for a new residential project.
        Water heater installation requires permits and inspection.
        Use PEX piping for all water lines.
        Contact John Smith at ABC Plumbing for questions.
      `;

      const metadata = await metadataTaggingService.extractTagsFast(content);

      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata.length).toBeGreaterThan(0);
      
      // Should detect plumbing-related tags
      expect(metadata.some(tag => tag.includes('plumbing'))).toBe(true);
    });
  });
});

// Manual test runner (if not using vitest)
export async function runKnowledgeVaultTests() {
  console.log('Running Knowledge Vault Tests...\n');

  const tests = [];
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    tests.push({ name, fn });
  }

  // Basic tests
  test('Embedding generation', async () => {
    const embedding = await vectorEmbeddingService.generate('test text');
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Invalid embedding');
    }
  });

  test('Chunking', async () => {
    const chunks = chunkingService.recursiveSplit('This is a test.\n\nAnother paragraph.');
    if (chunks.length === 0) {
      throw new Error('No chunks generated');
    }
  });

  test('Vector store operations', async () => {
    await sqliteVectorStore.initialize();
    await sqliteVectorStore.upsert([{
      id: 'manual_test',
      values: [0.1, 0.2, 0.3],
      content: 'test',
      source: 'manual_test',
      sourceType: 'test'
    }]);
    
    const results = await sqliteVectorStore.query([0.1, 0.2, 0.3], { topK: 1 });
    if (!Array.isArray(results)) {
      throw new Error('Query failed');
    }
  });

  // Run tests
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Export for use in other test files
export { runKnowledgeVaultTests };
