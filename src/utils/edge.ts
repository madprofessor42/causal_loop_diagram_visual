import type { Node } from '@xyflow/react';
import {
  STOCK_WIDTH,
  STOCK_HEIGHT,
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
} from '../constants';
import type { StraightEdgeParams } from '../types';

/**
 * Get node dimensions based on type
 * Used as fallback when measured dimensions are not available
 */
function getNodeDimensions(node: Node): { width: number; height: number } {
  if (node.type === 'stock') {
    return { width: STOCK_WIDTH, height: STOCK_HEIGHT };
  }
  // variable or default
  return { width: VARIABLE_WIDTH, height: VARIABLE_HEIGHT };
}

// Border offset to prevent arrows from going inside the node border
// Accounts for 2-3px border + small visual gap
const BORDER_OFFSET = 3;

/**
 * Calculate intersection of a parallel line with node boundary
 * The line passes through (centerX + perpOffsetX, centerY + perpOffsetY) at given angle
 * 
 * @param centerX - Node center X
 * @param centerY - Node center Y
 * @param nodeType - 'stock' for rectangle, else ellipse
 * @param width - Node width
 * @param height - Node height
 * @param angle - Direction angle of the line
 * @param perpOffsetX - Perpendicular offset X from center
 * @param perpOffsetY - Perpendicular offset Y from center
 * @returns Intersection point on node boundary
 */
function getParallelLineEdgePoint(
  centerX: number,
  centerY: number,
  nodeType: string | undefined,
  width: number,
  height: number,
  angle: number,
  perpOffsetX: number,
  perpOffsetY: number
): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  if (nodeType === 'stock') {
    // Rectangle - find intersection of parallel line with boundary
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Line in parametric form relative to node center:
    // x = perpOffsetX + t * cos
    // y = perpOffsetY + t * sin
    // We need to find t where line exits the rectangle (in direction of angle)
    
    let tExit = Infinity;
    let exitX = 0, exitY = 0;
    
    // Check intersection with right edge (x = halfWidth)
    if (cos > 1e-10) {
      const t = (halfWidth - perpOffsetX) / cos;
      const y = perpOffsetY + t * sin;
      if (Math.abs(y) <= halfHeight + 1e-10 && t < tExit && t > 0) {
        tExit = t;
        exitX = halfWidth;
        exitY = y;
      }
    }
    
    // Check intersection with left edge (x = -halfWidth)
    if (cos < -1e-10) {
      const t = (-halfWidth - perpOffsetX) / cos;
      const y = perpOffsetY + t * sin;
      if (Math.abs(y) <= halfHeight + 1e-10 && t < tExit && t > 0) {
        tExit = t;
        exitX = -halfWidth;
        exitY = y;
      }
    }
    
    // Check intersection with bottom edge (y = halfHeight)
    if (sin > 1e-10) {
      const t = (halfHeight - perpOffsetY) / sin;
      const x = perpOffsetX + t * cos;
      if (Math.abs(x) <= halfWidth + 1e-10 && t < tExit && t > 0) {
        tExit = t;
        exitX = x;
        exitY = halfHeight;
      }
    }
    
    // Check intersection with top edge (y = -halfHeight)
    if (sin < -1e-10) {
      const t = (-halfHeight - perpOffsetY) / sin;
      const x = perpOffsetX + t * cos;
      if (Math.abs(x) <= halfWidth + 1e-10 && t < tExit && t > 0) {
        tExit = t;
        exitX = x;
        exitY = -halfHeight;
      }
    }
    
    // Add border offset
    const dist = Math.sqrt(exitX * exitX + exitY * exitY);
    if (dist > 0) {
      exitX += (exitX / dist) * BORDER_OFFSET;
      exitY += (exitY / dist) * BORDER_OFFSET;
    }
    
    return {
      x: centerX + exitX,
      y: centerY + exitY,
    };
  } else {
    // Ellipse - find intersection of parallel line with ellipse
    const rx = width / 2;
    const ry = height / 2;
    
    // Line: x = perpOffsetX + t*cos, y = perpOffsetY + t*sin
    // Ellipse: (x/rx)² + (y/ry)² = 1
    // Substituting: ((perpOffsetX + t*cos)/rx)² + ((perpOffsetY + t*sin)/ry)² = 1
    
    // Expanding: a*t² + b*t + c = 0
    const a = (cos * cos) / (rx * rx) + (sin * sin) / (ry * ry);
    const b = 2 * ((perpOffsetX * cos) / (rx * rx) + (perpOffsetY * sin) / (ry * ry));
    const c = (perpOffsetX * perpOffsetX) / (rx * rx) + (perpOffsetY * perpOffsetY) / (ry * ry) - 1;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      // Line doesn't intersect ellipse - fallback to simple projection
      const t = 1 / Math.sqrt(a);
      return {
        x: centerX + t * cos + cos * BORDER_OFFSET,
        y: centerY + t * sin + sin * BORDER_OFFSET,
      };
    }
    
    // Take the positive t (exit point in direction of angle)
    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-b + sqrtD) / (2 * a);
    const t2 = (-b - sqrtD) / (2 * a);
    const t = t1 > 0 ? t1 : t2;
    
    const exitX = perpOffsetX + t * cos;
    const exitY = perpOffsetY + t * sin;
    
    return {
      x: centerX + exitX + cos * BORDER_OFFSET,
      y: centerY + exitY + sin * BORDER_OFFSET,
    };
  }
}

/**
 * Calculate straight edge connection points
 * 
 * Connects center-to-center, with edge points calculated at shape boundaries.
 * Supports perpendicular offset for parallel edges - creates truly parallel lines
 * that correctly exit from node boundaries.
 *
 * @param source - Source node
 * @param target - Target node
 * @param perpendicularOffset - Optional perpendicular offset for parallel edges (default 0)
 * @returns Edge parameters including start/end points at shape boundaries
 */
export function getStraightEdgeParams(
  source: Node,
  target: Node,
  perpendicularOffset: number = 0
): StraightEdgeParams {
  // Use computed positions from React Flow
  const sourcePosition = source.position;
  const targetPosition = target.position;

  // Get node dimensions
  const sourceDims = getNodeDimensions(source);
  const targetDims = getNodeDimensions(target);

  // Calculate center of each node
  const sourceWidth = source.measured?.width ?? sourceDims.width;
  const sourceHeight = source.measured?.height ?? sourceDims.height;
  const targetWidth = target.measured?.width ?? targetDims.width;
  const targetHeight = target.measured?.height ?? targetDims.height;

  const sourceX = sourcePosition.x + sourceWidth / 2;
  const sourceY = sourcePosition.y + sourceHeight / 2;
  const targetX = targetPosition.x + targetWidth / 2;
  const targetY = targetPosition.y + targetHeight / 2;

  // Calculate base angle between centers
  const sourceAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const targetAngle = sourceAngle + Math.PI; // Opposite direction

  // Calculate perpendicular offset
  const perpAngle = sourceAngle + Math.PI / 2;
  const offsetX = perpendicularOffset * Math.cos(perpAngle);
  const offsetY = perpendicularOffset * Math.sin(perpAngle);

  // Calculate edge points where the parallel line exits node boundaries
  // The parallel line passes through (center + offset) in the direction of the base angle
  const sourcePoint = getParallelLineEdgePoint(
    sourceX, sourceY, source.type, sourceWidth, sourceHeight,
    sourceAngle, offsetX, offsetY
  );
  const targetPoint = getParallelLineEdgePoint(
    targetX, targetY, target.type, targetWidth, targetHeight,
    targetAngle, offsetX, offsetY
  );

  return {
    sx: sourcePoint.x,
    sy: sourcePoint.y,
    tx: targetPoint.x,
    ty: targetPoint.y,
  };
}
