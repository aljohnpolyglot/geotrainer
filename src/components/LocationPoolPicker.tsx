import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import { loadCityPools, locationPoolChoices, locationTargetKey, samePoolRegion, selectPoolCity, selectPoolRegion } from '../services/cityPools';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import type { CityPoolRegion, LocationPoolTarget } from '../types';
import { CountryFlag } from './CountryFlag';

export function LocationPoolPicker({ countryCodes, value, onChange }: { countryCodes: string[]; value: LocationPoolTarget[]; onChange: (targets: LocationPoolTarget[]) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [pools, setPools] = useState<Record<string, CityPoolRegion[]>>({});
  const [order, setOrder] = useState<'importance' | 'alphabetical'>('importance');
  useEffect(() => { let active = true; void Promise.all(countryCodes.map(async (code) => [code, await loadCityPools(code)] as const)).then((entries) => { if (active) setPools(Object.fromEntries(entries)); }); return () => { active = false; }; }, [countryCodes.join(',')]);
  const choices = useMemo(() => locationPoolChoices(countryCodes, pools, value, order), [countryCodes, order, pools, value]);
  if (!countryCodes.length) return null;
  const loading = countryCodes.some((code) => pools[code] === undefined);
  const regions = value.filter((target, index) => value.findIndex((item) => samePoolRegion(item, target)) === index);
  const cities = value.filter((target) => target.kind === 'city');
  const byKey = new Map<string, LocationPoolTarget>(choices.flatMap((country) => country.regions.flatMap((region) => region.targets)).map((target) => [locationTargetKey(target), target]));
  return <div className="location-pool-picker" aria-busy={loading}>
    <div className="location-pool-field">
      <label>{t('Regions')}<select disabled={loading} value="" onChange={(event) => { const target = byKey.get(event.target.value); if (target) onChange(selectPoolRegion(value, target)); }}>
        <option value="">{t(regions.length ? 'Add region' : 'All regions')}</option>
        {choices.map(({ countryCode, regions: available }) => <optgroup key={countryCode} label={COUNTRIES[countryCode]?.name || countryCode}>
          {available.flatMap((region) => region.targets.filter((target) => target.kind === 'region' && !regions.some((item) => samePoolRegion(item, target))).map((target) => <option key={locationTargetKey(target)} value={locationTargetKey(target)}>{target.regionName}</option>))}
        </optgroup>)}
      </select></label>
      {!!regions.length && <div className="country-mix-chips">{regions.map((target) => <button type="button" key={`${target.countryCode}:${target.regionId}`} onClick={() => onChange(value.filter((item) => !samePoolRegion(item, target)))} aria-label={`${t('Remove')} ${target.regionName}`}><CountryFlag code={target.countryCode} /><span>{target.regionName}</span><X size={13} /></button>)}</div>}
    </div>
    {!!regions.length && <div className="location-pool-field">
      <div className="location-pool-controls"><label>{t('Cities')}<select disabled={loading} value="" onChange={(event) => { const target = byKey.get(event.target.value); if (target) onChange(selectPoolCity(value, target)); }}>
        <option value="">{t(cities.length ? 'Add city' : 'All available cities')}</option>
        {choices.flatMap(({ countryCode, regions: available }) => available.filter((region) => regions.some((item) => item.countryCode === countryCode && item.regionId === region.id)).map((region) => <optgroup key={`${countryCode}:${region.id}`} label={`${COUNTRIES[countryCode]?.name || countryCode} — ${region.name}`}>
          {region.targets.filter((target) => target.kind === 'city').map((target) => <option key={locationTargetKey(target)} value={locationTargetKey(target)}>{target.kind === 'city' && target.city.name}</option>)}
        </optgroup>))}
      </select></label><label>{t('City order')}<select value={order} onChange={(event) => setOrder(event.target.value as typeof order)}><option value="importance">{t('Importance')}</option><option value="alphabetical">{t('Alphabetical')}</option></select></label></div>
      {!!cities.length && <div className="country-mix-chips">{cities.map((target) => <button type="button" key={locationTargetKey(target)} onClick={() => onChange(selectPoolCity(value, target, true))} aria-label={`${t('Remove')} ${target.city.name}`} title={target.regionName}><CountryFlag code={target.countryCode} /><span>{target.city.name}</span><X size={13} /></button>)}</div>}
    </div>}
  </div>;
}
