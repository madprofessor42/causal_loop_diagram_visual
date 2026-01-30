import { Position, type Node } from '@xyflow/react';

interface EdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
  // Control point offsets for bezier curve (0 means straight line)
  sourceControlOffsetX: number;
  sourceControlOffsetY: number;
  targetControlOffsetX: number;
  targetControlOffsetY: number;
}

interface EdgeAngles {
  sourceAngle?: number;
  targetAngle?: number;
}

// Node radius (assuming circular nodes of 40px radius)
const RADIUS = 40;
// Outer threshold must match CircularNode.tsx
const OUTER_THRESHOLD = 10;
// Gap between edge and node circle for cleaner visual
const EDGE_GAP = 8;
// Base control point distance
const BASE_CONTROL_DISTANCE = 50;

// Normalize angle to [-PI, PI]
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

// Calculate edge connection points for floating edges
export function getEdgeParams(source: Node, target: Node, angles?: EdgeAngles): EdgeParams {
  // Use computed positions from React Flow
  const sourcePosition = source.position;
  const targetPosition = target.position;

  // Container size includes outer threshold, so actual node center is offset
  const containerSize = (RADIUS + OUTER_THRESHOLD) * 2;
  const nodeWidth = source.measured?.width ?? containerSize;
  const nodeCenterOffset = nodeWidth / 2;

  const sourceX = sourcePosition.x + nodeCenterOffset;
  const sourceY = sourcePosition.y + nodeCenterOffset;
  const targetX = targetPosition.x + nodeCenterOffset;
  const targetY = targetPosition.y + nodeCenterOffset;

  // Calculate the "ideal" straight angles (pointing directly at each other)
  const idealSourceAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const idealTargetAngle = Math.atan2(sourceY - targetY, sourceX - targetX);

  // Use provided angles if available, otherwise use ideal angles
  const sourceAngle = angles?.sourceAngle ?? idealSourceAngle;
  const targetAngle = angles?.targetAngle ?? idealTargetAngle;

  // Calculate edge start and end points with gap from circle perimeters
  const sx = sourceX + (RADIUS + EDGE_GAP) * Math.cos(sourceAngle);
  const sy = sourceY + (RADIUS + EDGE_GAP) * Math.sin(sourceAngle);
  const tx = targetX + (RADIUS + EDGE_GAP) * Math.cos(targetAngle);
  const ty = targetY + (RADIUS + EDGE_GAP) * Math.sin(targetAngle);

  // Calculate angle deviations from ideal straight line
  const sourceDeviation = Math.abs(normalizeAngle(sourceAngle - idealSourceAngle));
  const targetDeviation = Math.abs(normalizeAngle(targetAngle - idealTargetAngle));

  // Calculate the angle between source exit direction and target entry direction
  // This tells us how much the curve needs to "turn"
  const exitToEntryAngle = Math.abs(normalizeAngle(sourceAngle - (targetAngle + Math.PI)));
  
  // Calculate distance between edge points
  const edgeLength = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
  
  // Dynamic curve intensity based on:
  // 1. How much we deviate from straight line (sourceDeviation, targetDeviation)
  // 2. How much the curve needs to "turn" (exitToEntryAngle)
  // 3. Edge length (longer edges need proportionally more control distance)
  
  // The turn factor: 0 when going straight, 1 when making U-turn
  const turnFactor = exitToEntryAngle / Math.PI;
  
  // Minimum control distance based on edge length
  const minControlDistance = Math.max(BASE_CONTROL_DISTANCE, edgeLength * 0.3);
  
  // Scale up control distance based on deviation and turn factor
  // More deviation or more turning = more control distance needed
  const sourceIntensity = Math.max(sourceDeviation / Math.PI, turnFactor * 0.5);
  const targetIntensity = Math.max(targetDeviation / Math.PI, turnFactor * 0.5);
  
  const sourceControlDist = minControlDistance * (0.5 + sourceIntensity);
  const targetControlDist = minControlDistance * (0.5 + targetIntensity);

  // Control points extend in the direction the connection is pointing
  const sourceControlOffsetX = sourceControlDist * Math.cos(sourceAngle);
  const sourceControlOffsetY = sourceControlDist * Math.sin(sourceAngle);
  const targetControlOffsetX = targetControlDist * Math.cos(targetAngle);
  const targetControlOffsetY = targetControlDist * Math.sin(targetAngle);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos: Position.Bottom,
    targetPos: Position.Top,
    sourceControlOffsetX,
    sourceControlOffsetY,
    targetControlOffsetX,
    targetControlOffsetY,
  };
}

