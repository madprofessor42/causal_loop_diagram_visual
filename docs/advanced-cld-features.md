# Расширенные возможности для Causal Loop Diagram

## 📊 Исследование дополнительных элементов CLD

На основе анализа профессиональных инструментов (Vensim, Stella, iThink) и стандартов System Dynamics, вот полный список элементов, которые нужно учесть.

---

## 🔴 Критически важные элементы (упущены в первоначальном плане)

### 1. **Сила/Вес связи (Link Strength/Weight)** ⭐ ВЫСОКИЙ ПРИОРИТЕТ

**Описание:**
Вы правильно заметили - не все связи одинаково влияют на систему. Одна переменная может сильно влиять на другую, а обратное влияние может быть минимальным.

**Реализация:**

```typescript
interface CLDEdge {
  id: string;
  source: string;
  target: string;
  data: {
    polarity: '+' | '-';
    delayed: boolean;
    weight: number;              // 🆕 0.0 - 1.0 (или -1.0 до 1.0 с учетом полярности)
    weightLabel?: string;        // 🆕 "weak" | "medium" | "strong"
    description?: string;
  };
}
```

**Визуализация:**
- **Толщина линии:** 
  - Weak (0.1-0.3): тонкая линия (1-2px)
  - Medium (0.4-0.7): средняя (3-4px)
  - Strong (0.8-1.0): толстая (5-6px)
  
- **Дополнительно:**
  - Числовое значение на середине стрелки
  - Опция показать/скрыть веса
  - Интерактивный слайдер при клике на связь

**UI для редактирования:**
```typescript
// В контекстном меню edge
<EdgeContextMenu>
  <MenuItem>Polarity: {+/-}</MenuItem>
  <MenuItem>
    Strength: 
    <Slider min={0} max={1} step={0.1} value={weight} />
    <Select>
      <option value="weak">Weak (0.1-0.3)</option>
      <option value="medium">Medium (0.4-0.7)</option>
      <option value="strong">Strong (0.8-1.0)</option>
    </Select>
  </MenuItem>
  <MenuItem>Delayed: {true/false}</MenuItem>
</EdgeContextMenu>
```

**Влияние на анализ:**
- При расчете силы петли учитывать произведение весов
- Определять доминирующие пути влияния
- Приоритизировать интервенции (где эффект максимален)

---

### 2. **Типы переменных (Variable/Node Types)** ⭐ ВЫСОКИЙ ПРИОРИТЕТ

**Проблема:** 
В System Dynamics есть различные типы переменных, которые ведут себя по-разному.

**Типы:**

#### a) **Stock (Накопитель) 📦**
- Переменные, которые накапливают значения со временем
- Примеры: население, капитал, знания, загрязнение
- Визуализация: **Прямоугольник**
- Уравнение: Stock(t) = Stock(t-1) + Σ(inflows) - Σ(outflows)

#### b) **Flow (Поток) ➡️**
- Переменные-процессы, которые изменяют stocks
- Примеры: рождаемость, инвестиции, скорость обучения
- Визуализация: **Стрелка с вентилем/клапаном** или **двойная линия**
- Единицы: stock_units/time

#### c) **Auxiliary/Converter (Вспомогательная) ⚙️**
- Промежуточные вычисления
- Примеры: коэффициенты, множители, индексы
- Визуализация: **Круг** (как у вас сейчас)
- Это базовый тип в CLD

#### d) **Constant (Константа) 🔢**
- Параметры, которые не меняются
- Примеры: максимальная вместимость, нормы, стандарты
- Визуализация: **Маленький круг** или **ромб**

#### e) **External/Exogenous (Внешняя) 🌍**
- Факторы вне границ системы
- Примеры: погода, законы, рыночные условия
- Визуализация: **Круг с пунктирной границей** или **облако**

**Структура данных:**

```typescript
type NodeType = 'stock' | 'flow' | 'auxiliary' | 'constant' | 'external';

interface CLDNode {
  id: string;
  type: NodeType;              // 🆕 Тип узла
  data: {
    label: string;
    description?: string;
    value?: number;            // Текущее значение
    unit?: string;             // Единицы измерения
    initialValue?: number;     // Для stocks
    isAccumulating?: boolean;  // Для stocks
  };
  position: { x: number; y: number };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    shape?: 'circle' | 'rectangle' | 'diamond';
  };
}
```

**Компоненты:**
```
src/components/
  ├── nodes/
  │   ├── StockNode.tsx          // Прямоугольник
  │   ├── FlowNode.tsx           // С иконкой потока
  │   ├── AuxiliaryNode.tsx      // Круг (текущий CircleNode)
  │   ├── ConstantNode.tsx       // Маленький круг/ромб
  │   └── ExternalNode.tsx       // Пунктирная граница
```

**В Sidebar:**
```tsx
<Sidebar>
  <h3>Node Types</h3>
  <DraggableNode type="stock">📦 Stock</DraggableNode>
  <DraggableNode type="flow">➡️ Flow</DraggableNode>
  <DraggableNode type="auxiliary">⚙️ Auxiliary</DraggableNode>
  <DraggableNode type="constant">🔢 Constant</DraggableNode>
  <DraggableNode type="external">🌍 External</DraggableNode>
</Sidebar>
```

---

### 3. **Продвинутая визуализация задержек (Advanced Delays)** ⭐ СРЕДНИЙ ПРИОРИТЕТ

**Расширение текущего плана:**

Не просто `delayed: boolean`, а:

```typescript
interface DelayInfo {
  enabled: boolean;
  duration?: number;           // Величина задержки
  unit?: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  type?: 'information' | 'material' | 'perception';
  description?: string;
}

interface CLDEdge {
  // ...
  data: {
    polarity: '+' | '-';
    weight: number;
    delay: DelayInfo;          // 🆕 Вместо delayed: boolean
  };
}
```

**Визуальные варианты для задержек:**
- `||` - классическая нотация (ваш вариант) ✅
- `⏱️` - иконка часов
- Пунктирная линия
- Волнистая линия `〰️`
- Tooltip с деталями при наведении

**UI редактирования:**
```tsx
<DelayEditor>
  <Switch checked={delay.enabled} />
  {delay.enabled && (
    <>
      <Input type="number" value={delay.duration} />
      <Select value={delay.unit}>
        <option value="days">Days</option>
        <option value="weeks">Weeks</option>
        <option value="months">Months</option>
        <option value="years">Years</option>
      </Select>
      <Input placeholder="Description" value={delay.description} />
    </>
  )}
</DelayEditor>
```

---

### 4. **Нелинейные связи (Non-linear Relationships)** ⭐ СРЕДНИЙ ПРИОРИТЕТ

**Проблема:**
Не все связи линейные! В реальных системах часто встречаются:

#### Типы нелинейностей:

**a) S-образная кривая (Sigmoid)**
- Пример: принятие инноваций, рост популяции
- Медленный старт → быстрый рост → насыщение

**b) Пороговые эффекты (Threshold)**
- Нет эффекта до порога, затем резкое изменение
- Пример: критическая масса пользователей для вирусного роста

**c) Насыщение (Saturation)**
- Эффект уменьшается при высоких значениях
- Пример: производительность при переработках

**d) Экспоненциальная**
- Быстрый рост/падение
- Пример: compound interest, вирусное распространение

**Реализация:**

```typescript
type RelationshipType = 
  | 'linear'           // y = a*x + b (по умолчанию)
  | 'sigmoid'          // S-curve
  | 'exponential'      // y = a*e^(b*x)
  | 'logarithmic'      // y = a*ln(x) + b
  | 'threshold'        // step function
  | 'saturation'       // y = max * x / (k + x)
  | 'custom';          // пользовательская функция

interface CLDEdge {
  // ...
  data: {
    polarity: '+' | '-';
    weight: number;
    delay: DelayInfo;
    relationshipType: RelationshipType;  // 🆕
    relationshipParams?: {               // 🆕 Параметры функции
      a?: number;
      b?: number;
      k?: number;
      threshold?: number;
      saturationPoint?: number;
    };
  };
}
```

**Визуализация:**
- Иконка на связи: `~` для нелинейной
- Tooltip с мини-графиком функции
- Диалог редактирования с визуальным графиком

**Компонент:**
```tsx
<NonlinearEdgeDialog>
  <Select value={relationshipType}>
    <option value="linear">Linear (y = ax)</option>
    <option value="sigmoid">S-Curve (Growth/Adoption)</option>
    <option value="exponential">Exponential</option>
    <option value="threshold">Threshold Effect</option>
    <option value="saturation">Saturation</option>
  </Select>
  <div className="relationship-preview">
    {/* Мини-график выбранной функции */}
    <LineChart data={generateCurve(relationshipType, params)} />
  </div>
  <ParameterInputs params={params} />
</NonlinearEdgeDialog>
```

---

### 5. **Множественные связи между узлами** ⭐ СРЕДНИЙ ПРИОРИТЕТ

**Проблема:**
Один узел может влиять на другой несколькими путями:

**Пример:**
```
Доход → (+) Счастье  (прямой эффект)
Доход → (+) Статус → (+) Счастье  (косвенный)
Доход → (+) Рабочее время → (-) Счастье  (негативный путь)
```

**Реализация:**
- React Flow поддерживает это нативно
- Нужна визуальная укладка (edge routing) чтобы они не накладывались

**Настройки React Flow:**
```typescript
<ReactFlow
  defaultEdgeOptions={{
    type: 'smoothstep',  // или 'bezier' для красивой укладки
  }}
  // ...
/>
```

**Анализ:**
- При обнаружении петель учитывать все пути
- Показывать совокупный эффект (net effect)
- Выделять доминирующий путь

---

### 6. **Характеристики петель (Loop Characteristics)** ⭐ ВЫСОКИЙ ПРИОРИТЕТ

**Расширение анализа петель:**

```typescript
interface Loop {
  id: string;
  nodes: string[];
  edges: string[];
  type: 'reinforcing' | 'balancing';
  
  // 🆕 Дополнительные характеристики
  strength: number;              // Произведение весов связей
  dominance: 'primary' | 'secondary' | 'weak';
  timeToComplete?: number;       // Время замыкания петли (сумма задержек)
  criticalPath?: string[];       // Критический путь (самая сильная последовательность)
  behavior?: 'growth' | 'decline' | 'oscillation' | 'equilibrium';
  
  // Метаданные
  name?: string;                 // Пользовательское название
  description?: string;
  color?: string;                // Цвет для подсветки
}
```

**Расчет силы петли:**
```typescript
function calculateLoopStrength(loop: Loop, edges: Edge[]): number {
  const loopEdges = edges.filter(e => loop.edges.includes(e.id));
  
  // Произведение весов (абсолютные значения)
  const strength = loopEdges.reduce((acc, edge) => {
    return acc * Math.abs(edge.data.weight || 1);
  }, 1);
  
  return strength;
}
```

**Классификация доминантности:**
```typescript
function classifyLoopDominance(loops: Loop[]): Loop[] {
  const sorted = [...loops].sort((a, b) => b.strength - a.strength);
  
  return sorted.map((loop, index) => ({
    ...loop,
    dominance: index === 0 ? 'primary' : 
               index <= 2 ? 'secondary' : 'weak',
  }));
}
```

**UI - расширенная панель петель:**
```tsx
<LoopPanel>
  <h3>Detected Loops ({loops.length})</h3>
  
  {loops.map(loop => (
    <LoopCard key={loop.id} loop={loop}>
      <Badge type={loop.type} dominance={loop.dominance}>
        {loop.type === 'reinforcing' ? '🔴 R' : '🔵 B'}
        {loop.dominance === 'primary' && ' ⭐'}
      </Badge>
      
      <div className="loop-info">
        <div>Strength: <strong>{loop.strength.toFixed(2)}</strong></div>
        <div>Time: <strong>{loop.timeToComplete || 'instant'}</strong></div>
        <div>Behavior: <strong>{loop.behavior}</strong></div>
      </div>
      
      <div className="loop-path">
        {loop.nodes.map((nodeId, i) => (
          <span key={nodeId}>
            {getNodeLabel(nodeId)}
            {i < loop.nodes.length - 1 && ' → '}
          </span>
        ))}
      </div>
      
      <div className="loop-actions">
        <Button onClick={() => highlightLoop(loop)}>Highlight</Button>
        <Button onClick={() => editLoop(loop)}>Rename</Button>
        <Button onClick={() => exportLoop(loop)}>Export</Button>
      </div>
    </LoopCard>
  ))}
  
  <LoopComparison loops={loops} />
</LoopPanel>
```

---

### 7. **Границы системы (System Boundary)** ⭐ НИЗКИЙ ПРИОРИТЕТ

**Описание:**
Важно визуально показать, что входит в систему, а что является внешним фактором.

**Реализация:**

```typescript
interface SystemBoundary {
  id: string;
  name: string;
  nodeIds: string[];     // Узлы внутри границы
  style: {
    color: string;
    strokeDasharray?: string;  // Пунктир для внешней границы
    opacity: number;
  };
}
```

**Визуализация:**
- Пунктирный прямоугольник вокруг группы узлов
- Разные цвета для разных подсистем
- Возможность сворачивать/разворачивать границы

**Использование React Flow Background:**
```tsx
// Можно использовать кастомный Background или добавить overlay
<ReactFlow>
  <Background />
  <SystemBoundaryOverlay boundaries={boundaries} />
</ReactFlow>
```

---

### 8. **Аннотации и комментарии (Annotations)** ⭐ СРЕДНИЙ ПРИОРИТЕТ

**Зачем:**
- Документировать предположения
- Объяснять логику связей
- Добавлять инсайты из анализа

**Типы аннотаций:**

```typescript
interface Annotation {
  id: string;
  type: 'note' | 'insight' | 'warning' | 'question';
  position: { x: number; y: number };
  content: string;
  attachedTo?: {         // Привязка к элементу
    type: 'node' | 'edge' | 'loop';
    id: string;
  };
  author?: string;
  timestamp: Date;
  color?: string;
}
```

**Визуализация:**
- Sticky notes (желтые стикеры)
- Иконки-индикаторы на узлах/связях
- Комментарии в sidebar

**Компонент:**
```tsx
<AnnotationNode data={annotation}>
  <div className="annotation" style={{ background: annotation.color }}>
    <div className="annotation-header">
      <Icon type={annotation.type} />
      <span>{annotation.author}</span>
    </div>
    <div className="annotation-content">
      {annotation.content}
    </div>
    <div className="annotation-footer">
      {formatDate(annotation.timestamp)}
    </div>
  </div>
</AnnotationNode>
```

---

### 9. **Архетипы систем (System Archetypes)** ⭐ НИЗКИЙ ПРИОРИТЕТ (но полезно!)

**Описание:**
В System Dynamics есть типичные паттерны (архетипы), которые встречаются в разных системах.

**Основные архетипы:**

1. **Limits to Growth** 🌱➡️🛑
   - Усиливающий контур роста + балансирующий контур ограничения
   - Пример: рост компании → исчерпание ресурсов

2. **Shifting the Burden** 🔄
   - Два балансирующих контура: симптоматическое и фундаментальное решение
   - Пример: обезболивающие vs лечение причины

3. **Tragedy of the Commons** 🐄🌾
   - Множественные усиливающие контуры истощают общий ресурс
   - Пример: перевыпас скота на общих землях

4. **Fixes that Fail** 💊➡️💀
   - Краткосрочное решение создает долгосрочные проблемы
   - Пример: антибиотики → устойчивость бактерий

5. **Success to the Successful** 🏆
   - Winner-takes-all динамика
   - Пример: богатые становятся богаче

6. **Escalation** ⬆️⚔️⬆️
   - Два усиливающих контура в конфликте
   - Пример: гонка вооружений

**Реализация:**

```typescript
interface ArchetypeDetector {
  detectArchetypes(nodes: Node[], edges: Edge[], loops: Loop[]): Archetype[];
}

interface Archetype {
  type: 'limits-to-growth' | 'shifting-burden' | 'tragedy-commons' | 
        'fixes-fail' | 'success-successful' | 'escalation';
  confidence: number;      // 0-1, насколько уверены в детекции
  matchingLoops: string[]; // ID петель, формирующих архетип
  description: string;
  recommendation?: string; // Как работать с этим архетипом
}
```

**UI:**
```tsx
<ArchetypePanel>
  <h3>Detected System Archetypes</h3>
  {archetypes.map(archetype => (
    <ArchetypeCard key={archetype.type}>
      <h4>{archetype.type}</h4>
      <ConfidenceBar value={archetype.confidence} />
      <p>{archetype.description}</p>
      {archetype.recommendation && (
        <Alert type="info">
          💡 {archetype.recommendation}
        </Alert>
      )}
      <Button onClick={() => highlightArchetype(archetype)}>
        Show Pattern
      </Button>
    </ArchetypeCard>
  ))}
</ArchetypePanel>
```

---

### 10. **Leverage Points (Точки рычага)** ⭐ ВЫСОКИЙ ПРИОРИТЕТ

**Описание:**
Места в системе, где небольшое изменение дает большой эффект (из работы Донеллы Медоуз).

**Типы leverage points (от слабого к сильному):**

12. Constants, parameters (числовые параметры)
11. Buffer sizes (размеры запасов)
10. Stock-and-flow structures
9. Delays (длина задержек)
8. Balancing feedback loops
7. Reinforcing feedback loops
6. Information flows
5. Rules of the system
4. Self-organization
3. Goals of the system
2. Paradigms
1. Power to transcend paradigms

**Для CLD приложения - фокус на:**
- **Узлы с наибольшим количеством исходящих связей** (влияют на многое)
- **Узлы в доминирующих петлях** (усиливают/ослабляют динамику)
- **Связи с наибольшим весом** (сильное влияние)
- **Короткие задержки в критических путях** (быстрая обратная связь)

**Реализация:**

```typescript
interface LeveragePoint {
  type: 'node' | 'edge' | 'loop';
  id: string;
  score: number;           // 0-10 по шкале Медоуз
  category: string;        // Одна из 12 категорий
  description: string;
  potentialImpact: 'high' | 'medium' | 'low';
  interventions: string[]; // Предложения по изменению
}

function identifyLeveragePoints(
  nodes: Node[], 
  edges: Edge[], 
  loops: Loop[]
): LeveragePoint[] {
  const points: LeveragePoint[] = [];
  
  // 1. Узлы с высоким out-degree
  nodes.forEach(node => {
    const outgoingEdges = edges.filter(e => e.source === node.id);
    if (outgoingEdges.length > 3) {
      points.push({
        type: 'node',
        id: node.id,
        score: Math.min(10, outgoingEdges.length),
        category: 'Information flows',
        description: `${node.data.label} influences ${outgoingEdges.length} variables`,
        potentialImpact: 'high',
        interventions: [
          'Change the value or behavior of this variable',
          'Add constraints or bounds',
          'Modify update frequency'
        ]
      });
    }
  });
  
  // 2. Сильные связи в доминирующих петлях
  const primaryLoop = loops.find(l => l.dominance === 'primary');
  if (primaryLoop) {
    primaryLoop.edges.forEach(edgeId => {
      const edge = edges.find(e => e.id === edgeId);
      if (edge && edge.data.weight > 0.7) {
        points.push({
          type: 'edge',
          id: edge.id,
          score: 7,
          category: 'Reinforcing/Balancing loops',
          description: `Strong link in dominant ${primaryLoop.type} loop`,
          potentialImpact: 'high',
          interventions: [
            'Weaken this relationship',
            'Add balancing feedback',
            'Introduce delays'
          ]
        });
      }
    });
  }
  
  // 3. Короткие задержки
  edges.forEach(edge => {
    if (edge.data.delay?.enabled && edge.data.delay.duration < 7) {
      points.push({
        type: 'edge',
        id: edge.id,
        score: 9,
        category: 'Delays',
        description: 'Short delay creates rapid feedback',
        potentialImpact: 'high',
        interventions: [
          'Increase delay to dampen oscillations',
          'Add buffering capacity',
          'Smooth information flow'
        ]
      });
    }
  });
  
  return points.sort((a, b) => b.score - a.score);
}
```

**UI:**
```tsx
<LeveragePointsPanel>
  <h3>🎯 Leverage Points</h3>
  <p className="subtitle">High-impact intervention opportunities</p>
  
  {leveragePoints.map((point, index) => (
    <LeverageCard 
      key={point.id} 
      rank={index + 1}
      point={point}
    >
      <div className="rank">#{index + 1}</div>
      <div className="score">
        <ScoreBadge value={point.score} max={10} />
      </div>
      <div className="content">
        <h4>{getElementLabel(point.type, point.id)}</h4>
        <Tag>{point.category}</Tag>
        <p>{point.description}</p>
        <ImpactIndicator level={point.potentialImpact} />
      </div>
      <details className="interventions">
        <summary>Possible Interventions</summary>
        <ul>
          {point.interventions.map((intervention, i) => (
            <li key={i}>{intervention}</li>
          ))}
        </ul>
      </details>
      <Button onClick={() => highlightElement(point)}>
        Show on Diagram
      </Button>
    </LeverageCard>
  ))}
</LeveragePointsPanel>
```

---

### 11. **Сравнение сценариев (Scenario Comparison)** ⭐ СРЕДНИЙ ПРИОРИТЕТ

**Описание:**
Возможность создавать и сравнивать разные версии диаграммы ("что если" анализ).

**Реализация:**

```typescript
interface Scenario {
  id: string;
  name: string;
  description: string;
  baseScenarioId?: string;  // Если это вариация
  timestamp: Date;
  
  // Snapshot состояния
  nodes: Node[];
  edges: Edge[];
  
  // Изменения относительно базового
  changes?: {
    modifiedNodes: string[];
    modifiedEdges: string[];
    addedElements: string[];
    removedElements: string[];
  };
  
  // Результаты анализа
  loops?: Loop[];
  leveragePoints?: LeveragePoint[];
  archetypes?: Archetype[];
}
```

**UI:**
```tsx
<ScenarioManager>
  <ScenarioList>
    <ScenarioCard scenario={baseScenario} isBase>
      <h4>Base Scenario</h4>
      <p>{baseScenario.description}</p>
    </ScenarioCard>
    
    {scenarios.map(scenario => (
      <ScenarioCard key={scenario.id} scenario={scenario}>
        <h4>{scenario.name}</h4>
        <ChangeSummary changes={scenario.changes} />
        <ButtonGroup>
          <Button onClick={() => loadScenario(scenario)}>Load</Button>
          <Button onClick={() => compareScenarios(baseScenario, scenario)}>
            Compare
          </Button>
        </ButtonGroup>
      </ScenarioCard>
    ))}
  </ScenarioList>
  
  <Button onClick={createNewScenario}>+ New Scenario</Button>
</ScenarioManager>

<ScenarioComparison when={comparing}>
  <SideBySide>
    <DiagramView scenario={scenario1} />
    <DiagramView scenario={scenario2} />
  </SideBySide>
  
  <DifferenceHighlights>
    <DiffCard type="added">Added 3 nodes</DiffCard>
    <DiffCard type="modified">Modified 5 edges</DiffCard>
    <DiffCard type="removed">Removed 1 loop</DiffCard>
  </DifferenceHighlights>
  
  <MetricsComparison>
    <ComparisonTable>
      <thead>
        <tr>
          <th>Metric</th>
          <th>{scenario1.name}</th>
          <th>{scenario2.name}</th>
          <th>Δ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Number of Loops</td>
          <td>{scenario1.loops.length}</td>
          <td>{scenario2.loops.length}</td>
          <td className="delta">
            {scenario2.loops.length - scenario1.loops.length}
          </td>
        </tr>
        <tr>
          <td>Dominant Loop Strength</td>
          <td>{scenario1.loops[0]?.strength.toFixed(2)}</td>
          <td>{scenario2.loops[0]?.strength.toFixed(2)}</td>
          <td className="delta">
            {/* процентное изменение */}
          </td>
        </tr>
      </tbody>
    </ComparisonTable>
  </MetricsComparison>
</ScenarioComparison>
```

---

### 12. **Метаданные и документация** ⭐ СРЕДНИЙ ПРИОРИТЕТ

**Структура:**

```typescript
interface DiagramMetadata {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  
  // Контекст
  domain: string;          // business, environment, health, etc.
  purpose: string;         // analysis, communication, learning
  timeHorizon?: string;    // short-term, long-term
  
  // Предположения
  assumptions: Assumption[];
  
  // Источники данных
  dataSources: DataSource[];
  
  // История изменений
  changelog: ChangelogEntry[];
  
  // Теги для категоризации
  tags: string[];
}

interface Assumption {
  id: string;
  statement: string;
  confidence: 'low' | 'medium' | 'high';
  relatedElements: string[];  // node/edge IDs
}

interface DataSource {
  name: string;
  type: 'literature' | 'data' | 'expert' | 'assumption';
  reference?: string;
  relatedElements: string[];
}

interface ChangelogEntry {
  timestamp: Date;
  author: string;
  description: string;
  changes: {
    type: 'added' | 'modified' | 'removed';
    elementType: 'node' | 'edge' | 'loop';
    elementId: string;
  }[];
}
```

---

## 📊 Обновленная структура данных

### Полная структура Edge с всеми возможностями:

```typescript
interface CompleteCLDEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type: 'polarity';
  
  data: {
    // Базовые свойства
    polarity: '+' | '-';
    label?: string;
    description?: string;
    
    // Сила воздействия
    weight: number;                    // 0.0 - 1.0
    weightCategory?: 'weak' | 'medium' | 'strong';
    
    // Задержки
    delay: {
      enabled: boolean;
      duration?: number;
      unit?: 'days' | 'weeks' | 'months' | 'years';
      type?: 'information' | 'material' | 'perception';
    };
    
    // Тип отношения
    relationshipType: 'linear' | 'sigmoid' | 'exponential' | 
                     'logarithmic' | 'threshold' | 'saturation' | 'custom';
    relationshipParams?: Record<string, number>;
    
    // Метаданные
    source?: DataSource;
    confidence?: 'low' | 'medium' | 'high';
    assumptions?: string[];
    
    // UI состояние
    isHighlighted?: boolean;
    color?: string;
  };
  
  markerEnd: { type: MarkerType };
  style?: CSSProperties;
}
```

### Полная структура Node:

```typescript
interface CompleteCLDNode extends Node {
  id: string;
  type: 'stock' | 'flow' | 'auxiliary' | 'constant' | 'external';
  
  data: {
    // Базовые свойства
    label: string;
    description?: string;
    
    // Значения
    value?: number;
    initialValue?: number;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    
    // Для Stock узлов
    isAccumulating?: boolean;
    inflows?: string[];      // IDs входящих потоков
    outflows?: string[];     // IDs исходящих потоков
    
    // Метаданные
    source?: DataSource;
    assumptions?: string[];
    
    // Визуализация
    color?: string;
    shape?: 'circle' | 'rectangle' | 'diamond' | 'cloud';
    icon?: string;
    
    // UI состояние
    isHighlighted?: boolean;
    isEditing?: boolean;
  };
  
  position: { x: number; y: number };
  style?: CSSProperties;
}
```

---

## 🎯 Обновленная приоритизация

### Phase 1: MVP (Core) - ДОЛЖНО БЫТЬ
- ✅ Базовые узлы (пока просто Auxiliary)
- ✅ Связи с полярностью (+/-)
- ✅ Простые задержки (boolean)
- ✅ Loop detection
- ✅ Loop classification (R/B)

### Phase 2: Enhanced Analysis - ОЧЕНЬ ВАЖНО
- 🆕 **Сила связей (weight)** ⭐⭐⭐
- 🆕 **Типы узлов (Stock/Flow/etc)** ⭐⭐⭐
- 🆕 **Характеристики петель (strength, dominance)** ⭐⭐⭐
- 🆕 **Leverage points detection** ⭐⭐
- ✅ Расширенные задержки (с величиной)

### Phase 3: Advanced Features - ЖЕЛАТЕЛЬНО
- 🆕 **Нелинейные связи** ⭐⭐
- 🆕 **Аннотации и комментарии** ⭐⭐
- 🆕 **Сравнение сценариев** ⭐
- 🆕 **Границы системы** ⭐

### Phase 4: Expert Level - ОПЦИОНАЛЬНО
- 🆕 **Архетипы систем (автодетекция)** ⭐
- 🆕 **Метаданные и документация** ⭐
- 🆕 **Экспорт в форматы профессиональных инструментов**

---

## 🗂️ Обновленная структура файлов

```
src/
├── components/
│   ├── nodes/
│   │   ├── StockNode.tsx           🆕 Прямоугольник (накопители)
│   │   ├── FlowNode.tsx            🆕 Потоки
│   │   ├── AuxiliaryNode.tsx       ✅ Круг (переименованный CircleNode)
│   │   ├── ConstantNode.tsx        🆕 Константы
│   │   ├── ExternalNode.tsx        🆕 Внешние факторы
│   │   └── NodeFactory.tsx         🆕 Фабрика для создания узлов
│   │
│   ├── edges/
│   │   ├── PolarityEdge.tsx        ✅ Базовый edge
│   │   ├── EdgeLabel.tsx           🆕 Компонент label с весом
│   │   ├── DelayIndicator.tsx      🆕 Индикатор задержки
│   │   └── EdgeContextMenu.tsx     🆕 Меню редактирования
│   │
│   ├── panels/
│   │   ├── NodeSidebar.tsx         ✅ Sidebar с типами узлов
│   │   ├── LoopPanel.tsx           ✅ Панель петель (расширенная)
│   │   ├── LeveragePointsPanel.tsx 🆕 Точки рычага
│   │   ├── ArchetypePanel.tsx      🆕 Архетипы систем
│   │   └── ScenarioPanel.tsx       🆕 Управление сценариями
│   │
│   ├── dialogs/
│   │   ├── EdgeWeightDialog.tsx    🆕 Редактор веса связи
│   │   ├── DelayEditorDialog.tsx   🆕 Редактор задержки
│   │   ├── NonlinearEdgeDialog.tsx 🆕 Редактор нелинейностей
│   │   ├── AnnotationDialog.tsx    🆕 Создание аннотаций
│   │   └── MetadataDialog.tsx      🆕 Метаданные диаграммы
│   │
│   ├── visualization/
│   │   ├── LoopHighlight.tsx       🆕 Подсветка петель
│   │   ├── SystemBoundary.tsx      🆕 Границы системы
│   │   └── RelationshipCurve.tsx   🆕 График функции связи
│   │
│   ├── Toolbar.tsx                 ✅ Панель инструментов
│   └── App.tsx                     ✅ Главный компонент
│
├── utils/
│   ├── analysis/
│   │   ├── loop-detector.ts        ✅ Поиск циклов
│   │   ├── loop-classifier.ts      ✅ Классификация петель
│   │   ├── loop-strength.ts        🆕 Расчет силы петель
│   │   ├── leverage-detector.ts    🆕 Поиск точек рычага
│   │   ├── archetype-detector.ts   🆕 Детекция архетипов
│   │   └── scenario-comparison.ts  🆕 Сравнение сценариев
│   │
│   ├── graph/
│   │   ├── graph-utils.ts          🆕 Утилиты работы с графом
│   │   ├── path-finding.ts         🆕 Поиск путей
│   │   └── critical-path.ts        🆕 Критический путь
│   │
│   ├── calculations/
│   │   ├── relationship-functions.ts 🆕 Функции связей
│   │   ├── loop-dynamics.ts        🆕 Динамика петель
│   │   └── time-calculations.ts    🆕 Расчет времен
│   │
│   └── export/
│       ├── export-json.ts          ✅ Экспорт в JSON
│       ├── export-image.ts         ✅ Экспорт в PNG
│       └── export-vensim.ts        🆕 Экспорт в Vensim формат
│
├── types/
│   ├── nodes.ts                    🆕 Типы узлов
│   ├── edges.ts                    🆕 Типы связей
│   ├── loops.ts                    🆕 Типы петель
│   ├── scenarios.ts                🆕 Типы сценариев
│   ├── metadata.ts                 🆕 Метаданные
│   └── index.ts                    ✅ Экспорт всех типов
│
├── hooks/
│   ├── useLoopDetection.ts         🆕 Hook обнаружения петель
│   ├── useLeveragePoints.ts        🆕 Hook точек рычага
│   ├── useScenarioManager.ts       🆕 Hook управления сценариями
│   ├── useEdgeInteraction.ts       ✅ Hook работы с edges
│   └── useUndo.ts                  ✅ Hook undo/redo
│
└── styles/
    ├── nodes/
    │   ├── stock-node.css          🆕
    │   ├── flow-node.css           🆕
    │   └── auxiliary-node.css      🆕
    ├── edges/
    │   ├── polarity-edge.css       🆕
    │   └── edge-labels.css         🆕
    ├── panels/
    │   └── panels.css              🆕
    └── app.css                     ✅
```

---

## 📈 Сравнение с профессиональными инструментами

| Функция | Vensim | Stella | iThink | Наше приложение (после Phase 2-3) |
|---------|--------|--------|--------|-----------------------------------|
| Базовые узлы | ✅ | ✅ | ✅ | ✅ |
| Полярность связей | ✅ | ✅ | ✅ | ✅ |
| Задержки | ✅ | ✅ | ✅ | ✅ |
| Loop detection | ✅ | ✅ | ✅ | ✅ |
| Типы узлов | ✅ | ✅ | ✅ | ✅ (Phase 2) |
| Сила связей | ✅ | ✅ | ✅ | ✅ (Phase 2) |
| Нелинейные связи | ✅ | ✅ | ✅ | ✅ (Phase 3) |
| Leverage points | ✅ | ⚠️ | ⚠️ | ✅ (Phase 2) |
| Архетипы | ⚠️ | ⚠️ | ⚠️ | ✅ (Phase 4) |
| Симуляция | ✅ | ✅ | ✅ | ❌ (будущее) |
| Веб-интерфейс | ❌ | ❌ | ❌ | ✅ |
| Бесплатно | ❌ | ❌ | ❌ | ✅ |

---

## 🎓 Ресурсы для углубленного изучения

### Книги:
1. **"Thinking in Systems"** - Donella Meadows (обязательно!)
2. **"Business Dynamics"** - John Sterman
3. **"System Dynamics"** - Ogata

### Статьи:
1. **"Leverage Points: Places to Intervene in a System"** - Donella Meadows
2. **"System Archetypes"** - Systems Thinking World

### Инструменты для вдохновения:
1. **Insight Maker** (веб-версия) - https://insightmaker.com
2. **Loopy** (простая CLD) - https://ncase.me/loopy/
3. **Kumu** (network mapping) - https://kumu.io

---

## ✅ Итоговый чек-лист элементов CLD

### Базовые элементы (есть в плане):
- [x] Nodes (Variables)
- [x] Edges (Causal links)
- [x] Polarity (+/-)
- [x] Delays (||)
- [x] Loops (Feedback)
- [x] R/B Classification

### Критические (нужно добавить):
- [ ] **Link Strength/Weight** ⭐⭐⭐
- [ ] **Node Types (Stock/Flow/etc)** ⭐⭐⭐
- [ ] **Loop Strength & Dominance** ⭐⭐⭐
- [ ] **Leverage Points** ⭐⭐

### Важные (желательно):
- [ ] **Nonlinear Relationships** ⭐⭐
- [ ] **Annotations/Comments** ⭐⭐
- [ ] **Advanced Delays (with time units)** ⭐⭐
- [ ] **Multiple Edges between nodes** ⭐

### Опциональные (для профессионального уровня):
- [ ] **System Archetypes Detection** ⭐
- [ ] **System Boundaries** ⭐
- [ ] **Scenario Comparison** ⭐
- [ ] **Metadata & Documentation** ⭐

---

## 🚀 Рекомендации по реализации

### Стратегия "расширяемой архитектуры":

1. **Сразу заложить расширяемые типы данных:**
   - Используйте объекты вместо примитивов
   - `weight: number` вместо просто толщины линии
   - `delay: DelayInfo` вместо `delayed: boolean`

2. **Модульная архитектура компонентов:**
   - Абстрактный `BaseNode`, от которого наследуются конкретные типы
   - Композиция вместо монолита

3. **Plugin-based для анализа:**
   ```typescript
   interface AnalysisPlugin {
     name: string;
     analyze(diagram: Diagram): AnalysisResult;
   }
   
   // Можно добавлять новые анализаторы
   const plugins = [
     LoopDetector,
     LeverageDetector,
     ArchetypeDetector,
     // ... будущие
   ];
   ```

4. **Начните с Phase 1, но проектируйте для Phase 3:**
   - Интерфейсы сразу с полными полями
   - Но реализация постепенная
   - Используйте опциональные поля (?)

---

## 💡 Итоговая оценка

**Ваш первоначальный план: 7/10**
- ✅ Отличная база
- ✅ Правильная технология
- ⚠️ Упущены важные элементы

**После добавления рекомендаций: 9.5/10**
- ✅ Все критические элементы CLD
- ✅ Профессиональный уровень анализа
- ✅ Масштабируемая архитектура
- ✅ Конкурентоспособен с Vensim/Stella для CLD (не симуляции)

**Главное преимущество вашего приложения:**
- 🌐 Веб-интерфейс (доступность)
- 🆓 Бесплатно
- 🎨 Современный UI/UX
- 🤖 Автоматический анализ (leverage points, archetypes)

**Следующие шаги:**
1. Обновить типы данных с учетом новых элементов
2. Начать с Phase 1 MVP
3. Параллельно продумать UI для Phase 2 features
4. Итеративно добавлять функциональность

---

Готовы начинать реализацию? 🚀

