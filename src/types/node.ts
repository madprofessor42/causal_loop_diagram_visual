/**
 * Node type definitions for Stock and Flow diagrams
 */

import type { Node, NodeProps } from '@xyflow/react';

/**
 * Base data that all nodes share
 */
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  notes?: string;
}

/**
 * Stock node data - accumulator (blue rectangle)
 */
export interface StockNodeData extends BaseNodeData {
  /** Initial value of the stock */
  initialValue?: number;
  /** Units for the stock value */
  units?: string;
}

/**
 * Variable node data - formula or constant (orange oval)
 */
export interface VariableNodeData extends BaseNodeData {
  /** Formula or constant value. Examples: "100", "[Stock1] * 0.5", "Hours()^2" */
  value?: string;
  /** Units for the variable */
  units?: string;
}

/**
 * Available node variants
 * - stock: Accumulator (blue rectangle)
 * - variable: Formula or constant (orange oval)
 */
export type NodeVariant = 'stock' | 'variable';

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
