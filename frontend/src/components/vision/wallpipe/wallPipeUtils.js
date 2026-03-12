/**
 * Wall & Pipe utilities for demo/testing
 */

// ═══════════════════════════════════════════════════════════════
// Demo Wall Segments
// ═══════════════════════════════════════════════════════════════

export const DEMO_WALLS = [
  // Exterior walls (building perimeter)
  {
    id: 'wall-1',
    type: 'exterior',
    x1: 0.1,
    y1: 0.1,
    x2: 0.9,
    y2: 0.1,
    confidence: 94,
    status: 'verified',
    thickness: 6,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
  {
    id: 'wall-2',
    type: 'exterior',
    x1: 0.9,
    y1: 0.1,
    x2: 0.9,
    y2: 0.9,
    confidence: 92,
    status: 'verified',
    thickness: 6,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
  {
    id: 'wall-3',
    type: 'exterior',
    x1: 0.9,
    y1: 0.9,
    x2: 0.1,
    y2: 0.9,
    confidence: 93,
    status: 'verified',
    thickness: 6,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
  {
    id: 'wall-4',
    type: 'exterior',
    x1: 0.1,
    y1: 0.9,
    x2: 0.1,
    y2: 0.1,
    confidence: 91,
    status: 'verified',
    thickness: 6,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
  
  // Interior walls
  {
    id: 'wall-5',
    type: 'interior',
    x1: 0.35,
    y1: 0.1,
    x2: 0.35,
    y2: 0.6,
    confidence: 87,
    status: 'pending',
    thickness: 4,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
  {
    id: 'wall-6',
    type: 'interior',
    x1: 0.65,
    y1: 0.4,
    x2: 0.65,
    y2: 0.9,
    confidence: 84,
    status: 'pending',
    thickness: 4,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
  {
    id: 'wall-7',
    type: 'interior',
    x1: 0.35,
    y1: 0.35,
    x2: 0.9,
    y2: 0.35,
    confidence: 79,
    status: 'rejected',
    thickness: 4,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
    notes: 'False positive - cabinetry',
  },
  {
    id: 'wall-8',
    type: 'plumbing',
    x1: 0.1,
    y1: 0.6,
    x2: 0.35,
    y2: 0.6,
    confidence: 88,
    status: 'verified',
    thickness: 5,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
  {
    id: 'wall-9',
    type: 'loadBearing',
    x1: 0.5,
    y1: 0.1,
    x2: 0.5,
    y2: 0.9,
    confidence: 90,
    status: 'verified',
    thickness: 8,
    height: 9,
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-yolo-v5',
  },
];

// ═══════════════════════════════════════════════════════════════
// Demo Pipe Runs
// ═══════════════════════════════════════════════════════════════

export const DEMO_PIPES = [
  // Water supply main
  {
    id: 'pipe-1',
    type: 'water_supply',
    points: [
      { x: 0.12, y: 0.12 },
      { x: 0.25, y: 0.12 },
      { x: 0.25, y: 0.35 },
      { x: 0.33, y: 0.35 },
    ],
    diameter: 3,
    material: 'Copper',
    confidence: 86,
    status: 'verified',
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-pipe-net',
  },
  // Hot water branch
  {
    id: 'pipe-2',
    type: 'hot_water',
    points: [
      { x: 0.25, y: 0.35 },
      { x: 0.25, y: 0.58 },
      { x: 0.33, y: 0.58 },
    ],
    diameter: 2,
    material: 'Copper',
    confidence: 82,
    status: 'pending',
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-pipe-net',
  },
  // Cold water branch
  {
    id: 'pipe-3',
    type: 'cold_water',
    points: [
      { x: 0.25, y: 0.35 },
      { x: 0.15, y: 0.35 },
      { x: 0.15, y: 0.58 },
      { x: 0.12, y: 0.58 },
    ],
    diameter: 2,
    material: 'Copper',
    confidence: 84,
    status: 'verified',
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-pipe-net',
  },
  // Drain line
  {
    id: 'pipe-4',
    type: 'drain',
    points: [
      { x: 0.33, y: 0.62 },
      { x: 0.33, y: 0.88 },
      { x: 0.67, y: 0.88 },
      { x: 0.67, y: 0.62 },
    ],
    diameter: 4,
    material: 'PVC',
    confidence: 79,
    status: 'pending',
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-pipe-net',
  },
  // Vent stack
  {
    id: 'pipe-5',
    type: 'vent',
    points: [
      { x: 0.67, y: 0.62 },
      { x: 0.67, y: 0.12 },
      { x: 0.75, y: 0.12 },
    ],
    diameter: 2,
    material: 'PVC',
    confidence: 75,
    status: 'rejected',
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-pipe-net',
    notes: 'Likely electrical conduit',
  },
  // Gas line
  {
    id: 'pipe-6',
    type: 'gas',
    points: [
      { x: 0.88, y: 0.88 },
      { x: 0.88, y: 0.5 },
      { x: 0.7, y: 0.5 },
    ],
    diameter: 1.5,
    material: 'Black Iron',
    confidence: 88,
    status: 'verified',
    detectedAt: new Date().toISOString(),
    aiModel: 'aecvision-pipe-net',
  },
];

// ═══════════════════════════════════════════════════════════════
// Generator Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Generate random wall segments
 */
export function generateRandomWalls(count = 8) {
  const types = ['interior', 'exterior', 'loadBearing', 'partition', 'plumbing'];
  const walls = [];
  
  for (let i = 0; i < count; i++) {
    const x1 = 0.1 + Math.random() * 0.7;
    const y1 = 0.1 + Math.random() * 0.7;
    const isHorizontal = Math.random() > 0.5;
    const length = 0.1 + Math.random() * 0.3;
    
    walls.push({
      id: `wall-random-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      x1,
      y1,
      x2: isHorizontal ? x1 + length : x1,
      y2: isHorizontal ? y1 : y1 + length,
      confidence: Math.round(60 + Math.random() * 35),
      status: Math.random() > 0.6 ? 'verified' : Math.random() > 0.3 ? 'pending' : 'rejected',
      thickness: [4, 5, 6, 8][Math.floor(Math.random() * 4)],
      height: 9,
      detectedAt: new Date().toISOString(),
      aiModel: 'aecvision-yolo-v5',
    });
  }
  
  return walls;
}

/**
 * Generate random pipe runs
 */
export function generateRandomPipes(count = 6) {
  const types = ['water_supply', 'hot_water', 'cold_water', 'drain', 'vent', 'gas'];
  const materials = ['Copper', 'PVC', 'PEX', 'Black Iron'];
  const pipes = [];
  
  for (let i = 0; i < count; i++) {
    const points = [];
    const numPoints = 2 + Math.floor(Math.random() * 4);
    let x = 0.1 + Math.random() * 0.6;
    let y = 0.1 + Math.random() * 0.6;
    
    points.push({ x, y });
    
    for (let j = 1; j < numPoints; j++) {
      const isHorizontal = Math.random() > 0.5;
      const step = 0.05 + Math.random() * 0.15;
      
      if (isHorizontal) {
        x += step;
      } else {
        y += step;
      }
      
      points.push({ 
        x: Math.min(0.9, x), 
        y: Math.min(0.9, y) 
      });
    }
    
    pipes.push({
      id: `pipe-random-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      points,
      diameter: [1, 1.5, 2, 3, 4][Math.floor(Math.random() * 5)],
      material: materials[Math.floor(Math.random() * materials.length)],
      confidence: Math.round(60 + Math.random() * 35),
      status: Math.random() > 0.6 ? 'verified' : Math.random() > 0.3 ? 'pending' : 'rejected',
      detectedAt: new Date().toISOString(),
      aiModel: 'aecvision-pipe-net',
    });
  }
  
  return pipes;
}
