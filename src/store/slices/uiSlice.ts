import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NodeVariant, EdgeVariant } from '../../types';

export type EditingMode = 'select' | 'pan';
export type SidebarPanel = 'properties' | 'nodes' | 'settings' | null;

interface DragState {
  isDragging: boolean;
  nodeType: NodeVariant | null;
  ghostPosition: { x: number; y: number } | null;
}

interface UIState {
  editingMode: EditingMode;
  sidebarPanel: SidebarPanel;
  showMinimap: boolean;
  showGrid: boolean;
  drag: DragState;
  /** Current connection mode - determines what type of edge is created */
  connectionMode: EdgeVariant;
  /** Currently selected edge ID for editing in sidebar */
  selectedEdgeId: string | null;
  /** Currently selected node ID for editing in sidebar */
  selectedNodeId: string | null;
  /** Sidebar width in pixels */
  sidebarWidth: number;
  /** Highlighted nodes and edges when hovering over a loop in sidebar */
  highlightedLoop: {
    nodeIds: string[];
    edgeIds: string[];
  } | null;
}

const initialState: UIState = {
  editingMode: 'select',
  sidebarPanel: null,
  showMinimap: true,
  showGrid: true,
  drag: {
    isDragging: false,
    nodeType: null,
    ghostPosition: null,
  },
  connectionMode: 'link',
  selectedEdgeId: null,
  selectedNodeId: null,
  sidebarWidth: 280, // Default width in pixels
  highlightedLoop: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setEditingMode: (state, action: PayloadAction<EditingMode>) => {
      state.editingMode = action.payload;
    },
    setSidebarPanel: (state, action: PayloadAction<SidebarPanel>) => {
      state.sidebarPanel = action.payload;
    },
    toggleMinimap: (state) => {
      state.showMinimap = !state.showMinimap;
    },
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },
    // Drag and drop actions
    setDragStart: (state, action: PayloadAction<NodeVariant>) => {
      state.drag.isDragging = true;
      state.drag.nodeType = action.payload;
      state.drag.ghostPosition = null;
    },
    setGhostPosition: (state, action: PayloadAction<{ x: number; y: number } | null>) => {
      state.drag.ghostPosition = action.payload;
    },
    setDragEnd: (state) => {
      state.drag.isDragging = false;
      state.drag.nodeType = null;
      state.drag.ghostPosition = null;
    },
    // Connection mode actions
    setConnectionMode: (state, action: PayloadAction<EdgeVariant>) => {
      state.connectionMode = action.payload;
    },
    toggleConnectionMode: (state) => {
      state.connectionMode = state.connectionMode === 'link' ? 'flow' : 'link';
    },
    // Edge selection for sidebar editing
    setSelectedEdge: (state, action: PayloadAction<string | null>) => {
      state.selectedEdgeId = action.payload;
      // Clear node selection when edge is selected
      if (action.payload) {
        state.selectedNodeId = null;
      }
    },
    clearSelectedEdge: (state) => {
      state.selectedEdgeId = null;
    },
    // Node selection for sidebar editing
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
      // Clear edge selection when node is selected
      if (action.payload) {
        state.selectedEdgeId = null;
      }
    },
    clearSelectedNode: (state) => {
      state.selectedNodeId = null;
    },
    // Sidebar resize
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      // Clamp width between 200 and 600 pixels
      state.sidebarWidth = Math.max(200, Math.min(600, action.payload));
    },
    // Loop highlighting
    setHighlightedLoop: (state, action: PayloadAction<{ nodeIds: string[]; edgeIds: string[] } | null>) => {
      state.highlightedLoop = action.payload;
    },
    clearHighlightedLoop: (state) => {
      state.highlightedLoop = null;
    },
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

// Selectors
export const selectEditingMode = (state: { ui: UIState }) => state.ui.editingMode;
export const selectSidebarPanel = (state: { ui: UIState }) => state.ui.sidebarPanel;
export const selectShowMinimap = (state: { ui: UIState }) => state.ui.showMinimap;
export const selectShowGrid = (state: { ui: UIState }) => state.ui.showGrid;
export const selectDragState = (state: { ui: UIState }) => state.ui.drag;
export const selectIsDragging = (state: { ui: UIState }) => state.ui.drag.isDragging;
export const selectGhostPosition = (state: { ui: UIState }) => state.ui.drag.ghostPosition;
export const selectDragNodeType = (state: { ui: UIState }) => state.ui.drag.nodeType;
export const selectConnectionMode = (state: { ui: UIState }) => state.ui.connectionMode;
export const selectSelectedEdgeId = (state: { ui: UIState }) => state.ui.selectedEdgeId;
export const selectSelectedNodeId = (state: { ui: UIState }) => state.ui.selectedNodeId;
export const selectSidebarWidth = (state: { ui: UIState }) => state.ui.sidebarWidth;
export const selectHighlightedLoop = (state: { ui: UIState }) => state.ui.highlightedLoop;
