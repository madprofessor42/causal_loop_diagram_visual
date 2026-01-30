/**
 * Node constants - shared across all node components
 */

// Stock node dimensions (rectangle)
export const STOCK_WIDTH = 100;
export const STOCK_HEIGHT = 60;

// Variable node dimensions (oval)
export const VARIABLE_WIDTH = 100;
export const VARIABLE_HEIGHT = 50;

// Stock node colors (blue)
export const STOCK_COLORS = {
  background: '#a8c5e2',  // light blue
  border: '#5b9bd5',
  text: '#1a1a1a',
} as const;

// Variable node colors (orange)
export const VARIABLE_COLORS = {
  background: '#f8cbad',  // peach/orange
  border: '#ed7d31',
  text: '#1a1a1a',
} as const;
