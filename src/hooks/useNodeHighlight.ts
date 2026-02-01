import { useSelector } from 'react-redux';
import { selectHighlightedLoop } from '../store/slices/uiSlice';

/**
 * Hook для проверки подсветки ноды
 * Используется когда пользователь наводит на петлю в Sidebar
 * 
 * @param nodeId - ID ноды для проверки
 * @returns объект с флагом isHighlighted
 */
export function useNodeHighlight(nodeId: string) {
  const highlightedLoop = useSelector(selectHighlightedLoop);
  const isHighlighted = highlightedLoop?.nodeIds.includes(nodeId) ?? false;
  
  return { isHighlighted };
}

