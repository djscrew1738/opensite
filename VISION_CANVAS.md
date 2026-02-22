# Vision Canvas - Feature Documentation

## Overview

Vision Canvas is a **spatial workspace** for analyzing construction blueprints visually. Unlike the traditional single-blueprint viewer, Canvas allows you to work with multiple blueprints simultaneously, create connections between findings, and draw overlays for plumbing fixtures and critical elements.

## Features

### 1. Document Nodes
- **Drag and drop** blueprints onto the infinite canvas
- View **multiple floor plans side-by-side** (first, second, third floors)
- **Resize, rotate, and scale** individual blueprint nodes
- **Opacity control** for overlaying and comparing different plans
- **Internal zoom and pan** within each blueprint node

### 2. Pin Findings System
- **Click-to-place pins** anywhere on blueprints
- **Color-coded pins** for different finding types:
  - 🔴 Red: Critical issue
  - 🟠 Orange: Warning
  - 🟡 Yellow: Note
  - 🟢 Green: Approved
  - 🔵 Blue: Info
  - 🟣 Purple: Question
- **Detailed descriptions** and labels for each pin
- **Pin list panel** with search and filter

### 3. Connection Lines
- **Draw connections** between pins across different blueprints
- **Visualize relationships** spatially
- **Different line styles**: Solid, dashed, dotted
- **Arrowheads** for directed connections
- **Labels** on connections for context
- **Pipe flow animation** for plumbing routes

### 4. Drawing Overlays
- **Pipe drawing tool**: Draw pipe routes with cyan lines
- **Wall marking tool**: Draw critical walls with red dashed lines
- **Fixture markers**: Place fixture indicators (green circles)
- **Customizable colors** and line widths
- **Measurement tool**: Calculate distances on the canvas

### 5. OCR Text Overlay
- **Text extraction display** overlaid on blueprints
- **Searchable text panel** with all extracted content
- **Click-to-highlight** text boxes on the blueprint
- **Confidence indicators** for extracted text

### 6. Canvas Controls
- **Infinite pan and zoom** on the canvas
- **Grid toggle** for alignment
- **Undo/Redo** history (50 steps)
- **Fit to screen** to see all blueprints
- **Export** canvas state as JSON

## User Interface

### Toolbar (Top)
```
[Select] [Pan] | [Pin] [Connect] | [Pipe] [Wall] [Fixture] | [Measure] [Text]
                                        ↑
                                   Color & Width Pickers (when drawing)

[Undo] [Redo] | [Zoom -] [100%] [Zoom +] [Fit] | [Grid] [OCR] | [Add Blueprint] [Save] [Export]
```

### Sidebar (Left)
- **Project list**: All uploaded blueprints
- **View mode toggle**: Switch between Viewer and Canvas modes

### Pin Panel (Left overlay)
- **Findings list**: All pins grouped by type
- **Legend**: Color meanings
- **Click to navigate** to pin location

### Blueprint Selector (Modal)
- **Grid/List view** toggle
- **Search** blueprints by name
- **Preview panel** on hover
- **Multi-select** support

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Pan tool |
| `P` | Pin tool |
| `C` | Connect tool |
| `1` | Pipe drawing |
| `2` | Wall drawing |
| `3` | Fixture marker |
| `M` | Measure tool |
| `T` | Text tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `+` / `-` | Zoom in/out |
| `0` | Fit to screen |

## Data Structure

### Canvas State
```json
{
  "nodes": [
    {
      "id": "node-123",
      "projectId": "proj-456",
      "x": 100,
      "y": 100,
      "width": 800,
      "height": 600,
      "rotation": 0,
      "scale": 1,
      "opacity": 1,
      "visible": true,
      "locked": false
    }
  ],
  "connections": [
    {
      "id": "conn-789",
      "fromPin": "pin-001",
      "toPin": "pin-002",
      "color": "#3B82F6",
      "style": "solid",
      "width": 2
    }
  ],
  "pins": [
    {
      "id": "pin-001",
      "nodeId": "node-123",
      "x": 200,
      "y": 150,
      "type": "finding",
      "label": "Main Drain",
      "description": "Critical connection point",
      "color": "#EF4444"
    }
  ],
  "drawings": [
    {
      "id": "draw-001",
      "type": "draw_pipe",
      "points": [{"x": 100, "y": 100}, {"x": 200, "y": 200}],
      "color": "#06B6D4",
      "width": 4
    }
  ],
  "viewBox": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

## Use Cases

### 1. Multi-Floor Analysis
Place first, second, and third floor plans side-by-side. Use connections to trace vertical pipe runs across floors.

### 2. Before/After Comparison
Load existing and proposed blueprints. Adjust opacity to overlay and compare changes.

### 3. Issue Tracking
Place red pins on problem areas. Connect related issues across different parts of the building.

### 4. Plumbing Takeoff
Draw pipe routes directly on the blueprint. Mark fixture locations. Export the annotated canvas for reports.

### 5. Site Walk Documentation
Load site photos and blueprints together. Pin findings from site visits with photos and notes.

## Technical Notes

### Components Created
- `VisionCanvas.jsx` - Main canvas container
- `CanvasNode.jsx` - Draggable blueprint node
- `CanvasConnection.jsx` - Connection line rendering
- `CanvasToolbar.jsx` - Tool controls
- `OcrOverlay.jsx` - OCR text display
- `PinSystem.jsx` - Pin management
- `BlueprintSelector.jsx` - Blueprint picker modal

### Performance Considerations
- Canvas uses CSS transforms for smooth pan/zoom
- SVG overlay for drawings and connections
- Virtual rendering for large numbers of pins
- Debounced history updates (50 step limit)
- Local storage for auto-save

### Browser Support
- Modern browsers with CSS Grid and Flexbox
- Touch support for tablets
- Pointer events for stylus input

## Future Enhancements

### Planned
- [ ] Real-time collaboration (multiple users)
- [ ] Blueprint versioning and diff view
- [ ] AI-powered fixture auto-detection
- [ ] Automatic pipe route suggestions
- [ ] 3D model integration
- [ ] Export to PDF with annotations
- [ ] Mobile-optimized canvas controls

### Considered
- Voice notes on pins
- Measurement auto-calculation
- Integration with takeoff calculations
- Template canvas layouts
- Video annotations

---

**Made for CTL Plumbing LLC**
