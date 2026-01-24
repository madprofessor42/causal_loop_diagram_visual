/**
 * Variable component - A draggable circle representing a CLD variable
 */

import { memo, useCallback, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectVariable, selectSelectedVariableId } from '../slice/variablesSlice';
import { useVariableEditor } from '../hooks';
import { useConnectionDrawing } from '../../connections';
import type { Variable as VariableType } from '../types/variable.types';
import type { DragData } from '../../../types/common.types';
import styles from './Variable.module.css';

interface VariableProps {
  variable: VariableType;
}

/**
 * Variable component with dragging and connection support
 * Wrapped in memo for performance optimization
 *
 * Interaction model:
 * - Single click: Start drawing connection from this variable OR finish connection if already drawing
 * - Click and drag: Move the variable
 * - Double-click: Edit variable name
 * - Backspace/Delete: Delete selected variable (handled in Canvas)
 */
export const Variable = memo(function Variable({ variable }: VariableProps) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(selectSelectedVariableId);
  
  // Track when we just finished drawing to prevent immediately starting a new one
  const justFinishedDrawingRef = useRef(false);
  
  // Use custom hooks for complex logic
  const editor = useVariableEditor(variable);
  const connection = useConnectionDrawing({
    variableId: variable.id,
    position: variable.position
  });

  const isSelected = selectedId === variable.id;
  
  const dragData: DragData = {
    type: 'variable',
    variableId: variable.id,
  };

  // Dragging is always enabled - dnd-kit has activation distance to distinguish click vs drag
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `variable-${variable.id}`,
    data: dragData,
  });

  // Handle click on variable:
  // - If drawing and this is a valid target, finish the connection
  // - If not drawing, start drawing from this variable
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we just finished drawing, don't start a new one
    if (justFinishedDrawingRef.current) {
      justFinishedDrawingRef.current = false;
      dispatch(selectVariable(variable.id));
      return;
    }
    
    // If drawing and clicking on a different variable, finish the connection
    if (connection.isValidTarget) {
      justFinishedDrawingRef.current = true;
      connection.finishDrawingConnection();
      dispatch(selectVariable(variable.id));
      return;
    }
    
    // If clicking on the source variable while drawing, cancel the drawing
    if (connection.isDrawingSource) {
      connection.cancelDrawingConnection();
      dispatch(selectVariable(variable.id));
      return;
    }
    
    // If not drawing, select this variable and start drawing from it
    if (!connection.isDrawing) {
      dispatch(selectVariable(variable.id));
      connection.startDrawingConnection();
    }
  }, [dispatch, variable.id, connection]);

  // Handle double-click to edit name
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cancel any drawing that was started on the first click
    if (connection.isDrawing) {
      connection.cancelDrawingConnection();
    }
    
    editor.startEditing();
  }, [connection, editor]);

  // Handle mouse up on this variable (finish drawing connection)
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (connection.isValidTarget) {
      justFinishedDrawingRef.current = true;
      connection.finishDrawingConnection();
    }
  }, [connection]);

  // Calculate transform for positioning
  const style: React.CSSProperties = {
    transform: `translate(${variable.position.x - variable.radius}px, ${variable.position.y - variable.radius}px)`,
  };

  // Build class names for circle
  const circleClassName = [
    styles.circle,
    'no-pan', // Exclude from react-zoom-pan-pinch panning
    isSelected && styles.selected,
    isDragging && styles.dragging,
    connection.isValidTarget && styles.connectionTarget,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      className={`${styles.container} no-pan`}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleMouseUp}
    >
      {/* Main circle - click to start/finish connection, drag to move */}
      <div
        className={circleClassName}
        style={{
          width: variable.radius * 2,
          height: variable.radius * 2,
        }}
        {...listeners}
        {...attributes}
      />

      {/* Label */}
      {editor.isEditing ? (
        <input
          ref={editor.inputRef}
          className={`${styles.labelInput} no-pan`}
          value={editor.editValue}
          onChange={editor.handleChange}
          onBlur={editor.submitEdit}
          onKeyDown={editor.handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={`${styles.label} no-pan`}>{variable.name}</span>
      )}
    </div>
  );
});
