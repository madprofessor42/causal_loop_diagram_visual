import { useSelector } from 'react-redux';
import { selectHighlightedLoop } from '../store/slices/uiSlice';

/**
 * Hook для проверки подсветки edge
 * Определяет цвет и необходимость показа outline для edge
 * 
 * @param edgeId - ID edge для проверки
 * @param selected - флаг выбранности edge (может быть undefined)
 * @returns объект с информацией о подсветке
 */
export function useEdgeHighlight(edgeId: string, selected?: boolean) {
  const highlightedLoop = useSelector(selectHighlightedLoop);
  const isHighlighted = highlightedLoop?.edgeIds.includes(edgeId) ?? false;
  const isSelected = selected ?? false;
  
  // Определяем цвет подсветки
  // Приоритет: highlighted > selected > null
  const highlightColor = isHighlighted ? '#22c55e' : (isSelected ? '#3b82f6' : null);
  
  // Показываем outline если edge highlighted или selected
  const shouldShowOutline = isHighlighted || isSelected;
  
  // Ширина outline зависит от типа подсветки
  const outlineWidth = isHighlighted ? 6 : (isSelected ? 5 : 0);
  
  return {
    isHighlighted,
    highlightColor,
    shouldShowOutline,
    outlineWidth,
  };
}

