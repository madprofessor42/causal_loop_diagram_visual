import type { NodeTypes } from '@xyflow/react';
import type { BaseNodeData, NodeVariant } from '../../types';
import { CircularNode } from '../CircularNode';
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
  circular: {
    type: 'circular',
    defaultData: () => ({
      label: 'Variable',
      notes: '',
    }),
    displayName: 'Variable',
    description: 'Standard CLD variable node',
  },
};

/**
 * NodeTypes for React Flow - maps type names to components
 */
export const nodeTypes: NodeTypes = {
  circular: CircularNode,
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
