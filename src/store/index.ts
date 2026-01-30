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
