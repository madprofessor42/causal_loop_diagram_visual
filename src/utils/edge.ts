import type { Node } from '@xyflow/react';
import {
  NODE_RADIUS,
  NODE_CONTAINER_SIZE,
  EDGE_GAP,
  BASE_CONTROL_DISTANCE,
} from '../constants';
import type { EdgeParams, EdgeAngles } from '../types';

/**
 * Normalize angle to [-PI, PI]
 */
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Calculate edge connection points for floating edges
 * 
 * @param source - Source node
 * @param target - Target node  
 * @param angles - Optional custom connection angles
 * @returns Edge parameters including start/end points and control offsets
 */
export function getEdgeParams(source: Node, target: Node, angles?: EdgeAngles): EdgeParams {
  // Use computed positions from React Flow
  const sourcePosition = source.position;
  const targetPosition = target.position;

  // Container size includes outer threshold, so actual node center is offset
  const nodeWidth = source.measured?.width ?? NODE_CONTAINER_SIZE;
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
  const sx = sourceX + (NODE_RADIUS + EDGE_GAP) * Math.cos(sourceAngle);
  const sy = sourceY + (NODE_RADIUS + EDGE_GAP) * Math.sin(sourceAngle);
  const tx = targetX + (NODE_RADIUS + EDGE_GAP) * Math.cos(targetAngle);
  const ty = targetY + (NODE_RADIUS + EDGE_GAP) * Math.sin(targetAngle);

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
    sourceControlOffsetX,
    sourceControlOffsetY,
    targetControlOffsetX,
    targetControlOffsetY,
  };
}
