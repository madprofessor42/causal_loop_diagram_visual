/**
 * CausalEdge - Floating edge that connects to circle borders
 * Displays polarity indicator (+/-) on the edge
 */

import { memo, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react';
import { getFloatingEdgeParams } from '../utils/floatingEdge';
import styles from './CausalEdge.module.css';

/**
 * Polarity types for causal relationships
 */
export type CausalPolarity = 'positive' | 'negative' | 'unknown';

/**
 * Data structure for CausalEdge
 */
export interface CausalEdgeData {
  polarity: CausalPolarity;
  /** Offset for parallel edges - positive/negative for different sides */
  offset?: number;
}

/**
 * Get display label for polarity
 */
function getPolarityLabel(polarity: CausalPolarity): string {
  switch (polarity) {
    case 'positive':
      return '+';
    case 'negative':
      return '−'; // Using proper minus sign
    default:
      return '?';
  }
}

/**
 * Get CSS class for polarity styling
 */
function getPolarityClassName(polarity: CausalPolarity): string {
  switch (polarity) {
    case 'positive':
      return styles.positive;
    case 'negative':
      return styles.negative;
    default:
      return styles.unknown;
  }
}

/**
 * Create a curved path with control point offset perpendicular to the line
 * This creates nice arcs for parallel edges
 * @param curvature - absolute value of curve offset, sign doesn't matter as curveDirection controls it
 * @param curveDirection - 1 for curve below the line, -1 for curve above the line
 */
function createCurvedPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  curvature: number,
  curveDirection: number
): { path: string; labelX: number; labelY: number; controlX: number; controlY: number } {
  // Midpoint
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;
  
  // Direction vector - always calculate left-to-right for consistent perpendicular
  const leftX = Math.min(sx, tx);
  const rightX = Math.max(sx, tx);
  const leftY = sx < tx ? sy : ty;
  const rightY = sx < tx ? ty : sy;
  
  const dx = rightX - leftX;
  const dy = rightY - leftY;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) {
    return { path: `M ${sx} ${sy} L ${tx} ${ty}`, labelX: midX, labelY: midY, controlX: midX, controlY: midY };
  }
  
  // Perpendicular unit vector (consistent direction: positive = below the line)
  const perpX = -dy / len;
  const perpY = dx / len;
  
  // Control point offset perpendicular to the line
  // curveDirection: 1 = below, -1 = above
  const controlX = midX + perpX * curvature * curveDirection;
  const controlY = midY + perpY * curvature * curveDirection;
  
  // Quadratic bezier path
  const path = `M ${sx} ${sy} Q ${controlX} ${controlY} ${tx} ${ty}`;
  
  // Label position at the curve apex (on the quadratic bezier at t=0.5)
  const labelX = 0.25 * sx + 0.5 * controlX + 0.25 * tx;
  const labelY = 0.25 * sy + 0.5 * controlY + 0.25 * ty;
  
  return { path, labelX, labelY, controlX, controlY };
}

/**
 * Custom floating edge component for CLD connections
 * - Connects to circle borders (not fixed handles)
 * - Curved bezier path
 * - Arrow marker at end
 * - Polarity indicator (+/-) at midpoint
 */
export const CausalEdge = memo(function CausalEdge({
  id,
  source,
  target,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  
  const edgeData = (data ?? { polarity: 'unknown', offset: 0 }) as unknown as CausalEdgeData;
  const offset = edgeData.offset ?? 0;
  
  // Determine curve direction based on source/target relationship
  // If source < target (alphabetically), curve goes below (1)
  // If source > target, curve goes above (-1)
  // This ensures bidirectional edges have opposite curve directions
  const curveDirection = source < target ? 1 : -1;
  
  // Calculate floating edge path with offset for parallel edges
  // The offset shifts where edges connect to circle borders
  const { sx, sy, tx, ty } = useMemo(() => {
    if (!sourceNode || !targetNode) {
      return { sx: 0, sy: 0, tx: 0, ty: 0, sourcePos: undefined, targetPos: undefined };
    }
    return getFloatingEdgeParams(sourceNode, targetNode, offset, curveDirection);
  }, [sourceNode, targetNode, offset, curveDirection]);
  
  // Create curved path with curvature based on offset
  // The curvature value determines how far the control point is from the midpoint
  const curvature = Math.abs(offset) * 5; // Multiply for more pronounced curve
  const { path: edgePath, labelX, labelY } = useMemo(() => {
    return createCurvedPath(sx, sy, tx, ty, curvature, curveDirection);
  }, [sx, sy, tx, ty, curvature, curveDirection]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const polarityLabel = getPolarityLabel(edgeData.polarity);
  const polarityClassName = getPolarityClassName(edgeData.polarity);

  const labelClassName = [
    styles.label,
    polarityClassName,
    selected && styles.labelSelected,
  ].filter(Boolean).join(' ');

  // Use inline styles for SVG path since CSS modules don't work well with SVG
  const edgeStyle = {
    stroke: selected ? '#339af0' : '#868e96',
    strokeWidth: selected ? 3 : 2,
    fill: 'none',
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        <div
          className={labelClassName}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Dispatch event to toggle polarity
            window.dispatchEvent(new CustomEvent('edge-polarity-toggle', {
              detail: { id }
            }));
          }}
          title="Click to change polarity"
        >
          {polarityLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

export default CausalEdge;
