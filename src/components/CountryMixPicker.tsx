import { X } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';

export function CountryMixPicker({ value, availableCodes, onChange }: { value: string[]; availableCodes: string[]; onChange: (codes: string[]) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const options = availableCodes.filter((code) => !value.includes(code) && COUNTRIES[code]).sort((a, b) => COUNTRIES[a].name.localeCompare(COUNTRIES[b].name));
  return <div className="country-mix-picker">
    {!!value.length && <div className="country-mix-chips">{value.map((code) => <button type="button" key={code} onClick={() => onChange(value.filter((item) => item !== code))} aria-label={`${t('Remove')} ${COUNTRIES[code]?.name || code}`}><CountryFlag code={code} /><span>{COUNTRIES[code]?.name || code}</span><X size={13} /></button>)}</div>}
    <select value="" onChange={(event) => { if (event.target.value) onChange([...value, event.target.value]); }}>
      <option value="">{value.length ? `+ ${t('Add country')}` : t('Any country in collection')}</option>
      {options.map((code) => <option key={code} value={code}>{COUNTRIES[code].name}</option>)}
    </select>
  </div>;
}
