/**
 * Utility functions for calculating connection paths
 */

import type { Position } from '../../../types/common.types';
import type { Variable } from '../../variables/types/variable.types';
import { calculateConnectionPoints, generateArrowPath, calculateArrowhead } from '../../../utils/geometry';
import { CONNECTION_GAP, ARROW_HEAD_SIZE } from '../types/connection.types';

/**
 * Result of path calculation
 */
export interface PathResult {
  path: string;
  arrowhead: {
    points: string;
  };
  startPoint: Position;
  endPoint: Position;
}

/**
 * Calculate the complete path data for a connection between two variables
 */
export function calculatePath(
  source: Variable,
  target: Variable,
  gap: number = CONNECTION_GAP
): PathResult {
  const { start, end } = calculateConnectionPoints(
    source.position,
    source.radius,
    target.position,
    target.radius,
    gap
  );

  const path = generateArrowPath(start, end);
  const arrowheadPoints = calculateArrowhead(start, end, ARROW_HEAD_SIZE);
  
  // Create SVG polygon points for arrowhead
  const points = `${end.x},${end.y} ${arrowheadPoints.left.x},${arrowheadPoints.left.y} ${arrowheadPoints.right.x},${arrowheadPoints.right.y}`;

  return {
    path,
    arrowhead: { points },
    startPoint: start,
    endPoint: end,
  };
}

/**
 * Calculate path for a connection being drawn (from source to mouse position)
 */
export function calculateDrawingPath(
  source: Variable,
  mousePosition: Position
): PathResult {
  const { start } = calculateConnectionPoints(
    source.position,
    source.radius,
    mousePosition,
    0,
    0
  );

  const path = generateArrowPath(start, mousePosition);
  const arrowheadPoints = calculateArrowhead(start, mousePosition, ARROW_HEAD_SIZE);
  
  const points = `${mousePosition.x},${mousePosition.y} ${arrowheadPoints.left.x},${arrowheadPoints.left.y} ${arrowheadPoints.right.x},${arrowheadPoints.right.y}`;

  return {
    path,
    arrowhead: { points },
    startPoint: start,
    endPoint: mousePosition,
  };
}
