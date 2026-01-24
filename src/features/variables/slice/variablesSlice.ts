/**
 * Redux slice for managing variables in the Causal Loop Diagram
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type {
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
});

export const {
  addVariable,
  moveVariable,
  removeVariable,
  updateVariableName,
  selectVariable,
} = variablesSlice.actions;

export default variablesSlice.reducer;
