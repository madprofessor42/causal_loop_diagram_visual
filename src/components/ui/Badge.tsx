import type { ReactNode } from 'react';
import styles from './Badge.module.css';

/**
 * Упрощенный Badge компонент
 * Используется для отображения типов нод (Stock/Variable) и типов edges (Flow/Link)
 */

export type BadgeVariant = 'stock' | 'variable' | 'flow' | 'neutral';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Badge - компонент для визуального выделения типов элементов
 * 
 * @example
 * ```tsx
 * <Badge variant="stock">Stock</Badge>
 * <Badge variant="variable">Variable</Badge>
 * <Badge variant="neutral">Flow</Badge>
 * ```
 */
export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

