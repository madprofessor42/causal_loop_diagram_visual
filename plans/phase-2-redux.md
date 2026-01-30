# Phase 2: Redux Store Setup

## Goal
Set up Redux Toolkit store with slices for diagram state and UI state. Integrate with React Flow while maintaining current functionality.

## Prerequisites
- Phase 1 completed (constants and types in place)

## Deliverables

### 1. Store Configuration

#### `src/store/index.ts`
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { diagramReducer } from './slices/diagramSlice';
import { uiReducer } from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    diagram: diagramReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### `src/store/hooks.ts`
```typescript
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 2. Diagram Slice

#### `src/store/slices/diagramSlice.ts`
```typescript
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
    
    // React Flow adapters
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
```

### 3. UI Slice

#### `src/store/slices/uiSlice.ts`
```typescript
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
```

### 4. Slice Index

#### `src/store/slices/index.ts`
```typescript
export * from './diagramSlice';
export * from './uiSlice';
```

### 5. Update main.tsx

#### `src/main.tsx`
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
```

## Tasks

- [ ] Create `src/store/slices/` directory
- [ ] Create `src/store/slices/diagramSlice.ts`
- [ ] Create `src/store/slices/uiSlice.ts`
- [ ] Create `src/store/slices/index.ts`
- [ ] Create `src/store/hooks.ts` with typed hooks
- [ ] Create `src/store/index.ts` with store configuration
- [ ] Update `src/main.tsx` to wrap app with Provider
- [ ] Run `npm run typecheck` to verify no type errors

## Files to Create
- `src/store/index.ts`
- `src/store/hooks.ts`
- `src/store/slices/diagramSlice.ts`
- `src/store/slices/uiSlice.ts`
- `src/store/slices/index.ts`

## Files to Modify
- `src/main.tsx` - add Redux Provider

## Verification
1. Run `npm run typecheck` - should pass with no errors
2. Run `npm run dev` - app should work as before
3. Install Redux DevTools browser extension and verify store is accessible
4. Verify initial state is correct in Redux DevTools

## Notes
- This phase sets up Redux but does NOT yet integrate it with App.tsx
- App.tsx will still use React Flow hooks internally
- Integration with App.tsx happens in Phase 4
- UI slice is minimal for now - can be extended later
