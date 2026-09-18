import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { useHubTranslate } from './trainerHubUtils';

export function ZoomableSvgMap({ svg, onPathClick, onPathHover }: { svg: string; onPathClick?: (id: string) => void; onPathHover?: (id?: string) => void }) {
  const t = useHubTranslate();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number; pan: { x: number; y: number }; midpoint: { x: number; y: number } }>();
  const drag = useRef<{ id: number; x: number; y: number; origin: { x: number; y: number }; moved: boolean; pathId?: string }>();
  const suppressClick = useRef(false);
  const setPanValue = (value: { x: number; y: number }) => { panRef.current = value; setPan(value); };
  const clamp = (x: number, y: number, scale: number) => {
    const maxX = (viewport.current?.clientWidth || 0) * (scale - 1) / 2;
    const maxY = (viewport.current?.clientHeight || 0) * (scale - 1) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };
  const setZoomValue = (value: number) => {
    const next = Math.min(4, Math.max(1, Number(value.toFixed(1))));
    zoomRef.current = next; setZoom(next);
    setPanValue(clamp(panRef.current.x, panRef.current.y, next));
  };
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoomValue(zoomRef.current + (event.deltaY < 0 ? .5 : -.5));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('button, input')) return;
    if (event.pointerType === 'mouse' && (event.target as Element).closest('path[id]')) event.preventDefault();
    if (event.pointerType === 'touch') {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.current.size === 2) {
        const [first, second] = [...touches.current.values()];
        pinch.current = { distance: Math.hypot(first.x - second.x, first.y - second.y) || 1, zoom: zoomRef.current, pan: panRef.current, midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 } };
        drag.current = undefined;
        for (const id of touches.current.keys()) event.currentTarget.setPointerCapture(id);
        setDragging(true);
        return;
      }
    }
    if (zoomRef.current <= 1) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: panRef.current, moved: false, pathId: (event.target as Element).closest('path[id]')?.getAttribute('id') || undefined };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && !drag.current) onPathHover?.((event.target as Element).closest('path[id]')?.getAttribute('id') || undefined);
    if (touches.current.has(event.pointerId)) touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && touches.current.size >= 2) {
      const [first, second] = [...touches.current.values()];
      const current = pinch.current;
      const next = Math.min(4, Math.max(1, current.zoom * Math.hypot(first.x - second.x, first.y - second.y) / current.distance));
      const rect = viewport.current!.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      zoomRef.current = next; setZoom(next);
      setPanValue(clamp(midpoint.x - center.x - (current.midpoint.x - center.x - current.pan.x) * next / current.zoom, midpoint.y - center.y - (current.midpoint.y - center.y - current.pan.y) * next / current.zoom, next));
      suppressClick.current = true;
      return;
    }
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (Math.abs(event.clientX - current.x) + Math.abs(event.clientY - current.y) > 5) current.moved = true;
    setPanValue(clamp(current.origin.x + event.clientX - current.x, current.origin.y + event.clientY - current.y, zoomRef.current));
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    touches.current.delete(event.pointerId);
    if (pinch.current) {
      if (touches.current.size < 2) {
        pinch.current = undefined;
        const remaining = [...touches.current.entries()][0];
        drag.current = remaining && zoomRef.current > 1 ? { id: remaining[0], x: remaining[1].x, y: remaining[1].y, origin: panRef.current, moved: true } : undefined;
        setDragging(!!drag.current);
      }
      suppressClick.current = true;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (drag.current?.id !== event.pointerId) return;
    const clickedPath = !drag.current.moved ? drag.current.pathId : undefined;
    suppressClick.current = drag.current.moved || !!clickedPath;
    drag.current = undefined;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (clickedPath) onPathClick?.(clickedPath);
  };
  const pathId = (target: EventTarget) => (target as Element).closest('path[id]')?.getAttribute('id');
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && onPathClick) {
      const id = pathId(event.target);
      if (id) { event.preventDefault(); onPathClick(id); }
    }
  };
  return <div ref={viewport} className={`coverage-choropleth-viewport${dragging ? ' dragging' : ''}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onPointerLeave={() => onPathHover?.(undefined)} onFocusCapture={(event) => onPathHover?.((event.target as Element).closest('path[id]')?.getAttribute('id') || undefined)} onKeyDown={keyDown} onClick={(event) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    const id = pathId(event.target); if (id) onPathClick?.(id);
  }}>
    <div className="coverage-choropleth-canvas" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} dangerouslySetInnerHTML={{ __html: svg }} />
    <div className="coverage-choropleth-zoom" aria-label={t('Map zoom controls')}>
      <button type="button" onClick={() => setZoomValue(zoom + .5)} disabled={zoom >= 4} aria-label={t('Zoom in')} title={t('Zoom in')}><Plus size={15} /></button>
      <input type="range" min="1" max="4" step=".5" value={zoom} onChange={(event) => setZoomValue(Number(event.target.value))} aria-label={t('Zoom level')} title={t('Zoom level')} />
      <button type="button" onClick={() => setZoomValue(zoom - .5)} disabled={zoom <= 1} aria-label={t('Zoom out')} title={t('Zoom out')}><Minus size={15} /></button>
      <button type="button" onClick={() => setZoomValue(1)} disabled={zoom === 1} aria-label={t('Reset map zoom')} title={t('Reset map zoom')}><Maximize2 size={14} /></button>
    </div>
  </div>;
}
