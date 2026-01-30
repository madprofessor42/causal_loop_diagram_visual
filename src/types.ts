import type { Node, Edge } from '@xyflow/react';

export interface CircularNodeData extends Record<string, unknown> {
  label: string;
}

export type CircularNode = Node<CircularNodeData>;

export interface HandlePosition {
  x: number;
  y: number;
  angle: number;
  visible: boolean;
}

// Edge data to store connection angles for precise edge positioning
export interface FloatingEdgeData extends Record<string, unknown> {
  sourceAngle?: number; // Angle in radians from center where connection started
  targetAngle?: number; // Angle in radians from center where connection ended
  curveOffset?: { x: number; y: number }; // Manual curve offset from midpoint
}

export type FloatingEdge = Edge<FloatingEdgeData>;

