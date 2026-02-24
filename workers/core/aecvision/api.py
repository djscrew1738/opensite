"""
FastAPI Service for AECVision Blueprint Analysis
Provides HTTP endpoints for CV-based blueprint processing
"""

import os
import logging
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager
import tempfile
import shutil

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import uvicorn

from convert_pdf import PDFConverter, ImageTiler, convert_and_tile_pdf
from detector import BlueprintDetector, SAHIDetector
from analysis import BlueprintAnalyzer, PlumbingEstimator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DEFAULT_MODEL_PATH = os.getenv('AECVISION_MODEL_PATH', 'train_results/model_12classes/weights/best.pt')
CONFIDENCE_THRESHOLD = float(os.getenv('AECVISION_CONFIDENCE', '0.5'))
DEVICE = os.getenv('AECVISION_DEVICE', None)  # None = auto
PORT = int(os.getenv('AECVISION_PORT', '8002'))
HOST = os.getenv('AECVISION_HOST', '0.0.0.0')

# Global detector instance
detector = None
analyzer = None


# Pydantic models for API
class DetectionResponse(BaseModel):
    success: bool
    detections: list
    counts: dict
    total: int
    processing_time_ms: Optional[float] = None


class AnalysisResponse(BaseModel):
    success: bool
    detections: dict
    fixtures: dict
    pipe_runs: dict
    material_takeoff: list
    totals: dict
    visualization_url: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    model_path: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global detector, analyzer
    
    # Startup: Load model
    logger.info("Loading AECVision model...")
    model_path = Path(DEFAULT_MODEL_PATH)
    
    if model_path.exists():
        detector = BlueprintDetector(
            model_path=model_path,
            confidence_threshold=CONFIDENCE_THRESHOLD,
            device=DEVICE
        )
        estimator = PlumbingEstimator()
        analyzer = BlueprintAnalyzer(detector, estimator)
        logger.info(f"Model loaded from {model_path}")
    else:
        logger.warning(f"Model not found at {model_path}, will use fallback")
        detector = BlueprintDetector(confidence_threshold=CONFIDENCE_THRESHOLD)
        estimator = PlumbingEstimator()
        analyzer = BlueprintAnalyzer(detector, estimator)
    
    yield
    
    # Shutdown: Cleanup
    logger.info("Shutting down AECVision service...")


app = FastAPI(
    title="AECVision Blueprint Analysis API",
    description="Computer Vision service for analyzing architectural blueprints",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if detector else "unhealthy",
        model_loaded=detector is not None,
        device=detector.device if detector else "unknown",
        model_path=str(DEFAULT_MODEL_PATH) if Path(DEFAULT_MODEL_PATH).exists() else None
    )


@app.post("/detect", response_model=DetectionResponse)
async def detect(
    file: UploadFile = File(...),
    confidence: float = 0.5,
    size: int = 1280
):
    """
    Run object detection on blueprint image
    
    - **file**: Image file (JPG, PNG) or PDF
    - **confidence**: Minimum confidence threshold (0-1)
    - **size**: Inference size (default 1280)
    """
    if not detector:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Create temp directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Save uploaded file
        input_path = temp_path / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        try:
            # Handle PDF conversion if needed
            image_path = input_path
            if input_path.suffix.lower() == '.pdf':
                converter = PDFConverter(input_path)
                image_path = temp_path / "converted_page.jpg"
                converter.save_page(image_path, page_num=0)
                converter.close()
            
            # Run detection
            import time
            start_time = time.time()
            
            detector.model.conf = confidence
            results = detector.detect_with_visualization(image_path)
            
            processing_time = (time.time() - start_time) * 1000
            
            return DetectionResponse(
                success=True,
                detections=results['detections'],
                counts=results['counts'],
                total=results['total'],
                processing_time_ms=round(processing_time, 2)
            )
            
        except Exception as e:
            logger.error(f"Detection error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    confidence: float = 0.5,
    pixel_to_feet: float = 0.5,
    include_materials: bool = True
):
    """
    Complete blueprint analysis with plumbing estimates
    
    - **file**: Image file (JPG, PNG) or PDF
    - **confidence**: Detection confidence threshold
    - **pixel_to_feet**: Scale conversion factor
    - **include_materials**: Include material takeoff
    """
    if not analyzer:
        raise HTTPException(status_code=503, detail="Analyzer not initialized")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Save uploaded file
        input_path = temp_path / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        try:
            # Handle PDF conversion
            image_path = input_path
            if input_path.suffix.lower() == '.pdf':
                converter = PDFConverter(input_path)
                image_path = temp_path / "converted_page.jpg"
                converter.save_page(image_path, page_num=0)
                converter.close()
            
            # Update estimator scale
            analyzer.estimator.pixel_to_feet = pixel_to_feet
            detector.model.conf = confidence
            
            # Run analysis
            results = analyzer.analyze(image_path, include_materials=include_materials)
            
            # Save visualization
            vis_path = temp_path / "visualization.jpg"
            det_results = detector.detect_with_visualization(image_path, vis_path)
            
            return AnalysisResponse(
                success=True,
                detections=results['detections'],
                fixtures=results['fixtures'],
                pipe_runs=results['pipe_runs'],
                material_takeoff=results.get('material_takeoff', []),
                totals=results.get('totals', {}),
                visualization_url=f"/visualization/{file.filename}"
            )
            
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect/walls")
async def detect_walls(
    file: UploadFile = File(...),
    confidence: float = 0.8,
    use_sahi: bool = False
):
    """
    Detect walls only (optimized for pipe run estimation)
    
    - **file**: Image file or PDF
    - **confidence**: Higher threshold for wall detection (default 0.8)
    - **use_sahi**: Use SAHI for large images
    """
    if not detector:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        input_path = temp_path / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        try:
            # Convert PDF if needed
            image_path = input_path
            if input_path.suffix.lower() == '.pdf':
                converter = PDFConverter(input_path)
                image_path = temp_path / "converted_page.jpg"
                converter.save_page(image_path, page_num=0)
                converter.close()
            
            # Detect walls
            if use_sahi:
                sahi_detector = SAHIDetector(
                    Path(DEFAULT_MODEL_PATH) if Path(DEFAULT_MODEL_PATH).exists() else None,
                    confidence
                )
                results = sahi_detector.detect(image_path)
                walls = [d for d in results['detections'] if d['class'] == 'wall']
            else:
                detector.model.conf = confidence
                results = detector.detect_with_visualization(image_path)
                walls = [d for d in results['detections'] if d['class'] == 'wall']
            
            # Calculate total wall length
            total_length = sum(
                (w['bbox']['xmax'] - w['bbox']['xmin']) + (w['bbox']['ymax'] - w['bbox']['ymin'])
                for w in walls
            )
            
            return {
                'success': True,
                'wall_count': len(walls),
                'walls': walls,
                'total_length_pixels': round(total_length, 2)
            }
            
        except Exception as e:
            logger.error(f"Wall detection error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/convert/pdf")
async def convert_pdf(file: UploadFile = File(...), page_num: int = 0):
    """
    Convert PDF to image
    
    - **file**: PDF file
    - **page_num**: Page number to convert (0-indexed)
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        input_path = temp_path / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        try:
            converter = PDFConverter(input_path)
            output_path = temp_path / "converted.jpg"
            converter.save_page(output_path, page_num)
            converter.close()
            
            return FileResponse(output_path, media_type="image/jpeg")
            
        except Exception as e:
            logger.error(f"PDF conversion error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/available")
async def list_models():
    """List available detection classes"""
    return {
        'classes': [
            {'name': 'wall', 'description': 'Structural walls', 'relevance': 'high'},
            {'name': 'door', 'description': 'Doors', 'relevance': 'medium'},
            {'name': 'window', 'description': 'Windows', 'relevance': 'medium'},
            {'name': 'room', 'description': 'Room areas', 'relevance': 'high'},
            {'name': 'stairs', 'description': 'Staircases', 'relevance': 'low'},
            {'name': 'elevator', 'description': 'Elevator shafts', 'relevance': 'medium'},
            {'name': 'column', 'description': 'Structural columns', 'relevance': 'medium'},
            {'name': 'beam', 'description': 'Structural beams', 'relevance': 'low'},
            {'name': 'toilet', 'description': 'Toilets/WCs', 'relevance': 'high'},
            {'name': 'sink', 'description': 'Sinks/Lavs', 'relevance': 'high'},
            {'name': 'shower', 'description': 'Showers', 'relevance': 'high'},
            {'name': 'bathtub', 'description': 'Bathtubs', 'relevance': 'high'}
        ]
    }


# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc)}
    )


def main():
    """Run the API server"""
    uvicorn.run(
        "api:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info"
    )


if __name__ == "__main__":
    main()
