# Universal Upload System — Design Document

**Date:** 2026-02-25
**Status:** Approved

## Goal

Replace fragmented upload flows (vision, docvault, blueprint) with a single Universal Upload system that:
- Accepts all file types from one drag-and-drop interface
- Auto-routes files to the correct processing pipeline
- Links files to jobs
- Supports bulk uploads with full queue management

## Supported File Types

| Extension | Route To | Processing |
|---|---|---|
| `.png`, `.jpg`, `.jpeg`, `.tiff`, `.tif`, `.webp` | Vision | Tile generation + optional AI analysis |
| `.pdf` | Vision + DocVault | Tile gen (page 1 image) + text extraction |
| `.docx`, `.doc` | DocVault | Text extraction |
| `.txt`, `.md`, `.csv`, `.html`, `.json`, `.xml` | DocVault | Direct text storage |
| `.dwg` | Vision | Store as blueprint reference |
| `.xlsx`, `.xls` | DocVault | Text/table extraction |

## Backend

### New endpoint: `POST /api/upload/universal`

```
Request: multipart/form-data
  - files[]       (multiple files)
  - jobId?        (optional — links to a job)
  - category?     (optional — "blueprint", "photo", "document", "other")
  - notes?        (optional — user notes)

Response: {
  uploads: [
    { id, filename, type, size, category, pipeline, status, jobId },
    ...
  ]
}
```

### Auto-routing logic (server-side)

1. Validate file (extension + MIME + size)
2. Determine category from extension (image / document / blueprint)
3. Save file to `uploads/universal/{uuid}.{ext}`
4. Create record in `files` table
5. If `jobId` provided, create `job_files` link
6. Fire async pipeline:
   - Images → vision tile generation
   - PDFs → vision tiles + docvault text extraction
   - Text docs → docvault text extraction
   - Spreadsheets → docvault table extraction
7. Return immediately with status=`processing`

### Rate limiting

- Authenticated users: no upload rate limit
- Guest/unauthenticated: keep 10/hour limit

### New database tables

```sql
files
  id, original_name, stored_path, mime_type, size_bytes,
  category, pipeline_status, vision_project_id, docvault_id,
  uploaded_by, created_at

job_files
  id, job_id, file_id, notes, created_at
```

Existing vision and docvault systems stay untouched. The `files` table holds references to pipeline outputs via `vision_project_id` and `docvault_id`.

## Frontend Components

### Component hierarchy

```
useUniversalUpload (hook — queue engine)
├── UploadDropzone (inline drag-and-drop, embeds in pages)
├── UploadModal (full overlay with queue + progress)
│   ├── FileQueue (list of queued/uploading/completed files)
│   │   └── FileQueueItem (per-file: icon, name, progress, status, retry)
│   ├── RoutingPreview (shows pipeline per file)
│   └── JobLinker (optional job selector dropdown)
└── UploadFAB (floating button, opens UploadModal from anywhere)
```

### useUniversalUpload hook

- Manages upload queue (add, remove, retry, clear)
- Max 3 concurrent uploads
- Per-file progress via axios `onUploadProgress`
- Auto-categorizes files client-side
- Exposes: `{ queue, addFiles, removeFile, retryFile, clearCompleted, isUploading }`

### Integration points

| Page | Components |
|---|---|
| Documents Library tab | UploadDropzone (inline) + toolbar button opens UploadModal |
| Documents Text Intelligence | UploadDropzone (replaces DocUpload) |
| Jobs → New Job Modal | UploadDropzone (compact, inside modal) |
| Jobs → Job Detail (`/jobs/:id`) | UploadDropzone (inline) + attached files list |
| Jobs list → Expandable card | Attached files preview |
| App-wide (Layout) | UploadFAB → opens UploadModal with job linking |

### Upload Modal UX

- Drag-and-drop zone at top
- Optional job linker dropdown
- File queue with per-file: type icon, name, size, progress bar, pipeline label, status
- Invalid files show error inline with reason (not uploaded)
- Failed files get retry button
- 3 concurrent uploads, rest queued
- New files can be added mid-upload
- "Clear completed" button to clean up queue

### File queue states

`queued` → `uploading` (with %) → `processing` → `complete` | `error` (with retry)

### Auto-open behavior

- Drag files onto inline dropzone: if >3 files, auto-opens modal
- FAB click: opens modal with empty queue
- Page upload button: opens modal pre-scoped to context

## Jobs Integration

### New Job Modal

- Add compact UploadDropzone below form fields
- Show thumbnails of attached files before creation
- On submit: create job first, then fire uploads with new jobId

### Job Detail Page (`/jobs/:id`)

- Full page with job info + attached files section
- UploadDropzone to add more files
- Grid/list of files with type icon, name, size, date
- Click file → preview (image viewer or doc viewer)
- Delete button per file

### Expandable Job Card (Jobs list)

- Click job card → expands inline to show details + files preview
- "View full details" link → navigates to `/jobs/:id`

## Not Building (YAGNI)

- Folder upload
- File versioning
- Cloud storage (staying local disk)
- File sharing/permissions beyond existing auth
