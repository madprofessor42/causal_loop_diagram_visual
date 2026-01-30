/**
 * Node constants - shared across all node components
 */

// Node dimensions
export const NODE_RADIUS = 40;
export const NODE_INNER_THRESHOLD = 10;  // How far inside circle edge to start showing handles
export const NODE_OUTER_THRESHOLD = 10;  // How far outside circle edge to keep showing handles

// Node colors
export const NODE_COLORS = {
  default: {
    background: '#6366f1',
    border: '#4338ca',
    text: '#ffffff',
  },
  selected: {
    background: '#818cf8',
    border: '#6366f1',
    text: '#ffffff',
  },
  hover: {
    background: '#a5b4fc',
    border: '#818cf8',
    text: '#ffffff',
  },
} as const;

// Handle indicator (green dot showing connection point)
export const HANDLE_INDICATOR = {
  size: 12,
  color: '#22c55e',
  borderColor: '#16a34a',
} as const;

// Derived values
export const NODE_CONTAINER_SIZE = (NODE_RADIUS + NODE_OUTER_THRESHOLD) * 2;
