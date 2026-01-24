/**
 * Connection component - SVG arrow between two variables
 */

import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectConnection, removeConnection } from '../slice/connectionsSlice';
import { calculatePath } from '../utils/pathCalculations';
import type { Connection as ConnectionType } from '../types/connection.types';
import styles from './Connection.module.css';

interface ConnectionProps {
  connection: ConnectionType;
}

/**
 * Renders an arrow connection between two variables
 */
export function Connection({ connection }: ConnectionProps) {
  const dispatch = useAppDispatch();
  const variables = useAppSelector((state) => state.variables.items);
  const selectedId = useAppSelector((state) => state.connections.selectedId);

  const source = variables[connection.sourceId];
  const target = variables[connection.targetId];

  const isSelected = selectedId === connection.id;

  // Calculate path only when source or target changes
  const pathData = useMemo(() => {
    if (!source || !target) return null;
    return calculatePath(source, target);
  }, [source, target]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(selectConnection(connection.id));
  }, [dispatch, connection.id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeConnection(connection.id));
  }, [dispatch, connection.id]);

  // Don't render if either variable is missing
  if (!pathData) return null;

  return (
    <g>
      {/* Invisible wider path for easier clicking */}
      <path
        className={styles.hitArea}
        d={pathData.path}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Visible line */}
      <path
        className={`${styles.line} ${isSelected ? styles.lineSelected : ''}`}
        d={pathData.path}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Arrowhead */}
      <polygon
        className={`${styles.arrowhead} ${isSelected ? styles.arrowheadSelected : ''}`}
        points={pathData.arrowhead.points}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
    </g>
  );
}

/**
 * Props for drawing connection (temporary line while drawing)
 */
interface DrawingConnectionProps {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

/**
 * Renders a temporary connection while drawing
 */
export function DrawingConnection({ startPoint, endPoint }: DrawingConnectionProps) {
  const path = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;

  return (
    <g>
      <path
        className={styles.lineDrawing}
        d={path}
      />
    </g>
  );
}
