"""
YOLOv5 Object Detection for Blueprints
Based on AECVision's detection modules
"""

import torch
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import List, Dict, Optional, Union
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


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
                'center_y': round((self.bbox['ymin'] + self.bbox['ymax']) / 2, 2)
            }
        }


# Default class names for AECVision 12-class model
AECVISION_CLASSES = [
    'wall',
    'door',
    'window',
    'room',
    'stairs',
    'elevator',
    'column',
    'beam',
    'toilet',
    'sink',
    'shower',
    'bathtub'
]


class BlueprintDetector:
    """
    YOLOv5-based detector for architectural elements in blueprints
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        confidence_threshold: float = 0.5,
        device: Optional[str] = None,
        classes: Optional[List[str]] = None
    ):
        """
        Initialize detector
        
        Args:
            model_path: Path to YOLOv5 .pt model file
            confidence_threshold: Minimum confidence for detections
            device: 'cpu', 'cuda', or None for auto
            classes: List of class names (default: AECVISION_CLASSES)
        """
        self.confidence_threshold = confidence_threshold
        self.classes = classes or AECVISION_CLASSES
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load model
        if model_path and Path(model_path).exists():
            logger.info(f"Loading custom model from {model_path}")
            self.model = torch.hub.load(
                'ultralytics/yolov5',
                'custom',
                path=str(model_path),
                device=self.device,
                force_reload=True
            )
        else:
            # Use pretrained YOLOv5m as fallback
            logger.warning("No model provided, using YOLOv5m pretrained (limited blueprint detection)")
            self.model = torch.hub.load(
                'ultralytics/yolov5',
                'yolov5m',
                pretrained=True,
                device=self.device
            )
        
        self.model.conf = confidence_threshold
        self.model.iou = 0.45  # NMS IoU threshold
        
        logger.info(f"Detector initialized on {self.device}")
    
    def detect(
        self,
        image: Union[Image.Image, np.ndarray, Path, str],
        size: int = 1280
    ) -> List[Detection]:
        """
        Run detection on image
        
        Args:
            image: PIL Image, numpy array, or path to image
            size: Inference size (1280 for blueprints)
        
        Returns:
            List of Detection objects
        """
        # Run inference
        results = self.model(image, size=size)
        
        # Parse results
        detections = []
        df = results.pandas().xyxy[0]
        
        for _, row in df.iterrows():
            detection = Detection(
                class_name=row['name'],
                confidence=row['confidence'],
                bbox={
                    'xmin': row['xmin'],
                    'ymin': row['ymin'],
                    'xmax': row['xmax'],
                    'ymax': row['ymax']
                },
                class_id=row['class']
            )
            detections.append(detection)
        
        return detections
    
    def detect_with_visualization(
        self,
        image: Union[Image.Image, np.ndarray, Path, str],
        output_path: Optional[Path] = None,
        size: int = 1280
    ) -> dict:
        """
        Run detection and return results with visualization
        
        Returns dict with:
        - detections: List of Detection objects
        - visualization: Path to annotated image (if output_path provided)
        - counts: Detection counts by class
        """
        # Run inference
        results = self.model(image, size=size)
        
        # Parse detections
        detections = []
        df = results.pandas().xyxy[0]
        
        for _, row in df.iterrows():
            detection = Detection(
                class_name=row['name'],
                confidence=row['confidence'],
                bbox={
                    'xmin': row['xmin'],
                    'ymin': row['ymin'],
                    'xmax': row['xmax'],
                    'ymax': row['ymax']
                },
                class_id=row['class']
            )
            detections.append(detection)
        
        # Count by class
        counts = {}
        for det in detections:
            counts[det.class_name] = counts.get(det.class_name, 0) + 1
        
        result = {
            'detections': [d.to_dict() for d in detections],
            'counts': counts,
            'total': len(detections)
        }
        
        # Save visualization
        if output_path:
            results.save(save_dir=str(output_path.parent))
            result['visualization'] = str(output_path)
        
        return result
    
    def detect_tiles(
        self,
        tiles: List[dict],
        size: int = 1280
    ) -> List[dict]:
        """
        Run detection on multiple tiles and aggregate results
        
        Args:
            tiles: List of tile dicts from ImageTiler.create_tiles()
            size: Inference size
        
        Returns:
            List of detections with global coordinates
        """
        all_detections = []
        
        for tile in tiles:
            # Detect in tile
            detections = self.detect(tile['image'], size=size)
            
            # Transform to global coordinates
            for det in detections:
                global_bbox = {
                    'xmin': det.bbox['xmin'] + tile['x'],
                    'ymin': det.bbox['ymin'] + tile['y'],
                    'xmax': det.bbox['xmax'] + tile['x'],
                    'ymax': det.bbox['ymax'] + tile['y']
                }
                
                all_detections.append({
                    'class': det.class_name,
                    'class_id': det.class_id,
                    'confidence': det.confidence,
                    'bbox': global_bbox,
                    'tile_row': tile['row'],
                    'tile_col': tile['col']
                })
        
        return all_detections


class SAHIDetector:
    """
    SAHI (Slicing Aided Hyper Inference) detector for large blueprints
    Better for large images without tiling preprocessing
    """
    
    def __init__(
        self,
        model_path: Path,
        confidence_threshold: float = 0.5,
        device: str = 'cuda'
    ):
        """
        Initialize SAHI detector
        
        Note: Requires sahi package
        """
        try:
            from sahi import AutoDetectionModel
            from sahi.predict import get_sliced_prediction
            self.get_sliced_prediction = get_sliced_prediction
        except ImportError:
            raise ImportError("SAHI not installed. Run: pip install sahi")
        
        self.confidence_threshold = confidence_threshold
        self.device = device
        
        # Load model with SAHI
        self.detection_model = AutoDetectionModel.from_pretrained(
            model_type='yolov5',
            model_path=str(model_path),
            confidence_threshold=confidence_threshold,
            device=device
        )
        
        logger.info(f"SAHI Detector initialized on {device}")
    
    def detect(
        self,
        image_path: Path,
        slice_height: int = 1280,
        slice_width: int = 1280,
        overlap_ratio: float = 0.2
    ) -> dict:
        """
        Run SAHI sliced detection on large image
        
        Returns dict with:
        - detections: List of detection dicts
        - counts: Detection counts by class
        """
        result = self.get_sliced_prediction(
            str(image_path),
            self.detection_model,
            slice_height=slice_height,
            slice_width=slice_width,
            overlap_height_ratio=overlap_ratio,
            overlap_width_ratio=overlap_ratio
        )
        
        # Convert to standard format
        detections = []
        for pred in result.to_coco_annotations():
            detections.append({
                'class': pred['category_name'],
                'class_id': pred['category_id'],
                'confidence': pred['score'],
                'bbox': {
                    'xmin': pred['bbox'][0],
                    'ymin': pred['bbox'][1],
                    'xmax': pred['bbox'][0] + pred['bbox'][2],
                    'ymax': pred['bbox'][1] + pred['bbox'][3],
                    'width': pred['bbox'][2],
                    'height': pred['bbox'][3]
                }
            })
        
        # Count by class
        counts = {}
        for det in detections:
            counts[det['class']] = counts.get(det['class'], 0) + 1
        
        return {
            'detections': detections,
            'counts': counts,
            'total': len(detections)
        }


def detect_walls(
    image_path: Path,
    model_path: Path,
    confidence: float = 0.8,
    use_sahi: bool = False
) -> List[dict]:
    """
    Convenience function for wall detection
    
    Returns list of wall detections with coordinates
    """
    if use_sahi:
        detector = SAHIDetector(model_path, confidence)
        results = detector.detect(image_path)
    else:
        detector = BlueprintDetector(model_path, confidence)
        results = detector.detect_with_visualization(image_path)
        results['detections'] = results['detections']
    
    # Filter to walls only
    walls = [d for d in results['detections'] if d['class'] == 'wall']
    
    logger.info(f"Detected {len(walls)} walls")
    return walls
