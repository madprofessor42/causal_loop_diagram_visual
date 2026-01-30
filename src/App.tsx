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
  type Node,
  type Edge,
  type NodeTypes,
  type Connection,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';

import { CircularNode } from './components/CircularNode';
import FloatingEdge from './components/FloatingEdge';
import type { CircularNodeData } from './types';

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

const initialEdges: Edge[] = [];

// Node radius and connection zone thresholds (must match CircularNode.tsx)
const RADIUS = 40;
const INNER_THRESHOLD = 10;

function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const pendingConnectionRef = useRef<Connection | null>(null);

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
      pendingConnectionRef.current = null;
      
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
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#b1b1b7',
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
      const actualRadius = rect.width / 2;
      const scale = actualRadius / RADIUS;

      // Calculate distance from drop point to node center
      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );

      // Calculate inner threshold (scaled for zoom)
      const innerThresholdScaled = INNER_THRESHOLD * scale;
      const minDistance = actualRadius - innerThresholdScaled;

      // Only complete connection if dropped in edge zone (not center)
      if (distance >= minDistance) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'floating',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#b1b1b7',
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

