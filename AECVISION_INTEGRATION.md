# AECVision Integration for OpenSite

This document describes the integration of [AECVision](https://github.com/PawelKinczyk/AECVision) computer vision capabilities into the OpenSite blueprint analysis engine.

## Overview

AECVision provides YOLOv5-based object detection for architectural blueprints, detecting elements like:
- **Walls** - For pipe run estimation
- **Doors/Windows** - For penetration planning
- **Rooms** - For space validation
- **Fixtures** - Toilets, sinks, showers, bathtubs
- **Structural elements** - Columns, beams, stairs

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  OpenSite       │────▶│  AECVision       │────▶│  YOLOv5         │
│  Backend        │     │  Python Service  │     │  Object         │
│  (Node.js)      │◀────│  (FastAPI)       │◀────│  Detection      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  AI Provider    │     │  PDF/Image       │
│  (LLM Analysis) │     │  Processing      │
└─────────────────┘     └──────────────────┘
```

## Integration Components

### 1. Python CV Service (`workers/core/aecvision/`)

- **`api.py`** - FastAPI HTTP service
- **`detector.py`** - YOLOv5 object detection wrapper
- **`convert_pdf.py`** - PDF to image conversion with tiling
- **`analysis.py`** - Plumbing estimation from detected elements

### 2. Node.js Client (`backend/src/services/aecvision-client.js`)

- `AECVisionClient` - HTTP client for Python service
- `EnhancedCVBlueprintService` - Combines CV + AI analysis

### 3. API Routes (`backend/src/routes/aecvision.js`)

- `/api/aecvision/health` - Service health check
- `/api/aecvision/detect` - Object detection
- `/api/aecvision/analyze` - Complete CV analysis
- `/api/aecvision/walls` - Wall detection for pipe runs
- `/api/aecvision/enhanced-analysis` - CV + AI combined
- `/api/aecvision/compare` - Compare CV/AI/Combined results

## Installation

### Prerequisites

- Python 3.9+
- CUDA-capable GPU (optional but recommended)
- Node.js dependencies already installed

### Setup

1. **Start the AECVision service:**
   ```bash
   ./start-aecvision.sh
   ```

   This will:
   - Create a Python virtual environment
   - Install dependencies (PyTorch, YOLOv5, SAHI, etc.)
   - Start the FastAPI service on port 8002

2. **Verify the service:**
   ```bash
   curl http://localhost:8002/health
   ```

3. **Configure environment (optional):**
   ```bash
   # Add to backend/.env
   AECVISION_URL=http://localhost:8002
   AECVISION_CONFIDENCE=0.5
   AECVISION_DEVICE=cuda  # or 'cpu'
   ```

## Model Setup

### Option 1: Download Pre-trained AECVision Models

The original AECVision models are not included in this repository. You can:

1. Clone the original AECVision repo and copy models:
   ```bash
   git clone https://github.com/PawelKinczyk/AECVision.git /tmp/aecvision
   cp -r /tmp/aecvision/train_results ./train_results
   ```

2. Set the model path:
   ```bash
   export AECVISION_MODEL_PATH=./train_results/model_12classes/weights/best.pt
   ```

### Option 2: Use YOLOv5 Pre-trained (Fallback)

If no custom model is provided, the service will use YOLOv5m pretrained on COCO. This provides limited blueprint detection but will work for general object detection.

### Option 3: Train Your Own Model

Follow the AECVision training pipeline in `modules/prepare_data_and_training/`:

1. Label blueprints with Label Studio
2. Train with YOLOv5
3. Export model weights

## API Usage

### Basic Object Detection

```bash
curl -X POST http://localhost:8002/detect \
  -F "file=@blueprint.pdf" \
  -F "confidence=0.6"
```

### Complete Analysis

```bash
curl -X POST http://localhost:8002/analyze \
  -F "file=@blueprint.pdf" \
  -F "confidence=0.5" \
  -F "pixel_to_feet=0.5"
```

### Wall Detection (for Pipe Runs)

```bash
curl -X POST http://localhost:8002/detect/walls \
  -F "file=@blueprint.pdf" \
  -F "confidence=0.8"
```

### Enhanced Analysis (CV + AI)

```bash
curl -X POST http://localhost:5001/api/aecvision/enhanced-analysis \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/path/to/blueprint.pdf",
    "useCV": true,
    "useAI": true,
    "tier": "custom"
  }'
```

## Response Format

### Detection Response

```json
{
  "success": true,
  "detections": [
    {
      "class": "wall",
      "confidence": 0.92,
      "bbox": {
        "xmin": 100.5,
        "ymin": 200.0,
        "xmax": 400.5,
        "ymax": 220.0,
        "width": 300.0,
        "height": 20.0
      }
    }
  ],
  "counts": {
    "wall": 15,
    "door": 4,
    "window": 6,
    "toilet": 3
  },
  "total": 28
}
```

### Analysis Response

```json
{
  "success": true,
  "detections": { ... },
  "fixtures": {
    "toilets": 3,
    "sinks": 4,
    "showers": 2,
    "bathtubs": 1,
    "total_fixtures": 10,
    "fixture_units": 12
  },
  "pipe_runs": {
    "water_supply": {
      "main_feet": 125.5,
      "branch_feet": 850.0
    },
    "drain_waste_vent": {
      "main_feet": 95.0,
      "branch_feet": 680.0
    }
  },
  "material_takeoff": [
    {
      "item": "3/4\" Type L Copper Pipe",
      "category": "Supply",
      "quantity": 126,
      "unit": "LF",
      "purpose": "Water supply main"
    }
  ],
  "totals": {
    "material": 15200.00,
    "labor_multiplier": 1.65,
    "estimate": 25080.00
  }
}
```

## How It Enhances Blueprint Analysis

### 1. **Fixture Count Validation**
   - CV detects actual fixtures in the image
   - Cross-references with text extraction
   - Uses higher count for accuracy

### 2. **Pipe Run Estimation**
   - Wall detection identifies rough-in paths
   - Calculates linear feet by wall layout
   - Estimates main vs branch distribution

### 3. **Room Type Detection**
   - Identifies bathrooms, kitchens from layout
   - Validates fixture placement
   - Checks for missing fixtures

### 4. **Material Takeoff Enhancement**
   - CV provides physical measurements
   - AI provides material specifications
   - Combined = more accurate quantities

## Performance Considerations

### GPU Acceleration

| Device | Detection Speed | Analysis Speed |
|--------|----------------|----------------|
| CPU (8 cores) | ~2-5s/image | ~10-20s/image |
| GPU (RTX 3060) | ~0.2-0.5s/image | ~2-5s/image |
| GPU (RTX 4090) | ~0.05-0.1s/image | ~1-2s/image |

### Memory Requirements

- **Minimum**: 4GB RAM, 2GB VRAM
- **Recommended**: 8GB RAM, 4GB+ VRAM
- **Large Blueprints**: 16GB RAM, 8GB+ VRAM

### Large Blueprint Handling

For blueprints larger than 2000x2000 pixels:

1. **Tiling** - Automatically splits into 1280x1280 tiles
2. **SAHI** - Slicing Aided Hyper Inference for large images
3. **Overlap** - 128-256px overlap between tiles for continuity

## Troubleshooting

### Service Won't Start

```bash
# Check Python version
python3 --version  # Must be 3.9+

# Check CUDA (if using GPU)
python3 -c "import torch; print(torch.cuda.is_available())"

# Check port availability
lsof -i :8002
```

### Model Not Found

```bash
# Check model path
ls -la train_results/model_12classes/weights/best.pt

# Set correct path
export AECVISION_MODEL_PATH=/absolute/path/to/model.pt
```

### Low Detection Accuracy

1. **Increase confidence threshold:**
   ```bash
   export AECVISION_CONFIDENCE=0.7
   ```

2. **Use SAHI for large images:**
   ```json
   {"useSahi": true}
   ```

3. **Check image quality:**
   - Minimum 150 DPI
   - Clear lines (not scanned/fuzzy)
   - Good contrast

## Development

### Adding New Detection Classes

1. Train YOLOv5 model with new classes
2. Update `AECVISION_CLASSES` in `detector.py`
3. Update analysis logic in `analysis.py`
4. Update API docs

### Extending Analysis Pipeline

The `BlueprintAnalyzer` class can be extended:

```python
class CustomAnalyzer(BlueprintAnalyzer):
    def custom_analysis(self, detections):
        # Add custom logic
        pass
```

## License

AECVision is GPL v3 licensed. When using their models, comply with the license terms.

OpenSite integration code is MIT licensed.

## References

- [AECVision Original Repository](https://github.com/PawelKinczyk/AECVision)
- [YOLOv5 Documentation](https://docs.ultralytics.com/yolov5/)
- [SAHI Documentation](https://github.com/obss/sahi)
- [PyTorch Hub](https://pytorch.org/hub/)
