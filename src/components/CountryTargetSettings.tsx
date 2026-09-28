import { useState } from 'react';
import { Pencil, RotateCcw, X } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import { passingScoreFor } from '../data/reviewGrading';
import { countryDisplayName } from '../services/language';
import { COUNTRY_TARGET_COPY } from '../services/countryTargetCopy';
import type { SchedulerPreferences, SupportedLanguage } from '../types';
import { CountryFlag } from './CountryFlag';

export function CountryTargetSettings({ scheduler, language, onChange }: { scheduler: SchedulerPreferences; language: SupportedLanguage; onChange: (value: SchedulerPreferences) => void }) {
  const copy = COUNTRY_TARGET_COPY[language];
  const baseline = passingScoreFor(scheduler.strictness);
  const defaultFloor = scheduler.defaultCountryScoreFloor ?? baseline;
  const floors = scheduler.countryScoreFloors || {};
  const [country, setCountry] = useState('');
  const [floor, setFloor] = useState<number>(defaultFloor);
  const name = (code: string) => countryDisplayName(code, language) || COUNTRIES[code]?.name || code;
  const codes = Object.keys(COUNTRIES).sort((a, b) => name(a).localeCompare(name(b), language));
  const valid = Number.isInteger(floor) && floor >= baseline && floor <= 5000;
  const selectCountry = (code: string) => { setCountry(code); setFloor(Math.max(baseline, floors[code] ?? defaultFloor)); };
  const saveTarget = () => {
    if (!country || !valid) return;
    onChange({ ...scheduler, countryScoreFloors: { ...floors, [country]: floor } });
    setCountry('');
  };
  const removeTarget = (code: string) => {
    const next = { ...floors }; delete next[code];
    onChange({ ...scheduler, countryScoreFloors: next });
    if (country === code) setCountry('');
  };
  const number = (value: string) => value === '' ? NaN : Number(value);
  const format = (value: number) => new Intl.NumberFormat(language).format(value);

  return <fieldset className="country-target-settings"><legend>{copy.title}</legend><p>{copy.description}</p>
    <div className="country-target-default"><label>{copy.defaultFloor}<input type="number" min={baseline} max="5000" step="1" value={Number.isNaN(defaultFloor) ? '' : defaultFloor} onChange={(event) => onChange({ ...scheduler, defaultCountryScoreFloor: number(event.target.value) })} /></label>
      {scheduler.defaultCountryScoreFloor !== undefined && <button type="button" className="country-target-icon" aria-label={copy.reset} title={copy.reset} onClick={() => onChange({ ...scheduler, defaultCountryScoreFloor: undefined })}><RotateCcw size={16} /></button>}
      <span>/ {format(5000)}</span>
    </div>
    <div className="country-target-editor">
      <label>{copy.country}<span className={country ? 'language-choice' : ''}>{country && <CountryFlag code={country} />}<select value={country} onChange={(event) => selectCountry(event.target.value)}><option value="">{copy.choose}</option>{codes.map((code) => <option key={code} value={code}>{name(code)}</option>)}</select></span></label>
      <label>{copy.floor}<input type="number" min={baseline} max="5000" step="1" value={Number.isNaN(floor) ? '' : floor} disabled={!country} onChange={(event) => setFloor(number(event.target.value))} /></label>
      <button type="button" className="button secondary" disabled={!country || !valid} onClick={saveTarget}>{country && floors[country] !== undefined ? copy.update : copy.add}</button>
    </div>
    {!!Object.keys(floors).length ? <ul className="country-target-list">{Object.keys(floors).sort((a, b) => name(a).localeCompare(name(b), language)).map((code) => <li key={code}><CountryFlag code={code} /><strong>{name(code)}</strong><span>{format(Math.max(baseline, floors[code]))} / {format(5000)}</span><button type="button" className="country-target-icon" title={copy.edit} aria-label={copy.edit + ': ' + name(code)} onClick={() => selectCountry(code)}><Pencil size={15} /></button><button type="button" className="country-target-icon" title={copy.remove} aria-label={copy.remove + ': ' + name(code)} onClick={() => removeTarget(code)}><X size={16} /></button></li>)}</ul> : <p className="country-target-empty">{copy.empty}</p>}
  </fieldset>;
}
