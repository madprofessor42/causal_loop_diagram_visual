# Интеграция с пакетом `simulation`

## Обзор

Пакет `simulation` (версия 8.0.0) — это мощная библиотека для симуляции System Dynamics моделей. Она поддерживает:

- **System Dynamics** (дифференциальные уравнения)
- **Agent Based Modeling** (агентное моделирование)
- Импорт моделей из **Insight Maker**
- Экспорт/импорт в формате **ModelJSON**

**Репозиторий:** https://github.com/scottfr/simulation

---

## API пакета `simulation`

### Основные классы

```javascript
import { 
  Model,           // Основной класс модели
  Stock,           // Накопитель
  Variable,        // Переменная (формула/константа)
  Converter,       // Lookup-таблица
  Flow,            // Поток между Stocks
  Link,            // Информационная связь
  Results          // Результаты симуляции
} from "simulation";
```

### Создание модели

```javascript
let m = new Model({
  timeStart: 0,           // Начало симуляции
  timeLength: 100,        // Длительность
  timeStep: 1,            // Шаг симуляции
  timeUnits: "Years",     // Единицы времени
  algorithm: "RK4"        // Алгоритм: "Euler" или "RK4"
});
```

### Создание примитивов

```javascript
// Stock — накопитель
let population = m.Stock({
  name: "Population",
  initial: 1000,
  units: "People"
});

// Variable — переменная
let growthRate = m.Variable({
  name: "Growth Rate",
  value: 0.02,
  units: "1/Years"
});

// Flow — поток (null = облачко)
let births = m.Flow(null, population, {
  name: "Births",
  rate: "[Population] * [Growth Rate]",
  units: "People/Year"
});

// Link — информационная связь
m.Link(growthRate, births);
```

### Запуск симуляции

```javascript
// Синхронный запуск
let results = m.simulate();

// Асинхронный запуск (для интерактивных симуляций)
let results = await m.simulateAsync({
  onStep: async (simulation) => {
    console.log(`Time: ${simulation.time}`);
    // Можно изменять значения во время симуляции
    simulation.setValue(someVariable, newValue);
  }
});
```

### Получение результатов

```javascript
// Все временные точки
results.times();  // [0, 1, 2, ..., 100]

// Серия значений примитива
results.series(population);  // [1000, 1020, 1040.4, ...]

// Значение в конкретный момент времени
results.value(population, 50);  // 2691.58...

// Таблица всех данных
results.table([population, growthRate]);
// [
//   { _time: 0, Population: 1000, "Growth Rate": 0.02 },
//   { _time: 1, Population: 1020, "Growth Rate": 0.02 },
//   ...
// ]
```

---

## Маппинг UI → Simulation API

### Узлы (Nodes)

| UI тип | Simulation API | Метод создания |
|--------|----------------|----------------|
| `stock` | `Stock` | `m.Stock({ name, initial, units })` |
| `variable` | `Variable` | `m.Variable({ name, value, units })` |

### Связи (Edges)

| UI тип | Simulation API | Метод создания |
|--------|----------------|----------------|
| `flow` | `Flow` | `m.Flow(source, target, { name, rate, units })` |
| `link` | `Link` | `m.Link(source, target)` |

### Особенности маппинга

1. **Flow с облачком**: 
   - `source = null` → inflow из ниоткуда
   - `target = null` → outflow в никуда

2. **Формулы используют `[Name]` синтаксис**:
   - `"[Population] * 0.02"` — ссылка на примитив по имени
   - `"{10 people/year}"` — число с единицами

3. **Link обязателен для ссылок в формулах**:
   - Если Flow использует `[Variable]` в формуле, нужен `m.Link(variable, flow)`

---

## План интеграции

### 1. Конвертер UI → Simulation Model

Создать функцию `convertToSimulationModel`:

```typescript
// src/utils/simulation.ts

import { Model } from "simulation";
import type { Node, Edge } from "@xyflow/react";

interface SimulationResult {
  model: Model;
  primitiveMap: Map<string, any>; // nodeId → primitive
}

export function convertToSimulationModel(
  nodes: Node[],
  edges: Edge[],
  config?: {
    timeStart?: number;
    timeLength?: number;
    timeStep?: number;
    timeUnits?: string;
  }
): SimulationResult {
  const m = new Model({
    timeStart: config?.timeStart ?? 0,
    timeLength: config?.timeLength ?? 100,
    timeStep: config?.timeStep ?? 1,
    timeUnits: config?.timeUnits ?? "Years",
  });

  const primitiveMap = new Map();

  // 1. Создаём Stocks и Variables
  for (const node of nodes) {
    if (node.type === "stock") {
      const stock = m.Stock({
        name: node.data.label,
        initial: node.data.initialValue ?? 0,
        units: node.data.units,
      });
      primitiveMap.set(node.id, stock);
    } else if (node.type === "variable") {
      const variable = m.Variable({
        name: node.data.label,
        value: node.data.value ?? "0",
        units: node.data.units,
      });
      primitiveMap.set(node.id, variable);
    }
  }

  // 2. Создаём Flows
  const flowEdges = edges.filter(e => e.type === "flow");
  for (const edge of flowEdges) {
    const source = edge.source ? primitiveMap.get(edge.source) : null;
    const target = edge.target ? primitiveMap.get(edge.target) : null;
    
    const flow = m.Flow(source, target, {
      name: edge.data?.label ?? "Flow",
      rate: edge.data?.rate ?? "0",
      units: edge.data?.units,
    });
    primitiveMap.set(edge.id, flow);
  }

  // 3. Создаём Links
  const linkEdges = edges.filter(e => e.type === "link");
  for (const edge of linkEdges) {
    const source = primitiveMap.get(edge.source);
    const target = primitiveMap.get(edge.target);
    
    if (source && target) {
      m.Link(source, target);
    }
  }

  return { model: m, primitiveMap };
}
```

### 2. Запуск симуляции

```typescript
// src/utils/simulation.ts

export async function runSimulation(
  nodes: Node[],
  edges: Edge[],
  config?: SimulationConfig
): Promise<SimulationResults> {
  const { model, primitiveMap } = convertToSimulationModel(nodes, edges, config);
  
  try {
    const results = model.simulate();
    
    return {
      success: true,
      times: results.times(),
      series: Object.fromEntries(
        Array.from(primitiveMap.entries()).map(([id, primitive]) => [
          id,
          results.series(primitive)
        ])
      )
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorPrimitiveId: error.errorPrimitive?.id
    };
  }
}
```

### 3. UI компонент для запуска симуляции

```tsx
// src/components/SimulationPanel.tsx

import { runSimulation } from "../utils/simulation";
import { useAppSelector } from "../store/hooks";

export function SimulationPanel() {
  const nodes = useAppSelector(state => state.diagram.nodes);
  const edges = useAppSelector(state => state.diagram.edges);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    const res = await runSimulation(nodes, edges, {
      timeLength: 100,
      timeStep: 1
    });
    setResults(res);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleSimulate} disabled={loading}>
        {loading ? "Simulating..." : "Simulate"}
      </button>
      
      {results && (
        <SimulationChart 
          times={results.times} 
          series={results.series} 
        />
      )}
    </div>
  );
}
```

---

## Структура данных для интеграции

### Node data (расширенная)

```typescript
interface StockNodeData extends BaseNodeData {
  label: string;
  initialValue?: number | string;  // "100" или "[Variable]"
  units?: string;
}

interface VariableNodeData extends BaseNodeData {
  label: string;
  value?: string;  // "0.02" или "[Stock] * 0.5"
  units?: string;
}
```

### Edge data (расширенная)

```typescript
interface FlowEdgeData extends BaseEdgeData {
  label?: string;
  rate?: string;   // "[Stock] * 0.1"
  units?: string;
}

interface LinkEdgeData extends BaseEdgeData {
  // Link не требует дополнительных данных
  // Он просто делает source доступным в формулах target
}
```

---

## Зависимости

Добавить в `package.json`:

```json
{
  "dependencies": {
    "simulation": "^8.0.0"
  }
}
```

Или использовать локальную версию из workspace:

```json
{
  "dependencies": {
    "simulation": "file:../simulation"
  }
}
```

---

## Порядок реализации

1. **Добавить зависимость `simulation`** в causal_loop_diagram_visual
2. **Расширить типы данных узлов и связей** для хранения формул
3. **Создать `convertToSimulationModel`** функцию
4. **Создать UI для редактирования формул** (в свойствах узлов/связей)
5. **Создать SimulationPanel** с кнопкой запуска и графиком результатов
6. **Добавить визуализацию результатов** (Chart.js или другая библиотека)

---

## Пример полной интеграции (SIR модель)

```typescript
// Создание модели из UI данных
const nodes = [
  { id: "s", type: "stock", data: { label: "Susceptible", initialValue: 999 } },
  { id: "i", type: "stock", data: { label: "Infected", initialValue: 1 } },
  { id: "r", type: "stock", data: { label: "Recovered", initialValue: 0 } },
  { id: "beta", type: "variable", data: { label: "Contact Rate", value: "0.0003" } },
  { id: "gamma", type: "variable", data: { label: "Recovery Rate", value: "0.015" } },
];

const edges = [
  { id: "f1", type: "flow", source: "s", target: "i", data: { 
    label: "Infection", 
    rate: "[Susceptible] * [Infected] * [Contact Rate]" 
  }},
  { id: "f2", type: "flow", source: "i", target: "r", data: { 
    label: "Recovery", 
    rate: "[Infected] * [Recovery Rate]" 
  }},
  // Links для доступа к переменным в формулах Flow
  { id: "l1", type: "link", source: "beta", target: "f1" },
  { id: "l2", type: "link", source: "gamma", target: "f2" },
];

const results = await runSimulation(nodes, edges, { timeLength: 200 });
// results.series["s"] = [999, 998.7, 998.1, ...]
// results.series["i"] = [1, 1.3, 1.7, ...]
// results.series["r"] = [0, 0.015, 0.04, ...]
```

