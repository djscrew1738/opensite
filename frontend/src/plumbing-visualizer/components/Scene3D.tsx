import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Box, 
  Text,
  useTexture,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizerStore } from '../store';
import type { Floor, PipeSegment, Fixture, Chase, ViewPreset } from '../types';
import { PIPE_COLORS } from '../types';

// Floor Plane Component
function FloorPlane({ floor, onClick }: { floor: Floor; onClick?: (point: THREE.Vector3) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    if (!floor.blueprintUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(floor.blueprintUrl);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [floor.blueprintUrl]);

  if (!floor.visible) return null;

  const width = floor.dimensions ? floor.dimensions.width / 10 : 20;
  const height = floor.dimensions ? floor.dimensions.height / 10 : 20;

  return (
    <group position={[0, floor.heightOffset, 0]}>
      {/* Floor Plane */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e.point);
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={floor.opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Floor Label */}
      <Text
        position={[-width / 2 - 1, 0.5, -height / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.5}
        color="#60A5FA"
        anchorX="left"
        anchorY="top"
      >
        {floor.name}
      </Text>
      
      {/* Floor Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0, height)]} />
        <lineBasicMaterial color="#60A5FA" opacity={0.5} transparent />
      </lineSegments>
    </group>
  );
}

// Pipe Segment Component
function Pipe({ pipe, currentPhase }: { pipe: PipeSegment; currentPhase: number }) {
  const start = new THREE.Vector3(...pipe.startNode);
  const end = new THREE.Vector3(...pipe.endNode);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  
  // Determine visibility based on phase
  const isVisible = pipe.phase <= currentPhase;
  const isGhosted = pipe.phase > currentPhase;
  
  if (!isVisible && !isGhosted) return null;

  const radius = pipe.diameter / 24; // Convert inches to feet and scale
  const color = PIPE_COLORS[pipe.type];

  return (
    <group>
      {/* Pipe Cylinder */}
      <mesh position={midPoint} lookAt={end}>
        <cylinderGeometry args={[radius, radius, length, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isGhosted ? 0.2 : 0.8}
        />
      </mesh>
      
      {/* Pipe Outline for ghosted mode */}
      {isGhosted && (
        <mesh position={midPoint} lookAt={end}>
          <cylinderGeometry args={[radius * 1.1, radius * 1.1, length, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshBasicMaterial color={color} wireframe />
        </mesh>
      )}
      
      {/* Connection Nodes */}
      <mesh position={start}>
        <sphereGeometry args={[radius * 1.5, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[radius * 1.5, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// Fixture Component
function FixtureNode({ fixture }: { fixture: Fixture }) {
  const position = new THREE.Vector3(...fixture.position);
  
  const iconMap: Record<string, string> = {
    toilet: '🚽',
    sink: '🚰',
    shower: '🚿',
    tub: '🛁',
    hoseBib: '💧',
    waterHeater: '🔥',
    washer: '👕',
    dishwasher: '🍽️',
    cleanout: '🧹',
    floorDrain: '🔘',
    shutoffValve: '⭕',
  };

  return (
    <group position={position}>
      {/* Fixture Marker */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#FCD34D" emissive="#F59E0B" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Fixture Icon */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.6}
        anchorX="center"
        anchorY="middle"
      >
        {iconMap[fixture.type] || '🔧'}
      </Text>
      
      {/* Fixture Label */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {fixture.label}
      </Text>
      
      {/* Floor Indicator Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -fixture.position[1], 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="#FCD34D" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// Chase Component
function ChaseBox({ chase }: { chase: Chase }) {
  const position = new THREE.Vector3(...chase.position);
  const [width, height, depth] = chase.dimensions;

  return (
    <group position={position}>
      {/* Chase Box */}
      <Box args={[width, height, depth]}>
        <meshStandardMaterial
          color="#8B5CF6"
          transparent
          opacity={0.2}
        />
      </Box>
      
      {/* Chase Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color="#8B5CF6" />
      </lineSegments>
      
      {/* Chase Label */}
      <Text
        position={[0, height / 2 + 0.5, 0]}
        fontSize={0.3}
        color="#8B5CF6"
        anchorX="center"
        anchorY="bottom"
      >
        {chase.label}
      </Text>
    </group>
  );
}

// Camera Controller
function CameraController({ viewPreset }: { viewPreset: ViewPreset }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;

    switch (viewPreset) {
      case 'top':
        camera.position.set(0, 40, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'front':
        camera.position.set(0, 10, 40);
        camera.lookAt(0, 5, 0);
        break;
      case 'side':
        camera.position.set(40, 10, 0);
        camera.lookAt(0, 5, 0);
        break;
      case 'isometric':
        camera.position.set(30, 25, 30);
        camera.lookAt(0, 5, 0);
        break;
    }
    controlsRef.current.update();
  }, [viewPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={5}
      maxDistance={100}
      maxPolarAngle={Math.PI / 2 - 0.1}
    />
  );
}

// Ground Grid
function GroundGrid() {
  return (
    <>
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={50}
        infiniteGrid
        position={[0, -0.01, 0]}
      />
      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
    </>
  );
}

// Joist Cavity Indicator
function JoistCavity({ floors }: { floors: Floor[] }) {
  if (floors.length < 2) return null;

  const sortedFloors = [...floors].sort((a, b) => a.level - b.level);
  const cavityZones = [];

  for (let i = 0; i < sortedFloors.length - 1; i++) {
    const lowerFloor = sortedFloors[i];
    const upperFloor = sortedFloors[i + 1];
    const midHeight = (lowerFloor.heightOffset + upperFloor.heightOffset) / 2;
    const height = upperFloor.heightOffset - lowerFloor.heightOffset;

    cavityZones.push(
      <group key={`cavity-${i}`} position={[0, midHeight, 0]}>
        {/* Cavity Zone Indicator */}
        <mesh>
          <boxGeometry args={[25, height * 0.8, 25]} />
          <meshStandardMaterial
            color="#64748B"
            transparent
            opacity={0.05}
            depthWrite={false}
          />
        </mesh>
        
        {/* Cavity Label */}
        <Text
          position={[-13, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.4}
          color="#64748B"
          anchorX="center"
          anchorY="middle"
        >
          Joist Cavity
        </Text>
      </group>
    );
  }

  return <>{cavityZones}</>;
}

// Main Scene Content
function SceneContent({ onFloorClick }: { onFloorClick?: (point: THREE.Vector3, floor: Floor) => void }) {
  const { project, currentPhase, viewPreset, activeTool } = useVisualizerStore();

  const handleFloorClick = (point: THREE.Vector3, floor: Floor) => {
    if (activeTool === 'select') return;
    onFloorClick?.(point, floor);
  };

  if (!project) {
    return (
      <Text
        position={[0, 5, 0]}
        fontSize={1}
        color="#64748B"
        anchorX="center"
        anchorY="middle"
      >
        Create or load a project to begin
      </Text>
    );
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[30, 25, 30]} fov={50} />
      <CameraController viewPreset={viewPreset} />

      {/* Ground */}
      <GroundGrid />

      {/* Structure Bounding Box */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(24, 20, 24)]} />
        <lineBasicMaterial color="#334155" opacity={0.3} transparent />
      </lineSegments>

      {/* Floors */}
      {project.floors.map((floor) => (
        <FloorPlane
          key={floor.id}
          floor={floor}
          onClick={(point) => handleFloorClick(point, floor)}
        />
      ))}

      {/* Joist Cavities */}
      <JoistCavity floors={project.floors} />

      {/* Pipes */}
      {project.pipes.map((pipe) => (
        <Pipe key={pipe.id} pipe={pipe} currentPhase={currentPhase} />
      ))}

      {/* Fixtures */}
      {project.fixtures.map((fixture) => (
        <FixtureNode key={fixture.id} fixture={fixture} />
      ))}

      {/* Chases */}
      {project.chases.map((chase) => (
        <ChaseBox key={chase.id} chase={chase} />
      ))}
    </>
  );
}

// Main Scene Component
export function Scene3D({ onFloorClick }: { onFloorClick?: (point: THREE.Vector3, floor: Floor) => void }) {
  return (
    <Canvas
      style={{ background: '#0A0B0D' }}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContent onFloorClick={onFloorClick} />
    </Canvas>
  );
}

export default Scene3D;
