/**
 * VariableNode - Custom React Flow node for CLD variables
 * - Center area for dragging (React Flow default behavior)
 * - Border ring for starting connections (invisible handle)
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import styles from './VariableNode.module.css';

/**
 * Data structure for VariableNode
 */
export interface VariableNodeData {
  label: string;
}

/**
 * Custom node component for CLD variables
 */
export const VariableNode = memo(function VariableNode({
  data,
  selected,
  id,
}: NodeProps) {
  const nodeData = data as unknown as VariableNodeData;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(nodeData.label);
    }
  }, [nodeData.label, isEditing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  const submitEdit = useCallback(() => {
    setIsEditing(false);
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== nodeData.label) {
      window.dispatchEvent(new CustomEvent('variable-label-change', {
        detail: { id, label: trimmedValue }
      }));
    } else {
      setEditValue(nodeData.label);
    }
  }, [editValue, nodeData.label, id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitEdit();
    } else if (e.key === 'Escape') {
      setEditValue(nodeData.label);
      setIsEditing(false);
    }
  }, [submitEdit, nodeData.label]);

  const circleClassName = [
    styles.circle,
    selected && styles.selected,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.container}>
      {/* Invisible ring-shaped handle that covers the border area */}
      {/* This handle is underneath the circle, so center clicks go to drag, edge clicks to connect */}
      <Handle
        type="source"
        position={Position.Top}
        id="source"
        className={`${styles.ringHandle} nodrag`}
      />

      {/* Visual circle - blocks mouse events in center, allows drag */}
      <div
        className={circleClassName}
        onDoubleClick={handleDoubleClick}
      />

      {/* Label */}
      {isEditing ? (
        <input
          ref={inputRef}
          className={`${styles.labelInput} nodrag`}
          value={editValue}
          onChange={handleChange}
          onBlur={submitEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={styles.label}>{nodeData.label}</span>
      )}
    </div>
  );
});

export default VariableNode;
