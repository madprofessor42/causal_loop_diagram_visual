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
  
  return {
    x: centerX + (dx / distance) * radius,
    y: centerY + (dy / distance) * radius,
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
 * The edges connect at the circle borders
 */
export function getFloatingEdgeParams(
  sourceNode: Node | InternalNode,
  targetNode: Node | InternalNode
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
  
  // Calculate intersection points on the circle borders
  const sourceIntersection = getCircleIntersection(
    sourceCenter.x,
    sourceCenter.y,
    sourceRadius,
    targetCenter.x,
    targetCenter.y
  );
  
  const targetIntersection = getCircleIntersection(
    targetCenter.x,
    targetCenter.y,
    targetRadius,
    sourceCenter.x,
    sourceCenter.y
  );
  
  // Calculate angles for position determination
  const sourceAngle = Math.atan2(
    targetCenter.y - sourceCenter.y,
    targetCenter.x - sourceCenter.x
  );
  const targetAngle = Math.atan2(
    sourceCenter.y - targetCenter.y,
    sourceCenter.x - targetCenter.x
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
