/**
 * Edge constants - shared across all edge components
 */

// Edge visual properties
export const EDGE_STROKE_WIDTH = 1.5;
export const EDGE_HOVER_STROKE_WIDTH = 4;
export const EDGE_GAP = 15;  // Gap between edge and node circle

// Edge colors
export const EDGE_COLORS = {
  default: '#1a1a1a',
  hover: '#3b82f6',
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
} as const;

// Arrow configuration
export const ARROW_SIZE = 8;

// Control point calculation for bezier curves
export const BASE_CONTROL_DISTANCE = 50;

// Polarity marker (+/- symbol on edges)
export const POLARITY_MARKER = {
  size: 14,
  offset: 20,  // Distance from target along edge
  fontSize: 12,
  fontWeight: 'bold',
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
