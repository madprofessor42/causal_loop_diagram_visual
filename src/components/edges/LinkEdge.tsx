import { useStore, type EdgeProps } from '@xyflow/react';
import { getStraightEdgeParams } from '../../utils/edge';
import { useEdgeHighlight, useParallelEdges } from '../../hooks';
import {
  renderHitbox,
  renderEdgeOutline,
  renderArrow,
  renderEdgeLabel,
  calculateArrowPoints,
} from '../../utils/edgeRendering';
import type { LinkEdgeData } from '../../types';
import {
  LINK_EDGE,
} from '../../constants';
import styles from './LinkEdge.module.css';

export type UpdateEdgeData = (edgeId: string, data: Partial<LinkEdgeData>) => void;

interface LinkEdgeProps extends EdgeProps {
  updateEdgeData?: UpdateEdgeData;
}

// Invisible hitbox width for easier clicking
const HITBOX_WIDTH = 20;

/**
 * LinkEdge - Information connection (dashed straight line with arrow)
 * Supports bidirectional arrows when data.bidirectional is true
 */
function LinkEdge({ id, source, target, style, data, selected }: LinkEdgeProps) {
  const sourceNode = useStore((store) => store.nodeLookup.get(source));
  const targetNode = useStore((store) => store.nodeLookup.get(target));
  
  // Use custom hook for highlight logic
  const { highlightColor, shouldShowOutline, outlineWidth } = useEdgeHighlight(id, selected);
  
  // Calculate offset for parallel edges (if there's a Flow edge between same nodes)
  const { offset } = useParallelEdges(id, source, target, 'link');

  if (!sourceNode || !targetNode) {
    return null;
  }

  const edgeData = data as LinkEdgeData | undefined;
  const isBidirectional = edgeData?.bidirectional ?? false;
  
  // Get edge params with perpendicular offset applied during calculation
  // This ensures edge points are correctly positioned on node boundaries
  const { sx, sy, tx, ty } = getStraightEdgeParams(sourceNode, targetNode, offset);

  // Calculate angle for arrow direction
  const angle = Math.atan2(ty - sy, tx - sx);
  
  // Start and end points are already correctly positioned
  const startX = sx;
  const startY = sy;
  const endX = tx;
  const endY = ty;

  // Straight line path (with offset)
  const edgePath = `M ${startX},${startY} L ${endX},${endY}`;

  // Calculate arrow points using utility function
  const targetArrow = calculateArrowPoints(endX, endY, angle, LINK_EDGE.arrowSize);
  const sourceArrow = calculateArrowPoints(startX, startY, angle, LINK_EDGE.arrowSize, true);

  // Label
  const label = edgeData?.label;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  return (
    <g className="react-flow__edge">
      {/* Invisible wide path for easier clicking */}
      {renderHitbox(edgePath, HITBOX_WIDTH, styles.hitbox)}
      
      {/* Outline layer - drawn first (underneath) when highlighted or selected */}
      {shouldShowOutline && highlightColor && (
        <>
          {/* Outline for main edge path */}
          {renderEdgeOutline(edgePath, true, highlightColor, outlineWidth, LINK_EDGE.dashArray, styles.outline)}
          
          {/* Outline for arrow at target */}
          {renderArrow(targetArrow.x1, targetArrow.y1, endX, endY, targetArrow.x2, targetArrow.y2, outlineWidth, highlightColor, styles.outline)}
          
          {/* Outline for arrow at source - only for bidirectional */}
          {isBidirectional && renderArrow(sourceArrow.x1, sourceArrow.y1, startX, startY, sourceArrow.x2, sourceArrow.y2, outlineWidth, highlightColor, styles.outline)}
        </>
      )}
      
      {/* Main edge path - dashed line for Link (always in original color) */}
      <path
        id={id}
        className={`react-flow__edge-path ${styles.mainPath}`}
        d={edgePath}
        strokeWidth={LINK_EDGE.strokeWidth}
        stroke={LINK_EDGE.color}
        fill="none"
        strokeDasharray={LINK_EDGE.dashArray}
        strokeLinecap="round"
        style={{ ...style, stroke: LINK_EDGE.color, strokeWidth: LINK_EDGE.strokeWidth }}
      />
      
      {/* Arrow at target (always in original color) */}
      {renderArrow(targetArrow.x1, targetArrow.y1, endX, endY, targetArrow.x2, targetArrow.y2, LINK_EDGE.strokeWidth, LINK_EDGE.color, styles.mainPath)}
      
      {/* Arrow at source - only for bidirectional (always in original color) */}
      {isBidirectional && renderArrow(sourceArrow.x1, sourceArrow.y1, startX, startY, sourceArrow.x2, sourceArrow.y2, LINK_EDGE.strokeWidth, LINK_EDGE.color, styles.mainPath)}
      
      {/* Label if present */}
      {renderEdgeLabel(label, midX, midY, LINK_EDGE.color, styles.labelText, styles.labelBg)}
    </g>
  );
}

// Export without memo to ensure re-renders when parallel edges change
export default LinkEdge;
