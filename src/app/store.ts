/**
 * Redux store configuration
 * Note: React Flow manages diagram state internally via hooks.
 * This store can be used for additional app state if needed.
 */

import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // React Flow handles nodes/edges state internally
    // Add other app-level reducers here if needed
  },
  devTools: import.meta.env.DEV,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
