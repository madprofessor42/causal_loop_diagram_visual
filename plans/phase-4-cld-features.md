# Phase 4: CLD Features & Redux Integration

## Goal
Integrate Redux store with App.tsx, add CLD-specific features like polarity markers (+/-), and create the foundation for notes/comments.

## Prerequisites
- Phase 1 completed (constants and types)
- Phase 2 completed (Redux store)
- Phase 3 completed (component architecture)

## Deliverables

### 1. Polarity Markers

#### `src/components/edges/markers/PolarityMarker.tsx`
```typescript
import type { Polarity } from '../../../types';
import { EDGE_COLORS, POLARITY_MARKER } from '../../../constants';

interface PolarityMarkerProps {
  polarity: Polarity;
  x: number;
  y: number;
  angle: number; // Angle of the edge at this point
}

export function PolarityMarker({ polarity, x, y, angle }: PolarityMarkerProps) {
  if (polarity === 'neutral') return null;

  const symbol = polarity === 'positive' ? '+' : '−';
  const color = polarity === 'positive' ? EDGE_COLORS.positive : EDGE_COLORS.negative;
  
  // Position marker perpendicular to edge
  const offsetAngle = angle + Math.PI / 2;
  const offsetX = x + Math.cos(offsetAngle) * POLARITY_MARKER.offset;
  const offsetY = y + Math.sin(offsetAngle) * POLARITY_MARKER.offset;

  return (
    <g transform={`translate(${offsetX}, ${offsetY})`}>
      {/* Background circle */}
      <circle
        r={POLARITY_MARKER.size / 2}
        fill="white"
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Symbol */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={POLARITY_MARKER.fontSize}
        fontWeight={POLARITY_MARKER.fontWeight}
        style={{ userSelect: 'none' }}
      >
        {symbol}
      </text>
    </g>
  );
}
```

#### `src/components/edges/markers/DelayMarker.tsx`
```typescript
import { EDGE_COLORS } from '../../../constants';

interface DelayMarkerProps {
  x: number;
  y: number;
  angle: number;
}

export function DelayMarker({ x, y, angle }: DelayMarkerProps) {
  // Two parallel lines perpendicular to edge (||)
  const perpAngle = angle + Math.PI / 2;
  const lineLength = 8;
  const lineGap = 3;
  
  const line1Start = {
    x: x + Math.cos(perpAngle) * lineLength / 2 - Math.cos(angle) * lineGap,
    y: y + Math.sin(perpAngle) * lineLength / 2 - Math.sin(angle) * lineGap,
  };
  const line1End = {
    x: x - Math.cos(perpAngle) * lineLength / 2 - Math.cos(angle) * lineGap,
    y: y - Math.sin(perpAngle) * lineLength / 2 - Math.sin(angle) * lineGap,
  };
  const line2Start = {
    x: x + Math.cos(perpAngle) * lineLength / 2 + Math.cos(angle) * lineGap,
    y: y + Math.sin(perpAngle) * lineLength / 2 + Math.sin(angle) * lineGap,
  };
  const line2End = {
    x: x - Math.cos(perpAngle) * lineLength / 2 + Math.cos(angle) * lineGap,
    y: y - Math.sin(perpAngle) * lineLength / 2 + Math.sin(angle) * lineGap,
  };

  return (
    <g>
      <line
        x1={line1Start.x}
        y1={line1Start.y}
        x2={line1End.x}
        y2={line1End.y}
        stroke={EDGE_COLORS.default}
        strokeWidth={2}
      />
      <line
        x1={line2Start.x}
        y1={line2Start.y}
        x2={line2End.x}
        y2={line2End.y}
        stroke={EDGE_COLORS.default}
        strokeWidth={2}
      />
    </g>
  );
}
```

#### `src/components/edges/markers/index.ts`
```typescript
export { PolarityMarker } from './PolarityMarker';
export { DelayMarker } from './DelayMarker';
```

### 2. Updated FloatingEdge with Markers

Update `FloatingEdge.tsx` to render polarity and delay markers:

```typescript
// In the render method, add markers
import { PolarityMarker, DelayMarker } from '../markers';

// ... in the return statement, add:

{/* Polarity marker near target */}
{edgeData?.polarity && edgeData.polarity !== 'neutral' && (
  <PolarityMarker
    polarity={edgeData.polarity}
    x={polarityMarkerPosition.x}
    y={polarityMarkerPosition.y}
    angle={arrowAngle}
  />
)}

{/* Delay marker at midpoint */}
{edgeData?.delay && (
  <DelayMarker
    x={midpoint.x}
    y={midpoint.y}
    angle={midpointAngle}
  />
)}
```

### 3. Refactored App.tsx with Redux

#### `src/App.tsx`
```typescript
import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
  addEdge,
  type OnConnect,
  type OnConnectStart,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';

import { useAppDispatch, useAppSelector } from './store/hooks';
import { 
  diagramActions, 
  selectNodes, 
  selectEdges,
  selectShowMinimap,
  selectShowGrid,
} from './store/slices';
import { nodeTypes } from './components/nodes';
import { edgeTypes } from './components/edges';
import { NODE_RADIUS, NODE_INNER_THRESHOLD, NODE_OUTER_THRESHOLD } from './constants';
import type { CLDNode, CLDEdge, BaseEdgeData } from './types';

function calculateAngleFromNodeCenter(
  nodeElement: Element,
  clientX: number,
  clientY: number
): number {
  const rect = nodeElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.atan2(clientY - centerY, clientX - centerX);
}

function Flow() {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectNodes);
  const edges = useAppSelector(selectEdges);
  const showMinimap = useAppSelector(selectShowMinimap);
  const showGrid = useAppSelector(selectShowGrid);
  
  const pendingConnectionRef = useRef<Connection | null>(null);
  const sourceAngleRef = useRef<number | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange<CLDNode>[]) => {
      dispatch(diagramActions.onNodesChange(changes));
    },
    [dispatch]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<CLDEdge>[]) => {
      dispatch(diagramActions.onEdgesChange(changes));
    },
    [dispatch]
  );

  const onConnectStart: OnConnectStart = useCallback(
    (event, { nodeId }) => {
      if (!nodeId) return;

      const clientX = 'touches' in event 
        ? (event as TouchEvent).touches[0]?.clientX 
        : (event as MouseEvent).clientX;
      const clientY = 'touches' in event 
        ? (event as TouchEvent).touches[0]?.clientY 
        : (event as MouseEvent).clientY;

      if (clientX === undefined || clientY === undefined) return;

      const sourceNodeElement = document.querySelector(`[data-id="${nodeId}"]`);
      if (!sourceNodeElement) return;

      sourceAngleRef.current = calculateAngleFromNodeCenter(
        sourceNodeElement, clientX, clientY
      );
    },
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      pendingConnectionRef.current = connection;
    },
    []
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const connection = pendingConnectionRef.current;
      const sourceAngle = sourceAngleRef.current;
      pendingConnectionRef.current = null;
      sourceAngleRef.current = null;
      
      if (!connection || !connection.target) return;

      const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;

      if (clientX === undefined || clientY === undefined) return;

      const targetNodeElement = document.querySelector(`[data-id="${connection.target}"]`);
      if (!targetNodeElement) {
        const newEdge: CLDEdge = {
          id: `e${connection.source}-${connection.target}-${Date.now()}`,
          source: connection.source!,
          target: connection.target,
          type: 'floating',
          data: {
            polarity: 'positive',
            sourceAngle: sourceAngle ?? undefined,
          },
        };
        dispatch(diagramActions.addEdge(newEdge));
        return;
      }

      const rect = targetNodeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const actualContainerRadius = rect.width / 2;
      const scale = actualContainerRadius / (NODE_RADIUS + NODE_OUTER_THRESHOLD);
      const actualRadius = NODE_RADIUS * scale;
      const actualInnerThreshold = NODE_INNER_THRESHOLD * scale;

      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );

      const minDistance = actualRadius - actualInnerThreshold;
      const targetAngle = calculateAngleFromNodeCenter(targetNodeElement, clientX, clientY);

      if (distance >= minDistance) {
        const newEdge: CLDEdge = {
          id: `e${connection.source}-${connection.target}-${Date.now()}`,
          source: connection.source!,
          target: connection.target,
          type: 'floating',
          data: {
            polarity: 'positive',
            sourceAngle: sourceAngle ?? undefined,
            targetAngle,
          },
        };
        dispatch(diagramActions.addEdge(newEdge));
      }
    },
    [dispatch]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Controls />
        {showMinimap && <MiniMap nodeColor="#6366f1" />}
        {showGrid && <Background variant={BackgroundVariant.Dots} gap={12} size={1} />}
      </ReactFlow>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
```

### 4. Initial Nodes Setup

Update `src/store/slices/diagramSlice.ts` to include initial demo nodes:

```typescript
const initialState: DiagramState = {
  nodes: [
    {
      id: '1',
      type: 'circular',
      position: { x: 250, y: 100 },
      data: { label: 'A' },
    },
    {
      id: '2',
      type: 'circular',
      position: { x: 450, y: 250 },
      data: { label: 'B' },
    },
    {
      id: '3',
      type: 'circular',
      position: { x: 150, y: 300 },
      data: { label: 'C' },
    },
  ] as CLDNode[],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
};
```

## Tasks

- [ ] Create `src/components/edges/markers/` directory
- [ ] Create `src/components/edges/markers/PolarityMarker.tsx`
- [ ] Create `src/components/edges/markers/DelayMarker.tsx`
- [ ] Create `src/components/edges/markers/index.ts`
- [ ] Update `FloatingEdge.tsx` to render polarity markers
- [ ] Update `FloatingEdge.tsx` to render delay markers
- [ ] Update `src/store/slices/diagramSlice.ts` with initial nodes
- [ ] Refactor `src/App.tsx` to use Redux store
- [ ] Remove `UpdateEdgeData` type from App.tsx
- [ ] Update `FloatingEdge` to use Redux dispatch instead of prop
- [ ] Test edge creation with polarity
- [ ] Run `npm run typecheck` to verify no errors

## Files to Create
- `src/components/edges/markers/PolarityMarker.tsx`
- `src/components/edges/markers/DelayMarker.tsx`
- `src/components/edges/markers/index.ts`

## Files to Modify
- `src/components/edges/FloatingEdge/FloatingEdge.tsx`
- `src/store/slices/diagramSlice.ts`
- `src/App.tsx`

## Verification
1. Run `npm run typecheck` - should pass
2. Run `npm run dev` - app should work with full Redux integration
3. Open Redux DevTools and verify:
   - Initial nodes appear in state
   - Node drag updates position in state
   - Edge creation adds edge with polarity to state
4. Test polarity markers appear on edges
5. Test edge dragging still works

## Future Enhancements (not in this phase)
- UI for changing edge polarity
- Notes/comments panel
- Keyboard shortcuts for polarity toggle
- Edge labels

## Notes
- New edges default to `polarity: 'positive'`
- Delay marker can be toggled later via UI
- This phase completes the core refactoring
- After this, the app is ready for additional features
