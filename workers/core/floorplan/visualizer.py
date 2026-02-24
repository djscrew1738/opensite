"""
Visualizer Module
Creates visual representations of extracted dimensions and codes
Based on Floorplan-Dimractor by jasoncobra3
"""

import fitz  # PyMuPDF
import cv2
import numpy as np
from PIL import Image
import io
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class FloorplanVisualizer:
    """Visualize extracted dimensions and codes on floorplan PDFs"""
    
    def __init__(self):
        # Color scheme for different element types
        self.colors = {
            'dimension': (1, 0, 0),      # Red for dimensions
            'dimension_label': (0, 0.5, 0),  # Dark green for dimension labels
            'code': (0, 0, 1),           # Blue for codes
            'code_label': (0, 0.5, 0.5), # Teal for code labels
            'text': (0, 1, 0),           # Green for general text
            'room_boundary': (0.5, 0.5, 0),  # Olive for room boundaries
            'pipe_indicator': (1, 0.5, 0)    # Orange for pipe-related indicators
        }
    
    def draw_bounding_boxes(self, pdf_path: str, extraction_data: Dict, output_path: str):
        """
        Draw bounding boxes on PDF pages
        
        Args:
            pdf_path: Source PDF path
            extraction_data: Extraction results with dimensions and codes
            output_path: Output PDF path
        """
        doc = fitz.open(pdf_path)
        
        for page_data in extraction_data.get("pages", []):
            page_num = page_data.get("page", 1) - 1
            if page_num >= len(doc):
                continue
            
            page = doc[page_num]
            
            # Draw dimension bounding boxes
            for dim in page_data.get("dimensions", []):
                bbox = dim.get("bbox", [0, 0, 0, 0])
                if len(bbox) == 4:
                    rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
                    
                    # Draw rectangle
                    page.draw_rect(rect, color=self.colors['dimension'], width=2)
                    
                    # Add label
                    label = f"{dim.get('raw', '')} → {dim.get('inches', 0)}\""
                    page.insert_text(
                        (bbox[0], bbox[1] - 5),
                        label,
                        color=self.colors['dimension_label'],
                        fontsize=8
                    )
            
            # Draw code bounding boxes
            for code in page_data.get("codes", []):
                bbox = code.get("bbox", [0, 0, 0, 0])
                if len(bbox) == 4:
                    rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
                    
                    # Draw rectangle with different color
                    color = self.colors['pipe_indicator'] if code.get('plumbing') else self.colors['code']
                    page.draw_rect(rect, color=color, width=2)
                    
                    # Add label
                    label = f"{code.get('code', '')} ({code.get('name', '')})"
                    page.insert_text(
                        (bbox[0], bbox[1] - 5),
                        label,
                        color=self.colors['code_label'],
                        fontsize=7
                    )
        
        doc.save(output_path)
        doc.close()
        logger.info(f"Visualization saved to {output_path}")
    
    def create_visualization_image(self, pdf_path: str, extraction_data: Dict, page_num: int = 1, scale: float = 2.0) -> Image.Image:
        """
        Create a visualization image for a specific page
        
        Args:
            pdf_path: Source PDF path
            extraction_data: Extraction results
            page_num: Page to visualize (1-indexed)
            scale: Resolution scale factor
        
        Returns:
            PIL Image with annotations
        """
        doc = fitz.open(pdf_path)
        
        if page_num > len(doc) or page_num < 1:
            doc.close()
            raise ValueError(f"Invalid page number {page_num}, PDF has {len(doc)} pages")
        
        page = doc[page_num - 1]
        
        # Convert PDF page to image at higher resolution
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("ppm")
        
        # Convert to OpenCV format
        img = cv2.imdecode(np.frombuffer(img_data, np.uint8), 1)
        
        # Get page data
        page_data = next(
            (p for p in extraction_data.get("pages", []) if p.get("page") == page_num),
            None
        )
        
        if page_data:
            # Draw dimension bounding boxes
            for dim in page_data.get("dimensions", []):
                bbox = dim.get("bbox", [0, 0, 0, 0])
                if len(bbox) == 4:
                    # Scale coordinates
                    scaled_bbox = [int(coord * scale) for coord in bbox]
                    
                    # Draw rectangle (red)
                    cv2.rectangle(
                        img,
                        (scaled_bbox[0], scaled_bbox[1]),
                        (scaled_bbox[2], scaled_bbox[3]),
                        (0, 0, 255),  # BGR
                        2
                    )
                    
                    # Add label
                    label = f"{dim.get('raw', '')}"
                    cv2.putText(
                        img, label,
                        (scaled_bbox[0], scaled_bbox[1] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.4,
                        (0, 255, 0),  # Green
                        1
                    )
            
            # Draw code bounding boxes
            for code in page_data.get("codes", []):
                bbox = code.get("bbox", [0, 0, 0, 0])
                if len(bbox) == 4:
                    scaled_bbox = [int(coord * scale) for coord in bbox]
                    
                    # Different color for plumbing codes
                    if code.get('plumbing'):
                        color = (0, 165, 255)  # Orange for plumbing
                    else:
                        color = (255, 0, 0)  # Blue for others
                    
                    cv2.rectangle(
                        img,
                        (scaled_bbox[0], scaled_bbox[1]),
                        (scaled_bbox[2], scaled_bbox[3]),
                        color,
                        2
                    )
                    
                    # Add label
                    label = code.get('code', '')
                    cv2.putText(
                        img, label,
                        (scaled_bbox[0], scaled_bbox[1] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.4,
                        (255, 255, 0),  # Cyan
                        1
                    )
        
        # Convert back to PIL Image
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        
        doc.close()
        return pil_img
    
    def create_dimension_heatmap(self, pdf_path: str, extraction_data: Dict, page_num: int = 1) -> Image.Image:
        """
        Create a heatmap showing dimension density
        
        Useful for identifying areas with many measurements (likely detailed areas)
        """
        doc = fitz.open(pdf_path)
        
        if page_num > len(doc):
            doc.close()
            return None
        
        page = doc[page_num - 1]
        
        # Get page dimensions
        rect = page.rect
        width, height = int(rect.width), int(rect.height)
        
        # Create blank heatmap
        heatmap = np.zeros((height, width), dtype=np.float32)
        
        # Get page data
        page_data = next(
            (p for p in extraction_data.get("pages", []) if p.get("page") == page_num),
            None
        )
        
        if page_data:
            for dim in page_data.get("dimensions", []):
                bbox = dim.get("bbox", [0, 0, 0, 0])
                if len(bbox) == 4:
                    x0, y0, x1, y1 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
                    
                    # Ensure within bounds
                    x0, y0 = max(0, x0), max(0, y0)
                    x1, y1 = min(width, x1), min(height, y1)
                    
                    # Add to heatmap
                    heatmap[y0:y1, x0:x1] += 1
        
        # Normalize
        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max() * 255
        
        # Convert to color map
        heatmap_colored = cv2.applyColorMap(heatmap.astype(np.uint8), cv2.COLORMAP_JET)
        
        # Convert to PIL
        img_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        
        doc.close()
        return pil_img
    
    def generate_summary_image(self, extraction_data: Dict, width: int = 800, height: int = 600) -> Image.Image:
        """
        Generate a summary visualization as an image
        
        Shows statistics and key findings
        """
        # Create blank image
        img = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Add title
        cv2.putText(img, "Floorplan Analysis Summary", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        # Get summary stats
        summary = extraction_data.get("summary", {})
        
        y_pos = 100
        line_height = 40
        
        # Dimensions stats
        dim_stats = summary.get("dimension_stats", {})
        cv2.putText(img, f"Dimensions Found: {summary.get('total_dimensions', 0)}",
                    (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 1)
        y_pos += line_height
        
        cv2.putText(img, f"Total Length: {dim_stats.get('total_feet', 0):.1f} ft",
                    (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 1)
        y_pos += line_height
        
        # Codes stats
        cv2.putText(img, f"Codes Found: {summary.get('total_codes', 0)}",
                    (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 1)
        y_pos += line_height
        
        cv2.putText(img, f"Plumbing Connections: {summary.get('plumbing_codes', 0)}",
                    (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 1)
        y_pos += line_height
        
        # Room types
        room_types = summary.get("room_types", [])
        cv2.putText(img, f"Detected Rooms: {', '.join(room_types) if room_types else 'Unknown'}",
                    (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 128, 0), 1)
        
        # Convert to PIL
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        return Image.fromarray(img_rgb)
