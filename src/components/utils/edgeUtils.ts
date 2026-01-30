import { Position, type Node } from '@xyflow/react';

interface EdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
}

// Calculate edge connection points for floating edges
export function getEdgeParams(source: Node, target: Node): EdgeParams {
  // Use computed positions from React Flow
  const sourcePosition = source.position;
  const targetPosition = target.position;

  const sourceX = sourcePosition.x + (source.measured?.width ?? 0) / 2;
  const sourceY = sourcePosition.y + (source.measured?.height ?? 0) / 2;
  const targetX = targetPosition.x + (target.measured?.width ?? 0) / 2;
  const targetY = targetPosition.y + (target.measured?.height ?? 0) / 2;

  // Calculate angle between nodes
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);

  // Node radius (assuming circular nodes of 40px radius)
  const radius = 40;

  // Calculate edge start and end points on the circle perimeters
  const sx = sourceX + radius * Math.cos(angle);
  const sy = sourceY + radius * Math.sin(angle);
  const tx = targetX - radius * Math.cos(angle);
  const ty = targetY - radius * Math.sin(angle);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos: Position.Bottom,
    targetPos: Position.Top,
  };
}

