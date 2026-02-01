import type { CLDNode } from '../types';
import {
  STOCK_WIDTH,
  STOCK_HEIGHT,
  VARIABLE_WIDTH,
  VARIABLE_HEIGHT,
} from '../constants';

/**
 * Утилиты для создания и генерации нод
 * Вынесены из DiagramCanvas и useDiagramDragDrop для переиспользования
 */

// Counter for generating unique IDs
let idCounter = 1;

/**
 * Генерирует уникальный ID для новой ноды
 */
export function generateNodeId(): string {
  return `id_${idCounter++}`;
}

/**
 * Генерирует уникальный label для новой ноды
 * Использует буквы алфавита (A, B, C..., AA, AB, AC...)
 * 
 * @param nodes - существующие ноды для проверки занятых labels
 * @returns свободный label
 */
export function generateNodeLabel(nodes: CLDNode[]): string {
  const existingLabels = new Set(nodes.map(n => n.data.label));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // Проверяем одиночные буквы (A-Z)
  for (const letter of alphabet) {
    if (!existingLabels.has(letter)) {
      return letter;
    }
  }
  
  // Если все одиночные буквы заняты, используем двойные (AA-ZZ)
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      const label = alphabet[i] + alphabet[j];
      if (!existingLabels.has(label)) {
        return label;
      }
    }
  }
  
  // Fallback если все комбинации заняты
  return '?';
}

/**
 * Создает новую ноду с правильными данными и размерами
 * 
 * @param type - тип ноды ('stock' или 'variable')
 * @param position - позиция на canvas
 * @param existingNodes - существующие ноды для генерации уникального label
 * @returns новая нода
 */
export function createNode(
  type: 'stock' | 'variable',
  position: { x: number; y: number },
  existingNodes: CLDNode[]
): CLDNode {
  const label = generateNodeLabel(existingNodes);
  
  return {
    id: generateNodeId(),
    type,
    position,
    data: type === 'stock'
      ? { label, initialValue: 0 }
      : { label, value: '0' },
    style: type === 'stock'
      ? { width: STOCK_WIDTH, height: STOCK_HEIGHT }
      : { width: VARIABLE_WIDTH, height: VARIABLE_HEIGHT },
  };
}

