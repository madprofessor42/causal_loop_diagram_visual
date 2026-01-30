# Phase 3: Component Architecture & Registry Pattern

## Goal
Refactor node and edge components to use shared constants, create registry patterns for extensibility, and extract reusable hooks.

## Prerequisites
- Phase 1 completed (constants and types)
- Phase 2 completed (Redux store)

## Deliverables

### 1. Node Registry

#### `src/components/nodes/registry.ts`
```typescript
import type { NodeTypes } from '@xyflow/react';
import type { BaseNodeData, NodeVariant } from '../../types';
import { CircularNode } from './CircularNode';

// Node configuration for registry
interface NodeConfig {
  type: NodeVariant;
  component: React.ComponentType<any>;
  defaultData: () => BaseNodeData;
  displayName: string;
  description?: string;
}

// Registry of all available node types
export const nodeRegistry: Record<NodeVariant, NodeConfig> = {
  circular: {
    type: 'circular',
    component: CircularNode,
    defaultData: () => ({
      label: 'Variable',
      notes: '',
    }),
    displayName: 'Variable',
    description: 'Standard CLD variable node',
  },
};

// Create nodeTypes object for React Flow
export const nodeTypes: NodeTypes = Object.fromEntries(
  Object.entries(nodeRegistry).map(([key, config]) => [key, config.component])
);

// Get all available node configs
export const getNodeConfigs = (): NodeConfig[] => Object.values(nodeRegistry);

// Get specific node config
export const getNodeConfig = (type: NodeVariant): NodeConfig | undefined => 
  nodeRegistry[type];
```

### 2. Edge Registry

#### `src/components/edges/registry.ts`
```typescript
import type { EdgeTypes } from '@xyflow/react';
import type { BaseEdgeData, EdgeVariant, Polarity } from '../../types';
import { FloatingEdge } from './FloatingEdge';

// Edge configuration for registry
interface EdgeConfig {
  type: EdgeVariant;
  component: React.ComponentType<any>;
  defaultData: () => BaseEdgeData;
  displayName: string;
  description?: string;
}

// Registry of all available edge types
export const edgeRegistry: Record<EdgeVariant, EdgeConfig> = {
  floating: {
    type: 'floating',
    component: FloatingEdge,
    defaultData: () => ({
      polarity: 'positive' as Polarity,
      delay: false,
      lineStyle: 'solid',
    }),
    displayName: 'Causal Link',
    description: 'Curved edge with adjustable connection points',
  },
};

// Create edgeTypes object for React Flow
export const edgeTypes: EdgeTypes = Object.fromEntries(
  Object.entries(edgeRegistry).map(([key, config]) => [key, config.component])
);

// Get all available edge configs
export const getEdgeConfigs = (): EdgeConfig[] => Object.values(edgeRegistry);

// Get specific edge config
export const getEdgeConfig = (type: EdgeVariant): EdgeConfig | undefined => 
  edgeRegistry[type];
```

### 3. Refactored CircularNode

#### `src/components/nodes/CircularNode/CircularNode.tsx`
```typescript
import { useState, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getClosestPointOnCircle, getDistance } from '../../../utils/geometry';
import { 
  NODE_RADIUS, 
  NODE_INNER_THRESHOLD, 
  NODE_OUTER_THRESHOLD,
  NODE_COLORS,
  HANDLE_INDICATOR,
} from '../../../constants';
import type { CLDNode, BaseNodeData } from '../../../types';

interface HandlePosition {
  x: number;
  y: number;
  angle: number;
  visible: boolean;
}

export function CircularNode({ data }: NodeProps<CLDNode<BaseNodeData>>) {
  const [handlePos, setHandlePos] = useState<HandlePosition>({ 
    x: 0, y: 0, angle: 0, visible: false 
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const containerSize = (NODE_RADIUS + NODE_OUTER_THRESHOLD) * 2;
  const sensorSize = containerSize;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    const actualContainerRadius = containerRect.width / 2;
    const scale = actualContainerRadius / (NODE_RADIUS + NODE_OUTER_THRESHOLD);
    const actualRadius = NODE_RADIUS * scale;
    const actualOuterThreshold = NODE_OUTER_THRESHOLD * scale;
    const actualInnerThreshold = NODE_INNER_THRESHOLD * scale;

    const distance = getDistance(centerX, centerY, event.clientX, event.clientY);
    
    const minDistance = actualRadius - actualInnerThreshold;
    const maxDistance = actualRadius + actualOuterThreshold;
    const inConnectionZone = distance >= minDistance && distance <= maxDistance;

    if (inConnectionZone) {
      const mouseRelX = event.clientX - centerX;
      const mouseRelY = event.clientY - centerY;
      
      const { x, y, angle } = getClosestPointOnCircle(
        mouseRelX + NODE_RADIUS,
        mouseRelY + NODE_RADIUS,
        NODE_RADIUS,
        NODE_RADIUS,
        NODE_RADIUS
      );
      
      setHandlePos({
        x: x - NODE_RADIUS,
        y: y - NODE_RADIUS,
        angle,
        visible: true,
      });
    } else {
      setHandlePos(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setHandlePos(prev => ({ ...prev, visible: false }));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: containerSize,
        height: containerSize,
        position: 'relative',
        cursor: handlePos.visible ? 'crosshair' : undefined,
      }}
    >
      <div
        className="circular-node"
        style={{
          width: NODE_RADIUS * 2,
          height: NODE_RADIUS * 2,
          borderRadius: '50%',
          background: NODE_COLORS.default.background,
          border: `2px solid ${NODE_COLORS.default.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: NODE_COLORS.default.text,
          fontWeight: 500,
          fontSize: '14px',
          position: 'absolute',
          left: NODE_OUTER_THRESHOLD,
          top: NODE_OUTER_THRESHOLD,
          transition: 'box-shadow 0.2s',
          zIndex: 0,
        }}
      >
        <div style={{ pointerEvents: 'none' }}>{data?.label || ''}</div>
      </div>
      
      {handlePos.visible && (
        <div
          style={{
            position: 'absolute',
            width: HANDLE_INDICATOR.size,
            height: HANDLE_INDICATOR.size,
            background: HANDLE_INDICATOR.color,
            border: `2px solid ${HANDLE_INDICATOR.borderColor}`,
            borderRadius: '50%',
            left: `calc(50% + ${handlePos.x}px)`,
            top: `calc(50% + ${handlePos.y}px)`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      )}
      
      <Handle
        type="source"
        position={Position.Top}
        id="dynamic-source"
        style={{
          position: 'absolute',
          background: 'transparent',
          border: 'none',
          width: sensorSize,
          height: sensorSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          pointerEvents: handlePos.visible ? 'auto' : 'none',
          zIndex: 3,
          cursor: 'crosshair',
        }}
      />
      
      <Handle
        type="target"
        position={Position.Top}
        id="dynamic-target"
        style={{
          position: 'absolute',
          background: 'transparent',
          border: 'none',
          width: sensorSize,
          height: sensorSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          pointerEvents: handlePos.visible ? 'auto' : 'none',
          zIndex: 2,
          cursor: 'crosshair',
        }}
      />
    </div>
  );
}
```

#### `src/components/nodes/CircularNode/index.ts`
```typescript
export { CircularNode } from './CircularNode';
```

### 4. Node Components Index

#### `src/components/nodes/index.ts`
```typescript
export { CircularNode } from './CircularNode';
export { nodeTypes, nodeRegistry, getNodeConfigs, getNodeConfig } from './registry';
```

### 5. Refactored FloatingEdge

#### `src/components/edges/FloatingEdge/FloatingEdge.tsx`
```typescript
import { useCallback, useRef, useState } from 'react';
import { useStore, useReactFlow, type EdgeProps } from '@xyflow/react';
import { getEdgeParams } from '../../../utils/edge';
import { useAppDispatch } from '../../../store/hooks';
import { diagramActions } from '../../../store/slices';
import type { CLDEdge, BaseEdgeData } from '../../../types';
import {
  EDGE_STROKE_WIDTH,
  EDGE_HOVER_STROKE_WIDTH,
  EDGE_COLORS,
  ARROW_SIZE,
  NODE_RADIUS,
  NODE_OUTER_THRESHOLD,
} from '../../../constants';

type HoverZone = 'source' | 'target' | 'curve' | null;

export function FloatingEdge({ 
  id, 
  source, 
  target, 
  style, 
  data 
}: EdgeProps<CLDEdge<BaseEdgeData>>) {
  const dispatch = useAppDispatch();
  const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));
  const { screenToFlowPosition } = useReactFlow();
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [hoveredZone, setHoveredZone] = useState<HoverZone>(null);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const edgeData = data as BaseEdgeData | undefined;

  const {
    sx, sy, tx, ty,
    sourceControlOffsetX, sourceControlOffsetY,
    targetControlOffsetX, targetControlOffsetY
  } = getEdgeParams(sourceNode, targetNode, {
    sourceAngle: edgeData?.sourceAngle,
    targetAngle: edgeData?.targetAngle,
  });

  const curveOffset = edgeData?.curveOffset || { x: 0, y: 0 };

  const sourceControlX = sx + sourceControlOffsetX + curveOffset.x;
  const sourceControlY = sy + sourceControlOffsetY + curveOffset.y;
  const targetControlX = tx + targetControlOffsetX + curveOffset.x;
  const targetControlY = ty + targetControlOffsetY + curveOffset.y;

  const hasCurve = Math.abs(sourceControlOffsetX + curveOffset.x) > 0.1 || 
                   Math.abs(sourceControlOffsetY + curveOffset.y) > 0.1 ||
                   Math.abs(targetControlOffsetX + curveOffset.x) > 0.1 || 
                   Math.abs(targetControlOffsetY + curveOffset.y) > 0.1;

  // ... rest of edge rendering logic using constants
  // (Same logic as before, but using imported constants)

  const updateEdgeData = useCallback((newData: Partial<BaseEdgeData>) => {
    dispatch(diagramActions.updateEdgeData({ id, data: newData }));
  }, [dispatch, id]);

  // ... rest of component
}
```

### 6. Edge Components Index

#### `src/components/edges/index.ts`
```typescript
export { FloatingEdge } from './FloatingEdge';
export { edgeTypes, edgeRegistry, getEdgeConfigs, getEdgeConfig } from './registry';
```

### 7. Updated Edge Utils

#### `src/utils/edge.ts`
```typescript
// Move content from src/components/utils/edgeUtils.ts
// Update to use constants from src/constants
import { Position, type Node } from '@xyflow/react';
import { NODE_RADIUS, NODE_OUTER_THRESHOLD, EDGE_GAP, BASE_CONTROL_DISTANCE } from '../constants';

// ... same logic but using imported constants
```

## Tasks

- [ ] Create `src/components/nodes/` directory structure
- [ ] Create `src/components/nodes/CircularNode/CircularNode.tsx`
- [ ] Create `src/components/nodes/CircularNode/index.ts`
- [ ] Create `src/components/nodes/registry.ts`
- [ ] Create `src/components/nodes/index.ts`
- [ ] Create `src/components/edges/` directory structure
- [ ] Create `src/components/edges/FloatingEdge/FloatingEdge.tsx`
- [ ] Create `src/components/edges/FloatingEdge/index.ts`
- [ ] Create `src/components/edges/registry.ts`
- [ ] Create `src/components/edges/index.ts`
- [ ] Move `src/components/utils/edgeUtils.ts` to `src/utils/edge.ts`
- [ ] Update all imports to use new paths
- [ ] Delete old component files
- [ ] Run `npm run typecheck` to verify no errors

## Files to Create
- `src/components/nodes/CircularNode/CircularNode.tsx`
- `src/components/nodes/CircularNode/index.ts`
- `src/components/nodes/registry.ts`
- `src/components/nodes/index.ts`
- `src/components/edges/FloatingEdge/FloatingEdge.tsx`
- `src/components/edges/FloatingEdge/index.ts`
- `src/components/edges/registry.ts`
- `src/components/edges/index.ts`
- `src/utils/edge.ts`

## Files to Delete
- `src/components/CircularNode.tsx`
- `src/components/FloatingEdge.tsx`
- `src/components/utils/edgeUtils.ts`
- `src/components/utils/` directory

## Files to Modify
- `src/App.tsx` - update imports

## Verification
1. Run `npm run typecheck` - should pass
2. Run `npm run dev` - app should work identically
3. Verify no hardcoded constants remain in components
4. Test node creation and edge connections work

## Notes
- FloatingEdge starts using Redux for `updateEdgeData`
- This phase restructures files but keeps same visual behavior
- Registry pattern prepares for adding new node/edge types
