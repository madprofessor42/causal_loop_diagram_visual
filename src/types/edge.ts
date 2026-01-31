/**
 * Edge type definitions for Stock and Flow diagrams
 */

import type { Edge } from '@xyflow/react';

/**
 * Base data that all edges share
 */
export interface BaseEdgeData extends Record<string, unknown> {
  /** Optional label on the edge */
  label?: string;
  /** Optional notes/comments */
  notes?: string;
  /** Is this edge bidirectional (has arrows on both ends) */
  bidirectional?: boolean;
}

/**
 * Link edge data - information connection (dashed line)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LinkEdgeData extends BaseEdgeData {
  // Link is a simple information connection
}

/**
 * Flow edge data - material flow between Stocks
 */
export interface FlowEdgeData extends BaseEdgeData {
  /** Flow rate formula or constant */
  rate?: string;
  /** Units for the flow */
  units?: string;
  /** If true, draw cloud icon at source (flow from "nowhere") */
  sourceIsCloud?: boolean;
  /** If true, draw cloud icon at target (flow to "nowhere") */
  targetIsCloud?: boolean;
  /** Fixed target position when dropped on canvas (not connected to node) */
  targetPosition?: { x: number; y: number };
  /** Fixed source position when started from canvas */
  sourcePosition?: { x: number; y: number };
}

/**
 * Available edge variants
 * - link: Information connection (dashed line)
 * - flow: Material flow between Stocks (thick arrow with valve)
 */
export type EdgeVariant = 'link' | 'flow';

/**
 * CLD Edge extending React Flow Edge
 */
export type CLDEdge<T extends BaseEdgeData = BaseEdgeData> = Edge<T> & {
  type: EdgeVariant;
};

/**
 * Straight edge params (simplified)
 */
export interface StraightEdgeParams {
  sx: number;  // Source x
  sy: number;  // Source y
  tx: number;  // Target x
  ty: number;  // Target y
}
