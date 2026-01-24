/**
 * Variables feature exports
 */

// Components
export { Variable } from './components/Variable';

// Hooks
export { useVariableEditor } from './hooks';

// Slice and actions
export {
  default as variablesReducer,
  addVariable,
  moveVariable,
  removeVariable,
  updateVariableName,
  selectVariable,
} from './slice/variablesSlice';

// Selectors
export {
  selectVariablesMap,
  selectVariableIds,
  selectSelectedVariableId,
  selectVariableById,
  selectSelectedVariable,
  selectAllVariables,
  selectVariableCount,
} from './slice/variablesSlice';

// Types
export type {
  Variable as VariableType,
  VariablesState,
  AddVariablePayload,
  MoveVariablePayload,
  UpdateVariableNamePayload,
} from './types/variable.types';

export { DEFAULT_VARIABLE_RADIUS } from './types/variable.types';
