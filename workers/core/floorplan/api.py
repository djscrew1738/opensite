"""
FastAPI Service for Floorplan Dimension Extraction
Provides HTTP endpoints for extracting dimensions and codes from floorplan PDFs
"""

import os
import logging
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
import uvicorn

from .pdf_processor import PDFProcessor
from .visualizer import FloorplanVisualizer
from .dimension_parser import DimensionParser
from .code_detector import CodeDetector
from workers.core.utils.files import safe_filename, read_upload_bytes_async

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
PORT = int(os.getenv('FLOORPLAN_PORT', '8003'))
HOST = os.getenv('FLOORPLAN_HOST', '0.0.0.0')
OUTPUT_DIR = Path(os.getenv('FLOORPLAN_OUTPUT_DIR', './output'))
MAX_UPLOAD_BYTES = int(os.getenv('FLOORPLAN_MAX_UPLOAD_MB', '100')) * 1024 * 1024

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Global processor instance
processor = None
visualizer = None


# Pydantic models for API
class Dimension(BaseModel):
    raw: str
    inches: float
    feet: float
    bbox: List[float]


class Code(BaseModel):
    code: str
    type: str
    name: str
    plumbing: bool
    bbox: Optional[List[float]] = None


class PageResult(BaseModel):
    page: int
    dimensions: List[Dimension]
    codes: List[Code]
    room_type: str
    dimension_stats: dict


class ExtractionResponse(BaseModel):
    success: bool
    method: str
    total_pages: int
    pages: List[PageResult]
    summary: Optional[dict] = None
    processing_time_ms: Optional[float] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    capabilities: List[str]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global processor, visualizer
    
    logger.info("Starting Floorplan Dimension Extractor service...")
    processor = PDFProcessor()
    visualizer = FloorplanVisualizer()
    logger.info("Service initialized")
    
    yield
    
    logger.info("Shutting down Floorplan service...")


app = FastAPI(
    title="Floorplan Dimension Extractor API",
    description="Extract dimensions and cabinet codes from architectural floorplan PDFs",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        capabilities=[
            "dimension_extraction",
            "code_detection",
            "pdf_processing",
            "visualization"
        ]
    )


@app.post("/extract", response_model=ExtractionResponse)
async def extract(
    file: UploadFile = File(...),
    method: str = Query("auto", enum=["auto", "pdfplumber", "pymupdf"]),
    include_summary: bool = Query(True)
):
    """
    Extract dimensions and codes from floorplan PDF
    
    - **file**: PDF floorplan file
    - **method**: Extraction method ('pdfplumber' for accuracy, 'pymupdf' for speed, 'auto' for both)
    - **include_summary**: Include summary statistics
    """
    import time
    start_time = time.time()
    
    # Save uploaded file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = safe_filename(file.filename, default="upload.pdf")
    input_path = OUTPUT_DIR / f"input_{timestamp}_{safe_name}"
    
    try:
        try:
            content = await read_upload_bytes_async(file, MAX_UPLOAD_BYTES)
        except ValueError as exc:
            raise HTTPException(status_code=413, detail=str(exc)) from exc
        with open(input_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Processing {file.filename} with method={method}")
        
        # Process PDF
        if include_summary:
            results = processor.extract_with_metadata(str(input_path), method)
        else:
            results = processor.extract(str(input_path), method)
        
        processing_time = (time.time() - start_time) * 1000
        
        # Add metadata
        results["success"] = True
        results["processing_time_ms"] = round(processing_time, 2)
        results["filename"] = file.filename
        
        return ExtractionResponse(**results)
        
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup input file
        try:
            if input_path.exists():
                input_path.unlink()
        except:
            pass


@app.post("/extract/dimensions")
async def extract_dimensions(
    file: UploadFile = File(...),
    method: str = Query("auto", enum=["auto", "pdfplumber", "pymupdf"])
):
    """
    Extract only dimensions from floorplan PDF
    
    Returns flattened list of all dimensions found
    """
    import time
    start_time = time.time()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = safe_filename(file.filename, default="upload.pdf")
    input_path = OUTPUT_DIR / f"input_{timestamp}_{safe_name}"
    
    try:
        try:
            content = await read_upload_bytes_async(file, MAX_UPLOAD_BYTES)
        except ValueError as exc:
            raise HTTPException(status_code=413, detail=str(exc)) from exc
        with open(input_path, "wb") as f:
            f.write(content)
        
        results = processor.extract(str(input_path), method)
        
        # Flatten dimensions
        all_dimensions = []
        for page in results.get("pages", []):
            for dim in page.get("dimensions", []):
                dim["page"] = page["page"]
                all_dimensions.append(dim)
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "success": True,
            "total_dimensions": len(all_dimensions),
            "dimensions": all_dimensions,
            "stats": DimensionParser().calculate_total_length(all_dimensions),
            "processing_time_ms": round(processing_time, 2)
        }
        
    except Exception as e:
        logger.error(f"Dimension extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            if input_path.exists():
                input_path.unlink()
        except:
            pass


@app.post("/extract/codes")
async def extract_codes(
    file: UploadFile = File(...),
    method: str = Query("auto", enum=["auto", "pdfplumber", "pymupdf"]),
    plumbing_only: bool = Query(False)
):
    """
    Extract cabinet/appliance/fixture codes from floorplan PDF
    
    - **plumbing_only**: Return only codes that require plumbing connections
    """
    import time
    start_time = time.time()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = safe_filename(file.filename, default="upload.pdf")
    input_path = OUTPUT_DIR / f"input_{timestamp}_{safe_name}"
    
    try:
        try:
            content = await read_upload_bytes_async(file, MAX_UPLOAD_BYTES)
        except ValueError as exc:
            raise HTTPException(status_code=413, detail=str(exc)) from exc
        with open(input_path, "wb") as f:
            f.write(content)
        
        results = processor.extract(str(input_path), method)
        
        # Flatten codes
        all_codes = []
        for page in results.get("pages", []):
            for code in page.get("codes", []):
                code["page"] = page["page"]
                all_codes.append(code)
        
        # Filter if requested
        if plumbing_only:
            all_codes = [c for c in all_codes if c.get("plumbing")]
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "success": True,
            "total_codes": len(all_codes),
            "codes": all_codes,
            "by_type": CodeDetector().count_by_type(all_codes),
            "processing_time_ms": round(processing_time, 2)
        }
        
    except Exception as e:
        logger.error(f"Code extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            if input_path.exists():
                input_path.unlink()
        except:
            pass


@app.post("/visualize")
async def create_visualization(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    page: int = Query(1, ge=1),
    scale: float = Query(2.0, ge=1.0, le=4.0)
):
    """
    Create visualization of extracted elements on floorplan
    
    Returns annotated image showing dimensions and codes
    """
    import time
    start_time = time.time()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = safe_filename(file.filename, default="upload.pdf")
    input_path = OUTPUT_DIR / f"input_{timestamp}_{safe_name}"
    
    try:
        try:
            content = await read_upload_bytes_async(file, MAX_UPLOAD_BYTES)
        except ValueError as exc:
            raise HTTPException(status_code=413, detail=str(exc)) from exc
        with open(input_path, "wb") as f:
            f.write(content)
        
        # Extract data
        results = processor.extract(str(input_path), "auto")
        
        # Create visualization
        viz_image = visualizer.create_visualization_image(
            str(input_path), results, page, scale
        )
        
        # Save to file
        output_path = OUTPUT_DIR / f"viz_{timestamp}_page{page}.png"
        viz_image.save(output_path, "PNG")
        
        processing_time = (time.time() - start_time) * 1000
        
        response = FileResponse(
            output_path,
            media_type="image/png",
            headers={
                "X-Processing-Time": str(round(processing_time, 2))
            }
        )
        if background_tasks is not None:
            background_tasks.add_task(output_path.unlink, missing_ok=True)
        return response
        
    except Exception as e:
        logger.error(f"Visualization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/patterns")
async def get_patterns():
    """Get supported dimension and code patterns"""
    return {
        "dimension_patterns": [
            {"pattern": "25\"", "example": "Simple inches", "parsed": "25.0 inches"},
            {"pattern": "2' 6\"", "example": "Feet and inches", "parsed": "30.0 inches"},
            {"pattern": "34 (1/2)\"", "example": "Fraction in parentheses", "parsed": "34.5 inches"},
            {"pattern": "25 3/4\"", "example": "Mixed number fraction", "parsed": "25.75 inches"},
            {"pattern": "34.5\"", "example": "Decimal inches", "parsed": "34.5 inches"}
        ],
        "code_patterns": [
            {"pattern": "DB24", "type": "base_cabinet", "description": "24\" Drawer Base"},
            {"pattern": "SB36", "type": "base_cabinet", "description": "36\" Sink Base", "plumbing": True},
            {"pattern": "DW", "type": "appliance", "description": "Dishwasher", "plumbing": True},
            {"pattern": "WC", "type": "fixture", "description": "Water Closet", "plumbing": True}
        ]
    }


@app.post("/analyze/pipe-estimate")
async def estimate_pipes(
    file: UploadFile = File(...),
    method: str = Query("auto")
):
    """
    Analyze floorplan and estimate pipe requirements
    
    Combines dimension extraction with code detection to estimate:
    - Supply line lengths
    - DWV requirements
    - Fixture counts
    """
    import time
    start_time = time.time()
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = safe_filename(file.filename, default="upload.pdf")
    input_path = OUTPUT_DIR / f"input_{timestamp}_{safe_name}"
    
    try:
        try:
            content = await read_upload_bytes_async(file, MAX_UPLOAD_BYTES)
        except ValueError as exc:
            raise HTTPException(status_code=413, detail=str(exc)) from exc
        with open(input_path, "wb") as f:
            f.write(content)
        
        # Extract with full metadata
        results = processor.extract_with_metadata(str(input_path), method)
        summary = results.get("summary", {})
        
        # Get plumbing codes
        all_codes = []
        for page in results.get("pages", []):
            all_codes.extend(page.get("codes", []))
        
        plumbing_codes = [c for c in all_codes if c.get("plumbing")]
        
        # Estimate based on codes
        fixture_estimate = {
            "sinks": len([c for c in plumbing_codes if 'sink' in c.get('name', '').lower()]),
            "dishwashers": len([c for c in plumbing_codes if 'dishwasher' in c.get('name', '').lower()]),
            "water_closets": len([c for c in plumbing_codes if 'water closet' in c.get('name', '').lower()]),
            "bathtubs": len([c for c in plumbing_codes if 'bathtub' in c.get('name', '').lower()]),
            "showers": len([c for c in plumbing_codes if 'shower' in c.get('name', '').lower()]),
            "water_heaters": len([c for c in plumbing_codes if 'water heater' in c.get('name', '').lower()])
        }
        
        # Estimate pipe lengths based on room dimensions
        dim_stats = summary.get("dimension_stats", {})
        total_feet = dim_stats.get("total_feet", 0)
        
        # Rough estimate: 40% of total dimension length for rough-in
        estimated_pipe_feet = total_feet * 0.4 if total_feet else 0
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "success": True,
            "fixture_estimate": fixture_estimate,
            "total_fixtures": sum(fixture_estimate.values()),
            "estimated_pipe_feet": round(estimated_pipe_feet, 1),
            "room_types": summary.get("room_types", []),
            "total_dimensions": summary.get("total_dimensions", 0),
            "processing_time_ms": round(processing_time, 2)
        }
        
    except Exception as e:
        logger.error(f"Pipe estimation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            if input_path.exists():
                input_path.unlink()
        except:
            pass


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
