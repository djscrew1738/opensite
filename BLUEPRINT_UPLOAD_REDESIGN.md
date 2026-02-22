# Blueprint Upload Feature - Redesign

A complete redesign of the Plans blueprint upload feature with improved UX, mobile responsiveness, and better error handling.

## What's New

### 1. Modern File Dropzone (`FileDropzone.jsx`)
- **Visual feedback**: Highlight on drag, scale animation
- **Better validation**: File size (100MB) and type (PDF, JPG, PNG) checks
- **Error display**: Inline error messages with icons
- **Selected file preview**: Shows file icon, name, size with remove button
- **Mobile optimized**: Touch-friendly, large tap targets

### 2. Step-by-Step Progress (`UploadProgress.jsx`)
- **Visual progress bar**: Animated, color-coded by status
- **Step indicators**: Shows current processing stage
  - Uploading
  - Extracting Data
  - AI Analysis
  - Calculating
  - Complete
- **Elapsed time tracker**: Shows how long processing has taken
- **Cancel button**: Allow users to abort long-running analysis

### 3. Tabbed Results View (`AnalysisResults.jsx`)
- **Three tabs**:
  - **Overview**: Project stats, phase breakdown, hero card
  - **Fixtures**: Grid view of all detected fixtures
  - **Material Takeoff**: Detailed table with category filters
- **Hero stats card**: Gradient header with key metrics
- **Category breakdown**: Visual bars showing cost distribution
- **CSV export**: Download takeoff as CSV
- **Responsive design**: Works on all screen sizes

### 4. Improved Main Component (`BlueprintUpload.jsx`)
- **Clean state management**: Clear status flow (idle → uploading → processing → completed/error)
- **Better error handling**: Specific messages for different error types
- **Partial results**: Shows extracted data immediately while AI processes
- **Retry functionality**: One-click retry on failure
- **Toast integration**: Success/error notifications

## File Structure

```
frontend/src/components/upload/
├── index.js                    # Component exports
├── BlueprintUpload.jsx         # Main component
├── FileDropzone.jsx           # File selection UI
├── UploadProgress.jsx         # Progress indicator
└── AnalysisResults.jsx        # Results display
```

## Usage

```jsx
import { BlueprintUpload } from '../components/upload';

function PlansPage() {
  const handleAnalysisComplete = (result) => {
    // result contains:
    // - fileName: string
    // - extractedData: { sqft, units, stories, bathrooms, fixtures... }
    // - aiAnalysis: { materialTakeoff[], totals, notes... }
    // - estimate: { total, breakdown... }
    // - modelUsed: string
  };

  return (
    <BlueprintUpload
      onAnalysisComplete={handleAnalysisComplete}
      selectedModel="llama3.1"
      className="my-4"
    />
  );
}
```

## Features

### Mobile Optimizations
- Touch-friendly dropzone (44px+ tap targets)
- Responsive layouts (grid → stack on mobile)
- Horizontal scroll for tables on small screens
- Swipe-friendly interface

### Error Handling
- **File too large**: Clear message with size info
- **Wrong file type**: List of supported formats
- **Network errors**: Retry suggestion
- **AI timeout**: 5-minute timeout with clear messaging
- **Upload failures**: Specific error messages

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly status updates

### Performance
- Lazy loading of API client
- Cleanup of intervals and abort controllers
- Optimized re-renders with useCallback

## State Flow

```
┌─────────┐
│  idle   │ ← Initial state, waiting for file
└────┬────┘
     │ file selected
     ▼
┌─────────┐
│uploading│ ← File upload in progress (10-30%)
└────┬────┘
     │ upload complete
     ▼
┌─────────┐
│processing│ ← AI analysis (40-100%)
└────┬────┘     ┌─────────────────┐
     │          │  Partial results │ ← Extracted data shown immediately
     │          │     (optional)   │
     │          └─────────────────┘
     │
     ├──────────────┐
     ▼              ▼
┌─────────┐   ┌─────────┐
│completed│   │  error  │
└────┬────┘   └─────────┘
     │
     ▼
┌─────────┐
│ results │ ← Show AnalysisResults component
│  view   │
└─────────┘
```

## API Integration

The component uses the existing API endpoint:

```javascript
POST /api/upload/blueprint
Content-Type: multipart/form-data

Body:
- file: File
- tier: string (optional)
- model: string (optional)
- async: boolean (default: true)

Response (async mode):
{
  jobId: string,
  fileName: string,
  extractedData: object,
  textExtracted: boolean,
  status: 'processing'
}
```

## Styling

Uses Tailwind CSS with:
- Dark mode support (`dark:` variants)
- Consistent with existing design system (cards, buttons)
- Smooth transitions and animations
- Responsive breakpoints (sm, md, lg)

## Migration Guide

### From Old BlueprintUpload

**Before:**
```jsx
import BlueprintUpload from '../components/pricing/BlueprintUpload';

<BlueprintUpload
  onAnalysisComplete={handleAnalysis}
  tier={tier}
  selectedModel={model}
/>
```

**After:**
```jsx
import { BlueprintUpload } from '../components/upload';

<BlueprintUpload
  onAnalysisComplete={handleAnalysis}
  selectedModel={model}
  className="optional-custom-classes"
/>
```

Note: The `tier` prop is no longer needed as it's handled by the pricing calculation.

## Future Enhancements

- [ ] Multiple file upload support
- [ ] File history/recent uploads
- [ ] Upload progress with bytes transferred
- [ ] Image preview for JPG/PNG files
- [ ] OCR confidence scores
- [ ] Compare multiple blueprint versions
- [ ] Save analysis to project

## Testing Checklist

- [ ] Upload PDF file
- [ ] Upload JPG/PNG file
- [ ] Drag and drop file
- [ ] File too large error
- [ ] Wrong file type error
- [ ] Cancel during upload
- [ ] Retry after error
- [ ] Mobile responsive layout
- [ ] Dark mode appearance
- [ ] CSV export functionality
- [ ] Tab switching in results
- [ ] Category filtering in takeoff
