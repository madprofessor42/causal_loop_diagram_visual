/**
 * Types for Variable feature
 */

import type { Position } from '../../../types/common.types';

/**
 * Represents a variable node in the Causal Loop Diagram
 */
export interface Variable {
  id: string;
  name: string;
  position: Position;
  radius: number;
}

/**
 * State shape for variables slice
 */
export interface VariablesState {
  /** Map of variable ID to variable data */
  items: Record<string, Variable>;
  /** Ordered list of variable IDs */
  ids: string[];
  /** Currently selected variable ID (for future use) */
  selectedId: string | null;
}

/**
 * Payload for adding a new variable
 */
export interface AddVariablePayload {
  name: string;
  position: Position;
  radius?: number;
}

/**
 * Payload for moving a variable
 */
export interface MoveVariablePayload {
  id: string;
  position: Position;
}

/**
 * Payload for updating variable name
 */
export interface UpdateVariableNamePayload {
  id: string;
  name: string;
}

/**
 * Default variable radius
 */
export const DEFAULT_VARIABLE_RADIUS = 40;
