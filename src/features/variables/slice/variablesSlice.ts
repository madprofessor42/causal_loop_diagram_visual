/**
 * Redux slice for managing variables in the Causal Loop Diagram
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type {
  Variable,
  VariablesState,
  AddVariablePayload,
  MoveVariablePayload,
  UpdateVariableNamePayload,
} from '../types/variable.types';
import { DEFAULT_VARIABLE_RADIUS } from '../types/variable.types';

const initialState: VariablesState = {
  items: {},
  ids: [],
  selectedId: null,
};

export const variablesSlice = createSlice({
  name: 'variables',
  initialState,
  reducers: {
    /**
     * Add a new variable to the diagram
     */
    addVariable: (state, action: PayloadAction<AddVariablePayload>) => {
      const id = nanoid();
      const { name, position, radius = DEFAULT_VARIABLE_RADIUS } = action.payload;
      
      state.items[id] = {
        id,
        name,
        position,
        radius,
      };
      state.ids.push(id);
    },

    /**
     * Move a variable to a new position
     */
    moveVariable: (state, action: PayloadAction<MoveVariablePayload>) => {
      const { id, position } = action.payload;
      const variable = state.items[id];
      
      if (variable) {
        variable.position = position;
      }
    },

    /**
     * Remove a variable from the diagram
     */
    removeVariable: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.items[id];
      state.ids = state.ids.filter((varId) => varId !== id);
      
      if (state.selectedId === id) {
        state.selectedId = null;
      }
    },

    /**
     * Update a variable's name
     */
    updateVariableName: (state, action: PayloadAction<UpdateVariableNamePayload>) => {
      const { id, name } = action.payload;
      const variable = state.items[id];
      
      if (variable) {
        variable.name = name;
      }
    },

    /**
     * Select a variable (for future use with editing)
     */
    selectVariable: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
  },
  selectors: {
    /**
     * Select all variables as a record
     */
    selectVariablesMap: (state) => state.items,

    /**
     * Select all variable IDs
     */
    selectVariableIds: (state) => state.ids,

    /**
     * Select currently selected variable ID
     */
    selectSelectedVariableId: (state) => state.selectedId,

    /**
     * Select a variable by ID (memoized)
     */
    selectVariableById: createSelector(
      (state: VariablesState) => state.items,
      (_state: VariablesState, id: string) => id,
      (items, id): Variable | undefined => items[id]
    ),

    /**
     * Select the currently selected variable (memoized)
     */
    selectSelectedVariable: createSelector(
      (state: VariablesState) => state.items,
      (state: VariablesState) => state.selectedId,
      (items, selectedId): Variable | null =>
        selectedId ? items[selectedId] ?? null : null
    ),

    /**
     * Select all variables as an array (memoized)
     */
    selectAllVariables: createSelector(
      (state: VariablesState) => state.items,
      (state: VariablesState) => state.ids,
      (items, ids): Variable[] => ids.map((id) => items[id]).filter(Boolean)
    ),

    /**
     * Select variable count
     */
    selectVariableCount: (state) => state.ids.length,
  },
});

export const {
  addVariable,
  moveVariable,
  removeVariable,
  updateVariableName,
  selectVariable,
} = variablesSlice.actions;

export const {
  selectVariablesMap,
  selectVariableIds,
  selectSelectedVariableId,
  selectVariableById,
  selectSelectedVariable,
  selectAllVariables,
  selectVariableCount,
} = variablesSlice.selectors;

export default variablesSlice.reducer;
