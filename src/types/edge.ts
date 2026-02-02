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
export interface LinkEdgeData extends BaseEdgeData {
  /** If true, this Link connects to a Flow edge (not a node) */
  targetIsFlowEdge?: boolean;
  /** The Flow edge ID when targetIsFlowEdge is true */
  targetFlowEdgeId?: string;
  /** If true, this Link originates from a Flow edge (not a node) */
  sourceIsFlowEdge?: boolean;
  /** The Flow edge ID when sourceIsFlowEdge is true */
  sourceFlowEdgeId?: string;
  /** If true, the visual direction is reversed (for Links to/from Flow edges) */
  reversed?: boolean;
}

/**
 * Flow edge data - material flow between Stocks (semi-primitive)
 * Flow can receive Link connections and has editable properties like nodes
 */
export interface FlowEdgeData extends BaseEdgeData {
  /** Name of the flow (used in formulas as [Name]) */
  name?: string;
  /** Flow rate formula or constant (e.g., "10", "[Stock] * 0.1") */
  rate?: string;
  /** Units for the flow (e.g., "people/year") */
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
