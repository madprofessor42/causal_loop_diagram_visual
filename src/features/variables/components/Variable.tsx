/**
 * Variable component - A draggable circle representing a CLD variable
 */

import { memo, useCallback } from 'react';
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
 */
export const Variable = memo(function Variable({ variable }: VariableProps) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(selectSelectedVariableId);
  
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

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `variable-${variable.id}`,
    data: dragData,
    disabled: connection.isDrawing,
  });

  // Handle click on variable to select it or finish drawing connection
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If drawing and clicking on a different variable, finish the connection
    if (connection.isValidTarget) {
      connection.finishDrawingConnection();
      return;
    }
    
    // Otherwise, just select the variable
    if (!connection.isDrawing) {
      dispatch(selectVariable(variable.id));
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

  // Handle mouse down on edge zone (start or finish drawing connection)
  const handleEdgeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't start drawing on double-click (detail === 2)
    if (e.detail >= 2) {
      return;
    }
    
    e.preventDefault();
    
    // If already drawing and clicking on a different variable, finish the connection
    if (connection.isValidTarget) {
      connection.finishDrawingConnection();
      return;
    }
    
    // If not drawing, start drawing from this variable
    if (!connection.isDrawing) {
      connection.startDrawingConnection();
    }
  }, [connection]);

  // Handle mouse up on this variable (finish drawing connection)
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (connection.isValidTarget) {
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
    isSelected && styles.selected,
    isDragging && styles.dragging,
    connection.isValidTarget && styles.connectionTarget,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      className={styles.container}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleMouseUp}
    >
      <div className={styles.circleWrapper}>
        {/* Edge zone for starting connections */}
        <div
          className={styles.edgeZone}
          onMouseDown={handleEdgeMouseDown}
        />
        
        {/* Main circle */}
        <div
          className={circleClassName}
          style={{
            width: variable.radius * 2,
            height: variable.radius * 2,
          }}
          {...listeners}
          {...attributes}
        />
      </div>

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
