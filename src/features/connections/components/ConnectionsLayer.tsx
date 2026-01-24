/**
 * ConnectionsLayer component - SVG layer for all connections
 */

import { useAppSelector } from '../../../app/hooks';
import { Connection, DrawingConnection } from './Connection';
import { calculateDrawingPath } from '../utils/pathCalculations';

interface ConnectionsLayerProps {
  width: number;
  height: number;
}

/**
 * SVG layer that renders all connections and the currently drawing connection
 */
export function ConnectionsLayer({ width, height }: ConnectionsLayerProps) {
  const connectionIds = useAppSelector((state) => state.connections.ids);
  const connections = useAppSelector((state) => state.connections.items);
  const drawing = useAppSelector((state) => state.connections.drawing);
  const variables = useAppSelector((state) => state.variables.items);

  // Calculate drawing path if currently drawing
  const drawingPath = (() => {
    if (!drawing || !drawing.isDrawing) return null;
    
    const source = variables[drawing.sourceId];
    if (!source) return null;
    
    return calculateDrawingPath(source, drawing.tempEndPoint);
  })();

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* Render all existing connections */}
      <g style={{ pointerEvents: 'auto' }}>
        {connectionIds.map((id) => (
          <Connection key={id} connection={connections[id]} />
        ))}
      </g>

      {/* Render the connection being drawn */}
      {drawingPath && (
        <DrawingConnection
          startPoint={drawingPath.startPoint}
          endPoint={drawingPath.endPoint}
        />
      )}
    </svg>
  );
}
