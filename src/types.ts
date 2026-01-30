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

export type FloatingEdge = Edge;

