import type { EdgeTypes } from '@xyflow/react';
import type { BaseEdgeData, EdgeVariant, Polarity } from '../../types';
import FloatingEdge from '../FloatingEdge';
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
  floating: {
    type: 'floating',
    defaultData: () => ({
      polarity: 'positive' as Polarity,
      delay: false,
      lineStyle: 'solid',
    }),
    displayName: 'Causal Link',
    description: 'Curved edge with adjustable connection points',
  },
};

/**
 * EdgeTypes for React Flow - maps type names to components
 */
export const edgeTypes: EdgeTypes = {
  floating: FloatingEdge,
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
  polarity: Polarity = 'positive',
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
    data: {
      ...metadata.defaultData(),
      polarity,
    },
  };
}
