/**
 * Edge constants - shared across all edge components
 */

// Arrow configuration
export const ARROW_SIZE = 8;

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
