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
 * Calculate point on node edge at given angle
 * Handles rectangles (Stock) and ellipses (Variable)
 * Point is calculated slightly outside the actual edge to account for border
 */
function getEdgePointAtAngle(
  centerX: number,
  centerY: number,
  nodeType: string | undefined,
  width: number,
  height: number,
  angle: number
): { x: number; y: number } {
  if (nodeType === 'stock') {
    // Rectangle - find intersection with edge
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Determine which edge we intersect
    const tanAngle = Math.abs(sin / cos);
    const edgeTan = halfHeight / halfWidth;
    
    let x: number, y: number;
    
    if (tanAngle <= edgeTan) {
      // Intersects left or right edge
      x = cos > 0 ? halfWidth : -halfWidth;
      y = x * (sin / cos);
    } else {
      // Intersects top or bottom edge
      y = sin > 0 ? halfHeight : -halfHeight;
      x = y * (cos / sin);
    }
    
    // Add small offset to move point outside the border
    const distance = Math.sqrt(x * x + y * y);
    const offsetX = (x / distance) * BORDER_OFFSET;
    const offsetY = (y / distance) * BORDER_OFFSET;
    
    return {
      x: centerX + x + offsetX,
      y: centerY + y + offsetY,
    };
  } else {
    // Ellipse (Variable) - find intersection of ray with ellipse
    const radiusX = width / 2;
    const radiusY = height / 2;
    
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Ray from center: (t*cos(angle), t*sin(angle))
    // Ellipse equation: (x/radiusX)² + (y/radiusY)² = 1
    // Solve for t where ray intersects ellipse:
    // t = 1 / sqrt((cos²/radiusX²) + (sin²/radiusY²))
    const denominator = Math.sqrt(
      (cos * cos) / (radiusX * radiusX) + 
      (sin * sin) / (radiusY * radiusY)
    );
    const t = 1 / denominator;
    
    // Point on ellipse edge
    const x = t * cos;
    const y = t * sin;
    
    // Add small offset to move point outside the border
    // For ellipse, just extend along the same ray
    const offsetX = cos * BORDER_OFFSET;
    const offsetY = sin * BORDER_OFFSET;
    
    return {
      x: centerX + x + offsetX,
      y: centerY + y + offsetY,
    };
  }
}

/**
 * Calculate straight edge connection points
 * 
 * Connects center-to-center, with edge points calculated at shape boundaries
 *
 * @param source - Source node
 * @param target - Target node
 * @returns Edge parameters including start/end points at shape boundaries
 */
export function getStraightEdgeParams(source: Node, target: Node): StraightEdgeParams {
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

  // Calculate angles (pointing at each other)
  const sourceAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const targetAngle = Math.atan2(sourceY - targetY, sourceX - targetX);

  // Calculate edge start and end points on node edges
  const sourcePoint = getEdgePointAtAngle(sourceX, sourceY, source.type, sourceWidth, sourceHeight, sourceAngle);
  const targetPoint = getEdgePointAtAngle(targetX, targetY, target.type, targetWidth, targetHeight, targetAngle);

  return {
    sx: sourcePoint.x,
    sy: sourcePoint.y,
    tx: targetPoint.x,
    ty: targetPoint.y,
  };
}
