import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

type Point = { x: number; y: number };
type Bounds = { left: number; top: number; right: number; bottom: number };

export const clampPanelOffset = (origin: Point, delta: Point, bounds: Bounds, viewport: Point): Point => ({
  x: Math.min(origin.x + viewport.x - bounds.right, Math.max(origin.x - bounds.left, origin.x + delta.x)),
  y: Math.min(origin.y + viewport.y - bounds.bottom, Math.max(origin.y - bounds.top, origin.y + delta.y)),
});

export function useDraggablePanel<T extends HTMLElement>(): {
  panelRef: RefObject<T | null>;
  dragHandleProps: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  };
  dragStyle: CSSProperties;
  dragging: boolean;
} {
  const panelRef = useRef<T>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; start: Point; origin: Point; bounds: Bounds } | null>(null);

  const finish = (event: ReactPointerEvent<HTMLElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    drag.current = null;
    setDragging(false);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    const bounds = panelRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: offset, bounds };
    setDragging(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    setOffset(clampPanelOffset(active.origin, { x: event.clientX - active.start.x, y: event.clientY - active.start.y }, active.bounds, { x: window.innerWidth, y: window.innerHeight }));
  };

  return {
    panelRef,
    dragHandleProps: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish },
    dragStyle: { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` },
    dragging,
  };
}
