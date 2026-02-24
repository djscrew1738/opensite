"""
PDF Processor Module
Extracts text and dimensions from floorplan PDFs
Based on Floorplan-Dimractor by jasoncobra3
"""

import pdfplumber
import fitz  # PyMuPDF
from typing import Dict, List, Tuple, Optional
from .dimension_parser import DimensionParser
from .code_detector import CodeDetector
import logging

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Process floorplan PDFs to extract dimensions and codes"""
    
    def __init__(self):
        self.dimension_parser = DimensionParser()
        self.code_detector = CodeDetector()
    
    def extract_with_pdfplumber(self, pdf_path: str) -> Dict:
        """
        Extract text and metadata using pdfplumber
        
        Best for: Complex layouts, accurate spatial data
        Pros: Excellent layout analysis, detailed text positioning
        Cons: Slower than PyMuPDF
        """
        results = {"pages": [], "method": "pdfplumber"}
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_data = self.process_page_plumber(page, page_num)
                    results["pages"].append(page_data)
                
                results["total_pages"] = len(pdf.pages)
                
        except Exception as e:
            logger.error(f"Error processing PDF with pdfplumber: {e}")
            results["error"] = str(e)
        
        return results
    
    def extract_with_pymupdf(self, pdf_path: str) -> Dict:
        """
        Extract text and metadata using PyMuPDF
        
        Best for: High-volume processing, speed critical
        Pros: Very fast, memory efficient
        Cons: Basic layout analysis
        """
        results = {"pages": [], "method": "pymupdf"}
        
        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_data = self.process_page_pymupdf(page, page_num + 1)
                results["pages"].append(page_data)
            
            results["total_pages"] = len(doc)
            doc.close()
            
        except Exception as e:
            logger.error(f"Error processing PDF with PyMuPDF: {e}")
            results["error"] = str(e)
        
        return results
    
    def process_page_plumber(self, page, page_num: int) -> Dict:
        """Process a single page using pdfplumber"""
        dimensions = []
        all_codes = []
        raw_text_blocks = []
        
        # Extract text with bounding boxes
        words = page.extract_words()
        
        for word in words:
            text = word['text']
            bbox = [word['x0'], word['top'], word['x1'], word['bottom']]
            
            raw_text_blocks.append({
                'text': text,
                'bbox': bbox
            })
            
            # Extract dimensions
            dims = self.dimension_parser.extract_dimensions_from_text(text, bbox)
            dimensions.extend(dims)
            
            # Extract codes
            codes = self.code_detector.detect_codes_with_context(text, bbox)
            all_codes.extend(codes)
        
        # Infer room type from codes
        room_type = self.code_detector.get_room_type_from_codes(all_codes)
        
        return {
            "page": page_num,
            "dimensions": dimensions,
            "codes": all_codes,
            "room_type": room_type,
            "dimension_stats": self.dimension_parser.calculate_total_length(dimensions),
            "raw_text_count": len(raw_text_blocks)
        }
    
    def process_page_pymupdf(self, page, page_num: int) -> Dict:
        """Process a single page using PyMuPDF"""
        dimensions = []
        all_codes = []
        raw_text_blocks = []
        
        # Extract text blocks with bounding boxes
        blocks = page.get_text("dict")["blocks"]
        
        for block in blocks:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"]
                        bbox = list(span["bbox"])  # [x0, y0, x1, y1]
                        
                        raw_text_blocks.append({
                            'text': text,
                            'bbox': bbox
                        })
                        
                        # Extract dimensions
                        dims = self.dimension_parser.extract_dimensions_from_text(text, bbox)
                        dimensions.extend(dims)
                        
                        # Extract codes
                        codes = self.code_detector.detect_codes_with_context(text, bbox)
                        all_codes.extend(codes)
        
        # Infer room type from codes
        room_type = self.code_detector.get_room_type_from_codes(all_codes)
        
        return {
            "page": page_num,
            "dimensions": dimensions,
            "codes": all_codes,
            "room_type": room_type,
            "dimension_stats": self.dimension_parser.calculate_total_length(dimensions),
            "raw_text_count": len(raw_text_blocks)
        }
    
    def extract(self, pdf_path: str, method: str = "auto") -> Dict:
        """
        Extract dimensions and codes from PDF
        
        Args:
            pdf_path: Path to PDF file
            method: 'pdfplumber', 'pymupdf', or 'auto' (tries both)
        
        Returns:
            Dict with extracted data
        """
        if method == "pdfplumber":
            return self.extract_with_pdfplumber(pdf_path)
        elif method == "pymupdf":
            return self.extract_with_pymupdf(pdf_path)
        else:  # auto - try pdfplumber first, fall back to pymupdf
            results = self.extract_with_pdfplumber(pdf_path)
            if results.get("error") or not results["pages"]:
                logger.info("pdfplumber failed or returned empty, trying PyMuPDF")
                results = self.extract_with_pymupdf(pdf_path)
            return results
    
    def extract_with_metadata(self, pdf_path: str, method: str = "auto") -> Dict:
        """
        Extract with additional metadata and statistics
        """
        results = self.extract(pdf_path, method)
        
        # Add summary statistics
        all_dimensions = []
        all_codes = []
        room_types = []
        
        for page in results.get("pages", []):
            all_dimensions.extend(page.get("dimensions", []))
            all_codes.extend(page.get("codes", []))
            room_types.append(page.get("room_type", "unknown"))
        
        # Overall statistics
        results["summary"] = {
            "total_dimensions": len(all_dimensions),
            "total_codes": len(all_codes),
            "dimension_stats": self.dimension_parser.calculate_total_length(all_dimensions),
            "code_counts": self.code_detector.count_by_type(all_codes),
            "room_types": list(set(room_types)),
            "plumbing_codes": len(self.code_detector.filter_plumbing_codes(all_codes))
        }
        
        return results
