import type { NodeTypes } from '@xyflow/react';
import { StockNode } from './StockNode';
import { VariableNode } from './VariableNode';

/**
 * NodeTypes for React Flow - maps type names to components
 */
export const nodeTypes: NodeTypes = {
  stock: StockNode,
  variable: VariableNode,
};
