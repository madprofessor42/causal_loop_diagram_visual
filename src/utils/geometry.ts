/**
 * Geometry utilities for Causal Loop Diagram calculations
 */

import type { Position, TransformState } from '../types/common.types';

/**
 * Calculate the distance between two points
 */
export function getDistance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the normalized direction vector from p1 to p2
 */
export function getNormalizedDirection(p1: Position, p2: Position): Position {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) {
    return { x: 0, y: 0 };
  }
  
  return {
    x: dx / distance,
    y: dy / distance,
  };
}

/**
 * Calculate the angle in radians from p1 to p2
 */
export function getAngle(p1: Position, p2: Position): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Check if a point is within a certain distance from the edge of a circle
 */
export function isOnCircleEdge(
  point: Position,
  circleCenter: Position,
  radius: number,
  edgeThickness: number = 10
): boolean {
  const distance = getDistance(point, circleCenter);
  return distance >= radius - edgeThickness && distance <= radius + edgeThickness;
}

/**
 * Calculate the point on the edge of a circle in the direction of a target
 */
export function getCircleEdgePoint(
  circleCenter: Position,
  radius: number,
  targetPoint: Position
): Position {
  const direction = getNormalizedDirection(circleCenter, targetPoint);
  return {
    x: circleCenter.x + direction.x * radius,
    y: circleCenter.y + direction.y * radius,
  };
}

/**
 * Calculate connection path start and end points between two circles
 * The end point stops 'gap' pixels before the target circle
 */
export function calculateConnectionPoints(
  sourceCenter: Position,
  sourceRadius: number,
  targetCenter: Position,
  targetRadius: number,
  gap: number = 15
): { start: Position; end: Position } {
  const direction = getNormalizedDirection(sourceCenter, targetCenter);
  
  const start: Position = {
    x: sourceCenter.x + direction.x * sourceRadius,
    y: sourceCenter.y + direction.y * sourceRadius,
  };
  
  const end: Position = {
    x: targetCenter.x - direction.x * (targetRadius + gap),
    y: targetCenter.y - direction.y * (targetRadius + gap),
  };
  
  return { start, end };
}

/**
 * Convert screen coordinates to canvas coordinates (accounting for zoom/pan)
 */
export function screenToCanvas(
  screenPos: Position,
  transform: TransformState
): Position {
  return {
    x: (screenPos.x - transform.positionX) / transform.scale,
    y: (screenPos.y - transform.positionY) / transform.scale,
  };
}

/**
 * Convert canvas coordinates to screen coordinates (accounting for zoom/pan)
 */
export function canvasToScreen(
  canvasPos: Position,
  transform: TransformState
): Position {
  return {
    x: canvasPos.x * transform.scale + transform.positionX,
    y: canvasPos.y * transform.scale + transform.positionY,
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate an SVG path for a straight arrow line
 */
export function generateArrowPath(start: Position, end: Position): string {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

/**
 * Calculate arrowhead points for an arrow ending at 'end' coming from 'start'
 */
export function calculateArrowhead(
  start: Position,
  end: Position,
  arrowLength: number = 10,
  arrowAngle: number = Math.PI / 6 // 30 degrees
): { left: Position; right: Position } {
  const angle = getAngle(start, end);
  
  const leftAngle = angle + Math.PI - arrowAngle;
  const rightAngle = angle + Math.PI + arrowAngle;
  
  return {
    left: {
      x: end.x + Math.cos(leftAngle) * arrowLength,
      y: end.y + Math.sin(leftAngle) * arrowLength,
    },
    right: {
      x: end.x + Math.cos(rightAngle) * arrowLength,
      y: end.y + Math.sin(rightAngle) * arrowLength,
    },
  };
}
