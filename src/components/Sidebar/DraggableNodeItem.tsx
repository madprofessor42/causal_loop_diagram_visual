import { useCallback, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import type { NodeVariant } from '../../types';
import { STOCK_COLORS, VARIABLE_COLORS } from '../../constants';

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

  // Get colors based on node type
  const colors = nodeType === 'stock' ? STOCK_COLORS : VARIABLE_COLORS;
  const isStock = nodeType === 'stock';

  return (
    <div
      className="draggable-node-item"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
    >
      {/* Node preview icon */}
      <div
        style={{
          width: isStock ? 36 : 32,
          height: isStock ? 24 : 32,
          borderRadius: isStock ? '4px' : '50%',
          background: colors.background,
          border: `2px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text,
          fontSize: '10px',
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {isStock ? '□' : '○'}
      </div>
      
      {/* Label */}
      <span
        style={{
          fontSize: '14px',
          color: '#374151',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}
