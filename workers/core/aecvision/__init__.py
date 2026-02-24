"""
AECVision Integration Module

Computer Vision service for blueprint analysis using YOLOv5.
Provides object detection for architectural elements (walls, doors, windows, fixtures).
"""

__version__ = "1.0.0"

from .convert_pdf import PDFConverter, ImageTiler, convert_and_tile_pdf
from .detector import BlueprintDetector, SAHIDetector, Detection
from .analysis import BlueprintAnalyzer, PlumbingEstimator, WallSegment

__all__ = [
    'PDFConverter',
    'ImageTiler',
    'convert_and_tile_pdf',
    'BlueprintDetector',
    'SAHIDetector',
    'Detection',
    'BlueprintAnalyzer',
    'PlumbingEstimator',
    'WallSegment'
]
