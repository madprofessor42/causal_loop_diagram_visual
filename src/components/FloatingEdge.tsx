import { useCallback } from 'react';
import { useStore, getStraightPath, type EdgeProps } from '@xyflow/react';
import { getEdgeParams } from './utils/edgeUtils';

function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useStore(useCallback((store) => store.nodeLookup.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeLookup.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  return (
    <g className="react-flow__edge">
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#b1b1b7"
        fill="none"
        markerEnd={markerEnd}
        style={style}
      />
    </g>
  );
}

export default FloatingEdge;

