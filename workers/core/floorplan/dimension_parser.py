"""
Dimension Parser Module
Extracts and parses various dimension formats from architectural floorplans
Based on Floorplan-Dimractor by jasoncobra3
"""

import re
import regex
from typing import Dict, List, Tuple, Optional


class DimensionParser:
    """Parse dimension strings in various formats"""
    
    def __init__(self):
        self.setup_patterns()
    
    def setup_patterns(self):
        """Setup regex patterns for dimension detection"""
        # Pattern for simple inches: 25", 34.5"
        self.simple_inches = re.compile(r'(\d+(?:\.\d+)?)\s*["″]')
        
        # Pattern for feet and inches: 2' 6", 3' 4.5"
        self.feet_inches = re.compile(r'(\d+)\s*[\'′]\s*(\d+(?:\.\d+)?)\s*["″]')
        
        # Pattern for fractions: 34 (1/2)", 25 3/4"
        self.fraction_pattern = re.compile(
            r'(\d+)\s*[\(]?\s*(\d+)\s*/\s*(\d+)\s*[\)]?\s*["″]'
        )
        
        # Pattern for decimal with unit: 25.5", 34.5 inches
        self.decimal_inches = re.compile(r'(\d+\.\d+)\s*(?:in|inch|inches)?["″]?')
        
        # Combined pattern for all types
        self.combined_pattern = regex.compile(r'''
            (?:
                # Feet and inches: 2' 6" or 2'6"
                (\d+)\s*[\'′]\s*(\d+(?:\.\d+)?)\s*["″]\s*(?:\(?(\d+)\s*/\s*(\d+)\)?)?\s*["″]?|
                
                # Fractions: 34 (1/2)" or 25 3/4"
                (\d+)\s*[\(]?\s*(\d+)\s*/\s*(\d+)\s*[\)]?\s*["″]|
                
                # Simple inches: 25" or 25.5"
                (\d+(?:\.\d+)?)\s*["″]
            )
        ''', regex.VERBOSE)
    
    def parse_fraction(self, whole: str, numerator: str, denominator: str) -> float:
        """Convert fraction to decimal"""
        try:
            whole_num = float(whole) if whole else 0
            fraction = float(numerator) / float(denominator)
            return whole_num + fraction
        except (ValueError, ZeroDivisionError):
            return 0.0
    
    def parse_dimension(self, text: str) -> Optional[float]:
        """
        Parse dimension text and return inches as float
        
        Examples:
            "25" → 25.0
            "2' 6" → 30.0
            "34 (1/2)" → 34.5
            "25 3/4" → 25.75
        """
        text = text.strip()
        
        # Try feet and inches pattern
        feet_match = self.feet_inches.search(text)
        if feet_match:
            feet = float(feet_match.group(1))
            inches = float(feet_match.group(2))
            return feet * 12 + inches
        
        # Try fraction pattern
        frac_match = self.fraction_pattern.search(text)
        if frac_match:
            return self.parse_fraction(
                frac_match.group(1),
                frac_match.group(2),
                frac_match.group(3)
            )
        
        # Try decimal inches
        decimal_match = self.decimal_inches.search(text)
        if decimal_match:
            return float(decimal_match.group(1))
        
        # Try simple inches
        inches_match = self.simple_inches.search(text)
        if inches_match:
            return float(inches_match.group(1))
        
        return None
    
    def extract_dimensions_from_text(self, text: str, bbox: List[float]) -> List[Dict]:
        """
        Extract dimensions from text with bounding boxes
        
        Args:
            text: Text to search for dimensions
            bbox: Bounding box coordinates [x0, y0, x1, y1]
        
        Returns:
            List of dimension dicts with raw text, inches value, and bbox
        """
        dimensions = []
        
        # Find all matches with their positions in text
        matches = list(self.combined_pattern.finditer(text))
        
        for match in matches:
            raw_text = match.group(0)
            inches_value = self.parse_dimension(raw_text)
            
            if inches_value is not None and inches_value > 0:
                dimensions.append({
                    "raw": raw_text,
                    "inches": round(inches_value, 2),
                    "feet": round(inches_value / 12, 2),
                    "bbox": bbox
                })
        
        return dimensions
    
    def extract_all_dimensions(self, texts_with_bboxes: List[Tuple[str, List[float]]]) -> List[Dict]:
        """
        Extract dimensions from multiple text blocks
        
        Args:
            texts_with_bboxes: List of (text, bbox) tuples
        
        Returns:
            Combined list of all dimensions found
        """
        all_dimensions = []
        
        for text, bbox in texts_with_bboxes:
            dims = self.extract_dimensions_from_text(text, bbox)
            all_dimensions.extend(dims)
        
        return all_dimensions
    
    def calculate_total_length(self, dimensions: List[Dict]) -> Dict:
        """
        Calculate statistics from a list of dimensions
        
        Returns dict with:
        - total_inches: Sum of all dimensions
        - total_feet: Total in feet
        - count: Number of dimensions
        - average_inches: Average dimension size
        - largest: Largest dimension
        - smallest: Smallest dimension
        """
        if not dimensions:
            return {
                "total_inches": 0,
                "total_feet": 0,
                "count": 0,
                "average_inches": 0,
                "largest": None,
                "smallest": None
            }
        
        inches_list = [d["inches"] for d in dimensions]
        
        return {
            "total_inches": round(sum(inches_list), 2),
            "total_feet": round(sum(inches_list) / 12, 2),
            "count": len(inches_list),
            "average_inches": round(sum(inches_list) / len(inches_list), 2),
            "largest": max(inches_list),
            "smallest": min(inches_list)
        }
    
    def filter_pipe_relevant_dimensions(self, dimensions: List[Dict]) -> List[Dict]:
        """
        Filter dimensions that are likely relevant for plumbing pipe sizing
        
        Typical pipe dimensions: 1.5", 2", 3", 4", 6", etc.
        Returns dimensions that could represent pipe diameters
        """
        pipe_sizes = {1.5, 2, 3, 4, 6, 8, 10, 12}
        tolerance = 0.25  # Allow 0.25" tolerance
        
        return [
            d for d in dimensions
            if any(abs(d["inches"] - size) <= tolerance for size in pipe_sizes)
        ]
    
    def filter_room_dimensions(self, dimensions: List[Dict]) -> List[Dict]:
        """
        Filter dimensions that are likely room/space dimensions
        
        Typical room dimensions: > 36 inches (3 feet)
        """
        return [d for d in dimensions if d["inches"] >= 36]
