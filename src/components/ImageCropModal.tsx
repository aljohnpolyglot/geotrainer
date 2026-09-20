import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Check, Crop, LoaderCircle, RotateCcw, X } from 'lucide-react';
import { cropImageDataUrl, DEFAULT_IMAGE_CROP, moveImageCrop, resizeImageCrop, type CropCorner, type ImageCrop } from '../services/imageCrop';

type DragState = { kind: 'move' | CropCorner; x: number; y: number; crop: ImageCrop };

export function ImageCropModal({ image, t, onCancel, onApply }: { image: string; t: (key: string) => string; onCancel: () => void; onApply: (image: string) => void }) {
  const [crop, setCrop] = useState(DEFAULT_IMAGE_CROP);
  const [applying, setApplying] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | undefined>(undefined);

  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onCancel]);
  const start = (event: ReactPointerEvent, kind: DragState['kind']) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { kind, x: event.clientX, y: event.clientY, crop }; };
  const move = (event: ReactPointerEvent) => {
    const drag = dragRef.current; const frame = frameRef.current; if (!drag || !frame) return;
    const dx = (event.clientX - drag.x) / frame.clientWidth; const dy = (event.clientY - drag.y) / frame.clientHeight;
    setCrop(drag.kind === 'move' ? moveImageCrop(drag.crop, dx, dy) : resizeImageCrop(drag.crop, drag.kind, dx, dy));
  };
  const finish = () => { dragRef.current = undefined; };
  const apply = async () => { setApplying(true); try { onApply(await cropImageDataUrl(image, crop)); } finally { setApplying(false); } };

  return <div className="image-crop-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section className="image-crop-modal" role="dialog" aria-modal="true" aria-labelledby="image-crop-title">
      <header><span><Crop size={17} /><b id="image-crop-title">{t('Crop image')}</b></span><button type="button" onClick={onCancel} aria-label={t('close')}><X size={18} /></button></header>
      <div className="image-crop-stage">
        <div className="image-crop-frame" ref={frameRef} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
          <img src={image} alt={t('Clue image crop preview')} draggable={false} />
          <div className="image-crop-selection" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }} tabIndex={0} role="application" aria-label={t('Drag to position crop')} onPointerDown={(event) => start(event, 'move')} onKeyDown={(event) => { const step = event.shiftKey ? .05 : .01; if (event.key === 'ArrowLeft') setCrop((value) => moveImageCrop(value, -step, 0)); else if (event.key === 'ArrowRight') setCrop((value) => moveImageCrop(value, step, 0)); else if (event.key === 'ArrowUp') setCrop((value) => moveImageCrop(value, 0, -step)); else if (event.key === 'ArrowDown') setCrop((value) => moveImageCrop(value, 0, step)); else return; event.preventDefault(); }}>
            {(['nw', 'ne', 'sw', 'se'] as CropCorner[]).map((corner) => <button key={corner} type="button" className={`crop-handle ${corner}`} aria-label={t('Resize crop')} onPointerDown={(event) => { event.stopPropagation(); start(event, corner); }} />)}
          </div>
        </div>
      </div>
      <footer><button type="button" onClick={() => setCrop(DEFAULT_IMAGE_CROP)} aria-label={t('Reset crop')} title={t('Reset crop')}><RotateCcw size={17} /></button><span><button type="button" onClick={onCancel} aria-label={t('cancel')} title={t('cancel')}><X size={18} /></button><button type="button" disabled={applying} onClick={() => void apply()} aria-label={t(applying ? 'Cropping…' : 'Apply crop')} title={t(applying ? 'Cropping…' : 'Apply crop')}>{applying ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}</button></span></footer>
    </section>
  </div>;
}
