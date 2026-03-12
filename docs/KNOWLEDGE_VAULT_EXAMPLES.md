# Knowledge Vault Examples

Practical examples for using the Knowledge Vault & AI Data Pipeline.

## Table of Contents

1. [Basic Semantic Search](#basic-semantic-search)
2. [Document Ingestion](#document-ingestion)
3. [Hybrid Search with Filters](#hybrid-search-with-filters)
4. [Batch Processing](#batch-processing)
5. [Frontend Integration](#frontend-integration)

---

## Basic Semantic Search

### Using the API

```bash
# Simple semantic search
curl -X POST http://localhost:5001/api/v2/knowledge/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "water heater installation requirements",
    "topK": 5,
    "threshold": 0.7
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "query": "water heater installation requirements",
    "results": [
      {
        "id": "doc_123_chunk_0",
        "score": 0.89,
        "content": "Tankless water heaters require specific venting...",
        "metadata": {
          "parentId": "doc_123",
          "title": "Water Heater Guide",
          "tags": ["water_heater", "installation"],
          "chunkIndex": 0
        },
        "source": "doc_123",
        "sourceType": "specification"
      }
    ],
    "total": 1
  }
}
```

---

## Document Ingestion

### Single Document with Auto-Chunking

```bash
curl -X POST http://localhost:5001/api/v2/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Plumbing Code Requirements",
    "content": "## Chapter 1: General Requirements\n\nAll plumbing work must comply with local building codes...\n\n## Chapter 2: Pipe Sizing\nPipe sizing calculations must account for...",
    "source": "manual",
    "sourceType": "specification",
    "autoChunk": true,
    "generateMetadata": true
  }'
```

### File Upload

```bash
curl -X POST http://localhost:5001/api/v2/knowledge/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/plumbing-specs.pdf" \
  -F "autoChunk=true" \
  -F "generateMetadata=true"
```

### Using JavaScript

```javascript
import { useKnowledgeBase } from './hooks/useKnowledgeBase.js';

function DocumentUploader() {
  const { createEntry, uploadFile, loading } = useKnowledgeBase();

  const handleTextSubmit = async (text) => {
    const result = await createEntry({
      title: 'My Document',
      content: text,
      autoChunk: true,
      generateMetadata: true
    });
    console.log('Created:', result.data.id);
  };

  const handleFileUpload = async (file) => {
    const result = await uploadFile(file, {
      autoChunk: true,
      generateMetadata: true
    });
    console.log('Uploaded:', result.data.id);
  };
}
```

---

## Hybrid Search with Filters

### Search with Metadata Filters

```bash
curl -X POST http://localhost:5001/api/v2/knowledge/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "PEX pipe installation",
    "topK": 10,
    "useHybrid": true,
    "rerank": true,
    "filters": {
      "sourceType": "specification"
    },
    "sources": ["doc_123", "doc_456"],
    "facets": true
  }'
```

### Response with Facets

```json
{
  "success": true,
  "data": {
    "query": "PEX pipe installation",
    "results": [...],
    "facets": [
      {
        "source": "doc_123",
        "count": 5,
        "topResults": [...]
      },
      {
        "source": "doc_456",
        "count": 3,
        "topResults": [...]
      }
    ],
    "total": 8,
    "duration": 245
  }
}
```

---

## Batch Processing

### Multiple Documents

```bash
curl -X POST http://localhost:5001/api/v2/knowledge/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "title": "Document 1",
        "content": "Content of document 1...",
        "source": "batch",
        "sourceType": "manual"
      },
      {
        "title": "Document 2",
        "content": "Content of document 2...",
        "source": "batch",
        "sourceType": "manual"
      }
    ],
    "options": {
      "autoChunk": true,
      "generateMetadata": true
    }
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "processed": 2,
    "successful": 2,
    "failed": 0
  }
}
```

---

## Frontend Integration

### Search Component

```jsx
import { useSemanticSearch } from './hooks/useSemanticSearch.js';

function KnowledgeSearch() {
  const { 
    results, 
    loading, 
    error, 
    search, 
    facets,
    duration 
  } = useSemanticSearch();

  const handleSearch = (query) => {
    search(query, {
      topK: 10,
      useHybrid: true,
      rerank: true,
      facets: true
    });
  };

  return (
    <div>
      <SearchInput onSearch={handleSearch} loading={loading} />
      
      {error && <ErrorMessage message={error} />}
      
      {results.length > 0 && (
        <>
          <p>Found {results.length} results in {duration}ms</p>
          
          {/* Facets */}
          {facets && (
            <FacetList facets={facets} />
          )}
          
          {/* Results */}
          <ResultList results={results} />
        </>
      )}
    </div>
  );
}
```

### Debounced Search Input

```jsx
import { useDebouncedSemanticSearch } from './hooks/useSemanticSearch.js';

function LiveSearch() {
  const { query, setQuery, results, loading } = useDebouncedSemanticSearch({
    delay: 300,
    minLength: 3,
    topK: 5,
    useHybrid: true
  });

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search knowledge base..."
      />
      
      {loading && <Spinner />}
      
      <SearchResults results={results} />
    </div>
  );
}
```

### Document Management

```jsx
import { useKnowledgeBase } from './hooks/useKnowledgeBase.js';

function DocumentManager() {
  const { 
    createEntry, 
    updateEntry, 
    deleteEntry, 
    uploadFile,
    getStats,
    loading 
  } = useKnowledgeBase();

  const handleCreate = async (content) => {
    try {
      const result = await createEntry({
        title: 'New Document',
        content,
        autoChunk: true,
        generateMetadata: true
      });
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this document?')) {
      await deleteEntry(id);
    }
  };

  const handleFileDrop = async (files) => {
    for (const file of files) {
      await uploadFile(file, {
        autoChunk: true,
        generateMetadata: true
      });
    }
  };

  return (
    <div>
      <DropZone onDrop={handleFileDrop} />
      <DocumentList onDelete={handleDelete} />
    </div>
  );
}
```

---

## Advanced: Custom Chunking

### Server-Side Custom Chunking

```javascript
import { chunkingService } from './services/chunking-service.js';

// Markdown-aware chunking for documentation
const markdownContent = await fs.readFile('docs/manual.md', 'utf-8');
const chunks = chunkingService.splitMarkdown(markdownContent, {
  chunkSize: 1000,
  chunkOverlap: 200
});

// Code-aware chunking for source files
const codeContent = await fs.readFile('src/plumbing.js', 'utf-8');
const codeChunks = chunkingService.splitCode(codeContent, 'javascript', {
  chunkSize: 1500
});

// Semantic chunking for natural language
const articleContent = await fs.readFile('article.txt', 'utf-8');
const semanticChunks = chunkingService.splitSemantic(articleContent, {
  targetTokens: 200,
  maxSentences: 5
});
```

---

## Advanced: OCR Preprocessing

### Server-Side Image Enhancement

```javascript
import { ocrPreprocessingService } from './services/ocr-preprocessing-service.js';
import sharp from 'sharp';

// Process blueprint image
const blueprintBuffer = await fs.readFile('blueprint.jpg');
const processedBuffer = await ocrPreprocessingService.preprocessBlueprint(blueprintBuffer);

// Now send to Vision API
const visionResult = await callVisionAPI(processedBuffer);

// Or process receipt
const receiptBuffer = await fs.readFile('receipt.jpg');
const processedReceipt = await ocrPreprocessingService.preprocessReceipt(receiptBuffer);
```

---

## Testing

### Run Integration Tests

```bash
# Run all Knowledge Vault tests
cd backend
npm test -- tests/knowledge-vault.test.js

# Or run manual tests
node -e "
  import('./tests/knowledge-vault.test.js').then(m => m.runKnowledgeVaultTests());
"
```

### Test Individual Components

```javascript
// Test embedding generation
const embedding = await vectorEmbeddingService.generate('test text');
console.log('Dimensions:', embedding.length);

// Test chunking
const chunks = chunkingService.recursiveSplit(longText);
console.log('Chunks:', chunks.length);

// Test vector store
await sqliteVectorStore.upsert([{ id: 'test', values: [0.1, 0.2], content: 'test', source: 'test', sourceType: 'test' }]);
const results = await sqliteVectorStore.query([0.1, 0.2], { topK: 5 });
console.log('Results:', results.length);
```

---

## Performance Tips

1. **Use Batch Operations**: Process multiple documents together
2. **Enable Caching**: Frontend search results are cached for 5 minutes
3. **Add Filters**: Narrow search space with source/type filters
4. **Adjust Threshold**: Lower threshold (0.5) for more recall, higher (0.8) for precision
5. **Chunk Appropriately**: Use markdown/code-aware chunking for better results

---

## Troubleshooting

### Search returns no results
- Check that documents are indexed: `GET /api/v2/knowledge/stats`
- Verify embedding provider is working
- Lower similarity threshold
- Check vector store is initialized

### Slow search performance
- Add filters to narrow search
- Reduce `topK` parameter
- Consider migrating to Pinecone/pgvector
- Enable result caching

### Poor search quality
- Use hybrid search instead of pure semantic
- Enable reranking
- Check chunk size/overlap settings
- Verify metadata is being generated
