import { useState } from 'react';
import { useConnection } from '@xyflow/react';
import { useSelector } from 'react-redux';
import { selectConnectionMode } from '../store/slices/uiSlice';

/**
 * Hook для управления handles ноды
 * Инкапсулирует логику показа/скрытия handles и их состояния
 * 
 * @param nodeType - тип ноды ('stock' или 'variable')
 * @returns объект с флагами и handlers для handles
 */
export function useNodeHandles(nodeType: 'stock' | 'variable') {
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const connection = useConnection();
  const connectionMode = useSelector(selectConnectionMode);
  
  // У Stock всегда показывать center handle
  // У Variable - только в link mode
  const showCenterHandle = nodeType === 'stock' || connectionMode === 'link';
  
  // Проверяем, идет ли сейчас процесс создания connection
  const isConnecting = connection.inProgress;
  
  // Variable НЕ может быть target в flow mode (только Stock -> Stock в flow)
  const canBeTarget = nodeType === 'stock' || connectionMode === 'link';
  
  return {
    isHoveringHandle,
    setIsHoveringHandle,
    showCenterHandle,
    isConnecting,
    canBeTarget,
  };
}

