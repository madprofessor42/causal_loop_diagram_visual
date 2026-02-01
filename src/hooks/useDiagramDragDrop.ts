import { useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { diagramActions, selectNodes } from '../store/slices/diagramSlice';
import { uiActions } from '../store/slices/uiSlice';
import {
  STOCK_WIDTH,
  STOCK_HEIGHT,
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
} from '../constants';
import { createNode } from '../utils/nodeFactory';

/**
 * Hook для управления Drag & Drop ноды из sidebar на canvas
 * Инкапсулирует всю логику создания новой ноды через drag & drop
 * 
 * @returns handlers для drag событий (onDragOver, onDragLeave, onDrop)
 */
export function useDiagramDragDrop() {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectNodes);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Обработчик dragOver - показываем ghost node в позиции курсора
  const onDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      // Convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Update ghost position in store
      dispatch(uiActions.setGhostPosition(position));
    },
    [dispatch, screenToFlowPosition]
  );

  // Обработчик dragLeave - скрываем ghost node при выходе из canvas
  const onDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      // Only clear if leaving the ReactFlow container (not entering a child)
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (!relatedTarget || !reactFlowWrapper.current?.contains(relatedTarget)) {
        dispatch(uiActions.setGhostPosition(null));
      }
    },
    [dispatch]
  );

  // Обработчик drop - создаем новую ноду
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('application/reactflow') as 'stock' | 'variable';
      if (!type) return;
      
      // Get the drop position in flow coordinates
      const cursorPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Offset the position based on node type (center node at cursor)
      let offsetX: number;
      let offsetY: number;
      
      if (type === 'stock') {
        offsetX = STOCK_WIDTH / 2;
        offsetY = STOCK_HEIGHT / 2;
      } else {
        offsetX = VARIABLE_WIDTH / 2;
        offsetY = VARIABLE_HEIGHT / 2;
      }
      
      const position = {
        x: cursorPosition.x - offsetX,
        y: cursorPosition.y - offsetY,
      };
      
      // Create new node using factory function
      const newNode = createNode(type, position, nodes);
      
      dispatch(diagramActions.addNode(newNode));
      dispatch(uiActions.setDragEnd());
    },
    [dispatch, nodes, screenToFlowPosition]
  );

  return {
    onDragOver,
    onDragLeave,
    onDrop,
    reactFlowWrapper,
  };
}

