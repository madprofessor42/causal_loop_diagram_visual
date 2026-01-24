/**
 * Custom hook for managing connection drawing functionality
 * Follows React best practices: purpose-driven, named after its function
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  startDrawing,
  finishDrawing,
  cancelDrawing,
  selectIsDrawing,
  selectDrawingSourceId,
} from '../slice/connectionsSlice';
import type { Position } from '../../../types/common.types';

interface UseConnectionDrawingOptions {
  variableId: string;
  position: Position;
}

/**
 * Hook for managing connection drawing interactions for a variable
 * Handles starting, finishing, and determining if a variable is a valid drop target
 */
export function useConnectionDrawing({ variableId, position }: UseConnectionDrawingOptions) {
  const dispatch = useAppDispatch();
  const isDrawing = useAppSelector(selectIsDrawing);
  const drawingSourceId = useAppSelector(selectDrawingSourceId);

  /**
   * Start drawing a connection from this variable
   */
  const startDrawingConnection = useCallback(() => {
    if (!isDrawing) {
      dispatch(startDrawing({ sourceId: variableId, startPoint: position }));
    }
  }, [dispatch, variableId, position, isDrawing]);

  /**
   * Finish drawing a connection to this variable
   */
  const finishDrawingConnection = useCallback(() => {
    if (isDrawing && drawingSourceId && drawingSourceId !== variableId) {
      dispatch(finishDrawing({ targetId: variableId }));
    }
  }, [dispatch, isDrawing, drawingSourceId, variableId]);

  /**
   * Cancel the current drawing operation
   */
  const cancelDrawingConnection = useCallback(() => {
    if (isDrawing) {
      dispatch(cancelDrawing());
    }
  }, [dispatch, isDrawing]);

  /**
   * Check if this variable is a valid target for the current drawing
   */
  const isValidTarget = isDrawing && drawingSourceId !== null && drawingSourceId !== variableId;

  /**
   * Check if this variable is the source of the current drawing
   */
  const isDrawingSource = isDrawing && drawingSourceId === variableId;

  return {
    isDrawing,
    isValidTarget,
    isDrawingSource,
    drawingSourceId,
    startDrawingConnection,
    finishDrawingConnection,
    cancelDrawingConnection,
  };
}
