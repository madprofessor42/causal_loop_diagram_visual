import { useReactFlow } from '@xyflow/react';
import { NODE_RADIUS, NODE_COLORS, NODE_OUTER_THRESHOLD } from '../constants';

interface GhostNodeProps {
  position: { x: number; y: number };
}

/**
 * Ghost node component - shows a semi-transparent preview of a node
 * while dragging from the sidebar to the canvas.
 *
 * Uses ReactFlow's viewport to convert flow coordinates to screen coordinates.
 */
export function GhostNode({ position }: GhostNodeProps) {
  const { getViewport } = useReactFlow();
  const { x: viewX, y: viewY, zoom } = getViewport();
  
  // Convert flow position to screen position within the ReactFlow container
  // Flow position needs to be transformed by viewport: screenPos = flowPos * zoom + viewportOffset
  const screenX = position.x * zoom + viewX;
  const screenY = position.y * zoom + viewY;
  
  // Scale the node size based on zoom
  const scaledRadius = NODE_RADIUS * zoom;
  const scaledOuterThreshold = NODE_OUTER_THRESHOLD * zoom;
  
  return (
    <div
      className="ghost-node"
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        width: (scaledRadius + scaledOuterThreshold) * 2,
        height: (scaledRadius + scaledOuterThreshold) * 2,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      }}
    >
      {/* The visual circle */}
      <div
        style={{
          position: 'absolute',
          left: scaledOuterThreshold,
          top: scaledOuterThreshold,
          width: scaledRadius * 2,
          height: scaledRadius * 2,
          borderRadius: '50%',
          background: NODE_COLORS.default.background,
          border: `2px solid ${NODE_COLORS.default.border}`,
          opacity: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: NODE_COLORS.default.text,
          fontWeight: 500,
          fontSize: `${14 * zoom}px`,
        }}
      >
        ?
      </div>
    </div>
  );
}
