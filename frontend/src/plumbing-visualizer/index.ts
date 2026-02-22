export { PlumbingVisualizer } from './PlumbingVisualizer';
export { default } from './PlumbingVisualizer';

// Export types
export type {
  Project,
  Floor,
  PipeSegment,
  Fixture,
  Chase,
  Tool,
  ViewPreset,
  PipeType,
  FixtureType,
  MaterialList,
  ScaleConfig,
} from './types';

// Export constants
export { PIPE_COLORS, PIPE_LABELS, CONSTRUCTION_PHASES } from './types';

// Export store
export { useVisualizerStore } from './store';
