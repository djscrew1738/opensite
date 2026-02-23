import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  useReactFlow,
  ConnectionMode,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  ZoomIn, ZoomOut, Maximize, Grid, Lock, Unlock,
  Plus, Trash2, Save, FolderOpen, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';
import DocumentNode from '../components/canvas/nodes/DocumentNode';
import EntityNode from '../components/canvas/nodes/EntityNode';
import StickyNoteNode from '../components/canvas/nodes/StickyNoteNode';
import { useCanvasStore, generateId } from '../components/canvas/canvasStore';
import { ConfirmDialog } from '../components/shared';

// Node type components
const nodeTypes = {
  document: DocumentNode,
  entity: EntityNode,
  sticky: StickyNoteNode,
};

// Connection edge styles
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: {
    stroke: '#3B82F6',
    strokeWidth: 2,
  },
  labelStyle: {
    fill: '#f5f3f0',
    fontSize: 12,
    fontWeight: 500,
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#3B82F6',
  },
};

// Canvas toolbar component
function CanvasToolbar({ onAddEntity, onAddSticky, onSave, onClear, isLocked, setIsLocked, hasChanges, showGrid, setShowGrid }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  return (
    <Panel position="top-center" className="!m-0 !top-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2 bg-[#181C24] border border-[#2A2F38] rounded-xl px-4 py-2 shadow-lg"
      >
        {/* Navigation */}
        <button
          onClick={() => window.history.back()}
          className="p-2 text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38] rounded-lg transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="w-px h-6 bg-[#2A2F38] mx-1" />
        
        {/* Add Items */}
        <button
          onClick={onAddEntity}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#3B82F620] text-[#3B82F6] hover:bg-[#3B82F630] rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Entity
        </button>
        
        <button
          onClick={onAddSticky}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#10b98120] text-[#10b981] hover:bg-[#10b98130] rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Note
        </button>
        
        <div className="w-px h-6 bg-[#2A2F38] mx-1" />
        
        {/* View Controls */}
        <button
          onClick={() => zoomIn()}
          className="p-2 text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38] rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        
        <button
          onClick={() => zoomOut()}
          className="p-2 text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38] rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        
        <button
          onClick={() => fitView({ padding: 0.2 })}
          className="p-2 text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38] rounded-lg transition-colors"
          title="Fit View"
        >
          <Maximize size={18} />
        </button>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg transition-colors ${showGrid ? 'text-[#3B82F6] bg-[#3B82F620]' : 'text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38]'}`}
          title="Toggle Grid"
        >
          <Grid size={18} />
        </button>
        
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`p-2 rounded-lg transition-colors ${isLocked ? 'text-[#ef4444] bg-[#ef444420]' : 'text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38]'}`}
          title={isLocked ? 'Unlock Canvas' : 'Lock Canvas'}
        >
          {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
        </button>
        
        <div className="w-px h-6 bg-[#2A2F38] mx-1" />
        
        {/* Actions */}
        <button
          onClick={onClear}
          className="p-2 text-[#9a9590] hover:text-[#ef4444] hover:bg-[#ef444420] rounded-lg transition-colors"
          title="Clear Canvas"
        >
          <Trash2 size={18} />
        </button>
        
        <button
          onClick={onSave}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
            hasChanges 
              ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]' 
              : 'bg-[#2A2F38] text-[#9a9590]'
          }`}
        >
          <Save size={16} />
          Save
          {hasChanges && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
        </button>
      </motion.div>
    </Panel>
  );
}

// Sidebar component
function CanvasSidebar({ onAddDocument, documents, entities, selectedNode, onCreateConnection }) {
  const [activeTab, setActiveTab] = useState('documents');
  
  return (
    <Panel position="top-left" className="!m-0 !left-4 !top-20">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 bg-[#181C24] border border-[#2A2F38] rounded-xl overflow-hidden shadow-lg"
      >
        {/* Tabs */}
        <div className="flex border-b border-[#2A2F38]">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'documents' 
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6] bg-[#3B82F610]' 
                : 'text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38]'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'entities' 
                ? 'text-[#3B82F6] border-b-2 border-[#3B82F6] bg-[#3B82F610]' 
                : 'text-[#9a9590] hover:text-[#f5f3f0] hover:bg-[#2A2F38]'
            }`}
          >
            Entities
          </button>
        </div>
        
        {/* Content */}
        <div className="p-3 max-h-[60vh] overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'documents' ? (
              <motion.div
                key="documents"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="text-xs text-[#6b7280] mb-3">
                  Drag documents to canvas or click to add
                </div>
                {documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'document',
                        documentId: doc.id,
                        label: doc.title,
                        fileType: doc.type,
                      }));
                    }}
                    className="p-3 bg-[#121318] rounded-lg border border-[#2A2F38] cursor-move hover:border-[#3B82F660] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#f5f3f0] truncate">{doc.title}</div>
                        <div className="text-xs text-[#6b7280]">{doc.type}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {documents.length === 0 && (
                  <div className="text-center py-8 text-[#6b7280]">
                    <p className="text-sm">No documents yet</p>
                    <p className="text-xs mt-1">Upload documents to get started</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="entities"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="text-xs text-[#6b7280] mb-3">
                  Available entity types
                </div>
                {Object.entries({
                  person: { icon: '👤', label: 'Person', color: '#3b82f6' },
                  company: { icon: '🏢', label: 'Company', color: '#3B82F6' },
                  legal: { icon: '⚖️', label: 'Legal Entity', color: '#a855f7' },
                }).map(([type, config]) => (
                  <motion.div
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddDocument(type)}
                    className="p-3 bg-[#121318] rounded-lg border border-[#2A2F38] cursor-pointer hover:border-[#3B82F660] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ background: config.color + '20' }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <div className="text-sm text-[#f5f3f0]">{config.label}</div>
                        <div className="text-xs text-[#6b7280]">Click to add to canvas</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Panel>
  );
}

// Main Canvas component
function Canvas() {
  const reactFlowWrapper = useRef(null);
  const { project, fitView } = useReactFlow();
  const navigate = useNavigate();
  
  // State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Store integration
  const store = useCanvasStore();
  
  // Toast notifications
  const { addToast } = useToast();
  
  // Load saved workspace on mount
  useEffect(() => {
    const saved = store.loadWorkspace();
    if (saved) {
      setNodes(saved.nodes || []);
      setEdges(saved.edges || []);
    }
  }, []);
  
  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [nodes, edges]);
  
  // Connection handler
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      ...defaultEdgeOptions,
      id: generateId('edge'),
    }, eds));
    setHasChanges(true);
  }, []);
  
  // Drop handler for documents
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback((event) => {
    event.preventDefault();
    
    const type = event.dataTransfer.getData('application/reactflow');
    const docData = event.dataTransfer.getData('application/json');
    
    if (type || docData) {
      const position = project({
        x: event.clientX - reactFlowWrapper.current?.getBoundingClientRect().left || 0,
        y: event.clientY - reactFlowWrapper.current?.getBoundingClientRect().top || 0,
      });
      
      if (docData) {
        // Add document node
        const data = JSON.parse(docData);
        const newNode = {
          id: generateId('doc'),
          type: 'document',
          position,
          data: {
            ...data,
            createdAt: new Date().toISOString(),
          },
        };
        setNodes((nds) => nds.concat(newNode));
      }
    }
  }, [project]);
  
  // Add entity node
  const addEntity = useCallback(() => {
    const type = prompt('Entity type? (person, company, legal)', 'person') || 'person';
    const name = prompt('Entity name?', 'New Entity') || 'Unnamed Entity';
    
    const position = {
      x: window.innerWidth / 2 - 100 + (Math.random() - 0.5) * 100,
      y: window.innerHeight / 2 - 80 + (Math.random() - 0.5) * 100,
    };
    
    const newNode = {
      id: generateId('entity'),
      type: 'entity',
      position,
      data: {
        label: name,
        entityType: type,
        role: '',
        status: 'active',
        notes: '',
        connections: [],
        createdAt: new Date().toISOString(),
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, []);
  
  // Add sticky note
  const addStickyNote = useCallback(() => {
    const position = {
      x: window.innerWidth / 2 - 100 + (Math.random() - 0.5) * 100,
      y: window.innerHeight / 2 - 100 + (Math.random() - 0.5) * 100,
    };
    
    const newNode = {
      id: generateId('sticky'),
      type: 'sticky',
      position,
      data: {
        content: 'Double-click to edit...',
        colorIndex: Math.floor(Math.random() * 5),
        createdAt: new Date().toISOString(),
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, []);
  
  // Save workspace
  const saveWorkspace = useCallback(async () => {
    try {
      await store.saveWorkspace({ nodes, edges });
      setHasChanges(false);
      addToast('Canvas saved successfully', { type: 'success' });
    } catch (error) {
      addToast('Failed to save canvas', { type: 'error' });
      console.error('Save error:', error);
    }
  }, [nodes, edges, addToast]);
  
  // Clear canvas
  const clearCanvas = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setHasChanges(true);
    setShowClearConfirm(false);
  }, []);
  
  // Sample documents data (would come from API)
  const sampleDocuments = useMemo(() => [
    { id: 'doc-1', title: 'Contract_A.pdf', type: 'PDF' },
    { id: 'doc-2', title: 'Invoice_2024.pdf', type: 'PDF' },
    { id: 'doc-3', title: 'Evidence_Photo.jpg', type: 'Image' },
  ], []);
  
  return (
    <div ref={reactFlowWrapper} className="h-screen w-full bg-[#0A0B0D]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => setSelectedNode(node)}
        onPaneClick={() => setSelectedNode(null)}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={true}
        snapGrid={[15, 15]}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        fitView
        className="bg-[#0A0B0D]"
        proOptions={{ hideAttribution: true }}
      >
        {showGrid && (
          <Background 
            color="#2A2F38" 
            gap={20} 
            variant="dots"
            size={1}
          />
        )}
        
        <Controls 
          className="!bg-[#181C24] !border-[#2A2F38] [&>button]:!bg-[#121318] [&>button]:!border-[#2A2F38] [&>button]:!text-[#9a9590] [&>button:hover]:!text-[#f5f3f0] [&>button:hover]:!bg-[#2A2F38]"
        />
        
        <MiniMap 
          className="!bg-[#181C24] !border-[#2A2F38]"
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.type === 'document') return '#3B82F6';
            if (node.type === 'entity') return '#3b82f6';
            if (node.type === 'sticky') return '#10b981';
            return '#9a9590';
          }}
          maskColor="rgba(0,0,0,0.7)"
        />
        
        <CanvasToolbar
          onAddEntity={addEntity}
          onAddSticky={addStickyNote}
          onSave={saveWorkspace}
          onClear={clearCanvas}
          isLocked={isLocked}
          setIsLocked={setIsLocked}
          hasChanges={hasChanges}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
        />
        
        <CanvasSidebar
          documents={sampleDocuments}
          selectedNode={selectedNode}
          onAddDocument={addEntity}
        />
      </ReactFlow>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <ConfirmDialog
          title="Clear Canvas?"
          message="Are you sure you want to clear the entire canvas? This action cannot be undone and all your unsaved changes will be lost."
          confirmLabel="Clear All"
          onConfirm={handleConfirmClear}
          onCancel={() => setShowClearConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
}

// Wrapper component that provides ReactFlow context
export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
