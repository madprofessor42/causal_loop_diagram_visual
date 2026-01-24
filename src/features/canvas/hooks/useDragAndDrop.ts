/**
 * Custom hook for managing drag and drop functionality
 * Follows React best practices: purpose-driven, named after its function
 */

import { useState, useCallback, useRef } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addVariable, moveVariable, selectVariablesMap } from '../../variables';
import type { DragData, Position } from '../../../types/common.types';
import { DRAG_ACTIVATION_DISTANCE } from '../../../constants';

/** Drag type union */
type DragType = 'variable-template' | 'variable' | null;

/**
 * Hook for managing drag and drop interactions on the canvas
 * Handles both creating new variables from templates and moving existing ones
 */
export function useDragAndDrop() {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(selectVariablesMap);
  const [activeDragType, setActiveDragType] = useState<DragType>(null);
  const [variableCount, setVariableCount] = useState(1);
  
  // Track the current pointer position during drag
  const currentPointerPosition = useRef<Position | null>(null);

  // Configure sensors with a small activation distance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_ACTIVATION_DISTANCE,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data) {
      setActiveDragType(data.type);
    }
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // Track the current pointer position
    const activatorEvent = event.activatorEvent as PointerEvent;
    if (activatorEvent) {
      currentPointerPosition.current = {
        x: activatorEvent.clientX + event.delta.x,
        y: activatorEvent.clientY + event.delta.y,
      };
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const data = active.data.current as DragData | undefined;

    if (!data) {
      setActiveDragType(null);
      currentPointerPosition.current = null;
      return;
    }

    // Handle dropping variable template on canvas
    if (data.type === 'variable-template' && over?.id === 'canvas') {
      const dropRect = over.rect;
      
      if (currentPointerPosition.current && dropRect) {
        // Calculate position relative to canvas
        const position: Position = {
          x: currentPointerPosition.current.x - dropRect.left,
          y: currentPointerPosition.current.y - dropRect.top,
        };

        dispatch(addVariable({
          name: `Variable ${variableCount}`,
          position,
        }));
        setVariableCount((prev) => prev + 1);
      }
    }

    // Handle moving existing variable
    if (data.type === 'variable' && data.variableId) {
      const variable = variables[data.variableId];
      if (variable) {
        const newPosition: Position = {
          x: variable.position.x + event.delta.x,
          y: variable.position.y + event.delta.y,
        };

        dispatch(moveVariable({
          id: data.variableId,
          position: newPosition,
        }));
      }
    }

    setActiveDragType(null);
    currentPointerPosition.current = null;
  }, [dispatch, variableCount, variables]);

  const handleDragCancel = useCallback(() => {
    setActiveDragType(null);
    currentPointerPosition.current = null;
  }, []);

  return {
    sensors,
    activeDragType,
    handlers: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
  };
}
