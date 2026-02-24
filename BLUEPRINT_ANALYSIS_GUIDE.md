# OpenSite Blueprint Analysis Guide

Complete guide to using OpenSite's multi-modal blueprint analysis capabilities.

## Overview

OpenSite now integrates **three complementary analysis methods**:

| Service | Type | Best For | Port |
|---------|------|----------|------|
| **AECVision** | Computer Vision | Wall detection, fixture locations, visual layout | 8002 |
| **Floorplan** | Text Extraction | Precise dimensions, cabinet codes, measurements | 8003 |
| **AI (LLM)** | Language Model | Material specs, labor estimates, code compliance | 5001 |

## Quick Start

### Start All Services

```bash
# Terminal 1: AECVision CV Service
./start-aecvision.sh

# Terminal 2: Floorplan Dimension Service  
./start-floorplan.sh

# Terminal 3: OpenSite Backend
cd backend && npm run dev

# Terminal 4: OpenSite Frontend (optional)
cd frontend && npm run dev
```

### Test All Services

```bash
# Test AECVision
./test-aecvision.sh

# Test Floorplan
./test-floorplan.sh
```

## Service Comparison

### When to Use Each Service

| Scenario | Recommended Services |
|----------|---------------------|
| Need wall locations & room layout | AECVision |
| Need exact pipe lengths | Floorplan |
| Need cabinet/fixture counts | Floorplan + AECVision |
| Need material specifications | AI (LLM) |
| Complete comprehensive analysis | All three |

### Capabilities Matrix

| Capability | AECVision | Floorplan | AI |
|------------|-----------|-----------|-----|
| Wall detection | ✅ | ❌ | ❌ |
| Fixture detection | ✅ | ✅ (codes) | ⚠️ (text) |
| Dimension extraction | ❌ | ✅ | ⚠️ (text) |
| Cabinet codes | ❌ | ✅ | ❌ |
| Pipe run estimation | ✅ | ✅ | ⚠️ |
| Material specifications | ❌ | ❌ | ✅ |
| Labor estimates | ❌ | ❌ | ✅ |
| Code compliance | ❌ | ❌ | ✅ |

## API Usage Examples

### 1. AECVision - Object Detection

Detect walls, fixtures, rooms visually:

```bash
curl -X POST http://localhost:8002/detect \
  -F "file=@blueprint.pdf" \
  -F "confidence=0.6"
```

**Response:**
```json
{
  "detections": [
    {"class": "wall", "confidence": 0.92, "bbox": [...]},
    {"class": "toilet", "confidence": 0.88, "bbox": [...]}
  ],
  "counts": {"wall": 15, "toilet": 3}
}
```

### 2. Floorplan - Dimension Extraction

Extract precise measurements and codes:

```bash
curl -X POST http://localhost:8003/extract \
  -F "file=@floorplan.pdf" \
  -F "method=pdfplumber"
```

**Response:**
```json
{
  "pages": [{
    "dimensions": [
      {"raw": "36 (1/2)\"", "inches": 36.5, "bbox": [...]}
    ],
    "codes": [
      {"code": "SB36", "type": "base_cabinet", "plumbing": true}
    ]
  }],
  "summary": {
    "total_dimensions": 24,
    "plumbing_codes": 5
  }
}
```

### 3. Combined Analysis (Recommended)

Use all services together for most accurate results:

```bash
curl -X POST http://localhost:5001/api/floorplan/comprehensive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/path/to/blueprint.pdf",
    "useDimensions": true,
    "useVision": true,
    "useAI": true
  }'
```

**Response includes:**
- Dimensions from text extraction
- Walls/fixtures from computer vision
- Material specs from AI
- Combined pipe run estimates

## Integration Flow

```
User Uploads Blueprint PDF
         │
         ▼
┌──────────────────────────────────────┐
│  Parallel Processing                  │
│  ┌──────────┐ ┌──────────┐          │
│  │ Floorplan│ │AECVision │          │
│  │ (Text)   │ │ (Vision) │          │
│  └────┬─────┘ └────┬─────┘          │
│       │            │                 │
│       └─────┬──────┘                 │
│             ▼                        │
│  ┌──────────────────────┐            │
│  │   Data Aggregation    │            │
│  │  - Merge fixtures     │            │
│  │  - Cross-validate     │            │
│  └──────────┬───────────┘            │
│             │                        │
│             ▼                        │
│  ┌──────────────────────┐            │
│  │  AI Enhancement       │            │
│  │  - Material specs     │            │
│  │  - Labor estimates    │            │
│  └──────────┬───────────┘            │
└─────────────┼────────────────────────┘
              ▼
    ┌──────────────────────┐
    │  Final Results        │
    │  - Accurate counts    │
    │  - Precise lengths    │
    │  - Complete takeoff   │
    └──────────────────────┘
```

## Data Combination Strategy

### Fixture Counts

| Source | Example Value | Priority |
|--------|--------------|----------|
| Text extraction | 3 toilets | Medium |
| Floorplan codes | 2 WCs detected | High |
| AECVision CV | 3 toilets detected | High |
| AI analysis | 3 fixtures | Medium |
| **Final** | **3 toilets** | **Max of all** |

### Pipe Run Estimation

```javascript
// From AECVision: Wall detection
const wallLengthFromVision = 450; // feet estimated from walls

// From Floorplan: Dimension extraction  
const dimensionTotal = 380; // feet from dimension callouts

// Combined estimate (weighted average)
const estimatedPipeFeet = (wallLengthFromVision * 0.6) + (dimensionTotal * 0.4);
// = 422 feet
```

## Environment Configuration

### Required Environment Variables

```bash
# AECVision Service
AECVISION_URL=http://localhost:8002
AECVISION_MODEL_PATH=./train_results/model_12classes/weights/best.pt

# Floorplan Service
FLOORPLAN_URL=http://localhost:8003

# AI Providers (in backend/.env)
ANTHROPIC_API_KEY=sk-...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
```

## Performance Tips

### 1. For Large Blueprints (>10MB)

```bash
# Use specific page
POST /extract/dimensions?page=1

# Reduce scale for visualization
POST /visualize?scale=1.5
```

### 2. For Batch Processing

```bash
# Use faster method
POST /extract/dimensions?method=pymupdf

# Skip summary for speed
POST /extract?include_summary=false
```

### 3. For Complex Layouts

```bash
# Use pdfplumber for accuracy
POST /extract?method=pdfplumber

# Use SAHI for large images
POST /detect/walls?use_sahi=true
```

## Common Use Cases

### Kitchen Rough-In

```bash
# 1. Get cabinet codes (Floorplan)
curl -X POST /api/floorplan/codes?plumbing_only=true

# 2. Detect sinks visually (AECVision)
curl -X POST /api/aecvision/detect

# 3. Get material specs (AI)
curl -X POST /api/floorplan/comprehensive
```

### Bathroom Layout

```bash
# Get all plumbing fixtures from both sources
curl -X POST /api/floorplan/comprehensive

# Verify with visualization
curl -X POST /api/aecvision/detect
```

### Multi-Unit Building

```bash
# Process with all services for accuracy
curl -X POST /api/floorplan/comprehensive \
  -d '{"useDimensions": true, "useVision": true, "useAI": true}'
```

## Troubleshooting

### AECVision Issues

```bash
# Check model loaded
curl http://localhost:8002/health

# Check CUDA available
python3 -c "import torch; print(torch.cuda.is_available())"
```

### Floorplan Issues

```bash
# Test with different method
curl -X POST /extract?method=pymupdf

# Check PDF has text layer
pdfinfo blueprint.pdf | grep "PDF version"
```

### Combined Analysis Issues

```bash
# Test services individually first
./test-aecvision.sh
./test-floorplan.sh

# Then test combined
curl -X POST /api/floorplan/compare
```

## Frontend Integration Ideas

### Upload Flow

1. User uploads PDF
2. Show progress: "Analyzing with computer vision..."
3. Show progress: "Extracting dimensions..."
4. Show progress: "Generating estimate..."
5. Display combined results with confidence scores

### Visualization

```javascript
// Show detections on blueprint
const layers = {
  walls: aecvisionData.walls,
  dimensions: floorplanData.dimensions,
  fixtures: combinedData.fixtures
};
```

### Results Display

| Source | Toilets | Sinks | Pipe Feet | Confidence |
|--------|---------|-------|-----------|------------|
| Text | 2 | 3 | - | 70% |
| CV | 3 | 3 | 450 | 85% |
| Codes | 3 | 2 | - | 90% |
| **Combined** | **3** | **3** | **445** | **92%** |

## Next Steps

1. **Fine-tune Models**
   - Train AECVision on CTL-specific blueprints
   - Add custom cabinet code patterns

2. **Integration**
   - Connect to material pricing database
   - Add labor rate configuration
   - Export to QuickBooks

3. **Enhancement**
   - Add 3D visualization
   - Mobile field mode integration
   - Real-time collaboration

## Support

- **AECVision Issues:** Check `AECVISION_INTEGRATION.md`
- **Floorplan Issues:** Check `FLOORPLAN_INTEGRATION.md`
- **General:** Check `AGENTS.md`
- **Logs:** `backend.log`, `aecvision.log`, `floorplan.log`
