/**
 * Redux slice for managing connections (arrows) in the Causal Loop Diagram
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type {
  Connection,
  ConnectionsState,
  StartDrawingPayload,
  UpdateDrawingPayload,
  FinishDrawingPayload,
  AddConnectionPayload,
} from '../types/connection.types';

const initialState: ConnectionsState = {
  items: {},
  ids: [],
  drawing: null,
  selectedId: null,
};

/**
 * Helper function to check if a connection already exists between two variables
 */
function connectionExists(
  items: Record<string, Connection>,
  sourceId: string,
  targetId: string
): boolean {
  return Object.values(items).some(
    (conn) =>
      (conn.sourceId === sourceId && conn.targetId === targetId) ||
      (conn.sourceId === targetId && conn.targetId === sourceId)
  );
}

export const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    /**
     * Start drawing a new connection from a source variable
     */
    startDrawing: (state, action: PayloadAction<StartDrawingPayload>) => {
      const { sourceId, startPoint } = action.payload;
      state.drawing = {
        isDrawing: true,
        sourceId,
        tempEndPoint: startPoint,
      };
    },

    /**
     * Update the temporary end point while drawing
     */
    updateDrawing: (state, action: PayloadAction<UpdateDrawingPayload>) => {
      if (state.drawing) {
        state.drawing.tempEndPoint = action.payload.tempEndPoint;
      }
    },

    /**
     * Finish drawing and create a connection to the target variable
     */
    finishDrawing: (state, action: PayloadAction<FinishDrawingPayload>) => {
      if (state.drawing) {
        const { targetId } = action.payload;
        const { sourceId } = state.drawing;

        // Don't create connection to self and check if not exists
        if (sourceId !== targetId && !connectionExists(state.items, sourceId, targetId)) {
          const id = nanoid();
          state.items[id] = {
            id,
            sourceId,
            targetId,
          };
          state.ids.push(id);
        }
      }
      state.drawing = null;
    },

    /**
     * Cancel the current drawing operation
     */
    cancelDrawing: (state) => {
      state.drawing = null;
    },

    /**
     * Add a connection directly (without drawing)
     */
    addConnection: (state, action: PayloadAction<AddConnectionPayload>) => {
      const { sourceId, targetId } = action.payload;

      // Don't create connection to self and check if not exists
      if (sourceId !== targetId && !connectionExists(state.items, sourceId, targetId)) {
        const id = nanoid();
        state.items[id] = {
          id,
          sourceId,
          targetId,
        };
        state.ids.push(id);
      }
    },

    /**
     * Remove a connection
     */
    removeConnection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.items[id];
      state.ids = state.ids.filter((connId) => connId !== id);

      if (state.selectedId === id) {
        state.selectedId = null;
      }
    },

    /**
     * Remove all connections involving a specific variable
     * (Used when a variable is deleted)
     */
    removeConnectionsByVariableId: (state, action: PayloadAction<string>) => {
      const variableId = action.payload;
      const connectionsToRemove = Object.values(state.items)
        .filter(
          (conn) =>
            conn.sourceId === variableId || conn.targetId === variableId
        )
        .map((conn) => conn.id);

      connectionsToRemove.forEach((connId) => {
        delete state.items[connId];
      });
      state.ids = state.ids.filter((id) => !connectionsToRemove.includes(id));

      if (state.selectedId && connectionsToRemove.includes(state.selectedId)) {
        state.selectedId = null;
      }
    },

    /**
     * Select a connection (for future use with editing)
     */
    selectConnection: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
  },
  selectors: {
    /**
     * Select all connections as a record
     */
    selectConnectionsMap: (state) => state.items,

    /**
     * Select all connection IDs
     */
    selectConnectionIds: (state) => state.ids,

    /**
     * Select the drawing state
     */
    selectDrawingState: (state) => state.drawing,

    /**
     * Select whether currently drawing
     */
    selectIsDrawing: (state) => state.drawing?.isDrawing ?? false,

    /**
     * Select the source ID being drawn from
     */
    selectDrawingSourceId: (state) => state.drawing?.sourceId ?? null,

    /**
     * Select the temporary end point while drawing
     */
    selectDrawingTempEndPoint: (state) => state.drawing?.tempEndPoint ?? null,

    /**
     * Select currently selected connection ID
     */
    selectSelectedConnectionId: (state) => state.selectedId,

    /**
     * Select a connection by ID (memoized)
     */
    selectConnectionById: createSelector(
      (state: ConnectionsState) => state.items,
      (_state: ConnectionsState, id: string) => id,
      (items, id): Connection | undefined => items[id]
    ),

    /**
     * Select all connections as an array (memoized)
     */
    selectAllConnections: createSelector(
      (state: ConnectionsState) => state.items,
      (state: ConnectionsState) => state.ids,
      (items, ids): Connection[] => ids.map((id) => items[id]).filter(Boolean)
    ),

    /**
     * Select connections by variable ID (memoized)
     */
    selectConnectionsByVariableId: createSelector(
      (state: ConnectionsState) => state.items,
      (_state: ConnectionsState, variableId: string) => variableId,
      (items, variableId): Connection[] =>
        Object.values(items).filter(
          (conn) => conn.sourceId === variableId || conn.targetId === variableId
        )
    ),

    /**
     * Select connection count
     */
    selectConnectionCount: (state) => state.ids.length,
  },
});

export const {
  startDrawing,
  updateDrawing,
  finishDrawing,
  cancelDrawing,
  addConnection,
  removeConnection,
  removeConnectionsByVariableId,
  selectConnection,
} = connectionsSlice.actions;

export const {
  selectConnectionsMap,
  selectConnectionIds,
  selectDrawingState,
  selectIsDrawing,
  selectDrawingSourceId,
  selectDrawingTempEndPoint,
  selectSelectedConnectionId,
  selectConnectionById,
  selectAllConnections,
  selectConnectionsByVariableId,
  selectConnectionCount,
} = connectionsSlice.selectors;

export default connectionsSlice.reducer;
