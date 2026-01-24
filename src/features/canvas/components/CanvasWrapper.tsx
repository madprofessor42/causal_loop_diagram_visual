/**
 * CanvasWrapper component - Provides zoom and pan functionality
 */

import { useRef, useCallback, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { Canvas } from './Canvas';
import type { TransformState } from '../../../types/common.types';
import {
  MIN_SCALE,
  MAX_SCALE,
  INITIAL_SCALE,
  EXCLUDED_PAN_ELEMENTS,
} from '../../../constants';
import styles from './CanvasWrapper.module.css';

/**
 * Zoom control buttons
 */
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className={styles.controls}>
      <button
        className={styles.controlButton}
        onClick={() => zoomIn()}
        title="Zoom In"
      >
        +
      </button>
      <button
        className={styles.controlButton}
        onClick={() => zoomOut()}
        title="Zoom Out"
      >
        −
      </button>
      <div className={styles.divider} />
      <button
        className={styles.controlButton}
        onClick={() => resetTransform()}
        title="Reset View"
      >
        ⟲
      </button>
    </div>
  );
}

/**
 * Canvas wrapper with zoom/pan functionality
 */
export function CanvasWrapper() {
  const [transform, setTransform] = useState<TransformState>({
    scale: INITIAL_SCALE,
    positionX: 0,
    positionY: 0,
  });
  const [zoomLevel, setZoomLevel] = useState(INITIAL_SCALE * 100);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleTransform = useCallback((ref: { state: { scale: number; positionX: number; positionY: number } }) => {
    setTransform({
      scale: ref.state.scale,
      positionX: ref.state.positionX,
      positionY: ref.state.positionY,
    });
    setZoomLevel(Math.round(ref.state.scale * 100));
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <TransformWrapper
        initialScale={INITIAL_SCALE}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        centerOnInit={false}
        limitToBounds={false}
        panning={{
          velocityDisabled: true,
          excluded: EXCLUDED_PAN_ELEMENTS,
        }}
        onTransformed={handleTransform}
        doubleClick={{
          disabled: true,
        }}
      >
        {() => (
          <>
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                cursor: 'grab',
              }}
            >
              <Canvas transform={transform} />
            </TransformComponent>
            <ZoomControls />
            <div className={styles.zoomLevel}>{zoomLevel}%</div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
