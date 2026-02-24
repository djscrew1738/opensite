"""
Blueprint Analysis Pipeline
Combines CV detection with plumbing-specific analysis
"""

import math
from typing import List, Dict, Optional
from dataclasses import dataclass
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class WallSegment:
    """Wall segment with coordinates"""
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    
    @property
    def length(self) -> float:
        """Calculate segment length"""
        return math.sqrt((self.x2 - self.x1)**2 + (self.y2 - self.y1)**2)
    
    @property
    def is_horizontal(self) -> bool:
        """Check if wall is roughly horizontal"""
        return abs(self.x2 - self.x1) > abs(self.y2 - self.y1)
    
    @property
    def is_vertical(self) -> bool:
        """Check if wall is roughly vertical"""
        return abs(self.y2 - self.y1) > abs(self.x2 - self.x1)


@dataclass
class Room:
    """Detected room with properties"""
    id: int
    bbox: dict
    area: float
    estimated_type: str  # bathroom, kitchen, etc.
    confidence: float


class PlumbingEstimator:
    """
    Estimate plumbing requirements from detected elements
    """
    
    # Standard plumbing fixture units by room type
    FIXTURE_UNITS = {
        'bathroom': {
            'toilet': 1,
            'sink': 1,
            'shower': 2,
            'bathtub': 2
        },
        'kitchen': {
            'sink': 1,
            'dishwasher': 1
        },
        'laundry': {
            'washer': 2,
            'dryer': 0
        }
    }
    
    # Pipe sizing guidelines (simplified)
    PIPE_SIZES = {
        'water_supply': {
            'main': '3/4"',
            'branch': '1/2"',
            'fixture': '3/8"'
        },
        'drain': {
            'toilet': '3"',
            'sink': '1.5"',
            'shower': '2"',
            'tub': '1.5"',
            'main': '4"'
        }
    }
    
    def __init__(self, pixel_to_feet: float = 0.5):
        """
        Initialize estimator
        
        Args:
            pixel_to_feet: Conversion factor (pixels to feet)
                           Default 0.5 assumes 1/4" = 1' scale at 300 DPI
        """
        self.pixel_to_feet = pixel_to_feet
    
    def estimate_pipe_runs(
        self,
        walls: List[dict],
        fixtures: List[dict],
        strategy: str = 'perimeter'
    ) -> dict:
        """
        Estimate pipe run lengths based on wall layout
        
        Args:
            walls: List of wall detections
            fixtures: List of fixture detections (toilets, sinks, etc.)
            strategy: 'perimeter' or 'central'
        
        Returns:
            Dict with pipe run estimates
        """
        if not walls:
            return {'error': 'No walls detected'}
        
        # Convert walls to segments
        wall_segments = []
        for w in walls:
            bbox = w['bbox']
            # Use centerline of wall
            center_x = (bbox['xmin'] + bbox['xmax']) / 2
            center_y = (bbox['ymin'] + bbox['ymax']) / 2
            
            # Determine orientation from dimensions
            width = bbox['xmax'] - bbox['xmin']
            height = bbox['ymax'] - bbox['ymin']
            
            if width > height:  # Horizontal wall
                segment = WallSegment(
                    x1=bbox['xmin'],
                    y1=center_y,
                    x2=bbox['xmax'],
                    y2=center_y,
                    confidence=w.get('confidence', 0.5)
                )
            else:  # Vertical wall
                segment = WallSegment(
                    x1=center_x,
                    y1=bbox['ymin'],
                    x2=center_x,
                    y2=bbox['ymax'],
                    confidence=w.get('confidence', 0.5)
                )
            
            wall_segments.append(segment)
        
        # Calculate total wall length
        total_wall_length = sum(s.length for s in wall_segments)
        total_wall_feet = total_wall_length * self.pixel_to_feet
        
        # Estimate pipe runs based on strategy
        if strategy == 'perimeter':
            # Perimeter strategy: rough-in along exterior walls
            rough_in_length = total_wall_feet * 0.6  # 60% of walls
        else:  # central
            # Central strategy: main stack with branches
            rough_in_length = total_wall_feet * 0.4
        
        # Estimate by pipe type
        estimates = {
            'water_supply': {
                'main_feet': rough_in_length * 0.15,
                'branch_feet': rough_in_length * 0.85,
                'pipe_size_main': self.PIPE_SIZES['water_supply']['main'],
                'pipe_size_branch': self.PIPE_SIZES['water_supply']['branch']
            },
            'drain_waste_vent': {
                'main_feet': rough_in_length * 0.2,
                'branch_feet': rough_in_length * 0.8,
                'pipe_size_main': self.PIPE_SIZES['drain']['main'],
                'pipe_size_branch': self.PIPE_SIZES['drain']['sink']
            },
            'total_wall_length_feet': total_wall_feet,
            'strategy': strategy
        }
        
        return estimates
    
    def count_fixtures(self, detections: List[dict]) -> dict:
        """
        Count plumbing fixtures from detections
        
        Returns fixture counts for estimating materials
        """
        fixture_map = {
            'toilet': 'toilets',
            'sink': 'sinks',
            'shower': 'showers',
            'bathtub': 'bathtubs'
        }
        
        counts = {v: 0 for v in fixture_map.values()}
        
        for det in detections:
            class_name = det['class']
            if class_name in fixture_map:
                counts[fixture_map[class_name]] += 1
        
        # Calculate derived values
        counts['total_fixtures'] = sum(counts.values())
        counts['fixture_units'] = (
            counts['toilets'] * 1 +
            counts['sinks'] * 1 +
            counts['showers'] * 2 +
            counts['bathtubs'] * 2
        )
        
        return counts
    
    def estimate_materials(
        self,
        pipe_runs: dict,
        fixtures: dict,
        building_type: str = 'residential'
    ) -> List[dict]:
        """
        Generate material takeoff from estimates
        
        Returns list of material line items
        """
        materials = []
        
        if 'error' in pipe_runs:
            return materials
        
        # Water supply materials
        ws = pipe_runs.get('water_supply', {})
        if ws:
            # Main water line
            main_feet = ws.get('main_feet', 0)
            if main_feet > 0:
                materials.append({
                    'item': f"{ws.get('pipe_size_main', '3/4\"')} Type L Copper Pipe",
                    'category': 'Supply',
                    'quantity': round(main_feet, 0),
                    'unit': 'LF',
                    'purpose': 'Water supply main'
                })
            
            # Branch lines
            branch_feet = ws.get('branch_feet', 0)
            if branch_feet > 0:
                materials.append({
                    'item': f"{ws.get('pipe_size_branch', '1/2\"')} Type L Copper Pipe",
                    'category': 'Supply',
                    'quantity': round(branch_feet, 0),
                    'unit': 'LF',
                    'purpose': 'Water supply branches'
                })
        
        # DWV materials
        dwv = pipe_runs.get('drain_waste_vent', {})
        if dwv:
            main_feet = dwv.get('main_feet', 0)
            if main_feet > 0:
                materials.append({
                    'item': f"{dwv.get('pipe_size_main', '4\"')} PVC DWV Pipe",
                    'category': 'DWV',
                    'quantity': round(main_feet, 0),
                    'unit': 'LF',
                    'purpose': 'Drain/waste main'
                })
            
            branch_feet = dwv.get('branch_feet', 0)
            if branch_feet > 0:
                materials.append({
                    'item': f"{dwv.get('pipe_size_branch', '1.5\"')} PVC DWV Pipe",
                    'category': 'DWV',
                    'quantity': round(branch_feet, 0),
                    'unit': 'LF',
                    'purpose': 'Drain branches'
                })
        
        # Fixtures
        if fixtures.get('toilets', 0) > 0:
            materials.append({
                'item': 'Water Closet (Toilet)',
                'category': 'Fixture',
                'quantity': fixtures['toilets'],
                'unit': 'EA',
                'purpose': 'Toilet fixtures'
            })
        
        if fixtures.get('sinks', 0) > 0:
            materials.append({
                'item': 'Lavatory Sink',
                'category': 'Fixture',
                'quantity': fixtures['sinks'],
                'unit': 'EA',
                'purpose': 'Sink fixtures'
            })
        
        if fixtures.get('showers', 0) > 0:
            materials.append({
                'item': 'Shower Valve & Trim',
                'category': 'Fixture',
                'quantity': fixtures['showers'],
                'unit': 'EA',
                'purpose': 'Shower fixtures'
            })
        
        if fixtures.get('bathtubs', 0) > 0:
            materials.append({
                'item': 'Bathtub with Waste/Overflow',
                'category': 'Fixture',
                'quantity': fixtures['bathtubs'],
                'unit': 'EA',
                'purpose': 'Bathtub fixtures'
            })
        
        return materials


class BlueprintAnalyzer:
    """
    Main blueprint analysis class combining CV detection with plumbing estimation
    """
    
    def __init__(self, detector, estimator: Optional[PlumbingEstimator] = None):
        """
        Initialize analyzer
        
        Args:
            detector: BlueprintDetector instance
            estimator: PlumbingEstimator instance (optional)
        """
        self.detector = detector
        self.estimator = estimator or PlumbingEstimator()
    
    def analyze(
        self,
        image_path: Path,
        include_materials: bool = True
    ) -> dict:
        """
        Complete analysis pipeline
        
        Returns comprehensive analysis with:
        - Detected elements
        - Room analysis
        - Pipe run estimates
        - Material takeoff (optional)
        """
        logger.info(f"Starting analysis of {image_path}")
        
        # Run detection
        detection_results = self.detector.detect_with_visualization(image_path)
        detections = detection_results['detections']
        
        # Separate elements by type
        walls = [d for d in detections if d['class'] == 'wall']
        fixtures = [d for d in detections if d['class'] in ['toilet', 'sink', 'shower', 'bathtub']]
        rooms = [d for d in detections if d['class'] == 'room']
        
        # Count fixtures
        fixture_counts = self.estimator.count_fixtures(detections)
        
        # Estimate pipe runs
        pipe_runs = self.estimator.estimate_pipe_runs(walls, fixtures)
        
        # Build result
        analysis = {
            'detections': {
                'all': detections,
                'by_type': {
                    'walls': walls,
                    'fixtures': fixtures,
                    'rooms': rooms
                },
                'counts': detection_results['counts'],
                'total': detection_results['total']
            },
            'fixtures': fixture_counts,
            'pipe_runs': pipe_runs
        }
        
        # Add material takeoff if requested
        if include_materials:
            materials = self.estimator.estimate_materials(pipe_runs, fixture_counts)
            analysis['material_takeoff'] = materials
            
            # Calculate totals
            analysis['totals'] = self._calculate_totals(materials)
        
        return analysis
    
    def _calculate_totals(self, materials: List[dict]) -> dict:
        """Calculate total costs from materials"""
        # Simplified pricing (would come from database in production)
        pricing = {
            '3/4" Type L Copper Pipe': 3.85,
            '1/2" Type L Copper Pipe': 2.45,
            '4" PVC DWV Pipe': 4.20,
            '1.5" PVC DWV Pipe': 1.85,
            'Water Closet (Toilet)': 450,
            'Lavatory Sink': 280,
            'Shower Valve & Trim': 320,
            'Bathtub with Waste/Overflow': 850
        }
        
        total_material = 0
        for item in materials:
            unit_price = pricing.get(item['item'], 0)
            item['unit_cost'] = unit_price
            item['total_cost'] = round(item['quantity'] * unit_price, 2)
            total_material += item['total_cost']
        
        labor_multiplier = 1.65
        
        return {
            'material': round(total_material, 2),
            'labor_multiplier': labor_multiplier,
            'estimate': round(total_material * labor_multiplier, 2)
        }
