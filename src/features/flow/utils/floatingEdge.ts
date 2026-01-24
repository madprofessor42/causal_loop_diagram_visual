/**
 * Utility functions for floating edges that connect to nodes dynamically
 * Based on React Flow floating edges example
 */

import { type Node, type InternalNode, Position } from '@xyflow/react';

/**
 * Get the center point of a node
 */
function getNodeCenter(node: Node | InternalNode): { x: number; y: number } {
  const width = (node as InternalNode).measured?.width ?? node.width ?? 80;
  const height = (node as InternalNode).measured?.height ?? node.height ?? 80;
  
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
}

/**
 * Calculate intersection point between a line from center to target
 * and the circle boundary of a node
 */
function getCircleIntersection(
  centerX: number,
  centerY: number,
  radius: number,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) {
    return { x: centerX, y: centerY - radius };
  }
  
  // Unit vector pointing toward target
  const ux = dx / distance;
  const uy = dy / distance;
  
  // Point on circle
  return {
    x: centerX + ux * radius,
    y: centerY + uy * radius,
  };
}

/**
 * Determine the position (top/right/bottom/left) based on angle
 */
function getPositionFromAngle(angle: number): Position {
  // Convert angle to 0-360 range
  const normalizedAngle = ((angle * 180) / Math.PI + 360) % 360;
  
  if (normalizedAngle >= 315 || normalizedAngle < 45) {
    return Position.Right;
  } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
    return Position.Bottom;
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    return Position.Left;
  } else {
    return Position.Top;
  }
}

/**
 * Get the edge params for connecting two nodes with floating edges
 * The edges connect at the circle borders toward the curve's control point
 * @param offset - absolute offset value for curve (always positive)
 * @param curveDirection - 1 for curve below, -1 for curve above
 */
export function getFloatingEdgeParams(
  sourceNode: Node | InternalNode,
  targetNode: Node | InternalNode,
  offset: number = 0,
  curveDirection: number = 1
): {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
} {
  const sourceCenter = getNodeCenter(sourceNode);
  const targetCenter = getNodeCenter(targetNode);
  
  // Use circle radius (40px is the default)
  const sourceRadius = 40;
  const targetRadius = 40;
  
  // Calculate the control point of the curve (same logic as in CausalEdge)
  // This is the midpoint offset perpendicular to the line
  const midX = (sourceCenter.x + targetCenter.x) / 2;
  const midY = (sourceCenter.y + targetCenter.y) / 2;
  
  // Direction vector - always calculate left-to-right for consistent perpendicular
  const leftX = Math.min(sourceCenter.x, targetCenter.x);
  const rightX = Math.max(sourceCenter.x, targetCenter.x);
  const leftY = sourceCenter.x < targetCenter.x ? sourceCenter.y : targetCenter.y;
  const rightY = sourceCenter.x < targetCenter.x ? targetCenter.y : sourceCenter.y;
  
  const dx = rightX - leftX;
  const dy = rightY - leftY;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  // Perpendicular unit vector (consistent direction: positive = below the line)
  const perpX = len > 0 ? -dy / len : 0;
  const perpY = len > 0 ? dx / len : 1;
  
  // Control point offset (same multiplier as in CausalEdge: offset * 5)
  const curvature = Math.abs(offset) * 5;
  const controlX = midX + perpX * curvature * curveDirection;
  const controlY = midY + perpY * curvature * curveDirection;
  
  // Calculate intersection points on the circle borders toward the control point
  const sourceIntersection = getCircleIntersection(
    sourceCenter.x,
    sourceCenter.y,
    sourceRadius,
    controlX,
    controlY
  );
  
  const targetIntersection = getCircleIntersection(
    targetCenter.x,
    targetCenter.y,
    targetRadius,
    controlX,
    controlY
  );
  
  // Calculate angles for position determination
  const sourceAngle = Math.atan2(
    controlY - sourceCenter.y,
    controlX - sourceCenter.x
  );
  const targetAngle = Math.atan2(
    controlY - targetCenter.y,
    controlX - targetCenter.x
  );
  
  return {
    sx: sourceIntersection.x,
    sy: sourceIntersection.y,
    tx: targetIntersection.x,
    ty: targetIntersection.y,
    sourcePos: getPositionFromAngle(sourceAngle),
    targetPos: getPositionFromAngle(targetAngle),
  };
}
