"""
Code Detector Module
Detects cabinet, appliance, and fixture codes from floorplan text
Based on Floorplan-Dimractor by jasoncobra3
"""

import re
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class CabinetCode:
    """Represents a detected cabinet/appliance code"""
    code: str
    type: str  # cabinet, appliance, fixture
    description: str
    typical_width_inches: Optional[float] = None


class CodeDetector:
    """Detect cabinet, appliance, and fixture codes in floorplan text"""
    
    # Common cabinet and appliance code patterns
    CODE_PATTERNS = {
        # Base cabinets
        r'\bDB\d{2,4}[A-Z]{0,3}\b': {'type': 'base_cabinet', 'name': 'Drawer Base'},
        r'\bSB\d{2,4}[A-Z]{0,3}\b': {'type': 'base_cabinet', 'name': 'Sink Base'},
        r'\bBB\d{2,4}[A-Z]{0,3}\b': {'type': 'base_cabinet', 'name': 'Blind Base'},
        r'\bCB\d{2,4}[A-Z]{0,3}\b': {'type': 'base_cabinet', 'name': 'Corner Base'},
        r'\bB\d{2,4}[A-Z]{0,3}\b': {'type': 'base_cabinet', 'name': 'Base Cabinet'},
        
        # Wall cabinets
        r'\bW\d{2,4}[A-Z]{0,3}\b': {'type': 'wall_cabinet', 'name': 'Wall Cabinet'},
        r'\bUW\d{2,4}[A-Z]{0,3}\b': {'type': 'wall_cabinet', 'name': 'Upper Wall Cabinet'},
        
        # Tall cabinets
        r'\bT\d{2,4}[A-Z]{0,3}\b': {'type': 'tall_cabinet', 'name': 'Tall Cabinet'},
        r'\bPC\d{2,4}[A-Z]{0,3}\b': {'type': 'tall_cabinet', 'name': 'Pantry Cabinet'},
        
        # Appliances
        r'\bDW\d{0,4}[A-Z]{0,3}\b': {'type': 'appliance', 'name': 'Dishwasher', 'width': 24},
        r'\bMW\d{0,4}[A-Z]{0,3}\b': {'type': 'appliance', 'name': 'Microwave', 'width': 30},
        r'\bR\d{2,4}[A-Z]{0,3}\b': {'type': 'appliance', 'name': 'Refrigerator'},
        r'\bRNG\d{0,4}[A-Z]{0,3}\b': {'type': 'appliance', 'name': 'Range'},
        r'\bCOT\d{0,4}[A-Z]{0,3}\b': {'type': 'appliance', 'name': 'Cooktop'},
        r'\bOV\d{0,4}[A-Z]{0,3}\b': {'type': 'appliance', 'name': 'Oven'},
        r'\bWD\d{0,4}[A-Z]{0,3}\b': {'type': 'appliance', 'name': 'Washer/Dryer', 'width': 27},
        
        # Plumbing fixtures
        r'\bS\d{1,3}[A-Z]{0,3}\b': {'type': 'fixture', 'name': 'Sink'},
        r'\bWC\d{0,3}[A-Z]{0,3}\b': {'type': 'fixture', 'name': 'Water Closet'},
        r'\bTUB\d{0,3}[A-Z]{0,3}\b': {'type': 'fixture', 'name': 'Bathtub'},
        r'\bSH\d{0,3}[A-Z]{0,3}\b': {'type': 'fixture', 'name': 'Shower'},
        r'\bWH\d{0,3}[A-Z]{0,3}\b': {'type': 'fixture', 'name': 'Water Heater'},
        
        # Generic pattern (catch-all)
        r'\b[A-Z]{2,4}\d{2,4}[A-Z]{0,3}\b': {'type': 'unknown', 'name': 'Unknown Code'},
    }
    
    # Mapping of common codes to descriptions
    CODE_DESCRIPTIONS = {
        # Sink bases
        'SB30': {'name': '30" Sink Base', 'type': 'base_cabinet', 'plumbing': True},
        'SB36': {'name': '36" Sink Base', 'type': 'base_cabinet', 'plumbing': True},
        'SB42': {'name': '42" Sink Base', 'type': 'base_cabinet', 'plumbing': True},
        'SB24': {'name': '24" Sink Base', 'type': 'base_cabinet', 'plumbing': True},
        
        # Drawer bases
        'DB18': {'name': '18" 3-Drawer Base', 'type': 'base_cabinet'},
        'DB24': {'name': '24" 3-Drawer Base', 'type': 'base_cabinet'},
        'DB30': {'name': '30" 3-Drawer Base', 'type': 'base_cabinet'},
        
        # Dishwashers
        'DW': {'name': 'Dishwasher', 'type': 'appliance', 'plumbing': True, 'width': 24},
        'DW24': {'name': '24" Dishwasher', 'type': 'appliance', 'plumbing': True, 'width': 24},
        
        # Refrigerators
        'R30': {'name': '30" Refrigerator', 'type': 'appliance', 'width': 30},
        'R36': {'name': '36" Refrigerator', 'type': 'appliance', 'width': 36},
        
        # Fixtures
        'WC': {'name': 'Water Closet', 'type': 'fixture', 'plumbing': True},
        'TUB': {'name': 'Bathtub', 'type': 'fixture', 'plumbing': True},
        'SH': {'name': 'Shower', 'type': 'fixture', 'plumbing': True},
        'WH': {'name': 'Water Heater', 'type': 'fixture', 'plumbing': True},
    }
    
    def __init__(self):
        self.setup_patterns()
    
    def setup_patterns(self):
        """Setup regex patterns for code detection"""
        self.patterns = {
            re.compile(pattern): info
            for pattern, info in self.CODE_PATTERNS.items()
        }
        
        # Generic code pattern (2-4 letters + 2-4 digits + optional 0-3 letters)
        self.generic_pattern = re.compile(r'\b[A-Z]{2,4}\d{2,4}[A-Z]{0,3}\b')
    
    def detect_codes(self, text: str) -> List[Dict]:
        """
        Detect cabinet and appliance codes in text
        
        Returns list of detected codes with metadata
        """
        detected = []
        text_upper = text.upper()
        
        # Check against specific patterns first
        for pattern, info in self.patterns.items():
            matches = pattern.findall(text_upper)
            for match in matches:
                # Look up detailed description
                description = self.CODE_DESCRIPTIONS.get(
                    match,
                    {'name': info['name'], 'type': info['type']}
                )
                
                detected.append({
                    'code': match,
                    'type': description.get('type', info['type']),
                    'name': description.get('name', info['name']),
                    'plumbing': description.get('plumbing', False),
                    'width_inches': info.get('width') or description.get('width')
                })
        
        # Remove duplicates while preserving order
        seen = set()
        unique_detected = []
        for item in detected:
            if item['code'] not in seen:
                seen.add(item['code'])
                unique_detected.append(item)
        
        return unique_detected
    
    def detect_codes_with_context(self, text: str, bbox: List[float]) -> List[Dict]:
        """
        Detect codes with spatial context
        
        Returns codes with bounding box information
        """
        codes = self.detect_codes(text)
        for code in codes:
            code['bbox'] = bbox
        return codes
    
    def filter_plumbing_codes(self, codes: List[Dict]) -> List[Dict]:
        """Filter codes that require plumbing connections"""
        return [c for c in codes if c.get('plumbing', False)]
    
    def get_room_type_from_codes(self, codes: List[Dict]) -> str:
        """
        Infer room type from detected codes
        
        Returns: 'kitchen', 'bathroom', 'laundry', 'unknown'
        """
        code_types = [c['type'] for c in codes]
        code_names = [c['name'].lower() for c in codes]
        
        # Kitchen indicators
        kitchen_items = ['sink base', 'dishwasher', 'refrigerator', 'range', 'cooktop', 'oven']
        if any(item in ' '.join(code_names) for item in kitchen_items):
            return 'kitchen'
        
        if 'base_cabinet' in code_types or 'wall_cabinet' in code_types:
            return 'kitchen'
        
        # Bathroom indicators
        bathroom_items = ['water closet', 'bathtub', 'shower', 'sink', 'lavatory']
        if any(item in ' '.join(code_names) for item in bathroom_items):
            return 'bathroom'
        
        # Laundry indicators
        laundry_items = ['washer', 'dryer', 'laundry']
        if any(item in ' '.join(code_names) for item in laundry_items):
            return 'laundry'
        
        return 'unknown'
    
    def count_by_type(self, codes: List[Dict]) -> Dict:
        """Count codes by type"""
        counts = {}
        for code in codes:
            code_type = code['type']
            counts[code_type] = counts.get(code_type, 0) + 1
        return counts
