# Knowledge Vault & AI Data Pipeline Implementation

## Overview

The Knowledge Vault & AI Data Pipeline provides a comprehensive system for ingesting, processing, indexing, and searching documents using advanced AI techniques. This implementation replaces the previous basic knowledge base with a production-ready vector search system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Knowledge Vault Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   Document   │───▶│   Chunking   │───▶│  Embedding   │───▶│  Vector  │  │
│  │    Ingest    │    │   Service    │    │   Service    │    │  Store   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘  │
│         │                   │                   │                │          │
│         ▼                   ▼                   ▼                ▼          │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                      Processing Pipeline                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ OCR Prep │─▶│ Metadata │─▶│  Chunk   │─▶│ Vector Embedding │   │   │
│  │  │ (Sharp)  │  │  (LLM)   │  │(Recursive│  │(OpenAI/HF/Ollama)│   │   │
│  │  └──────────┘  └──────────┘  │Character)│  └──────────────────┘   │   │
│  │                             └──────────┘                         │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     Search Capabilities                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │   Semantic   │  │   Hybrid     │  │       Faceted            │  │   │
│  │  │   Search     │  │  (Vector +   │  │     (by source/type)     │  │   │
│  │  │(Embeddings)  │  │  Keyword)    │  │                          │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Vector Embedding Service (`backend/src/services/vector/VectorEmbeddingService.js`)

Multi-provider embedding generation with automatic fallback:

| Provider | Models | Dimensions | Batch Size |
|----------|--------|------------|------------|
| OpenAI | text-embedding-3-small | 1536 | 100 |
| OpenAI | text-embedding-3-large | 3072 | 100 |
| HuggingFace | sentence-transformers/all-mpnet-base-v2 | 768 | 32 |
| Ollama | nomic-embed-text | 768 | 4 |

**Features:**
- Provider priority: OpenAI → HuggingFace → Ollama (local)
- Automatic fallback on failure
- Batch processing with progress callbacks
- Cosine similarity calculation

**Environment Variables:**
```bash
EMBEDDING_PROVIDER=openai  # or 'huggingface', 'ollama'
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
OLLAMA_URL=http://localhost:11434
EMBEDDING_DIMENSIONS=1536
```

### 2. Vector Store Implementations

#### Pinecone (`PineconeVectorStore.js`)
- **Use case:** Production cloud deployments
- **Features:** Serverless scaling, metadata filtering, hybrid search
- **Setup:** Requires `PINECONE_API_KEY`

#### PGVector (`PGVectorStore.js`)
- **Use case:** PostgreSQL-based deployments
- **Features:** Native SQL queries, ACID transactions, ivfflat indexing
- **Setup:** Requires PostgreSQL with pgvector extension

#### SQLite Fallback (`SQLiteVectorStore.js`)
- **Use case:** Development or small deployments
- **Features:** JSON storage, JavaScript similarity, no external dependencies
- **Limitations:** Brute-force search (O(n)), suitable for < 100k vectors

### 3. Vector Store Manager (`VectorStoreManager.js`)

Unified interface with automatic store selection:

```javascript
// Automatic store selection (priority: Pinecone → pgvector → SQLite)
await vectorStoreManager.initialize();

// Upsert vectors
await vectorStoreManager.upsert([{
  id: 'doc_1_chunk_0',
  content: 'text content...',
  metadata: { source: 'manual', tags: ['plumbing'] },
  source: 'doc_1',
  sourceType: 'text'
}]);

// Semantic search
const results = await vectorStoreManager.search('query text', {
  topK: 10,
  threshold: 0.7,
  filter: { source: 'manual' }
});

// Hybrid search (vector + keyword)
const hybridResults = await vectorStoreManager.hybridSearch('query', {
  topK: 10,
  keywordWeight: 0.3
});
```

### 4. Semantic Search Service (`semantic-search-service.js`)

Advanced search with multiple strategies:

| Strategy | Description | Use Case |
|----------|-------------|----------|
| Pure Semantic | Vector similarity only | Conceptual queries |
| Hybrid | Vector + Keyword (RRF) | Balanced precision/recall |
| Faceted | Grouped by source/type | Browse by category |

**Reciprocal Rank Fusion (RRF) Formula:**
```
score = Σ(1 / (k + rank))
where k = 60 (constant)
```

### 5. Chunking Service (`chunking-service.js`)

Multiple chunking strategies for different content types:

| Strategy | Best For | Separators |
|----------|----------|------------|
| Recursive Character | General text | `\n\n`, `\n`, `. `, `? `, `! `, ` ` |
| Markdown | Documentation | `\n## `, `\n### `, `\n\n`, `\n` |
| Code | Source files | `\nclass `, `\nfunction `, `\n\n` |
| JSON | API responses | `}\n{`, `,\n` |
| Semantic | Natural language | Sentence boundaries |

**Example:**
```javascript
// Auto-detect content type and chunk
const chunks = chunkingService.autoChunk(markdownContent, {
  chunkSize: 1000,
  chunkOverlap: 200
});

// Markdown-aware chunking
const mdChunks = chunkingService.splitMarkdown(markdownContent);
// Preserves headers in metadata
```

### 6. OCR Preprocessing Service (`ocr-preprocessing-service.js`)

Image enhancement for better OCR accuracy using Sharp:

| Enhancement | Purpose | Default |
|-------------|---------|---------|
| Resize | Optimize for vision APIs | 2048px max |
| Grayscale | Reduce noise | Enabled |
| Contrast | Improve text clarity | 1.2x |
| Sharpen | Edge enhancement | σ=1.0 |
| Normalize | Histogram equalization | Enabled |
| Binarization | Black/white text | Optional |

**Presets:**
```javascript
// Blueprints/technical drawings
await ocrPreprocessingService.preprocessBlueprint(imageBuffer);

// Receipts/invoices
await ocrPreprocessingService.preprocessReceipt(imageBuffer);

// Handwritten text
await ocrPreprocessingService.preprocessHandwritten(imageBuffer);
```

### 7. Metadata Tagging Service (`metadata-tagging-service.js`)

LLM-based automatic metadata extraction:

**Extracted Fields:**
- Title and summary
- Tags and categories
- Document type (blueprint, contract, invoice, etc.)
- Relevant trades (plumbing, electrical, HVAC)
- Project phase
- Materials mentioned
- Priority and status
- Entities (people, organizations, locations, dates)
- Language detection

**Domain Categories:**
```javascript
documentTypes: ['blueprint', 'specification', 'contract', 'invoice', 
                'permit', 'inspection_report', 'estimate', 'work_order']
trades: ['plumbing', 'electrical', 'hvac', 'framing', 'concrete']
materials: ['pvc', 'copper', 'pex', 'cast_iron', 'fixtures', 'valves']
```

## API Endpoints

### Knowledge Base v2 Routes (`/api/v2/knowledge`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List entries with pagination |
| POST | `/search` | Pure semantic search |
| POST | `/query` | Hybrid search with reranking |
| POST | `/` | Create entry with auto-chunking |
| POST | `/batch` | Batch create entries |
| GET | `/:id` | Get single entry |
| PUT | `/:id` | Update entry |
| DELETE | `/:id` | Delete entry and vectors |
| POST | `/upload` | Upload and index file |
| POST | `/index` | Reindex all content |
| GET | `/stats` | Statistics |
| GET | `/health` | Health check |

### Example Usage

#### Semantic Search
```bash
curl -X POST http://localhost:5001/api/v2/knowledge/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "water heater installation requirements",
    "topK": 10,
    "threshold": 0.7,
    "filters": { "sourceType": "specification" }
  }'
```

#### Hybrid Search
```bash
curl -X POST http://localhost:5001/api/v2/knowledge/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "plumbing rough in",
    "topK": 10,
    "useHybrid": true,
    "rerank": true,
    "facets": true
  }'
```

#### Create Entry
```bash
curl -X POST http://localhost:5001/api/v2/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Water Heater Specs",
    "content": "Tankless water heaters require...",
    "source": "manual",
    "sourceType": "specification",
    "autoChunk": true,
    "generateMetadata": true
  }'
```

## Database Schema

### knowledge_base Table
```sql
CREATE TABLE knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE NOT NULL,
  title TEXT,
  content TEXT,
  content_preview TEXT,
  source TEXT,
  source_type TEXT,
  tags TEXT, -- JSON array
  metadata TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### vector_embeddings Table (SQLite)
```sql
CREATE TABLE vector_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE NOT NULL,
  embedding TEXT NOT NULL, -- JSON array
  content TEXT,
  metadata TEXT DEFAULT '{}',
  source TEXT,
  source_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### PGVector Table (PostgreSQL)
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE vector_embeddings (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  embedding VECTOR(768),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  source VARCHAR(255),
  source_type VARCHAR(100)
);

CREATE INDEX idx_vector_embeddings_embedding 
ON vector_embeddings USING ivfflat (embedding vector_cosine_ops);
```

## Migration from v1

### Step 1: Environment Setup
```bash
# Add to .env
EMBEDDING_PROVIDER=ollama  # or openai/huggingface
OLLAMA_URL=http://localhost:11434
PREFERRED_VECTOR_STORE=auto  # or pinecone/pgvector/sqlite

# For Pinecone
PINECONE_API_KEY=pc_...
PINECONE_INDEX=opensite-knowledge

# For PostgreSQL/pgvector
DATABASE_URL=postgresql://user:pass@localhost/opensite
```

### Step 2: Install Dependencies
```bash
cd backend
npm install sharp @pinecone-database/pinecone
```

### Step 3: Reindex Existing Content
```bash
# Trigger reindex via API
curl -X POST http://localhost:5001/api/v2/knowledge/index \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 4: Update Frontend (Optional)
The v2 API is backward-compatible with v1 responses, but new features require v2 endpoints.

## Performance Considerations

| Metric | SQLite | PGVector | Pinecone |
|--------|--------|----------|----------|
| Max Vectors | ~100K | Millions | Unlimited |
| Query Latency | 50-500ms | 10-50ms | 10-100ms |
| Index Build | N/A | Minutes | Automatic |
| Cost | Free | DB cost | Usage-based |
| Best For | Dev/Testing | Self-hosted | Production |

## Troubleshooting

### Issue: "No vector store available"
**Solution:** Check that at least one store is properly configured:
- SQLite: Always available
- PGVector: Check PostgreSQL connection and pgvector extension
- Pinecone: Verify API key and index name

### Issue: Slow search performance
**Solution:**
- Reduce `topK` parameter
- Add filters to narrow search space
- Consider migrating to Pinecone/pgvector

### Issue: Embedding generation fails
**Solution:**
- Check Ollama is running: `curl http://localhost:11434/api/tags`
- Verify API keys for cloud providers
- Check embedding dimensions match vector store

## Future Enhancements

1. **Cross-encoder Reranking**: Implement proper BERT-based reranking
2. **Multi-modal Search**: Index images alongside text
3. **Real-time Sync**: WebSocket updates for new documents
4. **Query Suggestions**: LLM-generated query refinements
5. **Analytics Dashboard**: Search usage and quality metrics

## References

- [Pinecone Documentation](https://docs.pinecone.io/)
- [PGVector GitHub](https://github.com/pgvector/pgvector)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [LangChain Text Splitters](https://python.langchain.com/docs/modules/data_connection/document_transformers/)
