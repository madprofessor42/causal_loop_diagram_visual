/**
 * Types for Connection feature
 */

import type { Position } from '../../../types/common.types';

/**
 * Represents a connection (arrow) between two variables
 */
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

/**
 * State for tracking the active connection drawing
 */
export interface DrawingState {
  /** Whether currently drawing a connection */
  isDrawing: boolean;
  /** ID of the source variable */
  sourceId: string;
  /** Temporary end point while drawing */
  tempEndPoint: Position;
}

/**
 * State shape for connections slice
 */
export interface ConnectionsState {
  /** Map of connection ID to connection data */
  items: Record<string, Connection>;
  /** Ordered list of connection IDs */
  ids: string[];
  /** Current drawing state (null when not drawing) */
  drawing: DrawingState | null;
  /** Currently selected connection ID (for future use) */
  selectedId: string | null;
}

/**
 * Payload for starting a connection drawing
 */
export interface StartDrawingPayload {
  sourceId: string;
  startPoint: Position;
}

/**
 * Payload for updating the drawing endpoint
 */
export interface UpdateDrawingPayload {
  tempEndPoint: Position;
}

/**
 * Payload for finishing a connection
 */
export interface FinishDrawingPayload {
  targetId: string;
}

/**
 * Payload for adding a connection directly
 */
export interface AddConnectionPayload {
  sourceId: string;
  targetId: string;
}

/**
 * Gap in pixels before the target circle
 */
export const CONNECTION_GAP = 15;

/**
 * Arrow head size
 */
export const ARROW_HEAD_SIZE = 10;
