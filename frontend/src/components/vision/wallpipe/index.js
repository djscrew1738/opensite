// Wall & Pipe Detection Visualization System
// Components for displaying and managing AI-detected walls and pipe runs

export { WallSegment, WALL_CONFIG } from './WallSegment';
export { PipeRun, PIPE_CONFIG } from './PipeRun';
export { WallAndPipeOverlay } from './WallAndPipeOverlay';
export { WallPipeDetectionPanel } from './WallPipeDetectionPanel';

// Demo data
export { DEMO_WALLS, DEMO_PIPES, generateRandomWalls, generateRandomPipes } from './wallPipeUtils';

// Default exports
export { default } from './WallAndPipeOverlay';
