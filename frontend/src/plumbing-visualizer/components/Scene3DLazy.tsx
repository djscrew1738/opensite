import { Suspense, lazy } from 'react';
import type { Floor } from '../types';
import * as THREE from 'three';

// Lazy load the heavy 3D scene component
const Scene3D = lazy(() => import('./Scene3D'));

// Lightweight loading placeholder
function SceneLoader() {
  return (
    <div 
      className="flex items-center justify-center w-full h-full"
      style={{ background: '#0A0B0D' }}
    >
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div 
            className="absolute inset-0 rounded-full animate-spin"
            style={{ 
              border: '3px solid transparent',
              borderTopColor: '#3B82F6',
              borderRightColor: '#3B82F6'
            }} 
          />
          <div 
            className="absolute inset-2 rounded-full animate-spin"
            style={{ 
              border: '2px solid transparent',
              borderBottomColor: '#60A5FA',
              animationDirection: 'reverse',
              animationDuration: '1.5s'
            }} 
          />
        </div>
        <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
          Loading 3D Engine...
        </p>
        <p className="text-xs mt-1" style={{ color: '#64748B' }}>
          Initializing Three.js
        </p>
      </div>
    </div>
  );
}

interface Scene3DLazyProps {
  onFloorClick?: (point: THREE.Vector3, floor: Floor) => void;
}

export function Scene3DLazy({ onFloorClick }: Scene3DLazyProps) {
  return (
    <Suspense fallback={<SceneLoader />}>
      <Scene3D onFloorClick={onFloorClick} />
    </Suspense>
  );
}

export default Scene3DLazy;
