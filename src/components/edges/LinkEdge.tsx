import { useStore, type EdgeProps } from '@xyflow/react';
import { getStraightEdgeParams, getNodeBoundaryPoint } from '../../utils/edge';
import { useEdgeHighlight, useParallelEdges, useFlowEdgeMidpoint } from '../../hooks';
import {
  renderHitbox,
  renderEdgeOutline,
  renderArrow,
  renderEdgeLabel,
  calculateArrowPoints,
} from '../../utils/edgeRendering';
import type { LinkEdgeData } from '../../types';
import { LINK_EDGE } from '../../constants';
import styles from './LinkEdge.module.css';

export type UpdateEdgeData = (edgeId: string, data: Partial<LinkEdgeData>) => void;

interface LinkEdgeProps extends EdgeProps {
  updateEdgeData?: UpdateEdgeData;
}

const HITBOX_WIDTH = 20;

/** Render the link edge with calculated endpoints */
function renderLinkEdge(
  id: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  showStartArrow: boolean,
  showEndArrow: boolean,
  label: string | undefined,
  shouldShowOutline: boolean,
  highlightColor: string | null,
  outlineWidth: number,
  style?: React.CSSProperties
) {
  const edgePath = `M ${startX},${startY} L ${endX},${endY}`;
  const angle = Math.atan2(endY - startY, endX - startX);
  
  const endArrow = calculateArrowPoints(endX, endY, angle, LINK_EDGE.arrowSize);
  const startArrow = calculateArrowPoints(startX, startY, angle, LINK_EDGE.arrowSize, true);
  
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  return (
    <g className="react-flow__edge">
      {renderHitbox(edgePath, HITBOX_WIDTH, styles.hitbox)}
      
      {shouldShowOutline && highlightColor && (
        <>
          {renderEdgeOutline(edgePath, true, highlightColor, outlineWidth, LINK_EDGE.dashArray, styles.outline)}
          {showEndArrow && renderArrow(endArrow.x1, endArrow.y1, endX, endY, endArrow.x2, endArrow.y2, outlineWidth, highlightColor, styles.outline)}
          {showStartArrow && renderArrow(startArrow.x1, startArrow.y1, startX, startY, startArrow.x2, startArrow.y2, outlineWidth, highlightColor, styles.outline)}
        </>
      )}
      
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
      
      {showEndArrow && renderArrow(endArrow.x1, endArrow.y1, endX, endY, endArrow.x2, endArrow.y2, LINK_EDGE.strokeWidth, LINK_EDGE.color, styles.mainPath)}
      {showStartArrow && renderArrow(startArrow.x1, startArrow.y1, startX, startY, startArrow.x2, startArrow.y2, LINK_EDGE.strokeWidth, LINK_EDGE.color, styles.mainPath)}
      
      {renderEdgeLabel(label, midX, midY, LINK_EDGE.color, styles.labelText, styles.labelBg)}
    </g>
  );
}

/**
 * LinkEdge - Information connection (dashed straight line with arrow)
 */
function LinkEdge({ id, source, target, style, data, selected }: LinkEdgeProps) {
  const sourceNode = useStore((store) => store.nodeLookup.get(source));
  const targetNode = useStore((store) => store.nodeLookup.get(target));
  
  const { highlightColor, shouldShowOutline, outlineWidth } = useEdgeHighlight(id, selected);

  const edgeData = data as LinkEdgeData | undefined;
  const isBidirectional = edgeData?.bidirectional ?? false;
  const isReversed = edgeData?.reversed ?? false;
  const label = edgeData?.label;
  
  // Flow edge connection info
  const targetIsFlow = edgeData?.targetIsFlowEdge ?? false;
  const sourceIsFlow = edgeData?.sourceIsFlowEdge ?? false;
  const targetFlowMidpoint = useFlowEdgeMidpoint(targetIsFlow ? edgeData?.targetFlowEdgeId ?? '' : '');
  const sourceFlowMidpoint = useFlowEdgeMidpoint(sourceIsFlow ? edgeData?.sourceFlowEdgeId ?? '' : '');
  
  // Parallel edge offset (only for node-to-node)
  const { offset } = useParallelEdges(id, source, target, 'link');

  // Calculate start and end points based on connection type
  let startX: number, startY: number, endX: number, endY: number;
  
  // Flow → Flow
  if (sourceIsFlow && targetIsFlow) {
    if (!sourceFlowMidpoint || !targetFlowMidpoint) return null;
    
    startX = sourceFlowMidpoint.x;
    startY = sourceFlowMidpoint.y;
    endX = targetFlowMidpoint.x;
    endY = targetFlowMidpoint.y;
  }
  // Node → Flow
  else if (targetIsFlow) {
    if (!sourceNode || !targetFlowMidpoint) return null;
    
    const nodeWidth = sourceNode.measured?.width ?? 100;
    const nodeHeight = sourceNode.measured?.height ?? 60;
    const nodeCenterX = sourceNode.position.x + nodeWidth / 2;
    const nodeCenterY = sourceNode.position.y + nodeHeight / 2;
    
    const boundary = getNodeBoundaryPoint(
      nodeCenterX, nodeCenterY, nodeWidth, nodeHeight,
      targetFlowMidpoint.x, targetFlowMidpoint.y,
      sourceNode.type === 'stock' ? 'rect' : 'ellipse'
    );
    
    startX = boundary.x;
    startY = boundary.y;
    endX = targetFlowMidpoint.x;
    endY = targetFlowMidpoint.y;
  }
  // Flow → Node
  else if (sourceIsFlow) {
    if (!sourceNode || !sourceFlowMidpoint) return null;
    
    const nodeWidth = sourceNode.measured?.width ?? 100;
    const nodeHeight = sourceNode.measured?.height ?? 60;
    const nodeCenterX = sourceNode.position.x + nodeWidth / 2;
    const nodeCenterY = sourceNode.position.y + nodeHeight / 2;
    
    const boundary = getNodeBoundaryPoint(
      nodeCenterX, nodeCenterY, nodeWidth, nodeHeight,
      sourceFlowMidpoint.x, sourceFlowMidpoint.y,
      sourceNode.type === 'stock' ? 'rect' : 'ellipse'
    );
    
    startX = sourceFlowMidpoint.x;
    startY = sourceFlowMidpoint.y;
    endX = boundary.x;
    endY = boundary.y;
  }
  // Node → Node
  else {
    if (!sourceNode || !targetNode) return null;
    
    const params = getStraightEdgeParams(sourceNode, targetNode, offset);
    startX = params.sx;
    startY = params.sy;
    endX = params.tx;
    endY = params.ty;
  }

  // Handle reversed direction
  if (isReversed) {
    [startX, endX] = [endX, startX];
    [startY, endY] = [endY, startY];
  }

  // Determine arrow visibility
  const showEndArrow = true;  // Always show arrow at end
  const showStartArrow = isBidirectional;  // Show at start only if bidirectional

  return renderLinkEdge(
    id, startX, startY, endX, endY,
    showStartArrow, showEndArrow, label,
    shouldShowOutline, highlightColor, outlineWidth, style
  );
}

export default LinkEdge;
