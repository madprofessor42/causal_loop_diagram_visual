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
// Control point distance multiplier for curve intensity
const CURVE_INTENSITY = 0.8;

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
  const sourceDeviation = normalizeAngle(sourceAngle - idealSourceAngle);
  const targetDeviation = normalizeAngle(targetAngle - idealTargetAngle);

  // Calculate distance between edge points for curve scaling
  const edgeLength = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
  const curveDistance = edgeLength * CURVE_INTENSITY;

  // Control points extend in the direction the connection is pointing
  // This creates a natural curve that follows the connection direction
  const sourceControlOffsetX = curveDistance * Math.cos(sourceAngle) * Math.abs(sourceDeviation) / Math.PI;
  const sourceControlOffsetY = curveDistance * Math.sin(sourceAngle) * Math.abs(sourceDeviation) / Math.PI;
  const targetControlOffsetX = curveDistance * Math.cos(targetAngle) * Math.abs(targetDeviation) / Math.PI;
  const targetControlOffsetY = curveDistance * Math.sin(targetAngle) * Math.abs(targetDeviation) / Math.PI;

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

