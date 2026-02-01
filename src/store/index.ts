import { configureStore } from '@reduxjs/toolkit';
import { diagramReducer } from './slices/diagramSlice';
import { uiReducer } from './slices/uiSlice';
import { selectionSyncMiddleware } from './middleware/selectionSync';

export const store = configureStore({
  reducer: {
    diagram: diagramReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(selectionSyncMiddleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
