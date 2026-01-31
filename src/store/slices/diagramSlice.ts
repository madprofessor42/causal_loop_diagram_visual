import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeChange, EdgeChange } from '@xyflow/react';
import type { CLDNode, CLDEdge, BaseNodeData, BaseEdgeData } from '../../types';

interface DiagramState {
  nodes: CLDNode[];
  edges: CLDEdge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
}

const initialState: DiagramState = {
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
};

/**
 * Find existing edge between two nodes (in either direction)
 */
function findExistingEdge(edges: CLDEdge[], source: string, target: string, type: string) {
  // Find reverse edge (target -> source with same type)
  return edges.find(
    e => e.source === target && e.target === source && e.type === type
  );
}

export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    // Node operations
    addNode: (state, action: PayloadAction<CLDNode>) => {
      state.nodes.push(action.payload);
    },
    updateNodeData: (state, action: PayloadAction<{ id: string; data: Partial<BaseNodeData> }>) => {
      const node = state.nodes.find(n => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, ...action.payload.data };
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter(n => n.id !== action.payload);
      // Also remove connected edges
      state.edges = state.edges.filter(
        e => e.source !== action.payload && e.target !== action.payload
      );
    },
    
    // Edge operations
    addEdge: (state, action: PayloadAction<CLDEdge>) => {
      const newEdge = action.payload;
      
      // Flow edges with cloud targets can have multiple edges from same source
      // (they use targetPosition for actual endpoint, target is just self-reference)
      const isCloudEdge = newEdge.data?.targetIsCloud || newEdge.data?.sourceIsCloud;
      
      if (!isCloudEdge) {
        // Check for existing edge in same direction
        const existingSameDirection = state.edges.find(
          e => e.source === newEdge.source && e.target === newEdge.target && e.type === newEdge.type
        );
        
        if (existingSameDirection) {
          // Edge already exists in same direction, don't add duplicate
          return;
        }
        
        // Check for existing edge in reverse direction (to make bidirectional)
        const existingReverse = findExistingEdge(
          state.edges,
          newEdge.source,
          newEdge.target,
          newEdge.type ?? 'link'
        );
        
        if (existingReverse) {
          // Make the existing edge bidirectional instead of creating a new one
          existingReverse.data = {
            ...existingReverse.data,
            bidirectional: true,
          };
          return;
        }
      }
      
      // Add the new edge
      state.edges.push(newEdge);
    },
    updateEdgeData: (state, action: PayloadAction<{ id: string; data: Partial<BaseEdgeData> }>) => {
      const edge = state.edges.find(e => e.id === action.payload.id);
      if (edge) {
        edge.data = { ...edge.data, ...action.payload.data };
      }
    },
    removeEdge: (state, action: PayloadAction<string>) => {
      state.edges = state.edges.filter(e => e.id !== action.payload);
    },
    
    // Reverse edge direction (swap source and target)
    reverseEdgeDirection: (state, action: PayloadAction<string>) => {
      const edgeIndex = state.edges.findIndex(e => e.id === action.payload);
      if (edgeIndex === -1) return;
      
      const edge = state.edges[edgeIndex];
      
      // Create a new edge with swapped source/target
      const reversedData: Record<string, unknown> = { ...edge.data };
      
      // Swap cloud-related data if present
      if (reversedData.sourceIsCloud !== undefined || reversedData.targetIsCloud !== undefined) {
        const tempIsCloud = reversedData.sourceIsCloud;
        reversedData.sourceIsCloud = reversedData.targetIsCloud;
        reversedData.targetIsCloud = tempIsCloud;
      }
      
      if (reversedData.sourcePosition !== undefined || reversedData.targetPosition !== undefined) {
        const tempPosition = reversedData.sourcePosition;
        reversedData.sourcePosition = reversedData.targetPosition;
        reversedData.targetPosition = tempPosition;
      }
      
      // Create new reversed edge
      const reversedEdge: CLDEdge = {
        ...edge,
        source: edge.target,
        target: edge.source,
        // DON'T swap handles - they should stay as 'source' and 'target'
        // because those are the fixed handle IDs on the nodes
        sourceHandle: edge.sourceHandle || 'source',
        targetHandle: edge.targetHandle || 'target',
        data: reversedData as typeof edge.data,
      };
      
      // Replace the edge
      state.edges[edgeIndex] = reversedEdge;
    },
    
    // React Flow change adapters
    onNodesChange: (state, action: PayloadAction<NodeChange<CLDNode>[]>) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes) as CLDNode[];
    },
    onEdgesChange: (state, action: PayloadAction<EdgeChange<CLDEdge>[]>) => {
      state.edges = applyEdgeChanges(action.payload, state.edges) as CLDEdge[];
    },
    
    // Selection
    setSelection: (state, action: PayloadAction<{ nodeIds: string[]; edgeIds: string[] }>) => {
      state.selectedNodeIds = action.payload.nodeIds;
      state.selectedEdgeIds = action.payload.edgeIds;
    },
    
    // Bulk operations
    setNodes: (state, action: PayloadAction<CLDNode[]>) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action: PayloadAction<CLDEdge[]>) => {
      state.edges = action.payload;
    },
    clearDiagram: (state) => {
      state.nodes = [];
      state.edges = [];
      state.selectedNodeIds = [];
      state.selectedEdgeIds = [];
    },
  },
});

export const diagramActions = diagramSlice.actions;
export const diagramReducer = diagramSlice.reducer;

// Selectors
export const selectNodes = (state: { diagram: DiagramState }) => state.diagram.nodes;
export const selectEdges = (state: { diagram: DiagramState }) => state.diagram.edges;
export const selectSelectedNodeIds = (state: { diagram: DiagramState }) => state.diagram.selectedNodeIds;
export const selectSelectedEdgeIds = (state: { diagram: DiagramState }) => state.diagram.selectedEdgeIds;
