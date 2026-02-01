import type { ReactNode } from 'react';

/**
 * Утилитные функции для рендеринга SVG элементов edges
 * Уменьшают дублирование кода в LinkEdge и FlowEdge
 */

/**
 * Рендерит outline (подсветку) для edge path
 * Используется для highlighted и selected состояний
 */
export function renderEdgeOutline(
  path: string,
  visible: boolean,
  color: string,
  strokeWidth: number,
  dashArray?: string,
  className?: string
): ReactNode {
  if (!visible) return null;
  
  return (
    <path
      d={path}
      strokeWidth={strokeWidth}
      stroke={color}
      fill="none"
      strokeDasharray={dashArray}
      strokeLinecap="round"
      className={className}
      style={{ pointerEvents: 'none', opacity: 0.6 }}
    />
  );
}

/**
 * Рендерит arrow (стрелку) для edge
 */
export function renderArrow(
  x1: number,
  y1: number,
  centerX: number,
  centerY: number,
  x2: number,
  y2: number,
  strokeWidth: number,
  stroke: string,
  className?: string
): ReactNode {
  return (
    <path
      d={`M ${x1},${y1} L ${centerX},${centerY} L ${x2},${y2}`}
      strokeWidth={strokeWidth}
      stroke={stroke}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    />
  );
}

/**
 * Рендерит label на edge с белым background
 */
export function renderEdgeLabel(
  label: string | undefined,
  x: number,
  y: number,
  color: string,
  className?: string,
  bgClassName?: string
): ReactNode {
  if (!label) return null;
  
  const padding = 6;
  const charWidth = 7;
  const bgWidth = label.length * charWidth + padding * 2;
  const bgHeight = 18;
  
  return (
    <>
      {/* White background for label text */}
      <rect
        x={x - bgWidth / 2}
        y={y - 20}
        width={bgWidth}
        height={bgHeight}
        fill="white"
        stroke="white"
        strokeWidth={2}
        rx={3}
        className={bgClassName}
        style={{ pointerEvents: 'none' }}
      />
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        fill={color}
        className={className}
        style={{ fontSize: '12px', pointerEvents: 'none' }}
      >
        {label}
      </text>
    </>
  );
}

/**
 * Рендерит невидимый hitbox для упрощения клика по edge
 */
export function renderHitbox(
  path: string,
  width: number,
  className?: string
): ReactNode {
  return (
    <path
      d={path}
      strokeWidth={width}
      stroke="transparent"
      fill="none"
      className={className}
    />
  );
}

/**
 * Вычисляет координаты стрелки
 * Возвращает два угловых points стрелки
 */
export function calculateArrowPoints(
  endX: number,
  endY: number,
  angle: number,
  arrowSize: number,
  reverse: boolean = false
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const angleOffset = reverse ? Math.PI : 0;
  const arrowAngle1 = angle + angleOffset + Math.PI * 0.8;
  const arrowAngle2 = angle + angleOffset - Math.PI * 0.8;
  
  return {
    x1: endX + arrowSize * Math.cos(arrowAngle1),
    y1: endY + arrowSize * Math.sin(arrowAngle1),
    x2: endX + arrowSize * Math.cos(arrowAngle2),
    y2: endY + arrowSize * Math.sin(arrowAngle2),
  };
}

