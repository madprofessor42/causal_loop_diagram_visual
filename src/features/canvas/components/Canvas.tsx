/**
 * Canvas component - The main drawing area for the CLD
 */

import { useCallback, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectVariable, selectVariablesMap, selectVariableIds, selectSelectedVariableId, removeVariable } from '../../variables';
import { updateDrawing, cancelDrawing, selectIsDrawing, removeConnectionsByVariableId } from '../../connections';
import { Variable } from '../../variables/components/Variable';
import { ConnectionsLayer } from '../../connections/components/ConnectionsLayer';
import type { Position, TransformState } from '../../../types/common.types';
import { screenToCanvas } from '../../../utils/geometry';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import styles from './Canvas.module.css';

interface CanvasProps {
  transform?: TransformState;
}

/**
 * Main canvas component with drop zone and connection drawing support
 */
export function Canvas({ transform }: CanvasProps) {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const variableIds = useAppSelector(selectVariableIds);
  const variables = useAppSelector(selectVariablesMap);
  const isDrawing = useAppSelector(selectIsDrawing);
  const selectedVariableId = useAppSelector(selectSelectedVariableId);

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  // Handle click on empty canvas area to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas (not a child)
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains(styles.canvas)) {
      dispatch(selectVariable(null));
    }
  }, [dispatch]);

  // Track mouse movement for connection drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    let mousePos: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // If transform is provided, convert screen coordinates to canvas coordinates
    if (transform) {
      mousePos = screenToCanvas(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        { ...transform, positionX: 0, positionY: 0 }
      );
    }

    dispatch(updateDrawing({ tempEndPoint: mousePos }));
  }, [dispatch, isDrawing, transform]);

  // Handle mouse up on canvas to cancel drawing if not on a variable
  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      dispatch(cancelDrawing());
    }
  }, [dispatch, isDrawing]);

  // Handle keyboard events (escape to cancel drawing, backspace/delete to remove variable)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cancel drawing on Escape
      if (e.key === 'Escape' && isDrawing) {
        dispatch(cancelDrawing());
        return;
      }
      
      // Delete selected variable on Backspace or Delete
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedVariableId) {
        // Don't delete if user is typing in an input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        
        e.preventDefault();
        // Remove connections first, then the variable
        dispatch(removeConnectionsByVariableId(selectedVariableId));
        dispatch(removeVariable(selectedVariableId));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isDrawing, selectedVariableId]);

  // Combine refs for both droppable and local ref
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    canvasRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  return (
    <div
      ref={setRefs}
      className={`${styles.canvas} ${isOver ? styles.canvasDropTarget : ''}`}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Connections SVG layer */}
      <ConnectionsLayer width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

      {/* Variables container */}
      <div className={styles.variablesContainer}>
        {variableIds.map((id) => (
          <Variable key={id} variable={variables[id]} />
        ))}
      </div>
    </div>
  );
}
