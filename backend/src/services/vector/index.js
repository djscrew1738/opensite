/**
 * Vector Services Index
 * 
 * Unified exports for all vector-related services:
 * - VectorEmbeddingService: Generate embeddings via multiple providers
 * - VectorStoreManager: Unified interface for Pinecone/pgvector/SQLite
 * - SemanticSearchService: Advanced semantic + hybrid search
 * - ChunkingService: Text chunking with multiple strategies
 * - MetadataTaggingService: LLM-based auto-tagging
 * - OCRPreprocessingService: Image preprocessing for OCR
 */

export { vectorEmbeddingService, VectorEmbeddingService } from './VectorEmbeddingService.js';
export { vectorStoreManager, VectorStoreManager } from './VectorStoreManager.js';
export { pineconeVectorStore, PineconeVectorStore } from './PineconeVectorStore.js';
export { pgVectorStore, PGVectorStore } from './PGVectorStore.js';
export { sqliteVectorStore, SQLiteVectorStore } from './SQLiteVectorStore.js';

// Re-export other services from ai directory for convenience
export { semanticSearchService } from '../ai/semantic-search-service.js';
export { chunkingService } from '../chunking-service.js';
export { metadataTaggingService } from '../metadata-tagging-service.js';
export { ocrPreprocessingService } from '../ocr-preprocessing-service.js';
