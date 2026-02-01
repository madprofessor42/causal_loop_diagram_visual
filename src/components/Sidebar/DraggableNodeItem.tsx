import { useCallback, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import type { NodeVariant } from '../../types';
import styles from './DraggableNodeItem.module.css';

interface DraggableNodeItemProps {
  nodeType: NodeVariant;
  label: string;
}

export function DraggableNodeItem({ nodeType, label }: DraggableNodeItemProps) {
  const dispatch = useAppDispatch();
  const emptyImageRef = useRef<HTMLImageElement | null>(null);
  
  // Create empty image for hiding drag preview
  useEffect(() => {
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    emptyImageRef.current = img;
  }, []);

  const onDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      // Set the data transfer type for ReactFlow compatibility
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
      
      // Hide the default drag preview image
      if (emptyImageRef.current) {
        event.dataTransfer.setDragImage(emptyImageRef.current, 0, 0);
      }
      
      // Dispatch drag start action
      dispatch(uiActions.setDragStart(nodeType));
    },
    [dispatch, nodeType]
  );

  const onDragEnd = useCallback(() => {
    // Clean up drag state when drag ends (regardless of whether it was successful)
    dispatch(uiActions.setDragEnd());
  }, [dispatch]);

  const isStock = nodeType === 'stock';

  return (
    <div
      className={styles.item}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Node preview icon */}
      <div className={`${styles.icon} ${isStock ? styles.iconStock : styles.iconVariable}`}>
        {isStock ? '□' : '○'}
      </div>
      
      {/* Label */}
      <span className={styles.label}>
        {label}
      </span>
    </div>
  );
}
