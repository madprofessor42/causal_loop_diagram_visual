import type { EdgeTypes } from '@xyflow/react';
import LinkEdge from './LinkEdge';
import FlowEdge from './FlowEdge';

/**
 * EdgeTypes for React Flow - maps type names to components
 */
export const edgeTypes: EdgeTypes = {
  link: LinkEdge,
  flow: FlowEdge,
};
