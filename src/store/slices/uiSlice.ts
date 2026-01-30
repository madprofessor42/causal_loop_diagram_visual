import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NodeVariant } from '../../types';

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
