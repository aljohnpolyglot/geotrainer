import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import { loadCityPools, locationTargetKey } from '../services/cityPools';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import type { CityPoolRegion, LocationPoolTarget } from '../types';
import { CountryFlag } from './CountryFlag';

export function LocationPoolPicker({ countryCodes, value, onChange }: { countryCodes: string[]; value: LocationPoolTarget[]; onChange: (targets: LocationPoolTarget[]) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [pools, setPools] = useState<Record<string, CityPoolRegion[]>>({});
  const [order, setOrder] = useState<'importance' | 'alphabetical'>('importance');
  useEffect(() => { let active = true; void Promise.all(countryCodes.map(async (code) => [code, await loadCityPools(code)] as const)).then((entries) => { if (active) setPools(Object.fromEntries(entries)); }); return () => { active = false; }; }, [countryCodes.join(',')]);
  const choices = useMemo(() => {
    const selected = new Set(value.map(locationTargetKey));
    return countryCodes.map((countryCode) => ({ countryCode, targets: (pools[countryCode] || []).flatMap((region) => {
      const cities = [...region.cities].sort(order === 'alphabetical' ? (a, b) => a.name.localeCompare(b.name) : (a, b) => b.population - a.population || a.name.localeCompare(b.name));
      return [{ kind: 'region', countryCode, regionId: region.id, regionName: region.name } as LocationPoolTarget,
        ...cities.map((city): LocationPoolTarget => ({ kind: 'city', countryCode, regionId: region.id, regionName: region.name, city }))];
    }).filter((target) => !selected.has(locationTargetKey(target))) }));
  }, [countryCodes, order, pools, value]);
  if (!countryCodes.length) return null;
  const loading = countryCodes.some((code) => pools[code] === undefined);
  const byKey = new Map<string, LocationPoolTarget>(choices.flatMap((group) => group.targets).map((target) => [locationTargetKey(target), target]));
  return <div className="location-pool-picker" aria-busy={loading}>
    {!!value.length && <div className="country-mix-chips">{value.map((target) => <button type="button" key={locationTargetKey(target)} onClick={() => onChange(value.filter((item) => locationTargetKey(item) !== locationTargetKey(target)))} aria-label={`${t('Remove')} ${target.kind === 'city' ? target.city.name : target.regionName}`}><CountryFlag code={target.countryCode} /><span>{target.regionName} — {target.kind === 'city' ? target.city.name : t('All available cities')}</span><X size={13} /></button>)}</div>}
    <div className="location-pool-controls"><select aria-label={t('Add region or city')} disabled={loading} value="" onChange={(event) => { const target = byKey.get(event.target.value); if (target) onChange([...value, target]); }}><option value="">+ {t('Add region or city')}</option>{choices.map(({ countryCode, targets }) => <optgroup key={countryCode} label={COUNTRIES[countryCode]?.name || countryCode}>{targets.map((target) => <option key={locationTargetKey(target)} value={locationTargetKey(target)}>{target.regionName} — {target.kind === 'city' ? target.city.name : t('All available cities')}</option>)}</optgroup>)}</select><label>{t('City order')}<select value={order} onChange={(event) => setOrder(event.target.value as typeof order)}><option value="importance">{t('Importance')}</option><option value="alphabetical">{t('Alphabetical')}</option></select></label></div>
  </div>;
}
