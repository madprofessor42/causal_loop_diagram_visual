/**
 * Custom hook for managing variable name editing
 * Follows React best practices: purpose-driven, named after its function
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { updateVariableName } from '../slice/variablesSlice';
import type { Variable } from '../types/variable.types';

/**
 * Hook for managing variable name editing state and handlers
 */
export function useVariableEditor(variable: Variable) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(variable.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync edit value when variable name changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(variable.name);
    }
  }, [variable.name, isEditing]);

  /**
   * Start editing the variable name
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditValue(variable.name);
  }, [variable.name]);

  /**
   * Submit the edited name
   */
  const submitEdit = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue) {
      dispatch(updateVariableName({ id: variable.id, name: trimmedValue }));
    } else {
      // Revert to original name if empty
      setEditValue(variable.name);
    }
    setIsEditing(false);
  }, [dispatch, variable.id, variable.name, editValue]);

  /**
   * Cancel editing and revert to original name
   */
  const cancelEdit = useCallback(() => {
    setEditValue(variable.name);
    setIsEditing(false);
  }, [variable.name]);

  /**
   * Handle keyboard events during editing
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }, [submitEdit, cancelEdit]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  return {
    isEditing,
    editValue,
    inputRef,
    startEditing,
    submitEdit,
    cancelEdit,
    handleKeyDown,
    handleChange,
  };
}
