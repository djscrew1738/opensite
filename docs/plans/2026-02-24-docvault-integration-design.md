# DocVault Integration into Documents Tab

## Overview

Integrate DocVault's text document intelligence (summarization, entity extraction, Q&A chat) into OpenSite's Documents tab as a new "Text Intelligence" tab alongside existing Library and AI Analysis.

## Backend

### New Routes — `/api/docvault`

| Method | Path | Purpose |
|--------|------|---------|
| POST | /upload | Upload text document (multipart) |
| GET | / | List all text documents |
| GET | /:id | Get document with full content |
| DELETE | /:id | Delete document + file cleanup |
| POST | /:id/summarize | Generate AI summary |
| POST | /:id/extract | Extract entities |
| POST | /:id/chat | Send Q&A message |
| GET | /:id/chat | Get chat history |
| DELETE | /:id/chat | Clear chat history |
| GET | /system/health | AI health check |

### New Services

- `text-extractor.js` — PDF text extraction (pdf-parse), DOCX (mammoth), plain text
- `docvault-ai.js` — Summarization, entity extraction, Q&A via OpenSite's AI provider system

### Database Tables

**text_documents**: id, user_id, filename, original_name, mime_type, file_size, file_path, extracted_text, summary, entities (JSONB), page_count, word_count, status, error_message, created_at, updated_at

**document_chat_messages**: id, document_id (FK CASCADE), role, content, created_at

### Configuration

- Upload directory: `uploads/documents/`
- Max file size: 100MB
- Supported types: PDF, DOCX, TXT, CSV, MD, HTML, JSON, XML
- AI text truncation: 12k chars for summarization, 10k for chat context

## Frontend

### New Tab — "Text Intelligence"

Added as third tab in Documents.jsx TabSystem. Contains:

1. **DocUpload** — Drag-and-drop + click-to-browse upload zone
2. **Document sidebar** — List of uploaded text documents with status badges
3. **DocViewer** — Selected document view with sub-tabs:
   - **DocSummary** — Generate/view/copy/regenerate AI summary
   - **DocEntities** — Extract/view entities with color-coded category cards
   - **DocChat** — Q&A with message history, suggested questions, clear history

### New API Client — `api/docvault.js`

Axios-based client mirroring DocVault's `hooks/api.js`, using OpenSite's auth token.

### Styling

All components use Dark Forge tokens (#0A0B0D, #111318, #181C24, #3B82F6, #F1F5F9, #94A3B8).

## Files to Create

### Backend (~5 files)
- `backend/src/routes/docvault.js`
- `backend/src/services/text-extractor.js`
- `backend/src/services/docvault-ai.js`
- `backend/src/middleware/docUpload.js`
- `backend/src/migrations/add_docvault_tables.js`

### Frontend (~7 files)
- `frontend/src/api/docvault.js`
- `frontend/src/components/documents/DocUpload.jsx`
- `frontend/src/components/documents/DocSidebar.jsx`
- `frontend/src/components/documents/DocViewer.jsx`
- `frontend/src/components/documents/DocSummary.jsx`
- `frontend/src/components/documents/DocEntities.jsx`
- `frontend/src/components/documents/DocChat.jsx`

### Modified (~2 files)
- `frontend/src/pages/Documents.jsx` — Add Text Intelligence tab
- `backend/src/routes/index.js` — Register docvault routes

## Key Decisions

- Text documents separate from vision_projects (different table, different routes)
- Uses OpenSite's AI provider system, not hardcoded Ollama
- 100MB file size limit (same as blueprints)
- No streaming for chat initially (regular request/response)
- Async text extraction with status polling
