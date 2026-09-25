import { X } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';

export function CountryMixPicker({ value, availableCodes, onChange }: { value: string[]; availableCodes: string[]; onChange: (codes: string[]) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const name = (code: string) => countryDisplayName(code, ui) || COUNTRIES[code]?.name || code;
  const options = availableCodes.filter((code) => !value.includes(code) && COUNTRIES[code]).sort((a, b) => name(a).localeCompare(name(b), ui));
  return <div className="country-mix-picker">
    {!!value.length && <div className="country-mix-chips">{value.map((code) => <button type="button" key={code} onClick={() => onChange(value.filter((item) => item !== code))} aria-label={`${t('Remove')} ${name(code)}`}><CountryFlag code={code} /><span>{name(code)}</span><X size={13} /></button>)}</div>}
    <select value="" onChange={(event) => { if (event.target.value) onChange([...value, event.target.value]); }}>
      <option value="">{value.length ? `+ ${t('Add country')}` : t('Any country in collection')}</option>
      {options.map((code) => <option key={code} value={code}>{name(code)}</option>)}
    </select>
  </div>;
}
