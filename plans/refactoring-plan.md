# План рефакторинга проекта Causal Loop Diagram Visual

## Обзор

Этот документ описывает план рефакторинга React приложения для визуализации причинно-следственных диаграмм. Цель - улучшить структуру кода, уменьшить дублирование и следовать современным best practices React, сохраняя всю существующую функциональность.

## Текущая структура проекта

```
src/
  ├── components/
  │   ├── nodes/         # StockNode, VariableNode
  │   ├── edges/         # LinkEdge, FlowEdge
  │   ├── Sidebar/       # Sidebar, панели свойств
  │   └── GhostNode.tsx
  ├── store/
  │   └── slices/        # Redux slices (diagram, ui)
  ├── utils/
  │   ├── edge.ts
  │   └── graph.ts
  ├── types/
  ├── constants/
  └── App.tsx           # 447 строк - слишком большой!
```

## Выявленные проблемы

### 1. **Дублирование кода в Node компонентах**
- `StockNode.tsx` и `VariableNode.tsx` имеют ~70% идентичного кода:
  - Логика handles (source/target)
  - NodeResizer конфигурация
  - Highlighting логика
  - Структура стилей

### 2. **Дублирование в Edge компонентах**
- `LinkEdge.tsx` и `FlowEdge.tsx` дублируют:
  - Логику highlight/selection
  - Расчет outline для подсветки
  - Логику параллельных edges
  - Рендеринг labels

### 3. **Inline стили везде**
- Все компоненты используют inline стили (сотни строк `style={{ ... }}`)
- Много магических чисел и повторяющихся значений
- Нет переиспользуемых UI компонентов
- Отсутствует модульная CSS архитектура

### 4. **Большой App.tsx (447 строк)**
- Смешана логика:
  - React Flow обработчики
  - Drag & Drop логика
  - ID/Label генерация
  - Рендеринг UI

### 5. **Повторяющаяся логика**
- NodeLabels map создается в `ConnectionsPanel` и `LoopsPanel` одинаково
- Вычисление edge properties (colors, symbols, types) дублируется
- Логика работы с highlight повторяется в nodes и edges

### 6. **Отсутствие переиспользуемых компонентов**
- Панели в Sidebar имеют похожую структуру, но дублируют код
- Нет базовых UI компонентов (Button, Input, Badge, Panel)

---

## План рефакторинга

### Фаза 0: Создание CSS Modules архитектуры 🎨

**Приоритет: ВЫСОКИЙ** | **Сложность: Низкая** | **Время: 1-2 часа**

Перед началом рефакторинга создадим CSS Modules для всех компонентов, вынеся inline стили в отдельные файлы.

#### 0.1. Что такое CSS Modules?

CSS Modules - это CSS файлы с локальными scope стилями. Vite поддерживает их из коробки.

**Преимущества:**
- ✅ Локальные стили (нет конфликтов имён классов)
- ✅ TypeScript типизация (автогенерация .d.ts файлов)
- ✅ Простая миграция с inline стилей
- ✅ Нет зависимостей (работает из коробки)
- ✅ Привычный CSS синтаксис

**Структура:**
```
Component.tsx         # React компонент
Component.module.css  # Стили компонента
```

#### 0.2. Создать общие CSS переменные

**Файл:** `src/styles/variables.css`

```css
/* Цвета для Stock nodes */
:root {
  --stock-bg: #a8c5e2;
  --stock-border: #5b9bd5;
  --stock-text: #1a1a1a;
  
  /* Цвета для Variable nodes */
  --variable-bg: #f8cbad;
  --variable-border: #ed7d31;
  --variable-text: #1a1a1a;
  
  /* Цвета для edges */
  --edge-link: #666666;
  --edge-flow: #5b9bd5;
  
  /* Highlight colors */
  --highlight-main: #22c55e;
  --highlight-bg: rgba(34, 197, 94, 0.2);
  --highlight-border: #16a34a;
  
  /* UI colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-500: #6b7280;
  --gray-700: #374151;
  --gray-900: #111827;
  
  --blue-100: #dbeafe;
  --blue-500: #3b82f6;
  --blue-800: #1e40af;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.15);
}
```

**Импортировать в `src/main.tsx` или `src/App.tsx`:**
```typescript
import './styles/variables.css';
```

#### 0.3. Пример структуры CSS Modules

**Компонент:** `StockNode.tsx`
**Стили:** `StockNode.module.css`

```css
/* StockNode.module.css */
.container {
  width: 100%;
  height: 100%;
  position: relative;
}

.shape {
  width: 100%;
  height: 100%;
  background: var(--stock-bg);
  border: 2px solid var(--stock-border);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--stock-text);
  font-weight: 500;
  font-size: 14px;
}

.shape.highlighted {
  border: 3px solid var(--highlight-main);
  box-shadow: 0 0 0 3px var(--highlight-bg);
}

.label {
  pointer-events: none;
}
```

**В компоненте:**
```typescript
import styles from './StockNode.module.css';

export function StockNode({ data, selected, id }: NodeProps) {
  const { isHighlighted } = useNodeHighlight(id);
  
  return (
    <div className={styles.container}>
      <div className={`${styles.shape} ${isHighlighted ? styles.highlighted : ''}`}>
        <div className={styles.label}>{data.label || 'Stock'}</div>
      </div>
    </div>
  );
}
```

#### 0.4. TypeScript типизация (опционально)

Vite автоматически генерирует типы для CSS Modules. Можно добавить для лучшей поддержки:

**Файл:** `src/vite-env.d.ts` (уже должен существовать)

```typescript
/// <reference types="vite/client" />

// CSS Modules type definitions
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
```

**Результат:** CSS Modules настроены и готовы к использованию.

---

### Фаза 1: Создание Custom Hooks 🎯

**Приоритет: ВЫСОКИЙ** | **Сложность: Средняя**

#### 1.1. Hook для Node Highlighting
**Файл:** `src/hooks/useNodeHighlight.ts`

Выносим логику подсветки нод из компонентов:

```typescript
export function useNodeHighlight(nodeId: string) {
  const highlightedLoop = useSelector(selectHighlightedLoop);
  const isHighlighted = highlightedLoop?.nodeIds.includes(nodeId);
  
  return { isHighlighted };
}
```

#### 1.2. Hook для Node Handles
**Файл:** `src/hooks/useNodeHandles.ts`

**⚠️ ИСПРАВЛЕНИЕ:** Вместо создания BaseNode компонента (избыточная абстракция), создаём хук для переиспользования логики handles:

```typescript
export function useNodeHandles(nodeType: 'stock' | 'variable') {
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const connection = useConnection();
  const connectionMode = useSelector(selectConnectionMode);
  
  // У Stock всегда показывать handle, у Variable - только в link mode
  const showCenterHandle = nodeType === 'stock' || connectionMode === 'link';
  const isConnecting = connection.inProgress;
  
  return {
    isHoveringHandle,
    setIsHoveringHandle,
    showCenterHandle,
    isConnecting,
  };
}
```

**Использование:**
```typescript
// В StockNode.tsx
const { isHighlighted } = useNodeHighlight(id);
const { isHoveringHandle, setIsHoveringHandle, showCenterHandle, isConnecting } = useNodeHandles('stock');
```

**Результат:** Переиспользуемая логика без лишних абстракций.

#### 1.3. Hook для Edge Highlighting
**Файл:** `src/hooks/useEdgeHighlight.ts`

```typescript
// Концептуальный пример
export function useEdgeHighlight(edgeId: string, selected: boolean) {
  const highlightedLoop = useSelector(selectHighlightedLoop);
  const isHighlighted = highlightedLoop?.edgeIds.includes(edgeId);
  
  return {
    isHighlighted,
    highlightColor: isHighlighted ? '#22c55e' : (selected ? '#3b82f6' : null),
    shouldShowOutline: isHighlighted || selected,
  };
}
```

#### 1.4. Hook для Node Labels Map
**Файл:** `src/hooks/useNodeLabelsMap.ts`

```typescript
export function useNodeLabelsMap() {
  const nodes = useAppSelector(selectNodes);
  
  return useMemo(() => {
    return new Map(nodes.map(node => [node.id, node.data.label || node.id]));
  }, [nodes]);
}
```

**Использование в `ConnectionsPanel` и `LoopsPanel`:**
```typescript
const nodeLabels = useNodeLabelsMap();
// Вместо создания map в каждом компоненте
```

#### 1.5. Hook для Drag & Drop
**Файл:** `src/hooks/useDiagramDragDrop.ts`

Выносим всю логику drag & drop из App.tsx:

```typescript
export function useDiagramDragDrop() {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectNodes);
  const { screenToFlowPosition } = useReactFlow();
  
  const onDragOver = useCallback((event) => {
    // ... логика из App.tsx
  }, [dispatch, screenToFlowPosition]);
  
  const onDrop = useCallback((event) => {
    // ... логика создания ноды
  }, [dispatch, nodes, screenToFlowPosition]);
  
  // ... другие обработчики
  
  return { onDragOver, onDragLeave, onDrop };
}
```

#### 1.6. Hook для Connection Logic
**Файл:** `src/hooks/useConnectionHandlers.ts`

```typescript
export function useConnectionHandlers() {
  const dispatch = useAppDispatch();
  const connectionMode = useAppSelector(selectConnectionMode);
  const nodes = useAppSelector(selectNodes);
  
  // Refs для tracking
  const sourceNodeIdRef = useRef<string | null>(null);
  const sourceNodeTypeRef = useRef<string | null>(null);
  
  const onConnectStart = useCallback(...);
  const onConnect = useCallback(...);
  const onConnectEnd = useCallback(...);
  
  return { onConnectStart, onConnect, onConnectEnd };
}
```

---

### Фаза 2: Рефакторинг Node компонентов 🎯

**Приоритет: ВЫСОКИЙ** | **Сложность: Средняя**

**⚠️ ВАЖНО:** Вместо создания BaseNode компонента (избыточная абстракция для 2 типов нод), используем хуки `useNodeHighlight` и `useNodeHandles` для переиспользования логики.

#### 2.1. Вынести общие константы
**Файл:** `src/constants/nodeHandles.ts`

```typescript
export const CENTER_HANDLE_SIZE = 14;
export const CENTER_HANDLE_COLOR = '#22c55e';
export const CENTER_HANDLE_BORDER = '#16a34a';

export const RESIZER_CONFIG = {
  minWidth: 80,
  minHeight: 50,
  handleStyle: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
};
```

#### 2.2. Рефакторинг StockNode и VariableNode

**StockNode.tsx:**
```typescript
import { Handle, Position, NodeResizer, NodeProps } from '@xyflow/react';
import { useNodeHighlight } from '../../hooks/useNodeHighlight';
import { useNodeHandles } from '../../hooks/useNodeHandles';
import { StockNodeData } from '../../types';
import { RESIZER_CONFIG, CENTER_HANDLE_SIZE } from '../../constants/nodeHandles';
import styles from './StockNode.module.css';

export function StockNode({ data, selected, id }: NodeProps) {
  const nodeData = data as StockNodeData;
  const { isHighlighted } = useNodeHighlight(id);
  const { isHoveringHandle, setIsHoveringHandle, showCenterHandle, isConnecting } = useNodeHandles('stock');
  
  return (
    <div className={styles.container}>
      <NodeResizer isVisible={selected} {...RESIZER_CONFIG} />
      
      {/* Визуальная форма */}
      <div className={`${styles.shape} ${isHighlighted ? styles.highlighted : ''}`}>
        <div className={styles.label}>{nodeData?.label || 'Stock'}</div>
      </div>
      
      {/* Center handle indicator */}
      {showCenterHandle && (
        <div 
          className={`${styles.handleIndicator} ${isHoveringHandle ? styles.handleActive : ''}`}
        />
      )}
      
      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Top}
        id="source"
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        className={styles.handleSource}
      />
      
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className={styles.handleTarget}
        style={{ pointerEvents: isConnecting ? 'auto' : 'none' }}
      />
    </div>
  );
}
```

**StockNode.module.css:**
```css
.container {
  width: 100%;
  height: 100%;
  position: relative;
}

.shape {
  width: 100%;
  height: 100%;
  background: var(--stock-bg);
  border: 2px solid var(--stock-border);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--stock-text);
  font-weight: 500;
  font-size: 14px;
}

.shape.highlighted {
  border: 3px solid var(--highlight-main);
  box-shadow: 0 0 0 3px var(--highlight-bg);
}

.label {
  pointer-events: none;
}

/* Center handle indicator */
.handleIndicator {
  position: absolute;
  width: 14px;
  height: 14px;
  background: rgba(34, 197, 94, 0.4);
  border: 2px solid rgba(22, 163, 74, 0.6);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 15;
  transition: all 0.15s ease;
}

.handleIndicator.handleActive {
  background: var(--highlight-main);
  border-color: var(--highlight-border);
}

/* Handles */
.handleSource {
  position: absolute;
  width: 14px;
  height: 14px;
  background: transparent;
  border: none;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: crosshair;
  z-index: 20;
}

.handleTarget {
  position: absolute;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: var(--radius-sm);
  z-index: 10;
}
```

**VariableNode.tsx:**
```typescript
import { Handle, Position, NodeResizer, NodeProps } from '@xyflow/react';
import { useNodeHighlight } from '../../hooks/useNodeHighlight';
import { useNodeHandles } from '../../hooks/useNodeHandles';
import { VariableNodeData } from '../../types';
import { RESIZER_CONFIG } from '../../constants/nodeHandles';
import styles from './VariableNode.module.css';

export function VariableNode({ data, selected, id }: NodeProps) {
  const nodeData = data as VariableNodeData;
  const { isHighlighted } = useNodeHighlight(id);
  const { isHoveringHandle, setIsHoveringHandle, showCenterHandle, isConnecting } = useNodeHandles('variable');
  
  return (
    <div className={styles.container}>
      <NodeResizer isVisible={selected} {...RESIZER_CONFIG} />
      
      {/* Визуальная форма */}
      <div className={`${styles.shape} ${isHighlighted ? styles.highlighted : ''}`}>
        <div className={styles.label}>{nodeData?.label || 'Variable'}</div>
      </div>
      
      {/* Center handle indicator - только в link mode */}
      {showCenterHandle && (
        <div 
          className={`${styles.handleIndicator} ${isHoveringHandle ? styles.handleActive : ''}`}
        />
      )}
      
      {/* Source handle - только в link mode */}
      <Handle
        type="source"
        position={Position.Top}
        id="source"
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        className={styles.handleSource}
        style={{ pointerEvents: showCenterHandle ? 'auto' : 'none' }}
      />
      
      {/* Target handle - только в link mode */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        className={styles.handleTarget}
        style={{ pointerEvents: (isConnecting && showCenterHandle) ? 'auto' : 'none' }}
      />
    </div>
  );
}
```

**VariableNode.module.css:**
```css
.container {
  width: 100%;
  height: 100%;
  position: relative;
}

.shape {
  width: 100%;
  height: 100%;
  background: var(--variable-bg);
  border: 2px solid var(--variable-border);
  border-radius: 50%; /* Круглая форма - отличие от Stock */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--variable-text);
  font-weight: 500;
  font-size: 14px;
}

.shape.highlighted {
  border: 3px solid var(--highlight-main);
  box-shadow: 0 0 0 3px var(--highlight-bg);
}

.label {
  pointer-events: none;
}

/* Handle indicator - только в link mode */
.handleIndicator {
  position: absolute;
  width: 14px;
  height: 14px;
  background: rgba(34, 197, 94, 0.4);
  border: 2px solid rgba(22, 163, 74, 0.6);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 15;
  transition: all 0.15s ease;
  opacity: 0; /* По умолчанию скрыт */
}

.handleIndicator.handleActive {
  background: var(--highlight-main);
  border-color: var(--highlight-border);
  opacity: 1;
}

/* Handles */
.handleSource {
  position: absolute;
  width: 14px;
  height: 14px;
  background: transparent;
  border: none;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: crosshair;
  z-index: 20;
}

.handleTarget {
  position: absolute;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  z-index: 10;
}
```

#### 2.3. Рефакторинг GhostNode
**Файл:** `src/components/GhostNode.tsx`

Вынести inline стили в CSS Module:

```typescript
import styles from './GhostNode.module.css';

export function GhostNode({ position }: { position: { x: number; y: number } }) {
  return (
    <div 
      className={styles.ghost}
      style={{ left: position.x, top: position.y }}
    />
  );
}
```

**GhostNode.module.css:**
```css
.ghost {
  position: absolute;
  width: 100px;
  height: 60px;
  background: rgba(91, 155, 213, 0.3);
  border: 2px dashed var(--stock-border);
  border-radius: var(--radius-sm);
  pointer-events: none;
  z-index: 1000;
}
```

**Результат:** Уменьшение кода в каждом Node с ~140 строк до ~50-60 строк + CSS Module без лишних абстракций.

---

### Фаза 3: Минимальные переиспользуемые UI компоненты 🎯

**Приоритет: СРЕДНИЙ** | **Сложность: Низкая**

**⚠️ ИСПРАВЛЕНИЕ:** Создаём только действительно переиспользуемые компоненты вместо полноценной UI библиотеки.

#### 3.1. Создать папку ui/
**Структура:** `src/components/ui/`

```
ui/
  ├── Badge.tsx           # Упрощённый badge (stock/variable/neutral)
  ├── Badge.module.css
  ├── FormField.tsx       # Переиспользуемое поле формы
  ├── FormField.module.css
  └── index.ts
```

**❌ НЕ создаём:** Card (используем CSS класс `.panel`), Button, Input, Label (избыточно)

#### 3.2. Общий CSS Module для панелей Sidebar

**⚠️ ВАЖНО:** Вместо компонента Card создаём общий CSS Module для всех панелей.

**Файл:** `src/components/Sidebar/Panel.module.css`

```css
/* Общие стили для всех панелей */
.panel {
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.panelTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.panelSubtitle {
  font-size: 11px;
  color: var(--gray-500);
  margin-bottom: var(--spacing-md);
  line-height: 1.4;
}

.panelSection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.panelEmpty {
  font-size: 12px;
  color: var(--gray-500);
  font-style: italic;
}
```

**Использование:**
```typescript
// В ConnectionsPanel, LoopsPanel, и других панелях
import panelStyles from './Panel.module.css';

<div className={panelStyles.panel}>
  <div className={panelStyles.panelTitle}>Connections</div>
  <div className={panelStyles.panelSection}>
    {/* content */}
  </div>
</div>
```

#### 3.3. Упрощённый Badge компонент

**⚠️ ИСПРАВЛЕНИЕ:** Упрощённый Badge с 3 вариантами вместо 6.

**Badge.tsx:**
```typescript
import { ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'stock' | 'variable' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
```

**Badge.module.css:**
```css
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.stock {
  background-color: var(--blue-100);
  color: var(--blue-800);
}

.variable {
  background-color: #fed7aa;
  color: #9a3412;
}

.neutral {
  background-color: var(--gray-100);
  color: var(--gray-700);
}
```

**Использование:**
```typescript
<Badge variant="stock">Stock</Badge>
<Badge variant="variable">Variable</Badge>
<Badge variant="neutral">Flow</Badge>
```

---

### Фаза 4: Рефакторинг Edge компонентов 🎯

**Приоритет: СРЕДНИЙ** | **Сложность: Средняя**

**⚠️ ИСПРАВЛЕНИЕ:** Вместо отдельных React компонентов для SVG элементов создаём утилитные функции.

#### 4.1. Утилитные функции для рендеринга Edge элементов

**Файл:** `src/utils/edgeRendering.tsx`

```typescript
import { ReactNode } from 'react';

/**
 * Рендерит outline для edge (подсветка)
 */
export function renderEdgeOutline(
  path: string,
  visible: boolean,
  color: string,
  strokeWidth: number,
  dashArray?: string
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
      style={{ pointerEvents: 'none', opacity: 0.6 }}
    />
  );
}

/**
 * Рендерит label на edge
 */
export function renderEdgeLabel(
  label: string,
  x: number,
  y: number,
  color: string
): ReactNode {
  if (!label) return null;
  
  return (
    <>
      <rect
        x={x - (label.length * 3.5 + 6)}
        y={y - 20}
        width={label.length * 7 + 12}
        height={18}
        fill="white"
        stroke="white"
        strokeWidth={2}
        rx={3}
        style={{ pointerEvents: 'none' }}
      />
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        style={{ fontSize: '12px', fill: color, pointerEvents: 'none' }}
      >
        {label}
      </text>
    </>
  );
}
```

**Использование в LinkEdge:**
```typescript
import { renderEdgeOutline, renderEdgeLabel } from '../../utils/edgeRendering';

// В JSX:
{renderEdgeOutline(edgePath, shouldShowOutline, highlightColor, outlineWidth, LINK_EDGE.dashArray)}
{renderEdgeLabel(label, midX, midY, LINK_EDGE.color)}
```

#### 4.2. Рефакторинг LinkEdge с хуками

**Использование в LinkEdge.tsx:**
```typescript
import { useEdgeHighlight } from '../../hooks/useEdgeHighlight';
import { useEdgeParallelOffset } from '../../hooks/useEdgeParallelOffset';
import { renderEdgeOutline, renderEdgeLabel } from '../../utils/edgeRendering';

function LinkEdge({ id, source, target, style, data, selected }: LinkEdgeProps) {
  const { highlightColor, shouldShowOutline } = useEdgeHighlight(id, selected);
  const offset = useEdgeParallelOffset(source, target, 'link');
  
  // ... расчёты координат с offset ...
  
  return (
    <g className="react-flow__edge">
      {/* Invisible hitbox */}
      <path d={edgePath} strokeWidth={20} stroke="transparent" fill="none" />
      
      {/* Outline */}
      {renderEdgeOutline(edgePath, shouldShowOutline, highlightColor, outlineWidth, LINK_EDGE.dashArray)}
      
      {/* Main path */}
      <path d={edgePath} strokeWidth={LINK_EDGE.strokeWidth} stroke={LINK_EDGE.color} />
      
      {/* Arrow */}
      {/* ... */}
      
      {/* Label */}
      {renderEdgeLabel(data?.label, midX, midY, LINK_EDGE.color)}
    </g>
  );
}
```

#### 4.3. Рефакторинг FlowEdge аналогично

**FlowEdge.tsx** рефакторится аналогично LinkEdge:
- Использует `useEdgeHighlight` хук
- Использует `useEdgeParallelOffset` хук  
- Использует утилитные функции `renderEdgeOutline` и `renderEdgeLabel`
- Inline стили можно оставить (специфичны для SVG)

---

### Фаза 5: Разбиение App.tsx 🎯

**Приоритет: ВЫСОКИЙ** | **Сложность: Низкая**

#### 5.1. Вынести компоненты

**ConnectionModeToggle.tsx:**
```typescript
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectConnectionMode, uiActions } from '../store/slices/uiSlice';
import styles from './ConnectionModeToggle.module.css';

export function ConnectionModeToggle() {
  const dispatch = useAppDispatch();
  const connectionMode = useAppSelector(selectConnectionMode);
  
  const handleToggle = useCallback(() => {
    dispatch(uiActions.toggleConnectionMode());
  }, [dispatch]);
  
  return (
    <div className={styles.container}>
      <span className={styles.label}>Connection:</span>
      <button 
        onClick={handleToggle}
        className={`${styles.button} ${styles[connectionMode]}`}
      >
        {connectionMode === 'link' ? '--- Link' : '═══ Flow'}
      </button>
    </div>
  );
}
```

**ConnectionModeToggle.module.css:**
```css
.container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.label {
  font-size: 14px;
  font-weight: 500;
}

.button {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: white;
  transition: opacity 0.2s;
}

.button:hover {
  opacity: 0.9;
}

.button.link {
  background: var(--edge-link);
}

.button.flow {
  background: var(--edge-flow);
}
```

#### 5.3. Компонент DiagramCanvas

**Файл:** `src/components/DiagramCanvas.tsx`

```typescript
import { ReactFlow, Controls, MiniMap, Background, BackgroundVariant } from '@xyflow/react';
import { useAppSelector } from '../store/hooks';
import { selectNodes, selectEdges } from '../store/slices/diagramSlice';
import { selectIsDragging, selectGhostPosition, selectConnectionMode } from '../store/slices/uiSlice';
import { useDiagramDragDrop } from '../hooks/useDiagramDragDrop';
import { useConnectionHandlers } from '../hooks/useConnectionHandlers';
import { GhostNode } from './GhostNode';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';

export function DiagramCanvas() {
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);
  const isDragging = useAppSelector(selectIsDragging);
  const ghostPosition = useAppSelector(selectGhostPosition);
  const connectionMode = useAppSelector(selectConnectionMode);
  
  const { onDragOver, onDragLeave, onDrop } = useDiagramDragDrop();
  const { onConnectStart, onConnect, onConnectEnd } = useConnectionHandlers();
  // ... другие обработчики ...
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onConnect={onConnect}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      // ... другие props ...
    >
      <Controls />
      <MiniMap />
      <Background variant={BackgroundVariant.Dots} />
      
      {/* Ghost node preview */}
      {isDragging && ghostPosition && (
        <GhostNode position={ghostPosition} />
      )}
    </ReactFlow>
  );
}
```

**Результат:** 
- App.tsx упрощён с 447 до ~10 строк
- AppLayout.tsx ~20 строк + 10 строк CSS  
- DiagramCanvas.tsx ~80 строк (вся логика React Flow)
- ConnectionModeToggle.tsx ~20 строк + 30 строк CSS

---

### Фаза 6: Утилиты и хелперы 🎯

**Приоритет: НИЗКИЙ** | **Сложность: Низкая**

#### 6.1. ID и Label генераторы

**Файл:** `src/utils/nodeFactory.ts`

```typescript
let idCounter = 1;

export function generateNodeId(): string {
  return `id_${idCounter++}`;
}

export function generateNodeLabel(existingNodes: CLDNode[]): string {
  const existingLabels = new Set(existingNodes.map(n => n.data.label));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // Найти первую свободную букву
  for (const letter of alphabet) {
    if (!existingLabels.has(letter)) return letter;
  }
  
  // Двойные буквы
  for (let i = 0; i < alphabet.length; i++) {
    for (let j = 0; j < alphabet.length; j++) {
      const label = alphabet[i] + alphabet[j];
      if (!existingLabels.has(label)) return label;
    }
  }
  
  return '?';
}

export function createNode(
  type: NodeVariant,
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
```

#### 6.2. Edge utility functions

**Файл:** `src/utils/edgeHelpers.ts`

```typescript
export function getEdgeColor(edgeType: EdgeVariant): string {
  return edgeType === 'flow' ? FLOW_EDGE.color : LINK_EDGE.color;
}

export function getEdgeArrowSymbol(
  edgeType: EdgeVariant,
  isBidirectional: boolean
): string {
  if (isBidirectional) {
    return edgeType === 'flow' ? '⇄' : '↔';
  }
  return '→';
}

export function getEdgeTypeLabel(edgeType: EdgeVariant): string {
  return edgeType === 'flow' ? 'Flow' : 'Link';
}
```

---

### Фаза 7: Оптимизация форм 🎯

**Приоритет: НИЗКИЙ** | **Сложность: Низкая**

#### 7.1. Переиспользуемый FormField компонент

**FormField.tsx:**
```typescript
import { ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'number' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
  monospace?: boolean;
}

export function FormField({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  rows,
  hint,
  monospace = false 
}: FormFieldProps) {
  const inputClassName = `${styles.input} ${monospace ? styles.monospace : ''}`;
  
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClassName} ${styles.textarea}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
      
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
```

**FormField.module.css:**
```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-700);
}

.input {
  padding: var(--spacing-sm);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: var(--blue-500);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.monospace {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.hint {
  font-size: 11px;
  color: var(--gray-500);
  margin-top: 2px;
}
```

#### 7.2. Использование в NodePropertiesPanel

**NodePropertiesPanel.tsx (упрощённая версия):**
```typescript
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedNodeId } from '../../store/slices/uiSlice';
import { selectNodes, diagramActions } from '../../store/slices/diagramSlice';
import { FormField } from '../ui/FormField';
import { Badge } from '../ui/Badge';
import styles from './NodePropertiesPanel.module.css';

export function NodePropertiesPanel() {
  const dispatch = useAppDispatch();
  const selectedNodeId = useAppSelector(selectSelectedNodeId);
  const nodes = useAppSelector(selectNodes);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // ... state и handlers ...
  
  if (!selectedNode) return null;
  
  const isStock = selectedNode.type === 'stock';
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {isStock ? 'Stock Properties' : 'Variable Properties'}
      </div>
      
      {/* Node type badge */}
      <Badge variant={isStock ? 'blue' : 'orange'}>
        {isStock ? 'Stock' : 'Variable'}
      </Badge>
      
      {/* Form fields */}
      <FormField
        label="Name"
        value={label}
        onChange={handleLabelChange}
      />
      
      {isStock ? (
        <FormField
          label="Initial Value"
          type="number"
          value={initialValue}
          onChange={handleInitialValueChange}
          placeholder="0"
        />
      ) : (
        <FormField
          label="Formula / Value"
          value={value}
          onChange={handleValueChange}
          placeholder="e.g., 100 or [Stock1] * 0.5"
          hint="Use [NodeName] to reference other nodes"
          monospace
        />
      )}
      
      <FormField
        label="Units"
        value={units}
        onChange={handleUnitsChange}
        placeholder="e.g., people, kg, $"
      />
      
      <FormField
        label="Notes"
        type="textarea"
        value={notes}
        onChange={handleNotesChange}
        placeholder="Add description or notes..."
        rows={4}
      />
      
      {/* Divider */}
      <div className={styles.divider} />
      
      {/* Node ID (read-only) */}
      <div className={styles.idSection}>
        <label className={styles.idLabel}>Node ID</label>
        <div className={styles.idValue}>{selectedNode.id}</div>
      </div>
    </div>
  );
}
```

**NodePropertiesPanel.module.css:**
```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.header {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.divider {
  height: 1px;
  background: var(--gray-200);
  margin: var(--spacing-sm) 0;
}

.idSection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.idLabel {
  font-size: 11px;
  font-weight: 500;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.idValue {
  padding: 6px var(--spacing-sm);
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--gray-500);
  font-family: 'Monaco', 'Menlo', monospace;
}
```

**Результат:** NodePropertiesPanel упрощён с 323 до ~120 строк + 50 строк CSS.

---

## Итоговая структура после рефакторинга

**⚠️ ОБНОВЛЕНО** согласно замечаниям ревью:

```
src/
  ├── components/
  │   ├── nodes/
  │   │   ├── StockNode.tsx                   # ✨ Упрощён до ~50-60 строк
  │   │   ├── StockNode.module.css            # 🆕 CSS Module (~60 строк)
  │   │   ├── VariableNode.tsx                # ✨ Упрощён до ~50-60 строк
  │   │   ├── VariableNode.module.css         # 🆕 CSS Module (~60 строк)
  │   │   └── ...
  │   ├── edges/
  │   │   ├── LinkEdge.tsx                    # ✨ Рефакторинг с хуками
  │   │   ├── FlowEdge.tsx                    # ✨ Рефакторинг с хуками
  │   │   └── ...
  │   ├── ui/                                 # 🆕 Только необходимое
  │   │   ├── Badge.tsx                       # Упрощённый (3 варианта)
  │   │   ├── Badge.module.css
  │   │   ├── FormField.tsx
  │   │   ├── FormField.module.css
  │   │   └── index.ts
  │   ├── AppLayout.tsx                       # 🆕 Вынесен из App.tsx
  │   ├── AppLayout.module.css                # 🆕
  │   ├── ConnectionModeToggle.tsx            # 🆕 Вынесен из App.tsx
  │   ├── ConnectionModeToggle.module.css     # 🆕
  │   ├── DiagramCanvas.tsx                   # 🆕 Вынесен из App.tsx
  │   ├── GhostNode.tsx                       # ✨ Рефакторинг
  │   ├── GhostNode.module.css                # 🆕
  │   └── Sidebar/
  │       ├── Panel.module.css                # 🆕 Общие стили для панелей
  │       ├── Sidebar.tsx                     # ✨ Использует CSS Modules
  │       ├── Sidebar.module.css              # 🆕
  │       ├── NodePropertiesPanel.tsx         # ✨ Упрощён до ~120 строк
  │       ├── NodePropertiesPanel.module.css  # 🆕
  │       ├── EdgePropertiesPanel.tsx         # ✨ Использует CSS Modules
  │       ├── EdgePropertiesPanel.module.css  # 🆕
  │       ├── ConnectionsPanel.tsx            # ✨ Использует Panel.module.css
  │       ├── ConnectionsPanel.module.css     # 🆕
  │       ├── LoopsPanel.tsx                  # ✨ Использует Panel.module.css
  │       └── LoopsPanel.module.css           # 🆕
  ├── hooks/                                  # 🆕 Custom hooks
  │   ├── useNodeHighlight.ts
  │   ├── useNodeHandles.ts                   # 🆕 Вместо BaseNode!
  │   ├── useEdgeHighlight.ts
  │   ├── useNodeLabelsMap.ts
  │   ├── useDiagramDragDrop.ts
  │   ├── useConnectionHandlers.ts
  │   ├── useEdgeParallelOffset.ts
  │   └── index.ts
  ├── constants/
  │   ├── nodeHandles.ts                      # 🆕 Общие константы handles
  │   └── ...
  ├── styles/
  │   └── variables.css                       # 🆕 CSS переменные
  ├── utils/
  │   ├── edge.ts
  │   ├── edgeHelpers.ts                      # 🆕
  │   ├── edgeRendering.tsx                   # 🆕 Утилитные функции для SVG
  │   ├── nodeFactory.ts                      # 🆕
  │   └── graph.ts
  ├── App.tsx                                 # ✨ Упрощён с 447 до ~10 строк
  └── ...
```

### 📊 Изменения структуры:

**❌ НЕ создаём (избыточно):**
- BaseNode компонент
- CenterHandleIndicator, NodeHandles компоненты
- EdgeOutline, EdgeLabel, EdgeArrow компоненты
- Card, Button, Input, Label компоненты

**✅ Создаём вместо них:**
- `useNodeHandles` хук (вместо BaseNode)
- Утилитные функции в `edgeRendering.tsx` (вместо Edge компонентов)
- Общий `Panel.module.css` (вместо Card компонента)
- Только `Badge` и `FormField` (реально переиспользуемые)

### 🎨 CSS Modules подход:

**До рефакторинга (inline стили):**
```typescript
<div style={{
  padding: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}}>
  <div style={{
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  }}>
    Title
  </div>
</div>
```

**После рефакторинга (CSS Modules):**
```typescript
// Component.tsx
import styles from './Component.module.css';

<div className={styles.card}>
  <div className={styles.title}>Title</div>
</div>

// Component.module.css
.card {
  padding: var(--spacing-lg);
  background-color: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
}
```

**Преимущества:**
- ✅ Локальные стили (нет конфликтов)
- ✅ Переиспользуемые CSS переменные
- ✅ Легко читать и поддерживать
- ✅ TypeScript типизация из коробки
- ✅ Лучшая производительность (нет inline стилей)

---

## Метрики до/после

**⚠️ ОБНОВЛЕНО** с учётом замечаний ревью:

| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Размер App.tsx | 447 строк | ~10 строк | **-98%** |
| Размер StockNode | 141 строка | ~50-60 строк + 60 строк CSS | -57% |
| Размер VariableNode | 150 строк | ~50-60 строк + 60 строк CSS | -60% |
| NodePropertiesPanel | 323 строки | ~120 строк + 50 строк CSS | -47% |
| Дублирование кода в Nodes | ~70% | **0%** | **-100%** |
| **Inline стилей** | **~500+ строк** | **0 строк** | **-100%** |
| CSS Modules файлов | 0 | **12** | ✓ (не 15+) |
| CSS переменных | 0 | 20+ | ✓ |
| UI компонентов | 0 | **2** (Badge, FormField) | ✓ (не 5+) |
| Custom hooks | 0 | **7** (включая useNodeHandles) | ✓ |
| Утилитных функций | 0 | 5+ | ✓ |
| Лишних абстракций | 0 | **0** | ✓ |

### 🎨 Улучшения с CSS Modules:

**Преимущества над inline стилями:**

1. **Производительность** - стили компилируются в CSS, не перевычисляются при каждом рендере
2. **Читаемость** - логика отделена от стилей
3. **Переиспользование** - CSS переменные и классы можно использовать повторно
4. **Псевдо-селекторы** - :hover, :focus, :active работают нативно
5. **Media queries** - responsive дизайн встроен в CSS
6. **No magic numbers** - все значения в CSS переменных
7. **TypeScript типизация** - автокомплит для классов в IDE

---

## Порядок выполнения рефакторинга

**⚠️ ИСПРАВЛЕНО:** Порядок изменён на более оптимальный - **по функциональным областям** вместо по фазам. Каждая неделя завершается работающим функционалом.

### Неделя 1: Hooks и утилиты (фундамент) 🎯
**Время: 1-2 часа в день**

**День 1-2:** Создать hooks
1. ✅ Создать папку `hooks/`
2. ✅ `useNodeHighlight.ts` - логика подсветки нод
3. ✅ `useNodeHandles.ts` - **НОВЫЙ** - логика handles
4. ✅ `useEdgeHighlight.ts` - логика подсветки edges
5. ✅ `useNodeLabelsMap.ts` - map для labels

**День 3-4:** Создать утилиты
6. ✅ `utils/nodeFactory.ts` - генерация ID и labels
7. ✅ `utils/edgeHelpers.ts` - helper функции для edges
8. ✅ `utils/edgeRendering.tsx` - **НОВЫЙ** - утилитные функции для SVG
9. ✅ `useDiagramDragDrop.ts` - drag & drop логика
10. ✅ `useConnectionHandlers.ts` - connection логика

**День 5:** CSS переменные
11. ✅ Создать `styles/variables.css` с минимальным набором переменных
12. ✅ Импортировать в `main.tsx`
13. ✅ Настроить TypeScript типы для CSS Modules

**Результат:** Вся переиспользуемая логика готова, можно начинать рефакторинг компонентов.

---

### Неделя 2: Node компоненты ⚡
**Время: 2-3 часа в день**

**День 1-2:** Рефакторинг StockNode
14. ✅ Создать `constants/nodeHandles.ts` с константами
15. ✅ Создать `StockNode.module.css`
16. ✅ Рефакторить `StockNode.tsx` с хуками (без BaseNode!)
17. ✅ Тестирование StockNode

**День 3-4:** Рефакторинг VariableNode
18. ✅ Создать `VariableNode.module.css`
19. ✅ Рефакторить `VariableNode.tsx` с хуками
20. ✅ Тестирование VariableNode

**День 5:** GhostNode
21. ✅ Создать `GhostNode.module.css`
22. ✅ Рефакторить `GhostNode.tsx`
23. ✅ Финальное тестирование всех Node компонентов

**Результат:** Все Node компоненты рефакторены, работают с хуками, используют CSS Modules.

---

### Неделя 3: Edge компоненты 🎨
**Время: 2-3 часа в день**

**День 1-2:** Рефакторинг LinkEdge
24. ✅ Рефакторить `LinkEdge.tsx` с `useEdgeHighlight` хуком
25. ✅ Использовать утилитные функции из `edgeRendering.tsx`
26. ✅ Тестирование LinkEdge

**День 3-4:** Рефакторинг FlowEdge
27. ✅ Рефакторить `FlowEdge.tsx` аналогично LinkEdge
28. ✅ Использовать те же утилитные функции
29. ✅ Тестирование FlowEdge

**День 5:** Финальное тестирование
30. ✅ Тестирование всех edge функций
    - Connections создаются корректно
    - Highlighting работает
    - Cloud edges работают
    - Bidirectional arrows работают

**Результат:** Все Edge компоненты рефакторены, дублирование устранено.

---

### Неделя 4: App и Sidebar 🏗️
**Время: 2-3 часа в день**

**День 1-2:** Создать UI компоненты
31. ✅ Создать `Badge.tsx` + `Badge.module.css` (упрощённый)
32. ✅ Создать `FormField.tsx` + `FormField.module.css`
33. ✅ Создать `Panel.module.css` для Sidebar панелей

**День 3-4:** Разбить App.tsx
34. ✅ Создать `AppLayout.tsx` + `AppLayout.module.css`
35. ✅ Создать `ConnectionModeToggle.tsx` + CSS Module
36. ✅ Создать `DiagramCanvas.tsx`
37. ✅ Упростить `App.tsx` до ~10 строк

**День 5-7:** Рефакторинг Sidebar панелей
38. ✅ `NodePropertiesPanel.tsx` + CSS Module (использовать FormField)
39. ✅ `EdgePropertiesPanel.tsx` + CSS Module
40. ✅ `ConnectionsPanel.tsx` + CSS Module (использовать Panel.module.css)
41. ✅ `LoopsPanel.tsx` + CSS Module (использовать Panel.module.css)
42. ✅ `Sidebar.tsx` + CSS Module

**Финальный день:** Тестирование и оптимизация
43. ✅ Финальное тестирование всех функций
44. ✅ Проверка производительности
45. ✅ Удалить неиспользуемые inline стили
46. ✅ Code review
47. ✅ Документация изменений

**Результат:** Проект полностью рефакторен, все цели достигнуты.

---

## Гарантии сохранения функциональности

### ✅ Что будет сохранено:
- Вся логика Redux (store остаётся без изменений)
- Все обработчики событий
- Drag & Drop функциональность
- Connection логика (link/flow режимы)
- Cloud edges с draggable endpoints
- Highlighting и selection
- Все панели в Sidebar
- Feedback loops detection
- Все стили и визуал

### ⚠️ Что НЕ будет изменено:
- Redux store structure
- Типы (types/)
- Константы (constants/)
- Утилиты graph.ts и edge.ts (математика)
- React Flow конфигурация

### 🔧 Изменения только в:
- Структуре компонентов (композиция)
- Извлечении логики в hooks
- Создании переиспользуемых UI компонентов
- Улучшении читаемости кода

---

## Best Practices применяемые в рефакторинге

### React Best Practices
1. **Custom Hooks для логики** - Извлечение повторяющейся логики
2. **Composition over Inheritance** - BaseNode как обёртка, а не наследование
3. **Single Responsibility** - Каждый компонент делает одну вещь
4. **Small Components** - Компоненты < 100 строк
5. **Meaningful Names** - Названия hooks отражают их назначение

### CSS/Styling Best Practices
6. **CSS Modules** - Локальные стили, нет конфликтов имён
7. **CSS Variables (Custom Properties)** - Централизованные design tokens
8. **BEM-подобная структура** - Понятная иерархия классов
9. **Separation of Concerns** - Стили отдельно от логики
10. **No Magic Numbers** - Все значения через CSS переменные
11. **Semantic Class Names** - .card, .button, .field, не .blue-box

### Code Quality
12. **DRY (Don't Repeat Yourself)** - Устранение дублирования
13. **Reusable Components** - UI компоненты можно использовать везде
14. **Pure Functions** - Утилиты не имеют side effects
15. **TypeScript Strict** - Типизация везде
16. **Performance** - CSS Modules компилируются, не перевычисляются

---

## Риски и их митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Сломать существующую функциональность | Средняя | Поэтапный рефакторинг, тестирование после каждой фазы |
| Увеличить bundle size | Низкая | Custom hooks не увеличивают размер, UI компоненты маленькие |
| Усложнить структуру | Низкая | Следуем React best practices, документируем изменения |
| Потерять производительность | Очень низкая | useMemo/useCallback остаются, оптимизация сохраняется |

---

## Заключение

**⚠️ ОБНОВЛЕНО** после ревью плана рефакторинга.

### Что было исправлено:

1. ✅ **Убрали BaseNode** - вместо него хук `useNodeHandles` (избыточная абстракция)
2. ✅ **Упростили UI компоненты** - только Badge (3 варианта) и FormField
3. ✅ **Убрали Edge компоненты** - используем утилитные функции
4. ✅ **Добавили AppLayout** - лучшая структура App.tsx
5. ✅ **Изменили порядок** - рефакторинг по функциональным областям
6. ✅ **Добавили GhostNode** - был упущен из плана
7. ✅ **Добавили FlowEdge** - был упущен из плана
8. ✅ **Добавили Panel.module.css** - общие стили для Sidebar панелей

### Этот план рефакторинга позволит:
- ✅ **CSS Modules** - все inline стили вынесены в отдельные файлы
- ✅ **CSS Variables** - централизованные design tokens
- ✅ **Hooks вместо абстракций** - переиспользование логики без over-engineering
- ✅ **Утилитные функции** - вместо лишних компонентов
- ✅ Уменьшить объём кода на ~30-40%
- ✅ Устранить дублирование на 100%
- ✅ Убрать 500+ строк inline стилей
- ✅ Улучшить читаемость и maintainability
- ✅ Следовать современным React + CSS best practices
- ✅ **Избежать избыточных абстракций** - только то, что реально переиспользуется
- ✅ Сохранить всю существующую функциональность
- ✅ Улучшить производительность (нет пересчёта inline стилей)
- ✅ Упростить добавление новых features в будущем

### Ключевые принципы после ревью:
1. **Composition через hooks** - не через компоненты-обёртки
2. **Утилитные функции** - для простых SVG элементов
3. **Минималистичный UI** - только реально переиспользуемое
4. **Общие CSS классы** - вместо компонентов-обёрток
5. **Рефакторинг по областям** - чтобы каждая неделя давала результат

### Почему именно CSS Modules?
- ✅ Нет vendor lock-in
- ✅ Привычный CSS синтаксис
- ✅ Полный контроль над стилями
- ✅ Нулевые зависимости
- ✅ TypeScript типизация из коробки
- ✅ Отлично работает с Vite

**Главный принцип:** Рефакторинг без изменения поведения и без избыточных абстракций. KISS (Keep It Simple, Stupid).

**Следующий шаг:** Начать с Недели 1 - создание hooks и утилит (фундамент для рефакторинга).

