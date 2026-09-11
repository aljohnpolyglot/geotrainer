import type { CoachAnalysis } from '../types';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function CoachLocationEstimate({ estimate }: { estimate?: CoachAnalysis['locationEstimate'] }) {
  const { ui } = useLanguagePreferences();
  if (!estimate) return null;
  return <section className="coach-location-estimate">
    <strong>{translate(ui, 'bestLocationEstimate')}</strong>
    <p>{estimate.label}<small>{estimate.confidence} {translate(ui, 'confidence')}</small></p>
    <ul>{estimate.basis.map((item) => <li key={item}>{item}</li>)}</ul>
  </section>;
}
