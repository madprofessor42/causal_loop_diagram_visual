import type { Polarity } from '../../../types';
import { EDGE_COLORS, POLARITY_MARKER } from '../../../constants';

interface PolarityMarkerProps {
  polarity: Polarity;
  x: number;
  y: number;
  angle: number; // Angle of the edge at this point (in radians)
}

/**
 * Renders a polarity indicator (+/-) on a causal link edge
 */
export function PolarityMarker({ polarity, x, y, angle }: PolarityMarkerProps) {
  if (polarity === 'neutral') return null;

  const symbol = polarity === 'positive' ? '+' : '−';
  const color = polarity === 'positive' ? EDGE_COLORS.positive : EDGE_COLORS.negative;
  
  // Position marker perpendicular to edge, offset to the side
  const perpAngle = angle - Math.PI / 2;
  const offsetX = x + Math.cos(perpAngle) * POLARITY_MARKER.offset;
  const offsetY = y + Math.sin(perpAngle) * POLARITY_MARKER.offset;

  return (
    <g 
      transform={`translate(${offsetX}, ${offsetY})`}
      style={{ pointerEvents: 'none' }}
    >
      {/* Background circle */}
      <circle
        r={POLARITY_MARKER.size / 2}
        fill="white"
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Symbol */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={POLARITY_MARKER.fontSize}
        fontWeight={POLARITY_MARKER.fontWeight}
        style={{ userSelect: 'none' }}
      >
        {symbol}
      </text>
    </g>
  );
}
