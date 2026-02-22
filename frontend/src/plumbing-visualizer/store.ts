import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Project, Floor, PipeSegment, Fixture, Chase, 
  Tool, ViewPreset, PipeType, FixtureType, ScaleConfig 
} from './types';

interface VisualizerState {
  // Project
  project: Project | null;
  createProject: (name: string) => void;
  loadProject: (project: Project) => void;
  
  // Floors
  addFloor: (level: number, name: string, blueprintUrl: string, image: HTMLImageElement) => void;
  updateFloor: (floorId: string, updates: Partial<Floor>) => void;
  removeFloor: (floorId: string) => void;
  setFloorOpacity: (floorId: string, opacity: number) => void;
  toggleFloorVisibility: (floorId: string) => void;
  
  // Scale
  setScale: (pixelsPerFoot: number, referencePoints: [Point2D, Point2D], knownDistance: number) => void;
  
  // Pipes
  addPipe: (pipe: Omit<PipeSegment, 'id'>) => string;
  updatePipe: (pipeId: string, updates: Partial<PipeSegment>) => void;
  removePipe: (pipeId: string) => void;
  
  // Fixtures
  addFixture: (fixture: Omit<Fixture, 'id'>) => string;
  updateFixture: (fixtureId: string, updates: Partial<Fixture>) => void;
  removeFixture: (fixtureId: string) => void;
  
  // Chases
  addChase: (chase: Omit<Chase, 'id'>) => string;
  updateChase: (chaseId: string, updates: Partial<Chase>) => void;
  removeChase: (chaseId: string) => void;
  
  // UI State
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  
  selectedObject: { type: 'pipe' | 'fixture' | 'chase' | null; id: string | null };
  setSelectedObject: (type: 'pipe' | 'fixture' | 'chase' | null, id: string | null) => void;
  
  currentPhase: number;
  setCurrentPhase: (phase: number) => void;
  
  viewPreset: ViewPreset;
  setViewPreset: (preset: ViewPreset) => void;
  
  // Drawing State
  drawingState: {
    isDrawing: boolean;
    pipeType: PipeType;
    pipeDiameter: number;
    pipePhase: 1 | 2 | 3 | 4 | 5;
    tempPoints: [number, number, number][];
  };
  setDrawingState: (state: Partial<VisualizerState['drawingState']>) => void;
  
  // Fixture Placement State
  fixtureToPlace: FixtureType | null;
  setFixtureToPlace: (type: FixtureType | null) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Export/Import
  exportProject: () => string;
  importProject: (json: string) => void;
}

interface Point2D {
  x: number;
  y: number;
}

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial project state
const createInitialProject = (name: string): Project => ({
  id: generateId(),
  name,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  floors: [],
  pipes: [],
  fixtures: [],
  chases: [],
  scale: {
    pixelsPerFoot: 10,
    referencePoints: null,
    knownDistance: 0,
  },
});

export const useVisualizerStore = create<VisualizerState>()(
  persist(
    (set, get) => ({
      project: null,
      
      createProject: (name) => {
        set({ project: createInitialProject(name) });
      },
      
      loadProject: (project) => {
        set({ project });
      },
      
      addFloor: (level, name, blueprintUrl, image) => {
        const { project } = get();
        if (!project) return;
        
        const newFloor: Floor = {
          id: generateId(),
          level,
          name,
          blueprintUrl,
          blueprintImage: image,
          dimensions: { width: image.width, height: image.height },
          heightOffset: level * 9,
          opacity: 0.8,
          visible: true,
        };
        
        set({
          project: {
            ...project,
            floors: [...project.floors, newFloor].sort((a, b) => a.level - b.level),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      updateFloor: (floorId, updates) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            floors: project.floors.map(f => 
              f.id === floorId ? { ...f, ...updates } : f
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      removeFloor: (floorId) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            floors: project.floors.filter(f => f.id !== floorId),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      setFloorOpacity: (floorId, opacity) => {
        get().updateFloor(floorId, { opacity });
      },
      
      toggleFloorVisibility: (floorId) => {
        const { project } = get();
        if (!project) return;
        const floor = project.floors.find(f => f.id === floorId);
        if (floor) {
          get().updateFloor(floorId, { visible: !floor.visible });
        }
      },
      
      setScale: (pixelsPerFoot, referencePoints, knownDistance) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            scale: { pixelsPerFoot, referencePoints, knownDistance },
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      addPipe: (pipe) => {
        const { project } = get();
        if (!project) return '';
        
        const newPipe: PipeSegment = {
          ...pipe,
          id: generateId(),
        };
        
        set({
          project: {
            ...project,
            pipes: [...project.pipes, newPipe],
            updatedAt: new Date().toISOString(),
          },
        });
        
        return newPipe.id;
      },
      
      updatePipe: (pipeId, updates) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            pipes: project.pipes.map(p => 
              p.id === pipeId ? { ...p, ...updates } : p
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      removePipe: (pipeId) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            pipes: project.pipes.filter(p => p.id !== pipeId),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      addFixture: (fixture) => {
        const { project } = get();
        if (!project) return '';
        
        const newFixture: Fixture = {
          ...fixture,
          id: generateId(),
        };
        
        set({
          project: {
            ...project,
            fixtures: [...project.fixtures, newFixture],
            updatedAt: new Date().toISOString(),
          },
        });
        
        return newFixture.id;
      },
      
      updateFixture: (fixtureId, updates) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            fixtures: project.fixtures.map(f => 
              f.id === fixtureId ? { ...f, ...updates } : f
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      removeFixture: (fixtureId) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            fixtures: project.fixtures.filter(f => f.id !== fixtureId),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      addChase: (chase) => {
        const { project } = get();
        if (!project) return '';
        
        const newChase: Chase = {
          ...chase,
          id: generateId(),
        };
        
        set({
          project: {
            ...project,
            chases: [...project.chases, newChase],
            updatedAt: new Date().toISOString(),
          },
        });
        
        return newChase.id;
      },
      
      updateChase: (chaseId, updates) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            chases: project.chases.map(c => 
              c.id === chaseId ? { ...c, ...updates } : c
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      removeChase: (chaseId) => {
        const { project } = get();
        if (!project) return;
        
        set({
          project: {
            ...project,
            chases: project.chases.filter(c => c.id !== chaseId),
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      activeTool: 'select',
      setActiveTool: (tool) => set({ activeTool: tool }),
      
      selectedObject: { type: null, id: null },
      setSelectedObject: (type, id) => set({ selectedObject: { type, id } }),
      
      currentPhase: 5,
      setCurrentPhase: (phase) => set({ currentPhase: phase }),
      
      viewPreset: 'isometric',
      setViewPreset: (preset) => set({ viewPreset: preset }),
      
      drawingState: {
        isDrawing: false,
        pipeType: 'cold',
        pipeDiameter: 0.75,
        pipePhase: 2,
        tempPoints: [],
      },
      setDrawingState: (state) => set((prev) => ({
        drawingState: { ...prev.drawingState, ...state },
      })),
      
      fixtureToPlace: null,
      setFixtureToPlace: (type) => set({ fixtureToPlace: type }),
      
      undo: () => {
        // Implementation for undo
      },
      
      redo: () => {
        // Implementation for redo
      },
      
      canUndo: () => false,
      canRedo: () => false,
      
      exportProject: () => {
        const { project } = get();
        if (!project) return '';
        
        // Strip HTMLImageElement before serializing
        const exportData = {
          ...project,
          floors: project.floors.map(f => ({
            ...f,
            blueprintImage: null,
          })),
        };
        
        return JSON.stringify(exportData, null, 2);
      },
      
      importProject: (json) => {
        try {
          const project = JSON.parse(json);
          set({ project });
        } catch (e) {
          console.error('Failed to import project:', e);
        }
      },
    }),
    {
      name: 'plumbing-visualizer-storage',
      partialize: (state) => ({ 
        project: state.project ? {
          ...state.project,
          floors: state.project.floors.map(f => ({
            ...f,
            blueprintImage: null,
          })),
        } : null,
      }),
    }
  )
);
