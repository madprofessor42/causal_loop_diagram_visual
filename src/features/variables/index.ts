/**
 * Variables feature exports
 */

// Components
export { Variable } from './components/Variable';

// Slice and actions
export {
  default as variablesReducer,
  addVariable,
  moveVariable,
  removeVariable,
  updateVariableName,
  selectVariable,
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
