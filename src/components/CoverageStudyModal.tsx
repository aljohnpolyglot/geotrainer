import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import type { TrainerLocation } from '../types';
import { StreetViewContainer } from './StreetViewContainer';

export function CoverageStudyModal({ location, onClose }: { location: TrainerLocation; onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  return <div className="coverage-study-backdrop" role="dialog" aria-modal="true" aria-labelledby="coverage-study-title">
    <section className="coverage-study-panel">
      <header>
        <div><span>Coverage study</span><h2 id="coverage-study-title">{COUNTRIES[location.countryCode]?.name || location.countryCode}</h2><p>{location.encounterCount} encounter{location.encounterCount === 1 ? '' : 's'} · last seen {new Date(location.lastSeenAt).toLocaleDateString()}</p></div>
        <button className="button secondary" onClick={onClose}><ArrowLeft size={15} /> Back to Coverage</button>
      </header>
      <div className="coverage-study-view">
        <StreetViewContainer currentLocation={location} isLoading={false} onNextLocation={() => {}} canMove canPan canZoom showCompass />
      </div>
    </section>
  </div>;
}
