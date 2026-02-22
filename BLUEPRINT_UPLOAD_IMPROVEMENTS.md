# Blueprint Upload Improvements

This document summarizes the improvements made to the blueprint upload feature in OpenSite.

## 🎯 Overview

The blueprint upload feature has been significantly enhanced with better extraction accuracy, user review capabilities, persistent job processing, and improved error handling.

---

## ✨ New Features

### 1. Enhanced Blueprint Extraction Service (`backend/src/services/blueprint-enhanced.js`)

**Confidence Scoring**
- Every extracted field now includes a confidence score (0-100%)
- Scores are calculated based on pattern match quality and context
- Visual indicators show confidence levels in the UI

**Improved Pattern Matching**
- Multiple regex patterns for each field type
- Better handling of variations (e.g., "sq ft", "square feet", "SF")
- Support for additional fields:
  - Bedrooms
  - Hose bibs
  - Floor drains
  - Water softener pre-plumb

**PDF Type Detection**
- Automatically detects scanned vs text-based PDFs
- Warns users when text extraction may be limited
- Provides file size and page count information

**Validation & Suggestions**
- Automatic validation of extracted values
- Suggests corrections for suspicious data
- Flags potential issues (e.g., unusually small unit sizes)

### 2. Extracted Data Editor (`frontend/src/components/upload/ExtractedDataEditor.jsx`)

**Review & Edit Interface**
- Clean form for reviewing all extracted data
- Confidence indicators for each field
- Color-coded confidence levels (green/amber/red)
- Editable fields with visual feedback for changes

**Fixture Management**
- Expandable fixture counts section
- Quick editing for all fixture types
- Visual indicators for detected vs missing fixtures

**Validation Feedback**
- Warnings for suspicious data
- Suggestions for missing fields
- Context-aware hints

### 3. Persistent Job Queue (`backend/src/services/jobQueuePersistent.js`)

**SQLite-Based Storage**
- Jobs survive server restarts
- Interrupted jobs are marked as failed on restart
- Automatic cleanup of old completed jobs

**Improved Reliability**
- No lost jobs during deployment
- Job status persisted across crashes
- Better monitoring and debugging capabilities

### 4. Improved Error Handling (`frontend/src/components/upload/FileDropzone.jsx`)

**Specific Error Types**
- File too large with compression suggestions
- Invalid file type with conversion guidance
- Corrupted file with repair suggestions
- Password-protected PDF handling
- Scanned PDF warnings

**Actionable Suggestions**
- Each error includes specific suggestions
- Links to helpful resources
- Alternative approaches

### 5. Updated Upload Flow

**New Two-Step Process**
1. **Extract**: Upload PDF and extract data immediately
2. **Review**: User reviews and corrects extracted data
3. **Analyze**: AI analysis with verified data

**Benefits**
- Higher accuracy from verified data
- Transparency in data extraction
- User control over the process
- Better handling of scanned PDFs

---

## 📁 Files Modified/Created

### New Files
```
backend/src/services/blueprint-enhanced.js      # Enhanced extraction service
backend/src/services/jobQueuePersistent.js      # SQLite-based job queue
frontend/src/components/upload/ExtractedDataEditor.jsx  # Data review component
```

### Modified Files
```
backend/src/routes/upload.js                    # Updated to use enhanced service
backend/src/routes/upload.js                    # Added /extract endpoint
frontend/src/components/upload/BlueprintUpload.jsx        # New flow integration
frontend/src/components/upload/FileDropzone.jsx           # Better error handling
frontend/src/components/upload/index.js                   # New export
frontend/src/api/client.js                                # New API methods
```

---

## 🔌 API Changes

### New Endpoints

**POST /api/upload/extract**
```javascript
// Request: multipart/form-data with 'file'

// Response:
{
  fileName: "blueprint.pdf",
  extractedData: { sqft: 2500, units: 4, ... },
  confidenceScores: { sqft: 95, units: 88, ... },
  hasLowConfidence: false,
  averageConfidence: 87,
  isScanned: false,
  textExtracted: true,
  pages: 5,
  warnings: [],
  suggestions: []
}
```

**Enhanced POST /api/upload/blueprint**
```javascript
// Now accepts optional extractedData field
// Request: multipart/form-data
//   - file: File
//   - extractedData: JSON string of verified data
//   - model: string (optional)

// Response: Same as before with jobId for polling
```

### New API Client Methods

```javascript
// Extract data only (no AI analysis)
api.upload.extract(file)

// Upload with pre-extracted/verified data
api.upload.blueprintWithData(file, extractedData, model)
```

---

## 🎨 UI/UX Improvements

### Confidence Visualization
- Green (80%+): High confidence - reliable data
- Amber (50-79%): Medium confidence - verify recommended
- Red (<50%): Low confidence - manual review needed

### Error Messages
- Clear, actionable error messages
- Specific suggestions for resolution
- Visual distinction between errors and warnings

### Data Review Form
- Organized by category (project info, fixtures)
- Real-time validation
- Reset to original values option

---

## 🛡️ Error Recovery

### Scanned PDFs
- Detection and warning
- Graceful degradation
- Manual data entry fallback

### Interrupted Uploads
- Jobs persist across restarts
- Failed jobs can be retried
- No data loss

### Validation Failures
- Detailed error messages
- Suggested corrections
- Alternative paths

---

## 📊 Performance Improvements

### Database Persistence
- Jobs stored in SQLite
- Minimal memory footprint
- Automatic cleanup of old jobs

### Extraction Efficiency
- Multiple pattern matching strategies
- Early termination on good matches
- Cached results during review

---

## 🚀 Migration Guide

### For Existing Code

The changes are backwards compatible. The existing `blueprint` endpoint still works:

```javascript
// Old way still works
api.upload.blueprint(file, tier, model)

// New way with review
const extracted = await api.upload.extract(file);
// ... show editor ...
await api.upload.blueprintWithData(file, editedData, model);
```

### For Database

The persistent job queue creates its own SQLite database at:
```
backend/data/jobs.db
```

No manual migration needed - it's automatically created on first run.

---

## 🧪 Testing Checklist

- [ ] Upload text-based PDF
- [ ] Upload scanned PDF (with warning)
- [ ] Edit extracted data
- [ ] Verify confidence scores
- [ ] Check error messages for large files
- [ ] Test job persistence (restart server during analysis)
- [ ] Verify CSV export still works
- [ ] Test dark mode appearance

---

## 🔮 Future Enhancements

Potential improvements for future iterations:

1. **OCR Integration**: Add Tesseract.js for scanned PDF text extraction
2. **Thumbnail Preview**: Generate PDF thumbnails in the browser
3. **Batch Upload**: Process multiple blueprints at once
4. **Blueprint Comparison**: Compare revisions side-by-side
5. **Auto-Save**: Save extracted data drafts
6. **Version History**: Track changes to extracted data

---

## 📞 Support

For issues or questions about the blueprint upload improvements:
1. Check the browser console for detailed error messages
2. Review the backend logs for server-side issues
3. Verify the jobs database is accessible
4. Ensure the uploads directory has proper permissions
