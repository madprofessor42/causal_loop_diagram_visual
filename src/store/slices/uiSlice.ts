import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type EditingMode = 'select' | 'pan';
export type SidebarPanel = 'properties' | 'nodes' | 'settings' | null;

interface UIState {
  editingMode: EditingMode;
  sidebarPanel: SidebarPanel;
  showMinimap: boolean;
  showGrid: boolean;
}

const initialState: UIState = {
  editingMode: 'select',
  sidebarPanel: null,
  showMinimap: true,
  showGrid: true,
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
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

// Selectors
export const selectEditingMode = (state: { ui: UIState }) => state.ui.editingMode;
export const selectSidebarPanel = (state: { ui: UIState }) => state.ui.sidebarPanel;
export const selectShowMinimap = (state: { ui: UIState }) => state.ui.showMinimap;
export const selectShowGrid = (state: { ui: UIState }) => state.ui.showGrid;
