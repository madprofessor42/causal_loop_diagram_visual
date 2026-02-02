import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeChange, EdgeChange } from '@xyflow/react';
import type { CLDNode, CLDEdge, BaseNodeData, BaseEdgeData, LinkEdgeData } from '../../types';

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
 * Find existing link between node/flow endpoints
 */
function findExistingFlowLink(
  edges: CLDEdge[],
  sourceFlowId: string | undefined,
  sourceNodeId: string | undefined,
  targetFlowId: string | undefined,
  targetNodeId: string | undefined
): CLDEdge | undefined {
  return edges.find(e => {
    if (e.type !== 'link') return false;
    const data = e.data as LinkEdgeData | undefined;
    
    // Check source match
    const edgeSourceFlow = data?.sourceIsFlowEdge ? data.sourceFlowEdgeId : undefined;
    const edgeSourceNode = data?.sourceIsFlowEdge ? undefined : e.source;
    if (sourceFlowId !== edgeSourceFlow) return false;
    if (sourceNodeId !== edgeSourceNode) return false;
    
    // Check target match
    const edgeTargetFlow = data?.targetIsFlowEdge ? data.targetFlowEdgeId : undefined;
    const edgeTargetNode = data?.targetIsFlowEdge ? undefined : e.target;
    if (targetFlowId !== edgeTargetFlow) return false;
    if (targetNodeId !== edgeTargetNode) return false;
    
    return true;
  });
}

/**
 * Find reverse link (swap source and target)
 */
function findReverseFlowLink(
  edges: CLDEdge[],
  sourceFlowId: string | undefined,
  sourceNodeId: string | undefined,
  targetFlowId: string | undefined,
  targetNodeId: string | undefined
): CLDEdge | undefined {
  // Swap source and target
  return findExistingFlowLink(edges, targetFlowId, targetNodeId, sourceFlowId, sourceNodeId);
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
      const nodeId = action.payload;
      state.nodes = state.nodes.filter(n => n.id !== nodeId);
      // Also remove connected edges
      state.edges = state.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      // Clear selection if this node was selected
      state.selectedNodeIds = state.selectedNodeIds.filter(id => id !== nodeId);
    },
    
    // Edge operations
    addEdge: (state, action: PayloadAction<CLDEdge>) => {
      const newEdge = action.payload;
      const newLinkData = newEdge.data as LinkEdgeData | undefined;
      
      // Check if this is a Link involving Flow edges
      const isLinkToFlow = newEdge.type === 'link' && newLinkData?.targetIsFlowEdge;
      const isLinkFromFlow = newEdge.type === 'link' && newLinkData?.sourceIsFlowEdge;
      const isFlowLink = isLinkToFlow || isLinkFromFlow;
      
      // Flow edges (material flow) with cloud targets
      const isCloudEdge = newEdge.data?.targetIsCloud || newEdge.data?.sourceIsCloud;
      
      // Prevent self-connections for regular node-to-node edges
      // Skip this check for:
      // - Flow links (use self-loop pattern internally)
      // - Cloud edges (also use self-loop pattern)
      if (!isFlowLink && !isCloudEdge && newEdge.source === newEdge.target) {
        return;
      }
      
      if (isFlowLink) {
        // Extract flow/node IDs
        const sourceFlowId = isLinkFromFlow ? newLinkData?.sourceFlowEdgeId : undefined;
        const sourceNodeId = isLinkFromFlow ? undefined : newEdge.source;
        const targetFlowId = isLinkToFlow ? newLinkData?.targetFlowEdgeId : undefined;
        const targetNodeId = isLinkToFlow ? undefined : newEdge.target;
        
        // Check for existing link in same direction
        const existingSame = findExistingFlowLink(state.edges, sourceFlowId, sourceNodeId, targetFlowId, targetNodeId);
        if (existingSame) {
          return; // Duplicate - don't add
        }
        
        // Check for reverse link - make bidirectional if exists
        const existingReverse = findReverseFlowLink(state.edges, sourceFlowId, sourceNodeId, targetFlowId, targetNodeId);
        if (existingReverse) {
          existingReverse.data = {
            ...existingReverse.data,
            bidirectional: true,
          };
          return;
        }
        
        // Add the new edge
        state.edges.push(newEdge);
        return;
      }
      
      // Standard node-to-node edge handling
      if (!isCloudEdge) {
        // Check for existing edge in same direction
        const existingSameDirection = state.edges.find(
          e => e.source === newEdge.source && e.target === newEdge.target && e.type === newEdge.type
        );
        
        if (existingSameDirection) {
          return; // Duplicate
        }
        
        // Check for reverse edge - make bidirectional
        const existingReverse = state.edges.find(
          e => e.source === newEdge.target && e.target === newEdge.source && e.type === newEdge.type
        );
        
        if (existingReverse) {
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
      const edgeId = action.payload;
      const edgeToRemove = state.edges.find(e => e.id === edgeId);
      
      // If removing a Flow edge, also remove any Links that connect to/from this Flow
      if (edgeToRemove?.type === 'flow') {
        state.edges = state.edges.filter(e => {
          if (e.id === edgeId) return false;
          // Remove Links that target or originate from this Flow edge
          if (e.type === 'link') {
            const linkData = e.data as LinkEdgeData;
            if (linkData?.targetIsFlowEdge && linkData?.targetFlowEdgeId === edgeId) {
              return false;
            }
            if (linkData?.sourceIsFlowEdge && linkData?.sourceFlowEdgeId === edgeId) {
              return false;
            }
          }
          return true;
        });
      } else {
        state.edges = state.edges.filter(e => e.id !== edgeId);
      }
      
      // Clear selection if this edge was selected
      state.selectedEdgeIds = state.selectedEdgeIds.filter(id => id !== edgeId);
    },
    
    // Reverse edge direction (swap source and target, or toggle reversed flag for Links to/from Flow)
    reverseEdgeDirection: (state, action: PayloadAction<string>) => {
      const edgeIndex = state.edges.findIndex(e => e.id === action.payload);
      if (edgeIndex === -1) return;
      
      const edge = state.edges[edgeIndex];
      
      // Special handling for Links that connect to/from Flow edges
      // These use a self-loop structure, so we toggle a "reversed" flag instead
      if (edge.type === 'link') {
        const linkData = edge.data as LinkEdgeData | undefined;
        if (linkData?.targetIsFlowEdge || linkData?.sourceIsFlowEdge) {
          // Toggle the reversed flag
          edge.data = {
            ...edge.data,
            reversed: !linkData?.reversed,
          };
          return;
        }
      }
      
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
      // Check for removed nodes to clear selection
      const removedNodeIds = action.payload
        .filter(change => change.type === 'remove')
        .map(change => change.id);
      
      state.nodes = applyNodeChanges(action.payload, state.nodes) as CLDNode[];
      
      // Clear selection for removed nodes
      if (removedNodeIds.length > 0) {
        state.selectedNodeIds = state.selectedNodeIds.filter(
          id => !removedNodeIds.includes(id)
        );
      }
    },
    onEdgesChange: (state, action: PayloadAction<EdgeChange<CLDEdge>[]>) => {
      // Check for removed edges to clear selection and cascade delete Links to Flow
      const removedEdgeIds = action.payload
        .filter(change => change.type === 'remove')
        .map(change => change.id);
      
      // Find Flow edges being removed (to cascade delete their connected Links)
      const removedFlowEdgeIds = removedEdgeIds.filter(id => {
        const edge = state.edges.find(e => e.id === id);
        return edge?.type === 'flow';
      });
      
      state.edges = applyEdgeChanges(action.payload, state.edges) as CLDEdge[];
      
      // Cascade: remove Links connected to removed Flow edges
      if (removedFlowEdgeIds.length > 0) {
        state.edges = state.edges.filter(e => {
          if (e.type === 'link') {
            const linkData = e.data as LinkEdgeData;
            // Check if link targets a removed flow
            if (linkData?.targetIsFlowEdge && linkData?.targetFlowEdgeId) {
              if (removedFlowEdgeIds.includes(linkData.targetFlowEdgeId)) return false;
            }
            // Check if link originates from a removed flow
            if (linkData?.sourceIsFlowEdge && linkData?.sourceFlowEdgeId) {
              if (removedFlowEdgeIds.includes(linkData.sourceFlowEdgeId)) return false;
            }
          }
          return true;
        });
      }
      
      // Clear selection for removed edges
      if (removedEdgeIds.length > 0) {
        state.selectedEdgeIds = state.selectedEdgeIds.filter(
          id => !removedEdgeIds.includes(id)
        );
      }
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
