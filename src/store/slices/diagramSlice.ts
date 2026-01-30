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
      state.edges.push(action.payload);
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
