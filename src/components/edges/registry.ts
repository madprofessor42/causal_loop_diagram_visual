import type { EdgeTypes } from '@xyflow/react';
import type { BaseEdgeData, EdgeVariant, LinkEdgeData, FlowEdgeData } from '../../types';
import LinkEdge from './LinkEdge';
import FlowEdge from './FlowEdge';
import { nanoid } from 'nanoid';

/**
 * Edge metadata for UI (toolbar, palette)
 */
interface EdgeMetadata {
  type: EdgeVariant;
  defaultData: () => BaseEdgeData;
  displayName: string;
  description?: string;
}

/**
 * Metadata for all available edge types
 * Used for UI components
 */
export const edgeMetadata: Record<EdgeVariant, EdgeMetadata> = {
  link: {
    type: 'link',
    defaultData: (): LinkEdgeData => ({
      delay: false,
      lineStyle: 'dashed',
    }),
    displayName: 'Link',
    description: 'Information connection (dashed line)',
  },
  flow: {
    type: 'flow',
    defaultData: (): FlowEdgeData => ({
      delay: false,
      lineStyle: 'solid',
      rate: '0',
    }),
    displayName: 'Flow',
    description: 'Material flow between Stocks (thick arrow)',
  },
};

/**
 * EdgeTypes for React Flow - maps type names to components
 */
export const edgeTypes: EdgeTypes = {
  link: LinkEdge,
  flow: FlowEdge,
};

/**
 * Get all available edge metadata (for palette)
 */
export const getEdgeMetadata = (): EdgeMetadata[] => Object.values(edgeMetadata);

/**
 * Get specific edge metadata by type
 */
export const getEdgeMetadataByType = (type: EdgeVariant): EdgeMetadata | undefined =>
  edgeMetadata[type];

/**
 * Factory function to create a new edge with default data
 */
export function createEdge(
  type: EdgeVariant,
  source: string,
  target: string,
  id?: string
) {
  const metadata = edgeMetadata[type];
  if (!metadata) {
    throw new Error(`Unknown edge type: ${type}`);
  }
  
  return {
    id: id ?? nanoid(),
    type,
    source,
    target,
    data: metadata.defaultData(),
  };
}
