/**
 * Константы для Node handles
 * Используются в StockNode, VariableNode и их CSS Modules
 */

// Размеры handles
export const CENTER_HANDLE_SIZE = 14;
export const CENTER_HANDLE_BORDER_WIDTH = 2;

// Цвета для center handle indicator
export const CENTER_HANDLE_COLOR = 'rgba(34, 197, 94, 0.4)';
export const CENTER_HANDLE_BORDER_COLOR = 'rgba(22, 163, 74, 0.6)';
export const CENTER_HANDLE_ACTIVE_COLOR = 'var(--highlight-main)';
export const CENTER_HANDLE_ACTIVE_BORDER = 'var(--highlight-border)';

// Z-index для handles
export const HANDLE_TARGET_Z = 10;
export const HANDLE_INDICATOR_Z = 15;
export const HANDLE_SOURCE_Z = 20;

// Конфигурация NodeResizer
export const RESIZER_CONFIG = {
  minWidth: 80,
  minHeight: 50,
  handleStyle: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
} as const;

