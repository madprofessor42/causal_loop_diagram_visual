/**
 * Variable component - A draggable circle representing a CLD variable
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { updateVariableName, selectVariable } from '../slice/variablesSlice';
import { startDrawing, finishDrawing, cancelDrawing } from '../../connections/slice/connectionsSlice';
import type { Variable as VariableType } from '../types/variable.types';
import type { Position, DragData } from '../../../types/common.types';
import styles from './Variable.module.css';

interface VariableProps {
  variable: VariableType;
  isConnectionTarget?: boolean;
  onEdgeMouseDown?: (variableId: string, position: Position) => void;
}

/**
 * Variable component with dragging and connection support
 */
export function Variable({ 
  variable, 
  isConnectionTarget = false,
  onEdgeMouseDown 
}: VariableProps) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.variables.selectedId);
  const isDrawing = useAppSelector((state) => state.connections.drawing?.isDrawing);
  const drawingSourceId = useAppSelector((state) => state.connections.drawing?.sourceId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(variable.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSelected = selectedId === variable.id;
  
  const dragData: DragData = {
    type: 'variable',
    variableId: variable.id,
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `variable-${variable.id}`,
    data: dragData,
    disabled: isDrawing,
  });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  // Handle click on variable to select it or finish drawing connection
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If drawing and clicking on a different variable, finish the connection
    if (isDrawing && drawingSourceId && drawingSourceId !== variable.id) {
      dispatch(finishDrawing({ targetId: variable.id }));
      return;
    }
    
    // Otherwise, just select the variable
    if (!isDrawing) {
      dispatch(selectVariable(variable.id));
    }
  }, [dispatch, variable.id, isDrawing, drawingSourceId]);

  // Handle double-click to edit name
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cancel any drawing that was started on the first click
    if (isDrawing) {
      dispatch(cancelDrawing());
    }
    
    setIsEditing(true);
    setEditValue(variable.name);
  }, [variable.name, isDrawing, dispatch]);

  // Handle name edit completion
  const handleNameSubmit = useCallback(() => {
    if (editValue.trim()) {
      dispatch(updateVariableName({ id: variable.id, name: editValue.trim() }));
    } else {
      setEditValue(variable.name);
    }
    setIsEditing(false);
  }, [dispatch, variable.id, variable.name, editValue]);

  // Handle keyboard events for editing
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(variable.name);
      setIsEditing(false);
    }
  }, [handleNameSubmit, variable.name]);

  // Handle mouse down on edge zone (start or finish drawing connection)
  const handleEdgeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't start drawing on double-click (detail === 2)
    if (e.detail >= 2) {
      return;
    }
    
    e.preventDefault();
    
    // If already drawing and clicking on a different variable, finish the connection
    if (isDrawing && drawingSourceId && drawingSourceId !== variable.id) {
      dispatch(finishDrawing({ targetId: variable.id }));
      return;
    }
    
    // If not drawing, start drawing from this variable
    if (!isDrawing) {
      dispatch(startDrawing({
        sourceId: variable.id,
        startPoint: variable.position,
      }));
      onEdgeMouseDown?.(variable.id, variable.position);
    }
  }, [dispatch, variable.id, variable.position, onEdgeMouseDown, isDrawing, drawingSourceId]);

  // Handle mouse up on this variable (finish drawing connection)
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDrawing && drawingSourceId && drawingSourceId !== variable.id) {
      dispatch(finishDrawing({ targetId: variable.id }));
    }
  }, [dispatch, isDrawing, drawingSourceId, variable.id]);

  // Calculate transform for positioning
  const style: React.CSSProperties = {
    transform: `translate(${variable.position.x - variable.radius}px, ${variable.position.y - variable.radius}px)`,
  };

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
          ref={circleRef}
          className={`${styles.circle} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''} ${isConnectionTarget ? styles.connectionTarget : ''}`}
          style={{
            width: variable.radius * 2,
            height: variable.radius * 2,
          }}
          {...listeners}
          {...attributes}
        />
      </div>

      {/* Label */}
      {isEditing ? (
        <input
          ref={inputRef}
          className={`${styles.labelInput} no-pan`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={`${styles.label} no-pan`}>{variable.name}</span>
      )}
    </div>
  );
}
