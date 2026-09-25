import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

type Point = { x: number; y: number };
type Bounds = { left: number; top: number; right: number; bottom: number };
export type PanelRect = { left: number; top: number; width: number; height: number };
export type PanelResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const clampPanelOffset = (origin: Point, delta: Point, bounds: Bounds, viewport: Point): Point => ({
  x: Math.min(origin.x + viewport.x - bounds.right, Math.max(origin.x - bounds.left, origin.x + delta.x)),
  y: Math.min(origin.y + viewport.y - bounds.bottom, Math.max(origin.y - bounds.top, origin.y + delta.y)),
});

export const movePanelRect = (origin: PanelRect, delta: Point, limits: Bounds): PanelRect => ({
  ...origin,
  left: Math.min(limits.right - origin.width, Math.max(limits.left, origin.left + delta.x)),
  top: Math.min(limits.bottom - origin.height, Math.max(limits.top, origin.top + delta.y)),
});

export const resizePanelRect = (origin: PanelRect, delta: Point, direction: PanelResizeDirection, limits: Bounds, minimum: Pick<PanelRect, 'width' | 'height'>): PanelRect => {
  let left = origin.left; let top = origin.top; let right = origin.left + origin.width; let bottom = origin.top + origin.height;
  if (direction.includes('w')) left = Math.min(right - minimum.width, Math.max(limits.left, left + delta.x));
  if (direction.includes('e')) right = Math.max(left + minimum.width, Math.min(limits.right, right + delta.x));
  if (direction.includes('n')) top = Math.min(bottom - minimum.height, Math.max(limits.top, top + delta.y));
  if (direction.includes('s')) bottom = Math.max(top + minimum.height, Math.min(limits.bottom, bottom + delta.y));
  return { left, top, width: right - left, height: bottom - top };
};

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
