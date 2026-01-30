import type { NodeTypes } from '@xyflow/react';
import type { BaseNodeData, NodeVariant, StockNodeData, VariableNodeData } from '../../types';
import { StockNode } from './StockNode';
import { VariableNode } from './VariableNode';
import { nanoid } from 'nanoid';

/**
 * Node metadata for UI (toolbar, palette)
 */
interface NodeMetadata {
  type: NodeVariant;
  defaultData: () => BaseNodeData;
  displayName: string;
  description?: string;
}

/**
 * Metadata for all available node types
 * Used for UI components like toolbars and palettes
 */
export const nodeMetadata: Record<NodeVariant, NodeMetadata> = {
  stock: {
    type: 'stock',
    defaultData: (): StockNodeData => ({
      label: 'Stock',
      initialValue: 0,
      notes: '',
    }),
    displayName: 'Stock',
    description: 'Accumulator - stores and accumulates values',
  },
  variable: {
    type: 'variable',
    defaultData: (): VariableNodeData => ({
      label: 'Variable',
      value: '0',
      notes: '',
    }),
    displayName: 'Variable',
    description: 'Formula or constant value',
  },
};

/**
 * NodeTypes for React Flow - maps type names to components
 */
export const nodeTypes: NodeTypes = {
  stock: StockNode,
  variable: VariableNode,
};

/**
 * Get all available node metadata (for toolbar/palette)
 */
export const getNodeMetadata = (): NodeMetadata[] => Object.values(nodeMetadata);

/**
 * Get specific node metadata by type
 */
export const getNodeMetadataByType = (type: NodeVariant): NodeMetadata | undefined =>
  nodeMetadata[type];

/**
 * Factory function to create a new node with default data
 */
export function createNode(
  type: NodeVariant,
  position: { x: number; y: number },
  id?: string
) {
  const metadata = nodeMetadata[type];
  if (!metadata) {
    throw new Error(`Unknown node type: ${type}`);
  }
  
  return {
    id: id ?? nanoid(),
    type,
    position,
    data: metadata.defaultData(),
  };
}
