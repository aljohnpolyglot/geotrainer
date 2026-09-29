import { ArrowUp, Flag } from 'lucide-react';
import { startDirection } from '../services/returnToStart';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

type Point = { lat: number; lng: number };
export function ReturnToStartControl({ start, position, heading, onReturn }: { start: Point; position: Point; heading: number; onReturn: () => void }) {
  const { ui } = useLanguagePreferences();
  const { meters, angle } = startDirection(start, position, heading);
  const label = `${translate(ui, 'Return to start')} · ${meters.toLocaleString(ui)} m`;
  return <button type="button" className="return-to-start" onClick={onReturn} aria-label={label} title={label}>
    <Flag size={19} aria-hidden="true" />
    <span className="return-to-start-distance"><ArrowUp size={17} aria-hidden="true" style={{ transform: `rotate(${meters > 0 ? angle : 0}deg)`, opacity: meters > 0 ? 1 : .35 }} /><span>{meters.toLocaleString(ui)}<small> m</small></span></span>
  </button>;
}
