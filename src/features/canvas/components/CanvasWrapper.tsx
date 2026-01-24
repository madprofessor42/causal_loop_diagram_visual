/**
 * CanvasWrapper component - Provides zoom and pan functionality
 */

import { useRef, useCallback, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { Canvas } from './Canvas';
import type { TransformState } from '../../../types/common.types';
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
    scale: 1,
    positionX: 0,
    positionY: 0,
  });
  const [zoomLevel, setZoomLevel] = useState(100);
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
        initialScale={1}
        minScale={0.25}
        maxScale={2}
        centerOnInit={false}
        limitToBounds={false}
        panning={{
          velocityDisabled: true,
          excluded: ['input', 'textarea', 'select', 'button', 'no-pan'],
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
