import { useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Scene3D } from './components/Scene3D';
import { Toolbar } from './components/Toolbar';
import { FloorPanel } from './components/FloorPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';
import { useVisualizerStore } from './store';
import type { Floor } from './types';
import './styles.css';

export function PlumbingVisualizer() {
  const { 
    project, 
    createProject,
    activeTool, 
    drawingState, 
    setDrawingState,
    addPipe,
    addFixture,
    setActiveTool,
    fixtureToPlace,
    setFixtureToPlace,
    setSelectedObject,
  } = useVisualizerStore();

  // Initialize with demo project if none exists
  useEffect(() => {
    if (!project) {
      createProject('New Plumbing Project');
    }
  }, [project, createProject]);

  // Handle floor clicks for drawing
  const handleFloorClick = useCallback((point: THREE.Vector3, floor: Floor) => {
    if (activeTool === 'drawPipe') {
      const newPoint: [number, number, number] = [point.x, floor.heightOffset, point.z];
      
      if (!drawingState.isDrawing) {
        // Start new pipe
        setDrawingState({
          isDrawing: true,
          tempPoints: [newPoint],
        });
      } else {
        // Continue pipe
        const tempPoints = [...drawingState.tempPoints, newPoint];
        
        if (tempPoints.length >= 2) {
          // Create pipe segment
          const startNode = tempPoints[tempPoints.length - 2];
          const endNode = tempPoints[tempPoints.length - 1];
          
          addPipe({
            type: drawingState.pipeType,
            diameter: drawingState.pipeDiameter,
            startNode,
            endNode,
            phase: drawingState.pipePhase,
            floorLevels: [floor.level],
            visible: true,
            fittings: [],
          });
          
          setDrawingState({
            tempPoints,
          });
        }
      }
    } else if (activeTool === 'placeFixture' && fixtureToPlace) {
      // Place fixture
      const position: [number, number, number] = [point.x, floor.heightOffset, point.z];
      
      addFixture({
        type: fixtureToPlace,
        position,
        floor: floor.level,
        connectedPipes: [],
        label: `${fixtureToPlace.charAt(0).toUpperCase() + fixtureToPlace.slice(1)}`,
      });
      
      // Reset tool
      setFixtureToPlace(null);
      setActiveTool('select');
    } else if (activeTool === 'select') {
      // Deselect
      setSelectedObject(null, null);
    }
  }, [
    activeTool, 
    drawingState, 
    fixtureToPlace,
    setDrawingState, 
    addPipe, 
    addFixture,
    setActiveTool,
    setFixtureToPlace,
    setSelectedObject,
  ]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'p':
          setActiveTool('drawPipe');
          break;
        case 'f':
          setActiveTool('placeFixture');
          break;
        case 'm':
          setActiveTool('measure');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 'escape':
          if (drawingState.isDrawing) {
            setDrawingState({ isDrawing: false, tempPoints: [] });
          }
          setActiveTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, drawingState.isDrawing, setDrawingState]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0A0B0D' }}>
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Floors */}
        <FloorPanel />

        {/* Center - 3D Scene */}
        <div className="flex-1 relative">
          <Scene3D onFloorClick={handleFloorClick} />
          
          {/* Overlay Instructions */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="backdrop-blur px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(17, 19, 24, 0.9)', border: '1px solid #1F2430' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                {activeTool === 'select' && 'Select Mode'}
                {activeTool === 'drawPipe' && 'Drawing Pipe'}
                {activeTool === 'placeFixture' && 'Placing Fixture'}
                {activeTool === 'measure' && 'Measure Mode'}
                {activeTool === 'eraser' && 'Eraser Mode'}
              </h3>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                {activeTool === 'select' && 'Click objects to select them'}
                {activeTool === 'drawPipe' && 'Click on floor to place pipe nodes'}
                {activeTool === 'placeFixture' && 'Select fixture type, then click to place'}
                {activeTool === 'measure' && 'Click two points to measure distance'}
                {activeTool === 'eraser' && 'Click objects to delete them'}
              </p>
            </div>
          </div>

          {/* Drawing Status */}
          {drawingState.isDrawing && (
            <div className="absolute top-4 right-4">
              <div className="backdrop-blur px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.9)' }}>
                <p className="text-sm font-medium text-white">
                  Drawing Pipe
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {drawingState.tempPoints.length} nodes placed
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Press ESC to finish
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties */}
        <PropertiesPanel />
      </div>

      {/* Bottom Timeline */}
      <Timeline />
    </div>
  );
}

export default PlumbingVisualizer;
