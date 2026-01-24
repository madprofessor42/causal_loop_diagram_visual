/**
 * VariableTemplate component - Draggable template for creating new variables
 */

import { useDraggable } from '@dnd-kit/core';
import type { DragData } from '../../../types/common.types';
import styles from './VariableTemplate.module.css';

interface VariableTemplateProps {
  id: string;
  label: string;
}

/**
 * Draggable template that can be dropped on the canvas to create a new variable
 */
export function VariableTemplate({ id, label }: VariableTemplateProps) {
  const dragData: DragData = {
    type: 'variable-template',
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className={styles.circle} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

/**
 * Overlay component shown while dragging
 */
export function VariableTemplateOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCircle} />
      <span className={styles.overlayLabel}>New Variable</span>
    </div>
  );
}
