import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectNodes } from '../store/slices/diagramSlice';

/**
 * Hook для создания Map с labels нод
 * Используется в ConnectionsPanel и LoopsPanel для отображения имен нод
 * Мемоизирован для оптимизации
 * 
 * @returns Map<nodeId, label>
 */
export function useNodeLabelsMap() {
  const nodes = useAppSelector(selectNodes);
  
  return useMemo(() => {
    return new Map(nodes.map(node => [node.id, node.data.label || node.id]));
  }, [nodes]);
}

