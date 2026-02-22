export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  floors: Floor[];
  pipes: PipeSegment[];
  fixtures: Fixture[];
  chases: Chase[];
  scale: ScaleConfig;
}

export interface ScaleConfig {
  pixelsPerFoot: number;
  referencePoints: [Point2D, Point2D] | null;
  knownDistance: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Floor {
  id: string;
  level: number;
  name: string;
  blueprintUrl: string | null;
  blueprintImage: HTMLImageElement | null;
  dimensions: { width: number; height: number } | null;
  heightOffset: number;
  opacity: number;
  visible: boolean;
}

export type PipeType = 'cold' | 'hot' | 'dwv' | 'vent' | 'gas';

export const PIPE_COLORS: Record<PipeType, string> = {
  cold: '#3B82F6',
  hot: '#EF4444',
  dwv: '#22C55E',
  vent: '#EAB308',
  gas: '#F97316',
};

export const PIPE_LABELS: Record<PipeType, string> = {
  cold: 'Cold Water',
  hot: 'Hot Water',
  dwv: 'Drain/Waste',
  vent: 'Vent',
  gas: 'Gas Line',
};

export interface PipeSegment {
  id: string;
  type: PipeType;
  diameter: number;
  startNode: [number, number, number];
  endNode: [number, number, number];
  phase: 1 | 2 | 3 | 4 | 5;
  floorLevels: number[];
  visible: boolean;
  fittings: Fitting[];
}

export interface Fitting {
  id: string;
  type: 'elbow' | 'tee' | 'coupling' | 'union' | 'cap' | 'cleanout';
  position: [number, number, number];
  rotation: [number, number, number];
}

export type FixtureType = 
  | 'toilet' 
  | 'sink' 
  | 'shower' 
  | 'tub' 
  | 'hoseBib' 
  | 'waterHeater' 
  | 'washer' 
  | 'dishwasher' 
  | 'cleanout' 
  | 'floorDrain'
  | 'shutoffValve';

export interface Fixture {
  id: string;
  type: FixtureType;
  position: [number, number, number];
  floor: number;
  connectedPipes: string[];
  label: string;
  description?: string;
}

export interface Chase {
  id: string;
  position: [number, number, number];
  dimensions: [number, number, number];
  floorLevels: number[];
  label: string;
}

export type Tool = 
  | 'select'
  | 'drawPipe'
  | 'placeFixture'
  | 'measure'
  | 'eraser'
  | 'setScale'
  | 'addChase';

export type ViewPreset = 'top' | 'front' | 'side' | 'isometric';

export const CONSTRUCTION_PHASES = [
  { phase: 1, name: 'Underground Rough-In', description: 'Slab/foundation pipes' },
  { phase: 2, name: 'Rough-In Floor 1', description: 'Supply + DWV stubbed up' },
  { phase: 3, name: 'Rough-In Floor 2', description: 'Vertical risers + 2nd floor layout' },
  { phase: 4, name: 'Top-Out', description: 'Vent stacks through roof' },
  { phase: 5, name: 'Trim-Out', description: 'Fixture connections, valves, stops' },
] as const;

export interface MaterialList {
  pipes: {
    type: PipeType;
    diameter: number;
    linearFeet: number;
    count: number;
  }[];
  fittings: {
    type: string;
    count: number;
  }[];
  fixtures: {
    type: FixtureType;
    count: number;
  }[];
}
