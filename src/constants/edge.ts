/**
 * Edge constants - shared across all edge components
 */

// Edge visual properties
export const EDGE_STROKE_WIDTH = 1.5;
export const EDGE_HOVER_STROKE_WIDTH = 4;
export const EDGE_GAP = 15;  // Gap between edge and node

// Edge colors
export const EDGE_COLORS = {
  default: '#1a1a1a',
  hover: '#3b82f6',
  link: '#666666',    // Link edge color (gray)
  flow: '#5b9bd5',    // Flow edge color (blue)
} as const;

// Arrow configuration
export const ARROW_SIZE = 8;

// Control point calculation for bezier curves
export const BASE_CONTROL_DISTANCE = 50;

// Link edge style (dashed line for information connections)
export const LINK_EDGE = {
  strokeWidth: 1.5,
  color: '#666666',
  dashArray: '5,5',
} as const;

// Flow edge style (thick arrow for material flows)
export const FLOW_EDGE = {
  strokeWidth: 3,
  color: '#5b9bd5',
  cloudSize: 20,      // Size of cloud indicator when source/target is null
  valveSize: 10,      // Size of valve indicator on flow
} as const;

// Delay marker (|| symbol for delayed effects)
export const DELAY_MARKER = {
  lineLength: 8,
  lineGap: 3,
  strokeWidth: 2,
} as const;

// Edge drag zones (percentage of edge length)
export const EDGE_ZONES = {
  sourceEnd: 0.15,    // 0-15% for source angle adjustment
  targetStart: 0.85,  // 85-100% for target angle adjustment
  // 15-85% is the curve adjustment zone
} as const;
