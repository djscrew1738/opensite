import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Document categories with colors and icons
export const DOCUMENT_CATEGORIES = {
  contract: {
    label: 'Contract',
    color: '#3b82f6',
    icon: '📋',
  },
  invoice: {
    label: 'Invoice',
    color: '#22c55e',
    icon: '📄',
  },
  evidence: {
    label: 'Evidence',
    color: '#ef4444',
    icon: '📸',
  },
  correspondence: {
    label: 'Correspondence',
    color: '#a855f7',
    icon: '✉️',
  },
  legal: {
    label: 'Legal Document',
    color: '#3B82F6',
    icon: '⚖️',
  },
  financial: {
    label: 'Financial',
    color: '#10b981',
    icon: '💰',
  },
  other: {
    label: 'Other',
    color: '#9a9590',
    icon: '📎',
  },
};

// Entity types with colors and icons
export const ENTITY_TYPES = {
  person: {
    label: 'Person',
    color: '#3b82f6',
    icon: '👤',
  },
  company: {
    label: 'Company',
    color: '#3B82F6',
    icon: '🏢',
  },
  legal: {
    label: 'Legal Entity',
    color: '#a855f7',
    icon: '⚖️',
  },
  location: {
    label: 'Location',
    color: '#22c55e',
    icon: '📍',
  },
  vehicle: {
    label: 'Vehicle',
    color: '#ec4899',
    icon: '🚗',
  },
  account: {
    label: 'Account',
    color: '#10b981',
    icon: '💳',
  },
};

// Generate unique IDs
export const generateId = (prefix = 'node') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default workspace
const createDefaultWorkspace = () => ({
  id: generateId('workspace'),
  name: 'Untitled Investigation',
  nodes: [],
  edges: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Canvas store with Zustand
export const useCanvasStore = create(
  persist(
    (set, get) => ({
      // Current workspace
      workspace: createDefaultWorkspace(),
      
      // History for undo/redo
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,
      
      // UI State
      selectedNodes: [],
      selectedEdges: [],
      clipboard: null,
      
      // Actions
      setWorkspace: (workspace) => set({ workspace }),
      
      // Update specific node data
      updateNodeData: (nodeId, newData) => {
        set((state) => {
          const nodes = state.workspace.nodes.map((node) => 
            node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
          );
          return {
            workspace: { ...state.workspace, nodes, updatedAt: new Date().toISOString() }
          };
        });
      },

      // Update specific node position
      updateNodePosition: (nodeId, position) => {
        set((state) => {
          const nodes = state.workspace.nodes.map((node) => 
            node.id === nodeId ? { ...node, position } : node
          );
          return {
            workspace: { ...state.workspace, nodes, updatedAt: new Date().toISOString() }
          };
        });
      },

      // Remove specific node
      removeNode: (nodeId) => {
        set((state) => {
          const nodes = state.workspace.nodes.filter((node) => node.id !== nodeId);
          const edges = state.workspace.edges.filter((edge) => 
            edge.source !== nodeId && edge.target !== nodeId
          );
          return {
            workspace: { ...state.workspace, nodes, edges, updatedAt: new Date().toISOString() }
          };
        });
      },

      // Save workspace to server
      saveWorkspace: async (data) => {
        try {
          // In real implementation, would call API
          // const response = await api.canvas.saveWorkspace(data);
          
          set((state) => ({
            workspace: {
              ...state.workspace,
              ...data,
              updatedAt: new Date().toISOString(),
            },
          }));
          
          return true;
        } catch (err) {
          console.error('Failed to save workspace:', err);
          throw err;
        }
      },
      
      // Load workspace
      loadWorkspace: () => {
        return get().workspace;
      },
      
      // Add to history
      pushHistory: (state) => {
        set((current) => {
          const newHistory = current.history.slice(0, current.historyIndex + 1);
          newHistory.push({
            nodes: [...state.nodes],
            edges: [...state.edges],
            timestamp: Date.now(),
          });
          
          // Limit history size
          if (newHistory.length > current.maxHistorySize) {
            newHistory.shift();
          }
          
          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },
      
      // Undo
      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            const historyState = state.history[newIndex];
            return {
              historyIndex: newIndex,
              workspace: {
                ...state.workspace,
                nodes: historyState.nodes,
                edges: historyState.edges,
              },
            };
          }
          return state;
        });
      },
      
      // Redo
      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            const historyState = state.history[newIndex];
            return {
              historyIndex: newIndex,
              workspace: {
                ...state.workspace,
                nodes: historyState.nodes,
                edges: historyState.edges,
              },
            };
          }
          return state;
        });
      },
      
      // Copy selected nodes
      copy: (nodes, edges) => {
        set({
          clipboard: {
            nodes: [...nodes],
            edges: [...edges],
            timestamp: Date.now(),
          },
        });
      },
      
      // Paste clipboard
      paste: () => {
        const { clipboard } = get();
        if (!clipboard) return null;
        
        // Generate new IDs for pasted nodes
        const idMap = new Map();
        const newNodes = clipboard.nodes.map((node) => {
          const newId = generateId(node.type);
          idMap.set(node.id, newId);
          return {
            ...node,
            id: newId,
            position: {
              x: node.position.x + 50,
              y: node.position.y + 50,
            },
          };
        });
        
        const newEdges = clipboard.edges
          .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
          .map((edge) => ({
            ...edge,
            id: generateId('edge'),
            source: idMap.get(edge.source),
            target: idMap.get(edge.target),
          }));
        
        return { nodes: newNodes, edges: newEdges };
      },
      
      // Set selected items
      setSelected: (nodes, edges) => {
        set({
          selectedNodes: nodes,
          selectedEdges: edges,
        });
      },
      
      // Clear selection
      clearSelection: () => {
        set({
          selectedNodes: [],
          selectedEdges: [],
        });
      },
      
      // Reset to default
      reset: () => {
        set({
          workspace: createDefaultWorkspace(),
          history: [],
          historyIndex: -1,
          selectedNodes: [],
          selectedEdges: [],
          clipboard: null,
        });
      },
      
      // Export workspace as JSON
      exportWorkspace: () => {
        const { workspace } = get();
        const blob = new Blob([JSON.stringify(workspace, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${workspace.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },
      
      // Import workspace from JSON
      importWorkspace: (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const workspace = JSON.parse(e.target.result);
              set({ workspace });
              resolve(workspace);
            } catch {
              reject(new Error('Invalid workspace file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });
      },
    }),
    {
      name: 'canvas-storage',
      partialize: (state) => ({
        workspace: state.workspace,
        history: [], // Don't persist history
        historyIndex: -1,
      }),
    }
  )
);

// Hook for keyboard shortcuts
export const useCanvasShortcuts = ({
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
  onSave,
  onSelectAll,
}) => {
  const handleKeyDown = (event) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;
    
    if (modifierKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            onRedo?.();
          } else {
            onUndo?.();
          }
          break;
        case 'c':
          event.preventDefault();
          onCopy?.();
          break;
        case 'v':
          event.preventDefault();
          onPaste?.();
          break;
        case 's':
          event.preventDefault();
          onSave?.();
          break;
        case 'a':
          event.preventDefault();
          onSelectAll?.();
          break;
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      onDelete?.();
    }
  };
  
  return { handleKeyDown };
};

// Node layout helpers
export const layoutNodes = {
  // Arrange nodes in a grid
  grid: (nodes, columns = 3, gap = { x: 300, y: 200 }) => {
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % columns) * gap.x,
        y: Math.floor(index / columns) * gap.y,
      },
    }));
  },
  
  // Arrange nodes in a tree
  tree: (nodes, rootId, levelGap = 250, siblingGap = 180) => {
    // Simple tree layout - would need more complex algorithm for real use
    const root = nodes.find((n) => n.id === rootId);
    if (!root) return nodes;
    
    const positionedIds = new Set([rootId]);
    const result = [{ ...root, position: { x: 0, y: 0 } }];
    positionedIds.add(rootId); // Mark root as positioned
    
    // This is a simplified version - real implementation would use a proper tree algorithm
    return result.concat(
      nodes.filter((n) => n.id !== rootId).map((node, i) => ({
        ...node,
        position: {
          x: levelGap,
          y: (i - nodes.length / 2) * siblingGap,
        },
      }))
    );
  },
  
  // Force-directed layout (simplified)
  force: (nodes) => {
    // Would use a force-directed layout library like d3-force
    // This is a placeholder
    return nodes;
  },
};

// Export utilities
export const canvasUtils = {
  // Get connected nodes
  getConnectedNodes: (nodeId, edges, nodes) => {
    const connectedIds = new Set();
    edges.forEach((edge) => {
      if (edge.source === nodeId) connectedIds.add(edge.target);
      if (edge.target === nodeId) connectedIds.add(edge.source);
    });
    return nodes.filter((n) => connectedIds.has(n.id));
  },
  
  // Get node edges
  getNodeEdges: (nodeId, edges) => {
    return edges.filter((e) => e.source === nodeId || e.target === nodeId);
  },
  
  // Find path between nodes
  findPath: (startId, endId, edges) => {
    const graph = new Map();
    edges.forEach((edge) => {
      if (!graph.has(edge.source)) graph.set(edge.source, []);
      if (!graph.has(edge.target)) graph.set(edge.target, []);
      graph.get(edge.source).push(edge.target);
      graph.get(edge.target).push(edge.source);
    });
    
    const visited = new Set();
    const queue = [[startId]];
    
    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];
      
      if (node === endId) return path;
      
      if (!visited.has(node)) {
        visited.add(node);
        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
          queue.push([...path, neighbor]);
        }
      }
    }
    
    return null;
  },
  
  // Calculate node bounds
  getBounds: (nodes) => {
    if (nodes.length === 0) return null;
    
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      center: {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
      },
    };
  },
};

export default useCanvasStore;
