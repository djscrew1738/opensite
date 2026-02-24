"""
PDF to Image Conversion Module
Based on AECVision's classes_functions.py
Handles conversion of blueprint PDFs to processable images
"""

import fitz  # PyMuPDF
from PIL import Image
import io
import math
from pathlib import Path
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


def to_1280_format(h: int, w: int) -> Tuple[int, int, int, int]:
    """Return pixel coordinates for 1280x1280 crop tiles"""
    return (w * 1280, h * 1280, (w + 1) * 1280, (h + 1) * 1280)


class PDFConverter:
    """Convert PDF blueprints to images for CV processing"""
    
    def __init__(self, pdf_path: Path, dpi: int = 300):
        """
        Initialize PDF converter
        
        Args:
            pdf_path: Path to PDF file
            dpi: Resolution for rendering (default 300 for blueprints)
        """
        self.pdf_path = Path(pdf_path)
        self.dpi = dpi
        
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
        self.doc = fitz.open(str(self.pdf_path))
        self.page_count = len(self.doc)
        
    def get_page_image(self, page_num: int = 0) -> Image.Image:
        """Get PIL Image of specific page"""
        if page_num >= self.page_count:
            raise ValueError(f"Page {page_num} exceeds document length ({self.page_count})")
        
        page = self.doc.load_page(page_num)
        pixmap = page.get_pixmap(dpi=self.dpi)
        
        # Convert to PIL Image
        img_data = pixmap.tobytes("jpg")
        return Image.open(io.BytesIO(img_data))
    
    def get_page_bytes(self, page_num: int = 0) -> bytes:
        """Get image bytes of specific page"""
        if page_num >= self.page_count:
            raise ValueError(f"Page {page_num} exceeds document length ({self.page_count})")
        
        page = self.doc.load_page(page_num)
        pixmap = page.get_pixmap(dpi=self.dpi)
        return pixmap.tobytes("jpg")
    
    def save_page(self, output_path: Path, page_num: int = 0) -> Path:
        """Save specific page as image"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        page = self.doc.load_page(page_num)
        pixmap = page.get_pixmap(dpi=self.dpi)
        pixmap.save(str(output_path))
        
        logger.info(f"Saved page {page_num} to {output_path}")
        return output_path
    
    def get_all_pages(self) -> List[Image.Image]:
        """Get all pages as PIL Images"""
        images = []
        for page_num in range(self.page_count):
            images.append(self.get_page_image(page_num))
        return images
    
    def close(self):
        """Close PDF document"""
        if self.doc:
            self.doc.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class ImageTiler:
    """Tile large blueprint images for CV processing"""
    
    def __init__(self, tile_size: int = 1280, overlap: int = 128):
        """
        Initialize image tiler
        
        Args:
            tile_size: Size of each tile (default 1280 for YOLOv5)
            overlap: Overlap between tiles (default 128 for context)
        """
        self.tile_size = tile_size
        self.overlap = overlap
    
    def calculate_tiles(self, width: int, height: int) -> Tuple[int, int]:
        """Calculate number of tiles needed"""
        cols = math.ceil(width / (self.tile_size - self.overlap))
        rows = math.ceil(height / (self.tile_size - self.overlap))
        return cols, rows
    
    def create_tiles(self, image: Image.Image) -> List[dict]:
        """
        Create tiles from image
        
        Returns list of dicts with:
        - image: PIL Image of tile
        - x: x offset in original image
        - y: y offset in original image
        - row: tile row number
        - col: tile column number
        """
        tiles = []
        width, height = image.size
        
        cols, rows = self.calculate_tiles(width, height)
        
        for row in range(rows):
            for col in range(cols):
                # Calculate tile boundaries with overlap
                left = col * (self.tile_size - self.overlap)
                top = row * (self.tile_size - self.overlap)
                right = min(left + self.tile_size, width)
                bottom = min(top + self.tile_size, height)
                
                # Crop tile
                tile = image.crop((left, top, right, bottom))
                
                # Resize to standard tile size if needed
                if tile.size != (self.tile_size, self.tile_size):
                    tile = tile.resize((self.tile_size, self.tile_size), Image.Resampling.LANCZOS)
                
                tiles.append({
                    'image': tile,
                    'x': left,
                    'y': top,
                    'width': right - left,
                    'height': bottom - top,
                    'row': row,
                    'col': col,
                    'original_width': width,
                    'original_height': height
                })
        
        logger.info(f"Created {len(tiles)} tiles ({cols}x{rows}) from image {width}x{height}")
        return tiles
    
    def save_tiles(self, tiles: List[dict], output_dir: Path, prefix: str = "tile") -> List[Path]:
        """Save tiles to disk"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        saved_paths = []
        for tile_info in tiles:
            filename = f"{prefix}_{tile_info['row']}_{tile_info['col']}.jpg"
            filepath = output_dir / filename
            tile_info['image'].save(filepath, 'JPEG', quality=95)
            saved_paths.append(filepath)
        
        return saved_paths


def convert_and_tile_pdf(
    pdf_path: Path,
    output_dir: Path,
    page_num: int = 0,
    tile_size: int = 1280,
    overlap: int = 128,
    dpi: int = 300
) -> dict:
    """
    Complete pipeline: PDF -> Image -> Tiles
    
    Returns dict with:
    - original_image: Path to full page image
    - tiles: List of tile file paths
    - metadata: Processing metadata
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Convert PDF to image
    with PDFConverter(pdf_path, dpi=dpi) as converter:
        # Save full page image
        original_path = output_dir / "original_page.jpg"
        converter.save_page(original_path, page_num)
        
        # Get image for tiling
        image = converter.get_page_image(page_num)
        
        # Create tiles
        tiler = ImageTiler(tile_size=tile_size, overlap=overlap)
        tiles = tiler.create_tiles(image)
        
        # Save tiles
        tiles_dir = output_dir / "tiles"
        tile_paths = tiler.save_tiles(tiles, tiles_dir)
        
        return {
            'original_image': original_path,
            'tiles': tile_paths,
            'metadata': {
                'page_num': page_num,
                'original_size': image.size,
                'tile_size': tile_size,
                'overlap': overlap,
                'tile_count': len(tiles),
                'cols': max(t['col'] for t in tiles) + 1 if tiles else 0,
                'rows': max(t['row'] for t in tiles) + 1 if tiles else 0
            }
        }
