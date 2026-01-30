import { useReactFlow } from '@xyflow/react';
import { useAppSelector } from '../store/hooks';
import { selectDragNodeType } from '../store/slices/uiSlice';
import {
  STOCK_WIDTH,
  STOCK_HEIGHT,
  STOCK_COLORS,
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
  VARIABLE_COLORS,
} from '../constants';

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
  const nodeType = useAppSelector(selectDragNodeType);
  const { x: viewX, y: viewY, zoom } = getViewport();
  
  // Convert flow position to screen position within the ReactFlow container
  const screenX = position.x * zoom + viewX;
  const screenY = position.y * zoom + viewY;
  
  const isStock = nodeType === 'stock';
  const colors = isStock ? STOCK_COLORS : VARIABLE_COLORS;
  
  // Scale the node size based on zoom and node type
  const scaledWidth = (isStock ? STOCK_WIDTH : VARIABLE_WIDTH) * zoom;
  const scaledHeight = (isStock ? STOCK_HEIGHT : VARIABLE_HEIGHT) * zoom;
  
  return (
    <div
      className="ghost-node"
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        width: scaledWidth,
        height: scaledHeight,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        borderRadius: isStock ? 4 * zoom : '50%',
        background: colors.background,
        border: `2px solid ${colors.border}`,
        opacity: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text,
        fontWeight: 500,
        fontSize: `${14 * zoom}px`,
      }}
    >
      {isStock ? 'Stock' : 'Var'}
    </div>
  );
}
