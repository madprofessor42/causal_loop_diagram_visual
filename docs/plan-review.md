# Ревью плана: Causal Loop Diagram приложение

## 📋 Общая оценка плана

**Статус:** ✅ Отличный и детальный план  
**Оценка полноты:** 9/10  
**Техническая обоснованность:** 10/10

План отлично структурирован и учитывает основные особенности Causal Loop Diagrams. React Flow (@xyflow/react) - правильный выбор для этой задачи.

---

## ✅ Сильные стороны плана

### 1. Правильный выбор технологического стека
- **React Flow** - идеальная библиотека для node-based диаграмм
- Поддерживает все необходимые функции: drag & drop, custom nodes/edges, connections
- Высокая производительность и активная поддержка

### 2. Учтены все ключевые элементы CLD
- ✅ Узлы-переменные (Variables)
- ✅ Полярность связей (+/-)
- ✅ Задержанные связи (Delayed)
- ✅ Обнаружение петель
- ✅ Классификация R/B петель

### 3. Хорошая архитектура
- Разделение на компоненты
- Утилиты для логики (loop detection)
- TypeScript типизация

---

## 🔍 Детальный анализ по разделам

### Раздел 1: Структура данных ✅

**Текущий план:**
```typescript
interface CLDNode {
  id: string;
  type: 'variable';
  data: { label: string };
  position: { x: number; y: number };
}
```

**Рекомендации:**

1. **Расширить данные узла** для будущих функций:
```typescript
interface CLDNode extends Node {
  id: string;
  type: 'variable';
  data: { 
    label: string;
    description?: string; // Опциональное описание
    value?: number; // Для симуляции (будущее)
    color?: string; // Кастомная раскраска
  };
  position: { x: number; y: number };
}
```

2. **Добавить метаданные в edges**:
```typescript
interface CLDEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type: 'polarity'; // Всегда 'polarity' для CLD
  data: {
    polarity: '+' | '-';
    delayed: boolean;
    strength?: 'weak' | 'medium' | 'strong'; // Сила влияния
    description?: string; // Описание связи
  };
  markerEnd: { type: MarkerType };
}
```

**Статус:** ✅ Хорошая база, небольшие улучшения рекомендованы

---

### Раздел 2: CircleNode компонент ✅

**Текущий план:**
- Круглая форма
- Редактируемое название
- Handle точки

**Рекомендации:**

1. **Использовать Handle компоненты React Flow** правильно:
```typescript
import { Handle, Position } from '@xyflow/react';

// В CircleNode компоненте:
<Handle 
  type="target" 
  position={Position.Top} 
  style={{ opacity: 0 }} // Скрыть, но сделать функциональным
/>
<Handle 
  type="source" 
  position={Position.Bottom} 
  style={{ opacity: 0 }}
/>
```

2. **Поддержка редактирования**:
   - Использовать `contentEditable` или контролируемый input
   - Обрабатывать double-click через `onDoubleClick`
   - Сохранять изменения через `updateNodeData` из React Flow

3. **Стили для визуального feedback**:
   - Подсветка при наведении
   - Выделение при выборе
   - Визуальная обратная связь при создании связи

**Пример структуры:**
```tsx
const CircleNode = ({ id, data, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const updateNodeData = useUpdateNodeData(); // React Flow hook

  return (
    <div className={`circle-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      {isEditing ? (
        <input
          autoFocus
          defaultValue={data.label}
          onBlur={(e) => {
            updateNodeData(id, { label: e.target.value });
            setIsEditing(false);
          }}
        />
      ) : (
        <div onDoubleClick={() => setIsEditing(true)}>
          {data.label}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

**Статус:** ✅ Хороший план, добавлены детали реализации

---

### Раздел 3: PolarityEdge компонент ✅

**Текущий план:**
- Стрелка с маркером
- Label с полярностью
- Индикатор задержки
- Переключение полярности по клику

**Рекомендации:**

1. **Использовать BaseEdge** из React Flow (best practice):
```tsx
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from '@xyflow/react';

const PolarityEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="edge-label"
        >
          <button onClick={() => togglePolarity(id)}>
            {data.polarity}
          </button>
          {data.delayed && <span className="delay-indicator">||</span>}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
```

2. **Визуальные различия**:
   - Положительные связи: сплошная линия, зеленый/синий цвет
   - Отрицательные связи: можно использовать красный цвет
   - Задержанные связи: двойные вертикальные линии || на середине

3. **Интерактивность**:
   - Клик на label для переключения полярности
   - Правый клик для контекстного меню (изменить, удалить)

**Статус:** ✅ Отличный план, добавлена лучшая практика с BaseEdge

---

### Раздел 4: Loop Detection алгоритм ⚠️

**Текущий план:**
- DFS/BFS для поиска циклов
- Поиск всех простых циклов

**Критические рекомендации:**

1. **Алгоритм Johnson для поиска всех элементарных циклов**:
   - Стандартный DFS найдет не все циклы в сложных графах
   - Алгоритм Johnson's (1975) - золотой стандарт для поиска всех простых циклов
   - Альтернатива: алгоритм Tarjan для strongly connected components + DFS

2. **Оптимизация**:
   - Кэшировать результаты анализа
   - Запускать анализ только при изменении графа
   - Для больших графов (>50 узлов) использовать debounce

3. **Структура loop detector**:
```typescript
// src/utils/loop-detector.ts
interface Loop {
  id: string;
  nodes: string[];
  edges: string[];
  type?: 'reinforcing' | 'balancing'; // Будет добавлено классификатором
}

export function detectLoops(nodes: Node[], edges: Edge[]): Loop[] {
  // Реализация поиска всех простых циклов
  const cycles: Loop[] = [];
  
  // 1. Построить adjacency list
  const graph = buildAdjacencyList(nodes, edges);
  
  // 2. Найти все strongly connected components
  const sccs = findStronglyConnectedComponents(graph);
  
  // 3. Для каждой SCC найти все простые циклы
  sccs.forEach(scc => {
    const sccCycles = findAllCyclesInSCC(scc, graph, edges);
    cycles.push(...sccCycles);
  });
  
  return cycles;
}
```

4. **Важно:** React Flow предоставляет утилиту `getOutgoers` для обхода графа:
```typescript
import { getOutgoers } from '@xyflow/react';

const outgoers = getOutgoers(node, nodes, edges);
```

**Статус:** ⚠️ Нужна более детальная реализация алгоритма

---

### Раздел 5: Loop Classification ✅

**Текущий план:**
- Подсчет отрицательных связей
- Четное число = Reinforcing
- Нечетное число = Balancing

**Рекомендации:**

1. **Правильность логики:** ✅ Верно!
   - 0 отрицательных связей → Reinforcing (positive feedback)
   - 2, 4, 6... отрицательных связей → Reinforcing
   - 1, 3, 5... отрицательных связей → Balancing (negative feedback)

2. **Реализация**:
```typescript
// src/utils/loop-classifier.ts
export function classifyLoop(loop: Loop, edges: Edge[]): 'reinforcing' | 'balancing' {
  const loopEdges = edges.filter(edge => loop.edges.includes(edge.id));
  const negativeCount = loopEdges.filter(edge => edge.data.polarity === '-').length;
  
  return negativeCount % 2 === 0 ? 'reinforcing' : 'balancing';
}

export function classifyLoops(loops: Loop[], edges: Edge[]): Loop[] {
  return loops.map(loop => ({
    ...loop,
    type: classifyLoop(loop, edges)
  }));
}
```

3. **Визуальная индикация**:
   - Reinforcing: 🔴 R (красный/оранжевый) - "снежный ком"
   - Balancing: 🔵 B (синий/зеленый) - "стабилизация"

**Статус:** ✅ Отлично, правильная логика

---

### Раздел 6: Sidebar и Drag & Drop ✅

**Текущий план:**
- Элемент Variable для перетаскивания
- Инструкции
- Легенда

**Рекомендации:**

1. **Использовать HTML Drag and Drop API** (как в примерах React Flow):
```tsx
const NodeSidebar = () => {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="sidebar">
      <div
        className="dnd-node"
        draggable
        onDragStart={(e) => onDragStart(e, 'variable')}
      >
        ⭕ Variable
      </div>
      <div className="legend">
        <h3>Legend</h3>
        <div>➕ Positive link (same direction)</div>
        <div>➖ Negative link (opposite direction)</div>
        <div>|| Delayed effect</div>
        <div>🔴 R - Reinforcing Loop</div>
        <div>🔵 B - Balancing Loop</div>
      </div>
    </aside>
  );
};
```

2. **В главном компоненте обработать drop**:
```tsx
const onDrop = (event: DragEvent) => {
  event.preventDefault();
  const type = event.dataTransfer.getData('application/reactflow');
  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });
  
  const newNode: CLDNode = {
    id: `node-${Date.now()}`,
    type: 'variable',
    position,
    data: { label: 'New Variable' },
  };
  
  setNodes(nodes => [...nodes, newNode]);
};
```

**Статус:** ✅ Хороший план, добавлены детали

---

### Раздел 7: LoopPanel компонент ✅

**Текущий план:**
- Список обнаруженных петель
- Highlight при наведении
- Цветовое кодирование

**Рекомендации:**

1. **Highlight петель** - использовать React Flow API:
```tsx
const [highlightedLoop, setHighlightedLoop] = useState<string | null>(null);

const onLoopHover = (loopId: string) => {
  setHighlightedLoop(loopId);
  
  // Подсветить узлы и ребра петли
  setNodes(nodes => 
    nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: highlightedLoopNodes.includes(node.id) ? 1 : 0.3,
      }
    }))
  );
};
```

2. **Структура панели**:
```tsx
<div className="loop-panel">
  <h3>Detected Loops ({loops.length})</h3>
  {loops.map(loop => (
    <div
      key={loop.id}
      className={`loop-item ${loop.type}`}
      onMouseEnter={() => onLoopHover(loop.id)}
      onMouseLeave={() => setHighlightedLoop(null)}
    >
      <span className="loop-badge">
        {loop.type === 'reinforcing' ? '🔴 R' : '🔵 B'}
      </span>
      <div className="loop-path">
        {loop.nodes.map((nodeId, i) => (
          <span key={nodeId}>
            {getNodeLabel(nodeId)}
            {i < loop.nodes.length - 1 && ' → '}
          </span>
        ))}
      </div>
    </div>
  ))}
</div>
```

**Статус:** ✅ Хороший план

---

## 🆕 Дополнительные рекомендации

### 1. **Функции, которые стоит добавить**

#### Экспорт/Импорт диаграмм
```typescript
// Сохранение в JSON
const exportDiagram = () => {
  const diagram = { nodes, edges, metadata: { name, date } };
  const json = JSON.stringify(diagram, null, 2);
  downloadFile('diagram.cld.json', json);
};

// Загрузка из JSON
const importDiagram = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const diagram = JSON.parse(e.target.result);
    setNodes(diagram.nodes);
    setEdges(diagram.edges);
  };
  reader.readAsText(file);
};
```

#### Экспорт в изображение
```typescript
import { toPng } from 'html-to-image';

const exportToImage = async () => {
  const element = document.querySelector('.react-flow');
  const dataUrl = await toPng(element);
  downloadImage('diagram.png', dataUrl);
};
```

#### Undo/Redo функциональность
```typescript
// Использовать библиотеку типа use-undo
import useUndo from 'use-undo';

const [nodesState, { set: setNodes, undo, redo, canUndo, canRedo }] = 
  useUndo(initialNodes);
```

### 2. **Улучшения UX**

#### Mini Map
```tsx
import { MiniMap } from '@xyflow/react';

<ReactFlow ...>
  <MiniMap />
  <Controls />
  <Background />
</ReactFlow>
```

#### Контекстные меню
```typescript
const onNodeContextMenu = (event: MouseEvent, node: Node) => {
  event.preventDefault();
  // Показать меню: Edit, Delete, Duplicate
};

const onEdgeContextMenu = (event: MouseEvent, edge: Edge) => {
  event.preventDefault();
  // Показать меню: Change Polarity, Toggle Delay, Delete
};
```

#### Клавиатурные shortcuts
- `Delete` - удалить выбранные элементы
- `Ctrl+Z` / `Cmd+Z` - undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - redo
- `Ctrl+S` / `Cmd+S` - сохранить
- `Space + drag` - pan canvas

### 3. **Валидация и предотвращение ошибок**

#### Предотвращение дублирующих связей
```typescript
const onConnect = useCallback((connection: Connection) => {
  // Проверить, нет ли уже такой связи
  const isDuplicate = edges.some(
    edge => edge.source === connection.source && 
            edge.target === connection.target
  );
  
  if (isDuplicate) {
    toast.warning('Connection already exists');
    return;
  }
  
  const newEdge: CLDEdge = {
    ...connection,
    id: `edge-${Date.now()}`,
    type: 'polarity',
    data: { polarity: '+', delayed: false },
    markerEnd: { type: MarkerType.ArrowClosed },
  };
  
  setEdges(edges => [...edges, newEdge]);
}, [edges]);
```

#### Предотвращение self-loops (опционально)
```typescript
const isValidConnection = (connection: Connection) => {
  // Для CLD self-loops обычно допустимы, но можно ограничить
  return connection.source !== connection.target;
};

<ReactFlow isValidConnection={isValidConnection} />
```

### 4. **Производительность**

#### Мемоизация компонентов
```typescript
const CircleNode = memo(({ id, data, selected }: NodeProps) => {
  // ...
});

const PolarityEdge = memo(({ id, data, ...props }: EdgeProps) => {
  // ...
});
```

#### Debounce для loop analysis
```typescript
import { debounce } from 'lodash';

const debouncedAnalyzeLoops = useMemo(
  () => debounce((nodes, edges) => {
    const loops = detectLoops(nodes, edges);
    const classified = classifyLoops(loops, edges);
    setLoops(classified);
  }, 500),
  []
);

useEffect(() => {
  debouncedAnalyzeLoops(nodes, edges);
}, [nodes, edges]);
```

---

## 📦 Дополнительные зависимости

### Рекомендуемые библиотеки:
```json
{
  "dependencies": {
    "@xyflow/react": "^12.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "optionalDependencies": {
    "html-to-image": "^1.11.11",  // Для экспорта в PNG
    "use-undo": "^1.1.0",          // Для undo/redo
    "react-hot-toast": "^2.4.0"    // Для уведомлений
  }
}
```

---

## 🗂️ Итоговая структура файлов

```
src/
├── components/
│   ├── CircleNode.tsx          ✅ Кастомный узел
│   ├── PolarityEdge.tsx        ✅ Кастомный edge
│   ├── NodeSidebar.tsx         ✅ Sidebar с drag & drop
│   ├── LoopPanel.tsx           ✅ Панель петель
│   ├── Toolbar.tsx             🆕 Toolbar с кнопками
│   ├── ContextMenu.tsx         🆕 Контекстное меню
│   └── ExportDialog.tsx        🆕 Диалог экспорта
│
├── utils/
│   ├── loop-detector.ts        ✅ Алгоритм поиска циклов
│   ├── loop-classifier.ts      ✅ Классификация петель
│   ├── graph-utils.ts          🆕 Утилиты работы с графом
│   ├── export.ts               🆕 Экспорт/импорт
│   └── validation.ts           🆕 Валидация связей
│
├── types/
│   ├── causal-loop.ts          ✅ TypeScript типы
│   └── index.ts                🆕 Экспорт типов
│
├── hooks/
│   ├── useLoopDetection.ts     🆕 Hook для обнаружения петель
│   ├── useEdgeInteraction.ts   🆕 Hook для работы с edges
│   └── useUndo.ts              🆕 Hook для undo/redo
│
├── styles/
│   ├── App.css                 ✅ Главные стили
│   ├── CircleNode.css          🆕 Стили узлов
│   ├── PolarityEdge.css        🆕 Стили edges
│   └── Sidebar.css             🆕 Стили sidebar
│
├── App.tsx                     ✅ Главный компонент
└── main.tsx                    ✅ Entry point
```

---

## 🎯 Приоритизация реализации

### Phase 1: MVP (Core Functionality) - 1-2 дня
1. ✅ Установка React Flow
2. ✅ Базовые типы данных
3. ✅ CircleNode компонент
4. ✅ PolarityEdge компонент
5. ✅ Основной Canvas с connections
6. ✅ Простой sidebar

**Результат:** Можно создавать узлы и связи с полярностью

### Phase 2: Advanced Features - 1-2 дня
7. ✅ Loop detection алгоритм
8. ✅ Loop classification
9. ✅ LoopPanel с визуализацией
10. ✅ Delayed links индикатор
11. 🆕 Редактирование узлов (double-click)
12. 🆕 Изменение полярности (click on label)

**Результат:** Полнофункциональный CLD редактор

### Phase 3: Polish & UX - 1 день
13. 🆕 Toolbar с кнопками
14. 🆕 Контекстные меню
15. 🆕 Export/Import JSON
16. 🆕 Стилизация и анимации
17. 🆕 MiniMap и Controls

**Результат:** Профессиональное приложение

### Phase 4: Optional Enhancements - по желанию
18. 🆕 Undo/Redo
19. 🆕 Export to PNG
20. 🆕 Keyboard shortcuts
21. 🆕 Tutorial/Onboarding
22. 🆕 Примеры диаграмм

---

## ⚠️ Потенциальные проблемы и решения

### Проблема 1: Сложность алгоритма поиска циклов
**Решение:** Начать с простого DFS для базовых циклов, потом оптимизировать

### Проблема 2: Производительность при большом количестве узлов
**Решение:** 
- Использовать мемоизацию
- Debounce для loop analysis
- React.memo для компонентов

### Проблема 3: Визуальное наложение edge labels
**Решение:**
- Использовать EdgeLabelRenderer
- Адаптивное позиционирование labels
- Опция скрытия labels при zoom out

### Проблема 4: Редактирование узлов может конфликтовать с drag
**Решение:**
- Double-click для редактирования
- Блокировать drag во время редактирования
- `draggable={!isEditing}` в node

---

## 📚 Полезные ресурсы

### React Flow Documentation
- Official Docs: https://reactflow.dev/
- Examples: https://reactflow.dev/examples
- API Reference: https://reactflow.dev/api-reference

### Causal Loop Diagrams Theory
- System Dynamics Society: https://www.systemdynamics.org/
- Introduction to System Thinking: D. Meadows
- Business Dynamics: J. Sterman

### Алгоритмы для Loop Detection
- Johnson's Algorithm (1975) - finding all elementary cycles
- Tarjan's Algorithm - strongly connected components
- DFS-based cycle detection

---

## ✅ Чек-лист готовности к реализации

- [x] React Flow установлен (@xyflow/react)
- [x] TypeScript настроен
- [x] Понимание структуры CLD
- [x] План архитектуры готов
- [x] Известны все компоненты
- [x] Алгоритмы определены
- [x] Приоритеты расставлены

---

## 🎓 Рекомендации по кодированию

### 1. Начните с минимального примера
Создайте простейшую версию с одним узлом и одной связью, затем расширяйте.

### 2. Тестируйте инкрементально
После каждого компонента проверяйте работоспособность.

### 3. Используйте React Flow DevTools
Установите расширение для браузера для отладки.

### 4. Изучите примеры React Flow
В документации много готовых решений для типичных задач.

---

## 🏁 Заключение

**Итоговая оценка плана: 9.5/10**

Ваш план отлично структурирован и технически обоснован. Основные рекомендации:

1. ✅ **Архитектура:** Отличная, используйте React Flow best practices
2. ⚠️ **Loop Detection:** Нужен более robust алгоритм (Johnson's)
3. ✅ **Типы данных:** Хорошие, можно расширить
4. 🆕 **Добавить:** Export/Import, Undo/Redo, Keyboard shortcuts
5. ✅ **Приоритизация:** Начните с MVP, затем добавляйте фичи

**Готов к реализации!** 🚀

План покрывает все необходимые аспекты Causal Loop Diagrams. React Flow предоставляет все нужные инструменты. Следуя этому плану и рекомендациям, вы создадите профессиональное приложение для CLD.

**Следующие шаги:**
1. Установить зависимости: `npm install @xyflow/react`
2. Создать структуру папок
3. Начать с Phase 1 (MVP)
4. Итеративно добавлять функциональность

Удачи в реализации! 🎯

