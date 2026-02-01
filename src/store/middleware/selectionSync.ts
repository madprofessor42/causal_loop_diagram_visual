import type { Middleware } from '@reduxjs/toolkit';
import { uiActions } from '../slices/uiSlice';

interface DiagramState {
  nodes: Array<{ id: string }>;
  edges: Array<{ id: string }>;
}

interface UIState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}

interface RootState {
  diagram: DiagramState;
  ui: UIState;
}

/**
 * Middleware to sync UI selection state with diagram state.
 * When nodes or edges are removed, clear the corresponding selection in UI.
 */
export const selectionSyncMiddleware: Middleware<object, RootState> = 
  (store) => (next) => (action) => {
    const result = next(action);
    
    // After the action is processed, check if we need to clear UI selection
    const state = store.getState();
    
    // Check if selected node still exists
    if (state.ui.selectedNodeId) {
      const nodeExists = state.diagram.nodes.some((n) => n.id === state.ui.selectedNodeId);
      if (!nodeExists) {
        store.dispatch(uiActions.clearSelectedNode());
      }
    }
    
    // Check if selected edge still exists
    if (state.ui.selectedEdgeId) {
      const edgeExists = state.diagram.edges.some((e) => e.id === state.ui.selectedEdgeId);
      if (!edgeExists) {
        store.dispatch(uiActions.clearSelectedEdge());
      }
    }
    
    return result;
  };

