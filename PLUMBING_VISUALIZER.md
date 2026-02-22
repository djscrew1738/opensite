# 4D Plumbing Route Visualizer

A web-based 3D plumbing route planning tool with time-phase animation for construction planning.

## ✅ Completed: Features 1 & 2 - Foundation

### Feature 1: Blueprint Upload & Layer Extraction ✓

**Capabilities:**
- Accept PDF, PNG, JPG uploads for floor plans
- Multi-floor support (Basement/Slab, Floor 1, Floor 2)
- Each floor rendered as textured plane in 3D space
- Adjustable floor height (default 9ft separation between floors)
- Semi-transparent blueprint layers (0-100% opacity)
- Toggle visibility on/off per floor
- Blueprint preview thumbnails

**UI Controls:**
- Upload buttons for each floor level
- Opacity slider per floor
- Height adjustment (+/- 1ft buttons)
- Visibility toggle (eye icon)
- Floor removal with confirmation

### Feature 2: 3D Model Construction ✓

**Scene Elements:**
- **Floor Planes**: Textured with uploaded blueprints, positioned at configurable heights
- **Ground Grid**: Infinite reference grid with major/minor lines
- **Joist Cavities**: Visual indicators between floors showing chase space
- **Structure Bounding Box**: Wireframe outline of building footprint
- **Floor Labels**: Text annotations identifying each level

**Camera System:**
- OrbitControls: Rotate, zoom, pan
- View Presets:
  - Top-down (birds eye)
  - Front elevation
  - Side elevation  
  - Isometric (default)
- Smooth transitions between views
- Min/max zoom limits
- Polar angle restriction (prevent going below ground)

**Lighting:**
- Ambient light (0.5 intensity)
- Directional light (sun-like, casts shadows)
- Secondary fill light

## 🎯 Foundation Features Working

### Blueprint Management
```
Left Sidebar: Floor Plans Panel
├── Upload buttons (Basement/1st/2nd floor)
├── Floor list with expandable cards
├── Opacity slider (0-100%)
├── Height offset controls
├── Blueprint preview thumbnail
└── Remove floor button
```

### 3D Navigation
```
Top Toolbar: View Controls
├── New/Open/Export Project
├── Undo/Redo
├── Tools: Select, Draw Pipe, Place Fixture, Measure, Eraser
├── View Presets: Top, Front, Side, Isometric
└── Zoom controls
```

### Time-Phase Timeline (UI Ready)
```
Bottom Panel: 4D Timeline
├── 5 Construction Phases:
│   ├── Phase 1: Underground Rough-In
│   ├── Phase 2: Rough-In Floor 1
│   ├── Phase 3: Rough-In Floor 2
│   ├── Phase 4: Top-Out
│   └── Phase 5: Trim-Out
├── Phase scrubber with progress bar
├── Play/Pause animation
├── Phase descriptions
└── Visual indicators for active phases
```

### Properties Panel (Right Sidebar)
```
Right Sidebar: Properties & Tools
├── Selected Object Properties
│   ├── Pipe: type, diameter, phase
│   ├── Fixture: type, label, floor
│   └── Delete actions
├── Drawing Tool Settings
│   ├── Default pipe type (5 colors)
│   ├── Default diameter (0.5" - 4")
│   └── Default phase
├── Fixture Palette (11 types with icons)
└── Project Stats
```

## 📁 File Structure

```
src/plumbing-visualizer/
├── types.ts                 # TypeScript interfaces & constants
├── store.ts                 # Zustand state management
├── PlumbingVisualizer.tsx   # Main container component
├── styles.css              # Custom styles & animations
├── index.ts                # Public exports
└── components/
    ├── Scene3D.tsx         # Three.js 3D scene
    ├── Toolbar.tsx         # Top toolbar
    ├── FloorPanel.tsx      # Left sidebar (floors)
    ├── PropertiesPanel.tsx # Right sidebar (properties)
    └── Timeline.tsx        # Bottom phase timeline
```

## 🎮 Usage

### Getting Started
1. Navigate to **4D Plumbing** tab in sidebar
2. Click "New Project" and name it
3. Upload floor plans using left sidebar buttons
4. Adjust opacity and height as needed
5. Use view presets to navigate the 3D scene

### View Controls
- **Orbit**: Left-click + drag
- **Pan**: Right-click + drag  
- **Zoom**: Scroll wheel
- **View Presets**: Click Top/Front/Side/ISO buttons

### Keyboard Shortcuts
- `V` - Select tool
- `P` - Draw pipe tool
- `F` - Place fixture tool
- `M` - Measure tool
- `E` - Eraser tool
- `ESC` - Cancel/clear selection

## 🚀 Next Steps (Features 3-6)

### Feature 3: Plumbing Route Drawing Tools
- [ ] Click-to-place pipe nodes on floors
- [ ] Connect nodes with 3D cylinders
- [ ] Pipe type color coding (5 colors)
- [ ] Diameter selection (0.5" - 4")
- [ ] Vertical routing through chases
- [ ] Fixture placement with icons

### Feature 4: 4D Time-Phase Animation
- [ ] Assign phases to pipe segments
- [ ] Timeline scrubber revealing pipes progressively
- [ ] Ghosted/dashed outlines for future phases
- [ ] Play button for auto-animation
- [ ] Phase-based visibility filtering

### Feature 5: Overlay & Analysis Tools
- [ ] Collision detection (red highlight)
- [ ] Slope indicators for DWV (green/red)
- [ ] Wet wall detector
- [ ] Distance measurement tool
- [ ] Material list generator
- [ ] Export transparent PNG overlays

### Feature 6: Smart Suggestions
- [ ] Fixture stacking suggestions
- [ ] Shortest path routing
- [ ] Vent stack optimization

## 🛠 Technical Stack

- **React 19** + TypeScript
- **Three.js** via @react-three/fiber & @react-three/drei
- **Zustand** for state management
- **Tailwind CSS** for UI
- **Lucide React** for icons
- **Vite** for build tooling

## 📦 Dependencies Added

```bash
npm install three @react-three/fiber @react-three/drei @types/three zustand
```

## 🔧 Build Status

✅ Build successful
- Bundle size: ~1MB (includes Three.js)
- Code split into separate chunk
- Lazy loaded on route navigation

---

**Access the visualizer at:** `/plumbing` route
