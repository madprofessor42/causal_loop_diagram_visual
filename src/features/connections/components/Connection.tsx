/**
 * Connection component - SVG arrow between two variables
 */

import { memo, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  selectConnection,
  removeConnection,
  selectSelectedConnectionId,
} from '../slice/connectionsSlice';
import { selectVariablesMap } from '../../variables';
import { calculatePath } from '../utils/pathCalculations';
import type { Connection as ConnectionType } from '../types/connection.types';
import styles from './Connection.module.css';

interface ConnectionProps {
  connection: ConnectionType;
}

/**
 * Renders an arrow connection between two variables
 * Wrapped in memo for performance optimization
 */
export const Connection = memo(function Connection({ connection }: ConnectionProps) {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(selectVariablesMap);
  const selectedId = useAppSelector(selectSelectedConnectionId);

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

  // Build class names
  const lineClassName = [
    styles.line,
    isSelected && styles.lineSelected,
  ].filter(Boolean).join(' ');

  const arrowheadClassName = [
    styles.arrowhead,
    isSelected && styles.arrowheadSelected,
  ].filter(Boolean).join(' ');

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
        className={lineClassName}
        d={pathData.path}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Arrowhead */}
      <polygon
        className={arrowheadClassName}
        points={pathData.arrowhead.points}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
    </g>
  );
});

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
