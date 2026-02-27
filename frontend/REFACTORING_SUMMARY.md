# Upload Components Refactoring Summary

## Overview
Refactored all upload-related components to reduce code duplication, improve maintainability, and establish consistent patterns across the codebase.

## New Shared Infrastructure

### 1. Utilities (`src/components/upload/utils/`)

#### `uploadUtils.js`
Core file handling utilities:
- `MAX_FILE_SIZE` - 100MB limit constant
- `EXTENSION_SETS` - Categorized file extensions (blueprint, image, document, spreadsheet)
- `formatFileSize(bytes)` - Human-readable file sizes
- `formatDuration(seconds)` - Format seconds to readable duration
- `categorizeFile(filename)` - Detect file category
- `getFileIconType(filename)` - Get icon type for file
- `getPipelineLabel(filename)` - Get processing pipeline description
- `validateFile(file, options)` - Comprehensive file validation
- `isLikelyScannedPDF(file)` - Heuristic for scanned PDFs
- `generateFileId(prefix)` - Unique ID generator

#### `errorUtils.js`
Standardized error handling:
- `ERROR_TYPES` - Enum of error types
- `ERROR_DETAILS` - Error messages and suggestions
- `getErrorDetails(type, details)` - Get display info for errors
- `parseErrorType(error, status)` - Parse HTTP errors to types
- `createError(type, details, isWarning)` - Error object factory

### 2. Custom Hooks (`src/hooks/upload/`)

#### `useDragDrop.js`
Manages drag-and-drop interactions:
- `useDragDrop(options)` - Drag state with counter pattern
  - Returns: `isDragging`, `dragCounter`, `handlers`, `resetDragState`
- `useFileInput(options)` - File input management
  - Returns: `inputRef`, `handlers`
- `useFileSelection(options)` - Combined drag-drop + click
  - Returns: `isDragging`, `inputRef`, `handlers`, `reset`

#### `useJobPolling.js`
Handles async job status polling:
- `useJobPolling(statusFetcher, options)` - Generic polling hook
  - Returns: `status`, `progress`, `error`, `result`, `isPolling`, `isComplete`, `isFailed`, `actions`
- `useVisionUpload(options)` - Specialized for vision uploads
  - Returns: `uploading`, `progress`, `jobId`, `error`, `actions`

### 3. Shared Components (`src/components/upload/`)

#### `ErrorDisplay.jsx`
Reusable error/warning display:
- `ErrorDisplay` - Full error with suggestions
- `CompactErrorDisplay` - Inline error for sidebars

#### `FileIcon.jsx`
File type icons:
- `FileIcon` - Icon based on file type
- `FileIconWithBg` - Icon with background container

#### `FileQueueItem.jsx`
Queue item for file lists with progress and actions

#### `StepIndicator.jsx`
Multi-step progress visualization:
- `StepIndicator` - Vertical step list
- `HorizontalStepIndicator` - Horizontal variant

## Refactored Components

### Before/After Comparison

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| FileDropzone.jsx | 359 lines | 241 lines | -118 lines |
| UploadProgress.jsx | 196 lines | 145 lines | -51 lines |
| UploadModal.jsx | 254 lines | 174 lines | -80 lines |
| DocUpload.jsx | 269 lines | 211 lines | -58 lines |
| VisionUpload.jsx | 173 lines | 177 lines | +4 lines* |
| BlueprintUpload.jsx | 542 lines | 477 lines | -65 lines |
| HeroUpload.jsx | 480 lines | 438 lines | -42 lines |
| UploadDropzone.jsx | 141 lines | 114 lines | -27 lines |
| **Total** | **2,414 lines** | **1,977 lines** | **-437 lines** |

*VisionUpload added polling logic that was previously inline

### Key Changes per Component

#### `FileDropzone.jsx`
- Extracted validation to `validateFile()` utility
- Uses `useFileSelection` hook for drag-drop + click
- Uses `ErrorDisplay` component for errors
- Removed inline error details definitions

#### `UploadProgress.jsx`
- Extracted steps UI to `StepIndicator` component
- Uses `formatDuration()` utility
- Cleaner separation of states (error/complete/processing)

#### `UploadModal.jsx`
- Extracted file list item to `FileQueueItem` component
- Uses `FileIcon` component for type icons
- Uses `formatFileSize()` utility

#### `DocUpload.jsx`
- Uses `useDragDrop` and `useFileInput` hooks
- Uses `validateFile()` and `formatFileSize()` utilities
- Uses `CompactErrorDisplay` for errors

#### `VisionUpload.jsx`
- Uses `useVisionUpload` hook for polling
- Uses `useDragDrop` and `useFileInput` hooks
- Cleaner separation of upload vs polling logic

#### `BlueprintUpload.jsx`
- Extracted status views: `IdleView`, `ExtractingView`, `ReviewView`, `ErrorView`, `SuccessView`
- Uses `useJobPolling` hook for status polling
- Uses `parseErrorType()` and `createError()` for error handling
- Cleaner render method with switch statement

#### `HeroUpload.jsx`
- Extracted sub-components: `ProcessingView`, `Dropzone`, `FileTypeBadges`, `UploadIcon`, `FeatureHighlights`, `SelectedFilesList`
- Uses `useDragDrop` and `useFileInput` hooks
- Uses `formatFileSize()` and `validateFile()` utilities
- Uses `CompactErrorDisplay` for errors

#### `UploadDropzone.jsx`
- Uses `useDragDrop` and `useFileInput` hooks
- Removed duplicate drag-drop counter logic

#### `useUniversalUpload.js`
- Refactored to use shared utilities
- Uses `categorizeFile()`, `getFileIconType()`, `getPipelineLabel()`
- Uses `validateFile()` and `generateFileId()`

## Import Patterns

### Before
```javascript
// Each component had inline utilities
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const formatSize = (bytes) => { /* ... */ };
```

### After
```javascript
// Import from shared utilities
import { formatFileSize, validateFile, MAX_FILE_SIZE } from './utils';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import ErrorDisplay from './ErrorDisplay';
```

## Barrel Exports

### Components (`src/components/upload/index.js`)
```javascript
export { default as FileDropzone } from './FileDropzone';
export { default as UploadProgress } from './UploadProgress';
export { default as UploadModal } from './UploadModal';
export { default as UploadDropzone } from './UploadDropzone';
export { default as BlueprintUpload } from './BlueprintUpload';
export { default as FileQueueItem } from './FileQueueItem';
export { default as StepIndicator } from './StepIndicator';
export { default as ErrorDisplay } from './ErrorDisplay';
export { default as FileIcon } from './FileIcon';
export * from './utils';
```

### Hooks (`src/hooks/index.js`)
```javascript
export { useDragDrop, useFileInput, useFileSelection } from './upload/useDragDrop';
export { useJobPolling, useVisionUpload } from './upload/useJobPolling';
```

## Benefits

1. **DRY Principle**: Common logic (validation, formatting, drag-drop) exists in one place
2. **Maintainability**: Changes to file size limits or accepted types update in one location
3. **Testability**: Smaller, focused components are easier to test
4. **Consistency**: Unified error messages and validation across all upload flows
5. **Readability**: Components focus on UI, logic extracted to hooks/utilities
6. **Performance**: `memo` and proper effect cleanup in hooks prevent unnecessary renders

## Migration Guide

For new upload components:

```javascript
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import { validateFile, formatFileSize } from '../upload/utils';
import ErrorDisplay from '../upload/ErrorDisplay';

function MyUpload() {
  const [error, setError] = useState(null);
  
  const handleFiles = useCallback((files) => {
    const validation = validateFile(files[0], {
      allowedExtensions: new Set(['pdf']),
      maxSize: MAX_FILE_SIZE
    });
    
    if (!validation.valid) {
      setError({ type: 'UPLOAD_FAILED', details: { message: validation.error } });
      return;
    }
    
    // Process valid file...
  }, []);
  
  const dragDrop = useDragDrop({ onDrop: handleFiles });
  const fileInput = useFileInput({ onSelect: handleFiles });
  
  return (
    <div>
      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
      {/* Dropzone UI */}
    </div>
  );
}
```

## Files Modified/Created

### New Files (9)
- `src/components/upload/utils/uploadUtils.js`
- `src/components/upload/utils/errorUtils.js`
- `src/components/upload/utils/index.js`
- `src/components/upload/ErrorDisplay.jsx`
- `src/components/upload/FileIcon.jsx`
- `src/components/upload/FileQueueItem.jsx`
- `src/components/upload/StepIndicator.jsx`
- `src/components/upload/index.js`
- `src/hooks/upload/useDragDrop.js`
- `src/hooks/upload/useJobPolling.js`
- `src/hooks/upload/index.js`

### Refactored Files (8)
- `src/components/upload/FileDropzone.jsx`
- `src/components/upload/UploadProgress.jsx`
- `src/components/upload/UploadModal.jsx`
- `src/components/upload/UploadDropzone.jsx`
- `src/components/upload/BlueprintUpload.jsx`
- `src/components/upload/HeroUpload.jsx`
- `src/components/documents/DocUpload.jsx`
- `src/components/vision/VisionUpload.jsx`
- `src/hooks/useUniversalUpload.js`
- `src/hooks/index.js`

## Testing Recommendations

1. Test each upload flow (blueprint, document, vision)
2. Verify error handling (file too large, invalid type, network errors)
3. Test drag-drop and click-to-upload behaviors
4. Verify progress indicators and polling
5. Test file validation edge cases (empty files, corrupted files)
