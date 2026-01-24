/**
 * VariableTemplate component - Draggable template for creating new variables
 * Uses HTML5 Drag and Drop API for React Flow compatibility
 */

import { useCallback } from 'react';
import styles from './VariableTemplate.module.css';

interface VariableTemplateProps {
  id: string;
  label: string;
}

/**
 * Draggable template that can be dropped on the canvas to create a new variable
 * Uses native HTML5 drag and drop for React Flow compatibility
 */
export function VariableTemplate({ id, label }: VariableTemplateProps) {
  const onDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', 'variable');
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div
      className={styles.container}
      draggable
      onDragStart={onDragStart}
    >
      <div className={styles.circle} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

/**
 * Overlay component shown while dragging (kept for backward compatibility)
 */
export function VariableTemplateOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCircle} />
      <span className={styles.overlayLabel}>New Variable</span>
    </div>
  );
}
