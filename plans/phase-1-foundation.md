# Phase 1: Foundation - Constants & Types

## Goal
Create shared constants and type definitions to eliminate code duplication and establish a solid type system for the CLD editor.

## Prerequisites
- None (this is the first phase)

## Deliverables

### 1. Constants Files

#### `src/constants/node.ts`
```typescript
// Node dimensions
export const NODE_RADIUS = 40;
export const NODE_INNER_THRESHOLD = 10;
export const NODE_OUTER_THRESHOLD = 10;

// Node colors
export const NODE_COLORS = {
  default: {
    background: '#6366f1',
    border: '#4338ca',
    text: '#ffffff',
  },
  selected: {
    background: '#818cf8',
    border: '#6366f1',
    text: '#ffffff',
  },
} as const;

// Handle indicator
export const HANDLE_INDICATOR = {
  size: 12,
  color: '#22c55e',
  borderColor: '#16a34a',
} as const;
```

#### `src/constants/edge.ts`
```typescript
// Edge visual properties
export const EDGE_STROKE_WIDTH = 1.5;
export const EDGE_HOVER_STROKE_WIDTH = 4;
export const EDGE_GAP = 15;

// Edge colors
export const EDGE_COLORS = {
  default: '#1a1a1a',
  hover: '#3b82f6',
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
} as const;

// Arrow configuration
export const ARROW_SIZE = 8;

// Control point calculation
export const BASE_CONTROL_DISTANCE = 50;

// Polarity marker
export const POLARITY_MARKER = {
  size: 14,
  offset: 20,
  fontSize: 12,
  fontWeight: 'bold',
} as const;
```

#### `src/constants/index.ts`
```typescript
export * from './node';
export * from './edge';
```

### 2. Type Definition Files

#### `src/types/node.ts`
```typescript
import type { Node, NodeProps } from '@xyflow/react';

// Base data that all nodes share
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  notes?: string;
  color?: string;
}

// Available node variants
export type NodeVariant = 'circular';

// CLD Node extending React Flow Node
export type CLDNode<T extends BaseNodeData = BaseNodeData> = Node<T> & {
  type: NodeVariant;
};

// Node component props
export type CLDNodeProps<T extends BaseNodeData = BaseNodeData> = NodeProps<CLDNode<T>>;
```

#### `src/types/edge.ts`
```typescript
import type { Edge, EdgeProps } from '@xyflow/react';

// CLD-specific polarity
export type Polarity = 'positive' | 'negative' | 'neutral';

// Edge visual styles
export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted';

// Base data that all edges share
export interface BaseEdgeData extends Record<string, unknown> {
  polarity?: Polarity;
  label?: string;
  notes?: string;
  delay?: boolean;
  lineStyle?: EdgeLineStyle;
  sourceAngle?: number;
  targetAngle?: number;
  curveOffset?: { x: number; y: number };
}

// Available edge variants
export type EdgeVariant = 'floating';

// CLD Edge extending React Flow Edge
export type CLDEdge<T extends BaseEdgeData = BaseEdgeData> = Edge<T> & {
  type: EdgeVariant;
};

// Edge component props
export type CLDEdgeProps<T extends BaseEdgeData = BaseEdgeData> = EdgeProps<CLDEdge<T>>;
```

#### `src/types/index.ts`
```typescript
export * from './node';
export * from './edge';
```

## Tasks

- [ ] Create `src/constants/node.ts` with node dimensions and colors
- [ ] Create `src/constants/edge.ts` with edge styles and colors
- [ ] Create `src/constants/index.ts` re-exporting all constants
- [ ] Create `src/types/node.ts` with node type definitions
- [ ] Create `src/types/edge.ts` with edge type definitions
- [ ] Create `src/types/index.ts` re-exporting all types
- [ ] Delete old `src/types.ts` file (move content first)
- [ ] Update imports in existing components to use new paths
- [ ] Run `npm run typecheck` to verify no type errors

## Files to Create
- `src/constants/node.ts`
- `src/constants/edge.ts`
- `src/constants/index.ts`
- `src/types/node.ts`
- `src/types/edge.ts`
- `src/types/index.ts`

## Files to Modify
- `src/components/CircularNode.tsx` - update imports, use constants
- `src/components/FloatingEdge.tsx` - update imports, use constants
- `src/components/utils/edgeUtils.ts` - update imports, use constants

## Files to Delete
- `src/types.ts` (after migrating content)

## Verification
1. Run `npm run typecheck` - should pass with no errors
2. Run `npm run dev` - app should work exactly as before
3. Check that no duplicate constants exist in components

## Notes
- Keep backward compatibility - app should work identically after this phase
- This phase does NOT change any behavior, only code organization
