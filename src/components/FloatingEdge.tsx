import { useCallback } from 'react';
import { useStore, type EdgeProps } from '@xyflow/react';
import { getEdgeParams } from './utils/edgeUtils';

interface FloatingEdgeData {
  sourceAngle?: number;
  targetAngle?: number;
}

// Arrow configuration
const ARROW_SIZE = 8;
const STROKE_WIDTH = 1.5;
const STROKE_COLOR = '#1a1a1a';

function FloatingEdge({ id, source, target, style, data }: EdgeProps) {
  const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Cast data to our expected type
  const edgeData = data as FloatingEdgeData | undefined;

  // Pass stored angles for precise edge positioning
  const {
    sx, sy, tx, ty,
    sourceControlOffsetX, sourceControlOffsetY,
    targetControlOffsetX, targetControlOffsetY
  } = getEdgeParams(sourceNode, targetNode, {
    sourceAngle: edgeData?.sourceAngle,
    targetAngle: edgeData?.targetAngle,
  });

  // Calculate control points for cubic bezier curve
  const sourceControlX = sx + sourceControlOffsetX;
  const sourceControlY = sy + sourceControlOffsetY;
  const targetControlX = tx + targetControlOffsetX;
  const targetControlY = ty + targetControlOffsetY;

  // Check if we need a curve (if any deviation exists)
  const hasCurve = Math.abs(sourceControlOffsetX) > 0.1 || Math.abs(sourceControlOffsetY) > 0.1 ||
                   Math.abs(targetControlOffsetX) > 0.1 || Math.abs(targetControlOffsetY) > 0.1;

  // Build path
  let edgePath: string;
  let arrowAngle: number;
  
  if (hasCurve) {
    // Cubic bezier curve: M start C control1 control2 end
    edgePath = `M ${sx},${sy} C ${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${tx},${ty}`;
    // Arrow angle is tangent at end point = direction from last control point to end
    arrowAngle = Math.atan2(ty - targetControlY, tx - targetControlX);
  } else {
    // Straight line
    edgePath = `M ${sx},${sy} L ${tx},${ty}`;
    // Arrow angle is direction of line
    arrowAngle = Math.atan2(ty - sy, tx - sx);
  }

  // Calculate arrow head points (simple V-shape arrow)
  const arrowAngle1 = arrowAngle + Math.PI * 0.8; // 144 degrees from line direction
  const arrowAngle2 = arrowAngle - Math.PI * 0.8; // -144 degrees from line direction
  
  const arrowX1 = tx + ARROW_SIZE * Math.cos(arrowAngle1);
  const arrowY1 = ty + ARROW_SIZE * Math.sin(arrowAngle1);
  const arrowX2 = tx + ARROW_SIZE * Math.cos(arrowAngle2);
  const arrowY2 = ty + ARROW_SIZE * Math.sin(arrowAngle2);

  return (
    <g className="react-flow__edge">
      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={STROKE_WIDTH}
        stroke={STROKE_COLOR}
        fill="none"
        strokeLinecap="round"
        style={style}
      />
      {/* Custom arrowhead - V-shape */}
      <path
        d={`M ${arrowX1},${arrowY1} L ${tx},${ty} L ${arrowX2},${arrowY2}`}
        strokeWidth={STROKE_WIDTH}
        stroke={STROKE_COLOR}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default FloatingEdge;

