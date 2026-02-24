# Floorplan Dimension Extractor Integration

This document describes the integration of [Floorplan-Dimractor](https://github.com/jasoncobra3/Floorplan-Dimractor) into the OpenSite blueprint analysis engine.

## Overview

Floorplan-Dimractor extracts **dimensions** and **cabinet/appliance codes** from architectural floorplan PDFs. This complements the AECVision computer vision integration by providing:

- **Precise measurements** - Extract actual dimension callouts from blueprints
- **Cabinet codes** - Identify SB36 (sink base), DW (dishwasher), etc.
- **Room type detection** - Infer kitchen, bathroom, laundry from codes
- **Pipe estimation** - Calculate rough pipe lengths from dimensions

## How It Works

### Dimension Parsing

Supports multiple architectural dimension formats:

| Format | Example | Parsed Value |
|--------|---------|--------------|
| Simple inches | `25"` | 25.0 inches |
| Feet and inches | `2' 6"` | 30.0 inches |
| Fraction in parens | `34 (1/2)"` | 34.5 inches |
| Mixed fraction | `25 3/4"` | 25.75 inches |
| Decimal inches | `34.5"` | 34.5 inches |

### Code Detection

Detects cabinet, appliance, and fixture codes:

| Code Pattern | Type | Example | Plumbing? |
|--------------|------|---------|-----------|
| `SB##` | Sink Base | SB36 | ✅ Yes |
| `DB##` | Drawer Base | DB24 | ❌ No |
| `DW` | Dishwasher | DW | ✅ Yes |
| `WC` | Water Closet | WC | ✅ Yes |
| `WH` | Water Heater | WH | ✅ Yes |
| `MW##` | Microwave | MW30 | ❌ No |

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    OpenSite Backend                            │
│  ┌─────────────────┐                                          │
│  │  Floorplan API  │─────────────────────────────────┐        │
│  └─────────────────┘                                 │        │
│                                                     ▼        │
│                                         ┌────────────────────┐│
│                                         │  FloorplanClient   ││
│                                         │  (HTTP Client)     ││
│                                         └────────────────────┘│
└─────────────────────────────────────────┬─────────────────────┘
                                          │ HTTP
                                          ▼
┌───────────────────────────────────────────────────────────────┐
│              Floorplan Dimension Extractor Service             │
│                         (Port 8003)                            │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐    │
│  │   FastAPI   │  │ Dimension     │  │ Code Detector    │    │
│  │   Server    │──│ Parser        │──│ (Cabinet/Appl)   │    │
│  └─────────────┘  └───────────────┘  └──────────────────┘    │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         PDF Processor (PyMuPDF/pdfplumber)           │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Python 3.9+
- Already installed with OpenSite

### Setup

1. **Start the Floorplan service:**
   ```bash
   ./start-floorplan.sh
   ```

2. **Verify the service:**
   ```bash
   curl http://localhost:8003/health
   ```

3. **Configure environment (optional):**
   ```bash
   # Add to backend/.env
   FLOORPLAN_URL=http://localhost:8003
   ```

## API Endpoints

### Floorplan Service (Port 8003)

```
GET  /health              - Service health
GET  /patterns            - Supported dimension/code patterns
POST /extract             - Full extraction (dimensions + codes)
POST /extract/dimensions  - Extract only dimensions
POST /extract/codes       - Extract only codes
POST /visualize           - Create annotated visualization
POST /analyze/pipe-estimate - Estimate pipe requirements
```

### OpenSite Backend (Port 5001)

```
GET  /api/floorplan/health          - Health check
GET  /api/floorplan/patterns        - Supported patterns
POST /api/floorplan/extract         - Full extraction
POST /api/floorplan/dimensions      - Dimensions only
POST /api/floorplan/codes           - Codes only
POST /api/floorplan/pipe-estimate   - Pipe estimation
POST /api/floorplan/comprehensive   - Combined with CV + AI
POST /api/floorplan/compare         - Compare methods
```

## Usage Examples

### Extract Dimensions and Codes

```bash
curl -X POST http://localhost:8003/extract \
  -F "file=@floorplan.pdf" \
  -F "method=pdfplumber"
```

### Extract Only Plumbing Codes

```bash
curl -X POST http://localhost:8003/extract/codes \
  -F "file=@floorplan.pdf" \
  -F "plumbing_only=true"
```

### Estimate Pipe Requirements

```bash
curl -X POST http://localhost:8003/analyze/pipe-estimate \
  -F "file=@floorplan.pdf"
```

### Comprehensive Analysis (All Services)

```bash
curl -X POST http://localhost:5001/api/floorplan/comprehensive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/path/to/floorplan.pdf",
    "useDimensions": true,
    "useVision": true,
    "useAI": true
  }'
```

## Response Format

### Extraction Response

```json
{
  "success": true,
  "method": "pdfplumber",
  "total_pages": 1,
  "pages": [
    {
      "page": 1,
      "dimensions": [
        {
          "raw": "36 (1/2)\"",
          "inches": 36.5,
          "feet": 3.04,
          "bbox": [100.5, 200.0, 150.5, 220.0]
        }
      ],
      "codes": [
        {
          "code": "SB36",
          "type": "base_cabinet",
          "name": "36\" Sink Base",
          "plumbing": true,
          "bbox": [300.0, 400.0, 350.0, 420.0]
        }
      ],
      "room_type": "kitchen",
      "dimension_stats": {
        "total_inches": 438.0,
        "total_feet": 36.5,
        "count": 12,
        "average_inches": 36.5
      }
    }
  ],
  "summary": {
    "total_dimensions": 12,
    "total_codes": 5,
    "plumbing_codes": 3,
    "room_types": ["kitchen", "bathroom"]
  }
}
```

### Pipe Estimate Response

```json
{
  "success": true,
  "fixture_estimate": {
    "sinks": 3,
    "dishwashers": 1,
    "water_closets": 2,
    "bathtubs": 1,
    "showers": 1,
    "water_heaters": 1
  },
  "total_fixtures": 9,
  "estimated_pipe_feet": 146.2,
  "room_types": ["kitchen", "bathroom"],
  "total_dimensions": 24
}
```

## How It Enhances Blueprint Analysis

### 1. **Accurate Pipe Length Estimation**
   - Extract dimension callouts from blueprints
   - Calculate total linear feet of walls/spaces
   - Estimate rough-in pipe requirements (40% of total dimensions)

### 2. **Fixture Location Identification**
   - SB (Sink Base) codes indicate sink locations
   - DW codes indicate dishwasher rough-ins
   - WC codes indicate toilet locations

### 3. **Room Type Detection**
   - Kitchen: Sink bases, dishwashers, appliances
   - Bathroom: Water closets, tubs, showers
   - Laundry: Washer/dryer codes

### 4. **Cross-Validation with CV**
   - Text-extracted dimensions vs. vision-detected walls
   - Cabinet codes vs. vision-detected fixtures
   - Higher confidence when both agree

## Integration with AECVision

When both services are used together:

```
Floorplan-Dimractor          AECVision
(extract dimensions)    +    (detect walls/rooms)
         │                          │
         └──────────┬───────────────┘
                    ▼
         ┌─────────────────────┐
         │  Combined Analysis  │
         │  - Dimension data   │
         │  - Wall detection   │
         │  - Room types       │
         └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   AI Enhancement    │
         │  - Material specs   │
         │  - Labor estimates  │
         └─────────────────────┘
```

## Performance

| Metric | PyMuPDF | pdfplumber |
|--------|---------|------------|
| Speed | Very Fast | Moderate |
| Text Accuracy | Good | Excellent |
| Layout Analysis | Basic | Excellent |
| Bounding Box Precision | Good | Excellent |
| Memory Usage | Efficient | Moderate |

**Recommendation:**
- Use `pdfplumber` for complex floorplans with many callouts
- Use `pymupdf` for simple layouts or batch processing
- Use `auto` to try both (recommended)

## Troubleshooting

### Service Won't Start

```bash
# Check Python version
python3 --version  # Must be 3.9+

# Check port availability
lsof -i :8003
```

### No Dimensions Found

1. Check PDF quality - scanned PDFs may not work well
2. Try different method: `method=pymupdf`
3. Check dimension format - must include quotes (") or unit indicators

### Incorrect Code Detection

1. Check code format - must match pattern `[A-Z]{2,4}\d{2,4}`
2. Some codes may be generic - check `type: "unknown"`

## Comparison with AECVision

| Feature | Floorplan-Dimractor | AECVision |
|---------|---------------------|-----------|
| **What it extracts** | Text dimensions, codes | Visual elements (walls, fixtures) |
| **Best for** | Precise measurements, cabinets | Layout detection, room boundaries |
| **Input** | Text layer of PDF | Images (PDF pages converted) |
| **Output** | Numbers, codes, bounding boxes | Detected objects with coordinates |
| **Speed** | Very fast (text extraction) | Slower (image processing) |
| **Accuracy** | Exact text values | Estimated visual positions |

**Best Practice:** Use both together for comprehensive analysis.

## Development

### Adding New Code Patterns

Edit `workers/core/floorplan/code_detector.py`:

```python
CODE_PATTERNS = {
    # Add new pattern
    r'\bNEW\d{2,4}\b': {'type': 'new_type', 'name': 'New Item'},
}
```

### Adding New Dimension Formats

Edit `workers/core/floorplan/dimension_parser.py`:

```python
def setup_patterns(self):
    # Add new pattern
    self.new_pattern = re.compile(r'...')
```

## References

- [Floorplan-Dimractor](https://github.com/jasoncobra3/Floorplan-Dimractor) by jasoncobra3
- [PyMuPDF Documentation](https://pymupdf.readthedocs.io/)
- [pdfplumber Documentation](https://github.com/jsvine/pdfplumber)

## License

- Floorplan-Dimractor original: Check original repo license
- OpenSite integration: MIT
