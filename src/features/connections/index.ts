/**
 * Connections feature exports
 */

// Components
export { Connection, DrawingConnection } from './components/Connection';
export { ConnectionsLayer } from './components/ConnectionsLayer';

// Hooks
export { useConnectionDrawing } from './hooks';

// Slice and actions
export {
  default as connectionsReducer,
  startDrawing,
  updateDrawing,
  finishDrawing,
  cancelDrawing,
  addConnection,
  removeConnection,
  removeConnectionsByVariableId,
  selectConnection,
} from './slice/connectionsSlice';

// Selectors
export {
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
} from './slice/connectionsSlice';

// Utils
export { calculatePath, calculateDrawingPath } from './utils/pathCalculations';

// Types
export type {
  Connection as ConnectionType,
  ConnectionsState,
  DrawingState,
  StartDrawingPayload,
  UpdateDrawingPayload,
  FinishDrawingPayload,
  AddConnectionPayload,
} from './types/connection.types';

export { CONNECTION_GAP, ARROW_HEAD_SIZE } from './types/connection.types';
