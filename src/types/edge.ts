/**
 * Edge type definitions for CLD editor
 */

import type { Edge, EdgeProps } from '@xyflow/react';

/**
 * CLD-specific polarity for causal relationships
 * - positive: reinforcing relationship (+)
 * - negative: balancing relationship (-)
 * - neutral: no polarity specified
 */
export type Polarity = 'positive' | 'negative' | 'neutral';

/**
 * Edge visual styles
 */
export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Base data that all edges share
 */
export interface BaseEdgeData extends Record<string, unknown> {
  /** Causal relationship polarity */
  polarity?: Polarity;
  /** Optional label on the edge */
  label?: string;
  /** Optional notes/comments */
  notes?: string;
  /** CLD delay indicator (shows || on edge) */
  delay?: boolean;
  /** Visual line style */
  lineStyle?: EdgeLineStyle;
  /** Angle in radians from source node center where connection started */
  sourceAngle?: number;
  /** Angle in radians from target node center where connection ended */
  targetAngle?: number;
  /** Manual curve offset from midpoint for bending the edge */
  curveOffset?: { x: number; y: number };
}

/**
 * Available edge variants
 * Extend this union type when adding new edge types
 */
export type EdgeVariant = 'floating';

/**
 * CLD Edge extending React Flow Edge
 */
export type CLDEdge<T extends BaseEdgeData = BaseEdgeData> = Edge<T> & {
  type: EdgeVariant;
};

/**
 * Edge component props type
 */
export type CLDEdgeProps<T extends BaseEdgeData = BaseEdgeData> = EdgeProps<CLDEdge<T>>;

/**
 * Edge params returned by edge calculation utilities
 */
export interface EdgeParams {
  sx: number;  // Source x
  sy: number;  // Source y
  tx: number;  // Target x
  ty: number;  // Target y
  sourceControlOffsetX: number;
  sourceControlOffsetY: number;
  targetControlOffsetX: number;
  targetControlOffsetY: number;
}

/**
 * Edge angles for precise positioning
 */
export interface EdgeAngles {
  sourceAngle?: number;
  targetAngle?: number;
}
