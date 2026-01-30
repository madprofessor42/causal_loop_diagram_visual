import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
  ConnectionMode,
  type OnConnect,
  type OnConnectStart,
  type Node,
  type Edge,
  type NodeTypes,
  type Connection,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';

import { CircularNode } from './components/CircularNode';
import FloatingEdge from './components/FloatingEdge';
import type { CircularNodeData, FloatingEdgeData } from './types';

const nodeTypes: NodeTypes = {
  circular: CircularNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};

const initialNodes: Node<CircularNodeData>[] = [
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

const initialEdges: Edge<FloatingEdgeData>[] = [];

// Node radius and connection zone thresholds (must match CircularNode.tsx)
const RADIUS = 40;
const INNER_THRESHOLD = 10;
const OUTER_THRESHOLD = 10;

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

function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const pendingConnectionRef = useRef<Connection | null>(null);
  const sourceAngleRef = useRef<number | null>(null);

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
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'floating',
              data: {
                sourceAngle: sourceAngle ?? undefined,
              },
            },
            eds
          )
        );
        return;
      }

      // Get the node's bounding rect
      const rect = targetNodeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate actual rendered radius (accounts for zoom)
      // Container size = (RADIUS + OUTER_THRESHOLD) * 2
      const actualContainerRadius = rect.width / 2;
      const scale = actualContainerRadius / (RADIUS + OUTER_THRESHOLD);
      const actualRadius = RADIUS * scale;
      const actualInnerThreshold = INNER_THRESHOLD * scale;

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
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'floating',
              data: {
                sourceAngle: sourceAngle ?? undefined,
                targetAngle,
              },
            },
            eds
          )
        );
      }
      // If dropped in center, connection is silently rejected
    },
    [setEdges]
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
        <MiniMap nodeColor="#6366f1" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default App;

