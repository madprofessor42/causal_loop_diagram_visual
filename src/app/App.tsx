/**
 * Main App component - Integrates all features with DndContext
 */

import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Provider } from 'react-redux';
import { store } from './store';
import { Sidebar, VariableTemplateOverlay } from '../features/sidebar';
import { CanvasWrapper, useDragAndDrop } from '../features/canvas';
import styles from './App.module.css';

/**
 * Inner app component with DndContext (needs Redux context)
 */
function AppContent() {
  const { sensors, activeDragType, handlers } = useDragAndDrop();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handlers.onDragStart}
      onDragMove={handlers.onDragMove}
      onDragEnd={handlers.onDragEnd}
      onDragCancel={handlers.onDragCancel}
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
