import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectEdges } from '../store/slices/diagramSlice';
import type { CLDEdge } from '../types';

// Константа для offset параллельных edges
const PARALLEL_EDGE_OFFSET = 15;

/**
 * Hook для расчета offset параллельных edges между одними и теми же нодами
 * 
 * Логика:
 * - Edges нормализуются по направлению (от меньшего ID к большему)
 * - Link edges получают положительный offset в нормализованном направлении
 * - Flow edges получают отрицательный offset (противоположно Link)
 * - Это гарантирует, что edges всегда располагаются по разные стороны
 * 
 * @param edgeId - ID текущего edge (чтобы не считать себя)
 * @param source - ID source ноды
 * @param target - ID target ноды
 * @param edgeType - тип текущего edge ('link' или 'flow')
 * @returns offset для применения к edge (0 если параллельных edges нет)
 */
export function useParallelEdges(
  edgeId: string,
  source: string,
  target: string,
  edgeType: 'link' | 'flow'
) {
  const edges = useAppSelector(selectEdges);
  
  return useMemo(() => {
    // Находим все edges между теми же двумя нодами (в любом направлении)
    const parallelEdges = edges.filter((e: CLDEdge) => 
      e.id !== edgeId && // Не считаем самого себя
      (
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
      )
    );
    
    // Проверяем наличие flow и link edges
    const hasParallelFlow = parallelEdges.some((e: CLDEdge) => e.type === 'flow');
    const hasParallelLink = parallelEdges.some((e: CLDEdge) => e.type === 'link');
    
    // Определяем, нужен ли offset (есть ли edge другого типа)
    const needsOffset = edgeType === 'link' ? hasParallelFlow : hasParallelLink;
    
    // Рассчитываем offset
    let offset = 0;
    
    if (needsOffset) {
      // Нормализация: используем направление от меньшего ID к большему
      const isNormalizedDirection = source < target;
      
      if (edgeType === 'link') {
        // Link: +offset в нормализованном направлении, -offset в обратном
        offset = isNormalizedDirection ? PARALLEL_EDGE_OFFSET : -PARALLEL_EDGE_OFFSET;
      } else {
        // Flow: -offset в нормализованном направлении, +offset в обратном
        // (противоположно Link, чтобы edges были по разные стороны)
        offset = isNormalizedDirection ? -PARALLEL_EDGE_OFFSET : PARALLEL_EDGE_OFFSET;
      }
    }
    
    return {
      // Основной результат - готовый offset для применения
      offset,
      
      // Дополнительная информация (может быть полезна для отладки)
      hasParallelFlow,
      hasParallelLink,
      needsOffset,
      parallelCount: parallelEdges.length,
    };
  }, [edges, edgeId, source, target, edgeType]);
}

