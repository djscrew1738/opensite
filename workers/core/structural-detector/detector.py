"""
YOLOv8 Structural Element Detector for Floor Plans
Based on sanatladkat/floor-plan-object-detection
Detects: Column, Curtain Wall, Dimension, Door, Railing, Sliding Door, Stair Case, Wall, Window
"""

import logging
from pathlib import Path
from typing import List, Optional, Union
from dataclasses import dataclass, field

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# 9-class model from floor-plan-object-detection
STRUCTURAL_CLASSES = [
    'Column',
    'Curtain Wall',
    'Dimension',
    'Door',
    'Railing',
    'Sliding Door',
    'Stair Case',
    'Wall',
    'Window',
]


@dataclass
class Detection:
    """Single detection result"""
    class_name: str
    confidence: float
    bbox: dict  # xmin, ymin, xmax, ymax
    class_id: int

    def to_dict(self) -> dict:
        return {
            'class': self.class_name,
            'class_id': self.class_id,
            'confidence': round(self.confidence, 4),
            'bbox': {
                'xmin': round(self.bbox['xmin'], 2),
                'ymin': round(self.bbox['ymin'], 2),
                'xmax': round(self.bbox['xmax'], 2),
                'ymax': round(self.bbox['ymax'], 2),
                'width': round(self.bbox['xmax'] - self.bbox['xmin'], 2),
                'height': round(self.bbox['ymax'] - self.bbox['ymin'], 2),
                'center_x': round((self.bbox['xmin'] + self.bbox['xmax']) / 2, 2),
                'center_y': round((self.bbox['ymin'] + self.bbox['ymax']) / 2, 2),
            },
        }


class StructuralDetector:
    """
    YOLOv8-based detector for structural elements in floor plans.
    Wraps the best.pt model from floor-plan-object-detection.
    """

    def __init__(
        self,
        model_path: Optional[Path] = None,
        confidence_threshold: float = 0.40,
        device: Optional[str] = None,
    ):
        from ultralytics import YOLO

        self.confidence_threshold = confidence_threshold

        if device:
            self.device = device
        else:
            import torch
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'

        if model_path and Path(model_path).exists():
            logger.info(f"Loading structural model from {model_path}")
            self.model = YOLO(str(model_path))
        else:
            logger.warning(f"Model not found at {model_path}, using YOLOv8n fallback")
            self.model = YOLO('yolov8n.pt')

        # Read class names from the model
        self.classes = list(self.model.names.values()) if self.model.names else STRUCTURAL_CLASSES
        logger.info(f"StructuralDetector initialized on {self.device} with {len(self.classes)} classes: {self.classes}")

    def detect(
        self,
        image: Union[Image.Image, np.ndarray, Path, str],
        size: int = 1280,
    ) -> List[Detection]:
        """Run detection on an image and return Detection objects."""
        results = self.model.predict(
            source=image,
            conf=self.confidence_threshold,
            imgsz=size,
            device=self.device,
            verbose=False,
        )

        detections: List[Detection] = []
        if not results:
            return detections

        result = results[0]
        boxes = result.boxes

        for box in boxes:
            xyxy = box.xyxy[0].cpu().numpy()
            cls_id = int(box.cls[0].cpu().numpy())
            conf = float(box.conf[0].cpu().numpy())
            cls_name = self.classes[cls_id] if cls_id < len(self.classes) else f'class_{cls_id}'

            detections.append(Detection(
                class_name=cls_name,
                confidence=conf,
                bbox={
                    'xmin': float(xyxy[0]),
                    'ymin': float(xyxy[1]),
                    'xmax': float(xyxy[2]),
                    'ymax': float(xyxy[3]),
                },
                class_id=cls_id,
            ))

        return detections

    def detect_with_counts(
        self,
        image: Union[Image.Image, np.ndarray, Path, str],
        size: int = 1280,
    ) -> dict:
        """Run detection and return results dict with counts."""
        detections = self.detect(image, size=size)

        counts = {}
        for det in detections:
            counts[det.class_name] = counts.get(det.class_name, 0) + 1

        return {
            'detections': [d.to_dict() for d in detections],
            'counts': counts,
            'total': len(detections),
        }

    def analyze_structure(
        self,
        image: Union[Image.Image, np.ndarray, Path, str],
        pixel_to_feet: float = 0.5,
        size: int = 1280,
    ) -> dict:
        """
        Full structural analysis: detect elements and compute spatial metrics.
        """
        result = self.detect_with_counts(image, size=size)

        walls = [d for d in result['detections'] if d['class'] == 'Wall']
        curtain_walls = [d for d in result['detections'] if d['class'] == 'Curtain Wall']
        doors = [d for d in result['detections'] if d['class'] == 'Door']
        sliding_doors = [d for d in result['detections'] if d['class'] == 'Sliding Door']
        windows = [d for d in result['detections'] if d['class'] == 'Window']
        columns = [d for d in result['detections'] if d['class'] == 'Column']
        stairs = [d for d in result['detections'] if d['class'] == 'Stair Case']
        railings = [d for d in result['detections'] if d['class'] == 'Railing']
        dimensions = [d for d in result['detections'] if d['class'] == 'Dimension']

        # Estimate total wall length in pixels
        total_wall_px = 0
        for w in walls + curtain_walls:
            bbox = w['bbox']
            width = bbox['width']
            height = bbox['height']
            # Use the longer axis as wall length
            total_wall_px += max(width, height)

        total_wall_feet = total_wall_px * pixel_to_feet

        # Estimate room count heuristic: enclosed areas between walls
        # Simple heuristic: every ~4 walls ≈ 1 room
        estimated_rooms = max(1, len(walls) // 4)

        return {
            'detections': result['detections'],
            'counts': result['counts'],
            'total': result['total'],
            'structural_summary': {
                'walls': len(walls),
                'curtain_walls': len(curtain_walls),
                'doors': len(doors),
                'sliding_doors': len(sliding_doors),
                'windows': len(windows),
                'columns': len(columns),
                'stairs': len(stairs),
                'railings': len(railings),
                'dimensions_detected': len(dimensions),
            },
            'spatial_metrics': {
                'total_wall_length_pixels': round(total_wall_px, 2),
                'total_wall_length_feet': round(total_wall_feet, 2),
                'pixel_to_feet': pixel_to_feet,
                'estimated_rooms': estimated_rooms,
                'openings_count': len(doors) + len(sliding_doors) + len(windows),
            },
        }
