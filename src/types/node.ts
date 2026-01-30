/**
 * Node type definitions for CLD editor
 */

import type { Node, NodeProps } from '@xyflow/react';

/**
 * Base data that all nodes share
 */
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  notes?: string;
  color?: string;
}

/**
 * Available node variants
 * Extend this union type when adding new node types
 */
export type NodeVariant = 'circular';

/**
 * CLD Node extending React Flow Node
 */
export type CLDNode<T extends BaseNodeData = BaseNodeData> = Node<T> & {
  type: NodeVariant;
};

/**
 * Node component props type
 */
export type CLDNodeProps<T extends BaseNodeData = BaseNodeData> = NodeProps<CLDNode<T>>;

/**
 * Handle position data for dynamic handle positioning
 */
export interface HandlePosition {
  x: number;
  y: number;
  angle: number;
  visible: boolean;
}

/**
 * Circular node specific data (extends base)
 */
export type CircularNodeData = BaseNodeData;
