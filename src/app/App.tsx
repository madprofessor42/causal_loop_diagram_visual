/**
 * Main App component - Integrates all features with DndContext
 */

import { useState, useCallback, useRef } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import { addVariable, moveVariable } from '../features/variables';
import { Sidebar, VariableTemplateOverlay } from '../features/sidebar';
import { CanvasWrapper } from '../features/canvas';
import type { DragData, Position } from '../types/common.types';
import { DEFAULT_VARIABLE_RADIUS } from '../features/variables';
import styles from './App.module.css';

/**
 * Inner app component with DndContext (needs Redux context)
 */
function AppContent() {
  const dispatch = useAppDispatch();
  const variables = useAppSelector((state) => state.variables.items);
  const [activeDragType, setActiveDragType] = useState<'variable-template' | 'variable' | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [variableCount, setVariableCount] = useState(1);
  
  // Track the current pointer position during drag
  const currentPointerPosition = useRef<Position | null>(null);

  // Configure sensors with a small activation distance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data) {
      setActiveDragType(data.type);
      if (data.variableId) {
        setActiveDragId(data.variableId);
      }
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
      setActiveDragId(null);
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
    setActiveDragId(null);
    currentPointerPosition.current = null;
  }, [dispatch, variableCount, variables]);

  const handleDragCancel = useCallback(() => {
    setActiveDragType(null);
    setActiveDragId(null);
    currentPointerPosition.current = null;
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.app}>
        <Sidebar />
        <main className={styles.main}>
          <CanvasWrapper />
        </main>
      </div>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeDragType === 'variable-template' && <VariableTemplateOverlay />}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Root App component with Redux Provider
 */
export function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
