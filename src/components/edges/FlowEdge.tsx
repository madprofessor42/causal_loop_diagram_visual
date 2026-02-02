import { useState, useRef, useEffect } from 'react';
import { useStore, useReactFlow, useConnection, type EdgeProps } from '@xyflow/react';
import { getStraightEdgeParams } from '../../utils/edge';
import { useEdgeHighlight, useParallelEdges } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectConnectionMode, uiActions } from '../../store/slices/uiSlice';
import {
  renderHitbox,
  renderEdgeOutline,
  renderEdgeLabel,
  calculateArrowPoints,
} from '../../utils/edgeRendering';
import type { FlowEdgeData } from '../../types';
import {
  ARROW_SIZE,
  FLOW_EDGE,
} from '../../constants';
import styles from './FlowEdge.module.css';

export type UpdateEdgeData = (edgeId: string, data: Partial<FlowEdgeData>) => void;

interface FlowEdgeProps extends EdgeProps {
  updateEdgeData?: UpdateEdgeData;
}

// Cloud SVG as inline path - simple cloud shape
const CLOUD_SIZE = 24;
const cloudPath = `
  M ${CLOUD_SIZE * 0.15},${CLOUD_SIZE * 0.6}
  C ${CLOUD_SIZE * 0.05},${CLOUD_SIZE * 0.6} 0,${CLOUD_SIZE * 0.5} ${CLOUD_SIZE * 0.05},${CLOUD_SIZE * 0.4}
  C 0,${CLOUD_SIZE * 0.3} ${CLOUD_SIZE * 0.1},${CLOUD_SIZE * 0.2} ${CLOUD_SIZE * 0.25},${CLOUD_SIZE * 0.25}
  C ${CLOUD_SIZE * 0.3},${CLOUD_SIZE * 0.1} ${CLOUD_SIZE * 0.45},${CLOUD_SIZE * 0.1} ${CLOUD_SIZE * 0.55},${CLOUD_SIZE * 0.2}
  C ${CLOUD_SIZE * 0.7},${CLOUD_SIZE * 0.1} ${CLOUD_SIZE * 0.85},${CLOUD_SIZE * 0.25} ${CLOUD_SIZE * 0.85},${CLOUD_SIZE * 0.4}
  C ${CLOUD_SIZE * 0.95},${CLOUD_SIZE * 0.5} ${CLOUD_SIZE * 0.85},${CLOUD_SIZE * 0.6} ${CLOUD_SIZE * 0.75},${CLOUD_SIZE * 0.6}
  Z
`;

// Invisible hitbox width for easier clicking
const HITBOX_WIDTH = 20;

// Cloud hitbox for dragging - larger than cloud for easier grabbing
const CLOUD_HITBOX_SIZE = 40;

/**
 * FlowEdge - Material flow between Stocks (thick straight arrow)
 * With valve indicator at midpoint
 * Supports bidirectional arrows and cloud icons at endpoints
 * Clouds are draggable to reposition
 */
function FlowEdge({ id, source, target, style, data, selected, updateEdgeData }: FlowEdgeProps) {
  const dispatch = useAppDispatch();
  const sourceNode = useStore((store) => store.nodeLookup.get(source));
  const targetNode = useStore((store) => store.nodeLookup.get(target));
  const { screenToFlowPosition } = useReactFlow();
  
  // Use custom hook for highlight logic
  const { highlightColor, shouldShowOutline, outlineWidth } = useEdgeHighlight(id, selected);
  
  // Dragging state
  const [isDraggingCloud, setIsDraggingCloud] = useState<'source' | 'target' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Calculate offset for parallel edges (if there's a Link edge between same nodes)
  const { offset: parallelOffset } = useParallelEdges(id, source, target, 'flow');
  
  // Connection state - detect when a Link can be connected to this Flow
  const connection = useConnection();
  const connectionMode = useAppSelector(selectConnectionMode);
  const isLinkConnectionInProgress = connection.inProgress && connectionMode === 'link';
  
  // Hover state for valve (when Link can be connected)
  const [isHoveringValve, setIsHoveringValve] = useState(false);


  const edgeData = data as FlowEdgeData | undefined;
  const isBidirectional = edgeData?.bidirectional ?? false;
  const hasCloudAtSource = edgeData?.sourceIsCloud ?? false;
  const hasCloudAtTarget = edgeData?.targetIsCloud ?? false;
  
  // Get fixed positions for cloud endpoints
  const fixedSourcePos = edgeData?.sourcePosition;
  const fixedTargetPos = edgeData?.targetPosition;

  // Handle pointer move and up for dragging
  useEffect(() => {
    if (!isDraggingCloud) return;
    
    const handlePointerMove = (event: PointerEvent) => {
      if (!updateEdgeData) return;
      
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      if (isDraggingCloud === 'target') {
        updateEdgeData(id, { targetPosition: flowPos });
      } else if (isDraggingCloud === 'source') {
        updateEdgeData(id, { sourcePosition: flowPos });
      }
    };
    
    const handlePointerUp = () => {
      setIsDraggingCloud(null);
      dragStartRef.current = null;
    };
    
    // Use capture phase to ensure we get the events
    window.addEventListener('pointermove', handlePointerMove, { capture: true });
    window.addEventListener('pointerup', handlePointerUp, { capture: true });
    window.addEventListener('pointercancel', handlePointerUp, { capture: true });
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
      window.removeEventListener('pointercancel', handlePointerUp, { capture: true });
    };
  }, [isDraggingCloud, id, updateEdgeData, screenToFlowPosition]);

  // Handle cloud drag start
  const handleCloudPointerDown = (cloudType: 'source' | 'target') => (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    // Capture pointer to ensure we get all subsequent events
    (event.target as Element).setPointerCapture(event.pointerId);
    setIsDraggingCloud(cloudType);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
  };
  
  // Calculate edge points
  let sx: number, sy: number, tx: number, ty: number;
  
  if (fixedSourcePos) {
    sx = fixedSourcePos.x;
    sy = fixedSourcePos.y;
  }
  
  if (fixedTargetPos) {
    tx = fixedTargetPos.x;
    ty = fixedTargetPos.y;
  }
  
  // Get node-based positions if not fixed
  // Pass parallelOffset to correctly calculate edge points on node boundaries
  if (sourceNode && targetNode && !fixedSourcePos && !fixedTargetPos) {
    const params = getStraightEdgeParams(sourceNode, targetNode, parallelOffset);
    sx = params.sx;
    sy = params.sy;
    tx = params.tx;
    ty = params.ty;
  } else if (sourceNode && fixedTargetPos) {
    // Calculate source point towards fixed target
    const sourcePos = sourceNode.position;
    const sourceWidth = sourceNode.measured?.width ?? 100;
    const sourceHeight = sourceNode.measured?.height ?? 60;
    const centerX = sourcePos.x + sourceWidth / 2;
    const centerY = sourcePos.y + sourceHeight / 2;
    
    const angle = Math.atan2(fixedTargetPos.y - centerY, fixedTargetPos.x - centerX);
    
    // Simple edge point calculation
    if (sourceNode.type === 'stock') {
      const hw = sourceWidth / 2;
      const hh = sourceHeight / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tanAngle = Math.abs(sin / cos);
      const edgeTan = hh / hw;
      
      if (tanAngle <= edgeTan) {
        sx = centerX + (cos > 0 ? hw : -hw);
        sy = centerY + (cos > 0 ? hw : -hw) * (sin / cos);
      } else {
        sy = centerY + (sin > 0 ? hh : -hh);
        sx = centerX + (sin > 0 ? hh : -hh) * (cos / sin);
      }
    } else {
      // Ellipse
      const rx = sourceWidth / 2;
      const ry = sourceHeight / 2;
      sx = centerX + rx * Math.cos(angle);
      sy = centerY + ry * Math.sin(angle);
    }
    
    tx = fixedTargetPos.x;
    ty = fixedTargetPos.y;
  } else if (fixedSourcePos && targetNode) {
    // Calculate target point from fixed source
    const targetPos = targetNode.position;
    const targetWidth = targetNode.measured?.width ?? 100;
    const targetHeight = targetNode.measured?.height ?? 60;
    const centerX = targetPos.x + targetWidth / 2;
    const centerY = targetPos.y + targetHeight / 2;
    
    const angle = Math.atan2(fixedSourcePos.y - centerY, fixedSourcePos.x - centerX);
    
    if (targetNode.type === 'stock') {
      const hw = targetWidth / 2;
      const hh = targetHeight / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tanAngle = Math.abs(sin / cos);
      const edgeTan = hh / hw;
      
      if (tanAngle <= edgeTan) {
        tx = centerX + (cos > 0 ? hw : -hw);
        ty = centerY + (cos > 0 ? hw : -hw) * (sin / cos);
      } else {
        ty = centerY + (sin > 0 ? hh : -hh);
        tx = centerX + (sin > 0 ? hh : -hh) * (cos / sin);
      }
    } else {
      const rx = targetWidth / 2;
      const ry = targetHeight / 2;
      tx = centerX + rx * Math.cos(angle);
      ty = centerY + ry * Math.sin(angle);
    }
    
    sx = fixedSourcePos.x;
    sy = fixedSourcePos.y;
  } else if (!sourceNode && !targetNode) {
    // Both are fixed positions (shouldn't happen but handle it)
    return null;
  } else {
    return null;
  }

  // Calculate angle for arrow and valve direction
  const angle = Math.atan2(ty - sy, tx - sx);
  const perpAngle = angle + Math.PI / 2;
  
  // Start and end points are already correctly positioned from getStraightEdgeParams
  const startX = sx;
  const startY = sy;
  const endX = tx;
  const endY = ty;

  // Straight line path (with offset)
  const edgePath = `M ${startX},${startY} L ${endX},${endY}`;

  // Calculate midpoint for valve
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // Arrow size for flow
  const flowArrowSize = ARROW_SIZE * 1.5;

  // Offset arrow back if there's a cloud at target/source
  const targetArrowOffset = hasCloudAtTarget ? CLOUD_SIZE / 2 + 5 : 0;
  const arrowTx = endX - targetArrowOffset * Math.cos(angle);
  const arrowTy = endY - targetArrowOffset * Math.sin(angle);
  
  const sourceArrowOffset = hasCloudAtSource ? CLOUD_SIZE / 2 + 5 : 0;
  const arrowSx = startX + sourceArrowOffset * Math.cos(angle);
  const arrowSy = startY + sourceArrowOffset * Math.sin(angle);

  // Calculate arrow points using utility function
  const targetArrow = calculateArrowPoints(arrowTx, arrowTy, angle, flowArrowSize);
  const sourceArrow = calculateArrowPoints(arrowSx, arrowSy, angle, flowArrowSize, true);

  // Valve indicator at midpoint (small perpendicular line)
  const valveSize = FLOW_EDGE.valveSize;
  const valve1X = midX + valveSize * Math.cos(perpAngle);
  const valve1Y = midY + valveSize * Math.sin(perpAngle);
  const valve2X = midX - valveSize * Math.cos(perpAngle);
  const valve2Y = midY - valveSize * Math.sin(perpAngle);

  // Label
  const label = edgeData?.label;

  return (
    <g className="react-flow__edge">
      {/* Invisible wide path for easier clicking */}
      {renderHitbox(edgePath, HITBOX_WIDTH, styles.hitbox)}
      
      {/* Outline layer - drawn first (underneath) when highlighted or selected */}
      {shouldShowOutline && highlightColor && (
        <>
          {/* Outline for main edge path */}
          {renderEdgeOutline(edgePath, true, highlightColor, outlineWidth, undefined, styles.outline)}
          
          {/* Outline for valve indicator */}
          <line
            x1={valve1X}
            y1={valve1Y}
            x2={valve2X}
            y2={valve2Y}
            strokeWidth={outlineWidth}
            stroke={highlightColor}
            strokeLinecap="round"
            className={styles.outline}
          />
          
          {/* Outline for arrowhead at target */}
          <path
            d={`M ${targetArrow.x1},${targetArrow.y1} L ${arrowTx},${arrowTy} L ${targetArrow.x2},${targetArrow.y2} Z`}
            strokeWidth={3}
            stroke={highlightColor}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.outline}
          />
          
          {/* Outline for arrowhead at source - only for bidirectional */}
          {isBidirectional && (
            <path
              d={`M ${sourceArrow.x1},${sourceArrow.y1} L ${arrowSx},${arrowSy} L ${sourceArrow.x2},${sourceArrow.y2} Z`}
              strokeWidth={3}
              stroke={highlightColor}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.outline}
            />
          )}
        </>
      )}
      
      {/* Main edge path - thick solid line for Flow (always in original color) */}
      <path
        id={id}
        className={`react-flow__edge-path ${styles.mainPath}`}
        d={edgePath}
        strokeWidth={FLOW_EDGE.strokeWidth}
        stroke={FLOW_EDGE.lineColor}
        fill="none"
        strokeLinecap="round"
        style={{ ...style, stroke: FLOW_EDGE.lineColor }}
      />
      
      {/* Valve indicator at midpoint */}
      {/* Highlight when a Link connection can be made */}
      <line
        x1={valve1X}
        y1={valve1Y}
        x2={valve2X}
        y2={valve2Y}
        strokeWidth={FLOW_EDGE.strokeWidth}
        stroke={isLinkConnectionInProgress && isHoveringValve ? '#3b82f6' : FLOW_EDGE.color}
        strokeLinecap="round"
        className={`${styles.mainPath} ${isLinkConnectionInProgress ? styles.valveConnectable : ''}`}
      />
      
      {/* Visible connection handle at valve - only shown when Link mode is active */}
      {connectionMode === 'link' && (
        <circle
          cx={midX}
          cy={midY}
          r={8}
          fill={isHoveringValve ? '#e0e7ff' : 'white'}
          stroke={isHoveringValve ? '#3b82f6' : FLOW_EDGE.color}
          strokeWidth={2}
          className={styles.flowHandle}
          data-flow-handle={id}
          data-flow-id={id}
          onMouseEnter={() => setIsHoveringValve(true)}
          onMouseLeave={() => setIsHoveringValve(false)}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const cursorPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            dispatch(uiActions.startFlowConnection({
              flowEdgeId: id,
              cursorPosition,
              screenPosition: { x: e.clientX, y: e.clientY },
            }));
          }}
        />
      )}
      
      {/* Invisible hitbox for valve - larger area for easier hovering during Link connection */}
      {isLinkConnectionInProgress && (
        <circle
          cx={midX}
          cy={midY}
          r={valveSize + 10}
          fill="transparent"
          className={styles.valveHitbox}
          onMouseEnter={() => setIsHoveringValve(true)}
          onMouseLeave={() => setIsHoveringValve(false)}
        />
      )}
      
      {/* Filled arrowhead at target (always in original color) */}
      <path
        d={`M ${targetArrow.x1},${targetArrow.y1} L ${arrowTx},${arrowTy} L ${targetArrow.x2},${targetArrow.y2} Z`}
        strokeWidth={1}
        stroke={FLOW_EDGE.color}
        fill={FLOW_EDGE.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.mainPath}
      />
      
      {/* Filled arrowhead at source - only for bidirectional (always in original color) */}
      {isBidirectional && (
        <path
          d={`M ${sourceArrow.x1},${sourceArrow.y1} L ${arrowSx},${arrowSy} L ${sourceArrow.x2},${sourceArrow.y2} Z`}
          strokeWidth={1}
          stroke={FLOW_EDGE.color}
          fill={FLOW_EDGE.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.mainPath}
        />
      )}
      
      {/* Cloud at target - draggable */}
      {hasCloudAtTarget && (
        <>
          {/* Cloud visual */}
          <g transform={`translate(${endX - CLOUD_SIZE / 2}, ${endY - CLOUD_SIZE / 2})`}>
            <path
              d={cloudPath}
              fill="#f5f5f5"
              stroke={selected || isDraggingCloud === 'target' ? '#3b82f6' : '#999999'}
              strokeWidth={1.5}
              className={styles.cloud}
            />
          </g>
          {/* Invisible hitbox for dragging - on top of everything */}
          <rect
            x={endX - CLOUD_HITBOX_SIZE / 2}
            y={endY - CLOUD_HITBOX_SIZE / 2}
            width={CLOUD_HITBOX_SIZE}
            height={CLOUD_HITBOX_SIZE}
            fill="transparent"
            className={`${styles.cloudHitbox} ${isDraggingCloud === 'target' ? styles.grabbing : styles.grab}`}
            onPointerDown={handleCloudPointerDown('target')}
          />
        </>
      )}
      
      {/* Cloud at source - draggable */}
      {hasCloudAtSource && (
        <>
          {/* Cloud visual */}
          <g transform={`translate(${startX - CLOUD_SIZE / 2}, ${startY - CLOUD_SIZE / 2})`}>
            <path
              d={cloudPath}
              fill="#f5f5f5"
              stroke={selected || isDraggingCloud === 'source' ? '#3b82f6' : '#999999'}
              strokeWidth={1.5}
              className={styles.cloud}
            />
          </g>
          {/* Invisible hitbox for dragging - on top of everything */}
          <rect
            x={startX - CLOUD_HITBOX_SIZE / 2}
            y={startY - CLOUD_HITBOX_SIZE / 2}
            width={CLOUD_HITBOX_SIZE}
            height={CLOUD_HITBOX_SIZE}
            fill="transparent"
            className={`${styles.cloudHitbox} ${isDraggingCloud === 'source' ? styles.grabbing : styles.grab}`}
            onPointerDown={handleCloudPointerDown('source')}
          />
        </>
      )}
      
      {/* Label if present */}
      {renderEdgeLabel(label, midX, midY, FLOW_EDGE.color, styles.labelText, styles.labelBg)}
    </g>
  );
}

// Export without memo to ensure re-renders when parallel edges change
export default FlowEdge;
