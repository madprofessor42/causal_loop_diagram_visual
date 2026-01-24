/**
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import variablesReducer from '../features/variables/slice/variablesSlice';
import connectionsReducer from '../features/connections/slice/connectionsSlice';

export const store = configureStore({
  reducer: {
    variables: variablesReducer,
    connections: connectionsReducer,
  },
  devTools: import.meta.env.DEV,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
