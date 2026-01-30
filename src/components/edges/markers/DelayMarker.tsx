import { EDGE_COLORS, DELAY_MARKER } from '../../../constants';

interface DelayMarkerProps {
  x: number;
  y: number;
  angle: number; // Angle of the edge at this point (in radians)
}

/**
 * Renders a delay indicator (||) on a causal link edge
 * Used to show delayed effects in causal loop diagrams
 */
export function DelayMarker({ x, y, angle }: DelayMarkerProps) {
  // Two parallel lines perpendicular to edge (||)
  const perpAngle = angle + Math.PI / 2;
  const { lineLength, lineGap, strokeWidth } = DELAY_MARKER;
  
  const line1Start = {
    x: x + Math.cos(perpAngle) * lineLength / 2 - Math.cos(angle) * lineGap,
    y: y + Math.sin(perpAngle) * lineLength / 2 - Math.sin(angle) * lineGap,
  };
  const line1End = {
    x: x - Math.cos(perpAngle) * lineLength / 2 - Math.cos(angle) * lineGap,
    y: y - Math.sin(perpAngle) * lineLength / 2 - Math.sin(angle) * lineGap,
  };
  const line2Start = {
    x: x + Math.cos(perpAngle) * lineLength / 2 + Math.cos(angle) * lineGap,
    y: y + Math.sin(perpAngle) * lineLength / 2 + Math.sin(angle) * lineGap,
  };
  const line2End = {
    x: x - Math.cos(perpAngle) * lineLength / 2 + Math.cos(angle) * lineGap,
    y: y - Math.sin(perpAngle) * lineLength / 2 + Math.sin(angle) * lineGap,
  };

  return (
    <g style={{ pointerEvents: 'none' }}>
      <line
        x1={line1Start.x}
        y1={line1Start.y}
        x2={line1End.x}
        y2={line1End.y}
        stroke={EDGE_COLORS.default}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1={line2Start.x}
        y1={line2Start.y}
        x2={line2End.x}
        y2={line2End.y}
        stroke={EDGE_COLORS.default}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </g>
  );
}
