/**
 * Edge constants - shared across all edge components
 */

// Arrow configuration
export const ARROW_SIZE = 8;

// Common edge line color
export const EDGE_LINE_COLOR = '#1a1a1a';    // Dark gray for all edge lines

// Link edge style (dashed line for information connections)
export const LINK_EDGE = {
  strokeWidth: 1.5,             // Thin line for links
  previewStrokeWidth: 1.5,      // Width for preview line when drawing
  color: EDGE_LINE_COLOR,       // Line and arrow color (dark gray)
  dashArray: '5,5',
  arrowSize: ARROW_SIZE,
} as const;

// Flow edge style (thick arrow for material flows)
export const FLOW_EDGE = {
  strokeWidth: 3,               // Thicker line for flows
  previewStrokeWidth: 3,        // Width for preview line when drawing
  lineColor: EDGE_LINE_COLOR,   // Main line color (dark gray)
  color: '#5b9bd5',             // Valve and arrowhead color (blue)
  cloudSize: 20,                // Size of cloud indicator when source/target is null
  valveSize: 10,                // Size of valve indicator on flow
} as const;
