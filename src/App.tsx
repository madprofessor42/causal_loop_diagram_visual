import { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
  addEdge as addEdgeUtil,
  type OnConnect,
  type OnConnectStart,
  type NodeTypes,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';

import { CircularNode } from './components/CircularNode';
import FloatingEdge from './components/FloatingEdge';
import type { BaseEdgeData, CLDNode, CLDEdge } from './types';
import {
  NODE_RADIUS,
  NODE_INNER_THRESHOLD,
  NODE_OUTER_THRESHOLD,
} from './constants';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  diagramActions,
  selectNodes,
  selectEdges,
} from './store/slices/diagramSlice';

// Context to pass edge update function to edge components
export type UpdateEdgeData = (edgeId: string, data: Partial<BaseEdgeData>) => void;

const nodeTypes: NodeTypes = {
  circular: CircularNode,
};

const initialNodes: CLDNode[] = [
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
];

// Helper to calculate angle from node center to a point
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
  
  const pendingConnectionRef = useRef<Connection | null>(null);
  const sourceAngleRef = useRef<number | null>(null);
  
  // Инициализация начальных узлов при монтировании
  useEffect(() => {
    if (nodes.length === 0) {
      dispatch(diagramActions.setNodes(initialNodes));
    }
  }, [dispatch, nodes.length]);
  
  // Обработчики изменений для React Flow -> Redux
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
  
  // Обновление данных edge через Redux
  const updateEdgeData = useCallback(
    (edgeId: string, newData: Partial<BaseEdgeData>) => {
      dispatch(diagramActions.updateEdgeData({ id: edgeId, data: newData }));
    },
    [dispatch]
  );
  
  // Create edge types with updateEdgeData bound
  const edgeTypesWithUpdate = useMemo(() => ({
    floating: (props: React.ComponentProps<typeof FloatingEdge>) => (
      <FloatingEdge {...props} updateEdgeData={updateEdgeData} />
    ),
  }), [updateEdgeData]);

  const onConnectStart: OnConnectStart = useCallback(
    (event, { nodeId }) => {
      if (!nodeId) return;

      // Get mouse position
      const clientX = 'touches' in event ? (event as TouchEvent).touches[0]?.clientX : (event as MouseEvent).clientX;
      const clientY = 'touches' in event ? (event as TouchEvent).touches[0]?.clientY : (event as MouseEvent).clientY;

      if (clientX === undefined || clientY === undefined) return;

      // Find the source node element
      const sourceNodeElement = document.querySelector(`[data-id="${nodeId}"]`);
      if (!sourceNodeElement) return;

      // Calculate and store the source angle
      sourceAngleRef.current = calculateAngleFromNodeCenter(sourceNodeElement, clientX, clientY);
    },
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Store connection for validation in onConnectEnd
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

      // Get drop position
      const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;

      if (clientX === undefined || clientY === undefined) return;

      // Find the target node element
      const targetNodeElement = document.querySelector(`[data-id="${connection.target}"]`);
      if (!targetNodeElement) {
        // Still complete connection if we can't find element (fallback)
        const newEdges = addEdgeUtil(
          {
            ...connection,
            type: 'floating',
            data: {
              sourceAngle: sourceAngle ?? undefined,
            },
          },
          edges
        );
        dispatch(diagramActions.setEdges(newEdges as CLDEdge[]));
        return;
      }

      // Get the node's bounding rect
      const rect = targetNodeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate actual rendered radius (accounts for zoom)
      const actualContainerRadius = rect.width / 2;
      const scale = actualContainerRadius / (NODE_RADIUS + NODE_OUTER_THRESHOLD);
      const actualRadius = NODE_RADIUS * scale;
      const actualInnerThreshold = NODE_INNER_THRESHOLD * scale;

      // Calculate distance from drop point to node center
      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );

      // Calculate inner threshold (scaled for zoom)
      const minDistance = actualRadius - actualInnerThreshold;

      // Calculate target angle from drop position
      const targetAngle = calculateAngleFromNodeCenter(targetNodeElement, clientX, clientY);

      // Only complete connection if dropped in edge zone (not center)
      if (distance >= minDistance) {
        const newEdges = addEdgeUtil(
          {
            ...connection,
            type: 'floating',
            data: {
              sourceAngle: sourceAngle ?? undefined,
              targetAngle,
            },
          },
          edges
        );
        dispatch(diagramActions.setEdges(newEdges as CLDEdge[]));
      }
      // If dropped in center, connection is silently rejected
    },
    [dispatch, edges]
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
        edgeTypes={edgeTypesWithUpdate}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Controls />
        <MiniMap nodeColor="#6366f1" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

// Wrapper component with ReactFlowProvider
function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
