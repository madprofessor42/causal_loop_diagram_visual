/**
 * Common types used across the Causal Loop Diagram application
 */

/**
 * Represents a 2D position coordinate
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Represents a size dimension
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Represents a bounding rectangle
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
