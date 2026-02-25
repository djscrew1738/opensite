"""
FastAPI Service for Structural Element Detection
YOLOv8-based floor plan analysis — detects walls, doors, windows, columns, etc.
"""

import os
import logging
import time
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager
import tempfile

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

from detector import StructuralDetector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Configuration
DEFAULT_MODEL_PATH = os.getenv(
    'STRUCTURAL_MODEL_PATH',
    'models/best.pt',
)
CONFIDENCE_THRESHOLD = float(os.getenv('STRUCTURAL_CONFIDENCE', '0.40'))
DEVICE = os.getenv('STRUCTURAL_DEVICE', None)  # None = auto
PORT = int(os.getenv('STRUCTURAL_PORT', '8004'))
HOST = os.getenv('STRUCTURAL_HOST', '0.0.0.0')
MAX_UPLOAD_BYTES = int(os.getenv('STRUCTURAL_MAX_UPLOAD_MB', '100')) * 1024 * 1024

# Global detector instance
detector: Optional[StructuralDetector] = None


# Pydantic response models
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    classes: list
    model_path: Optional[str] = None


class DetectionResponse(BaseModel):
    success: bool
    detections: list
    counts: dict
    total: int
    processing_time_ms: Optional[float] = None


class AnalysisResponse(BaseModel):
    success: bool
    detections: list
    counts: dict
    total: int
    structural_summary: dict
    spatial_metrics: dict
    processing_time_ms: Optional[float] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global detector

    logger.info("Loading structural detection model...")
    model_path = Path(DEFAULT_MODEL_PATH)

    detector = StructuralDetector(
        model_path=model_path if model_path.exists() else None,
        confidence_threshold=CONFIDENCE_THRESHOLD,
        device=DEVICE,
    )
    logger.info(f"Model loaded (path exists: {model_path.exists()})")

    yield

    logger.info("Shutting down structural detector service...")


app = FastAPI(
    title="Structural Element Detection API",
    description="YOLOv8-based detection of walls, doors, windows, columns and other architectural elements in floor plans",
    version="1.0.0",
    lifespan=lifespan,
)


def _safe_filename(filename: str | None, default: str = "upload.png") -> str:
    """Sanitize a user-provided filename."""
    raw = (filename or "").replace("\\", "/")
    name = Path(raw).name
    if not name or name in {".", ".."}:
        return default
    return name


async def _read_upload(upload_file, max_bytes: int) -> bytes:
    """Read an UploadFile and enforce size limit."""
    content = await upload_file.read()
    if len(content) > max_bytes:
        raise ValueError(f"Upload exceeds {max_bytes} bytes")
    return content


def _save_upload(content: bytes, filename: str, temp_path: Path) -> Path:
    """Write uploaded bytes to a temp file and return the path."""
    safe_name = _safe_filename(filename, default="upload.png")
    input_path = temp_path / safe_name
    with open(input_path, "wb") as f:
        f.write(content)
    return input_path


def _convert_pdf_if_needed(input_path: Path, temp_path: Path) -> Path:
    """If the file is a PDF, convert first page to JPEG."""
    if input_path.suffix.lower() != '.pdf':
        return input_path

    import fitz  # PyMuPDF
    doc = fitz.open(str(input_path))
    page = doc.load_page(0)
    pix = page.get_pixmap(dpi=200)
    image_path = temp_path / "converted_page.jpg"
    pix.save(str(image_path))
    doc.close()
    return image_path


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if detector else "unhealthy",
        model_loaded=detector is not None,
        device=detector.device if detector else "unknown",
        classes=detector.classes if detector else [],
        model_path=str(DEFAULT_MODEL_PATH) if Path(DEFAULT_MODEL_PATH).exists() else None,
    )


@app.post("/detect", response_model=DetectionResponse)
async def detect(
    file: UploadFile = File(...),
    confidence: float = 0.40,
    size: int = 1280,
):
    """
    Run structural element detection on a floor plan image.

    - **file**: Image (JPG, PNG) or PDF
    - **confidence**: Minimum confidence threshold (0-1)
    - **size**: Inference size (default 1280)
    """
    if not detector:
        raise HTTPException(status_code=503, detail="Model not loaded")

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        try:
            content = await _read_upload(file, MAX_UPLOAD_BYTES)
        except ValueError as exc:
            raise HTTPException(status_code=413, detail=str(exc)) from exc

        input_path = _save_upload(content, file.filename, temp_path)
        try:
            image_path = _convert_pdf_if_needed(input_path, temp_path)

            old_conf = detector.confidence_threshold
            detector.confidence_threshold = confidence

            start = time.time()
            result = detector.detect_with_counts(image_path, size=size)
            elapsed_ms = (time.time() - start) * 1000

            detector.confidence_threshold = confidence

            return DetectionResponse(
                success=True,
                detections=result['detections'],
                counts=result['counts'],
                total=result['total'],
                processing_time_ms=round(elapsed_ms, 2),
            )
        except Exception as e:
            logger.error(f"Detection error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    confidence: float = 0.40,
    pixel_to_feet: float = 0.5,
    size: int = 1280,
):
    """
    Full structural analysis with spatial metrics.

    - **file**: Image (JPG, PNG) or PDF
    - **confidence**: Detection confidence threshold
    - **pixel_to_feet**: Scale conversion factor
    - **size**: Inference size
    """
    if not detector:
        raise HTTPException(status_code=503, detail="Model not loaded")

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        try:
            content = await _read_upload(file, MAX_UPLOAD_BYTES)
        except ValueError as exc:
            raise HTTPException(status_code=413, detail=str(exc)) from exc

        input_path = _save_upload(content, file.filename, temp_path)
        try:
            image_path = _convert_pdf_if_needed(input_path, temp_path)

            start = time.time()
            result = detector.analyze_structure(
                image_path,
                pixel_to_feet=pixel_to_feet,
                size=size,
            )
            elapsed_ms = (time.time() - start) * 1000

            return AnalysisResponse(
                success=True,
                detections=result['detections'],
                counts=result['counts'],
                total=result['total'],
                structural_summary=result['structural_summary'],
                spatial_metrics=result['spatial_metrics'],
                processing_time_ms=round(elapsed_ms, 2),
            )
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/classes")
async def list_classes():
    """List available detection classes"""
    return {
        'classes': [
            {'name': 'Wall', 'description': 'Structural walls', 'category': 'structural'},
            {'name': 'Curtain Wall', 'description': 'Glass/curtain wall systems', 'category': 'structural'},
            {'name': 'Column', 'description': 'Structural columns', 'category': 'structural'},
            {'name': 'Door', 'description': 'Standard doors', 'category': 'opening'},
            {'name': 'Sliding Door', 'description': 'Sliding door systems', 'category': 'opening'},
            {'name': 'Window', 'description': 'Windows', 'category': 'opening'},
            {'name': 'Stair Case', 'description': 'Staircases', 'category': 'circulation'},
            {'name': 'Railing', 'description': 'Railings and guards', 'category': 'circulation'},
            {'name': 'Dimension', 'description': 'Dimension annotations', 'category': 'annotation'},
        ]
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc)},
    )


def main():
    """Run the API server"""
    uvicorn.run(
        "api:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
