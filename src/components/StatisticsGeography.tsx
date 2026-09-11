import { useMemo, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import type { Attempt, ReviewRecord, StudyVisit, TrainerLocation } from '../types';
import { geographyFor } from '../analytics/geography';
import { breakdown, metrics, sampleLabel } from '../analytics/statistics';
import { sortRows, type SortDirection } from '../analytics/tableSorting';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

const name = (code: string) => COUNTRIES[code]?.name || code;
const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const num = (value: number | null, digits = 0) => value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: digits });
type CountrySortKey = 'name' | 'seen' | 'study' | 'play' | 'review' | 'correct' | 'country' | 'region' | 'score' | 'distance' | 'time' | 'last' | 'due' | 'sample';

function SortHeader({ label, active, direction, onSort, sortLabel }: { label: string; active: boolean; direction: SortDirection; onSort: () => void; sortLabel: string }) {
  return <th aria-sort={active ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className="sortable-heading" onClick={onSort} aria-label={`${sortLabel}: ${label}`}>{label}{active ? ` ${direction === 'asc' ? '↑' : '↓'}` : ''}</button></th>;
}

export function CountryStatistics({ play, attempts, visits, locations, reviews }: { play: Attempt[]; attempts: Attempt[]; visits: StudyVisit[]; locations: TrainerLocation[]; reviews: ReviewRecord[] }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [continent, setContinent] = useState(''); const [region, setRegion] = useState(''); const [minimum, setMinimum] = useState(0);
  const [sortKey, setSortKey] = useState<CountrySortKey>('country'); const [sortDirection, setSortDirection] = useState<SortDirection>('asc'); const [selected, setSelected] = useState('');
  const rows = useMemo(() => {
    const group = <T extends { countryCode: string }>(items: T[]) => items.reduce((map, item) => map.set(item.countryCode, [...(map.get(item.countryCode) || []), item]), new Map<string, T[]>());
    const playedByCountry = group(play); const attemptsByCountry = group(attempts); const visitsByCountry = group(visits); const locationsByCountry = group(locations);
    const duePanos = new Set(reviews.filter((item) => item.dueAt <= Date.now()).map((item) => item.panoId));
    return Object.keys(COUNTRIES).map((code) => {
      const played = playedByCountry.get(code) || []; const allAttempts = attemptsByCountry.get(code) || [];
      const reviewAttempts = allAttempts.filter((item) => item.source === 'review'); const exposure = visitsByCountry.get(code) || []; const seen = locationsByCountry.get(code) || []; const value = metrics(played);
      return { code, played, reviewAttempts, exposure, seen, value, due: new Set(allAttempts.filter((item) => duePanos.has(item.panoId)).map((item) => item.panoId)).size, lastSeen: Math.max(0, ...seen.map((item) => item.lastSeenAt), ...played.map((item) => item.createdAt)) };
    }).filter((item) => item.played.length >= minimum && (!continent || geographyFor(item.code)?.continent === continent) && (!region || geographyFor(item.code)?.region === region));
  }, [play, attempts, visits, locations, reviews, continent, region, minimum]);
  const sortValue = (row: (typeof rows)[number]) => ({
    name: name(row.code), seen: row.seen.length, study: row.exposure.length, play: row.played.length, review: row.reviewAttempts.length,
    correct: row.value.ladder.country.correct, country: row.value.ladder.country.rate, region: row.value.ladder.region.rate,
    score: row.value.averageScore, distance: row.value.averageDistance, time: row.value.averageTime, last: row.lastSeen, due: row.due, sample: row.played.length,
  }[sortKey]);
  const sorted = sortRows(rows, sortValue, sortDirection);
  const sortBy = (key: CountrySortKey) => { if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDirection('asc'); } };
  const selectSort = (key: CountrySortKey) => { setSortKey(key); setSortDirection(key === 'country' ? 'asc' : 'desc'); };
  const continents = [...new Set(Object.keys(COUNTRIES).map((code) => geographyFor(code)?.continent).filter(Boolean))].sort();
  const regions = [...new Set(Object.keys(COUNTRIES).map((code) => geographyFor(code)?.region).filter(Boolean))].sort();
  const current = rows.find((item) => item.code === selected); const currentAll = selected ? attempts.filter((item) => item.countryCode === selected) : [];
  const actualMistakes = selected ? play.filter((item) => item.countryCode === selected && item.guessedCountryCode && item.guessedCountryCode !== selected) : [];
  const mistakenFor = selected ? play.filter((item) => item.countryCode !== selected && item.guessedCountryCode === selected) : [];
  const counts = (items: Attempt[], key: (item: Attempt) => string | undefined) => [...items.reduce((map, item) => { const value = key(item); if (value) map.set(value, (map.get(value) || 0) + 1); return map; }, new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const header = (key: CountrySortKey, label: string) => <SortHeader label={label} active={sortKey === key} direction={sortDirection} onSort={() => sortBy(key)} sortLabel={t('Sort by')} />;
  return <>
    <div className="filter-bar stats-filters"><label>{t('Continent')}<select value={continent} onChange={(event) => setContinent(event.target.value)}><option value="">{t('All')}</option>{continents.map((item) => <option key={item}>{item}</option>)}</select></label><label>{t('Region')}<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">{t('All')}</option>{regions.map((item) => <option key={item}>{item}</option>)}</select></label><label>{t('Minimum attempts')}<input type="number" min="0" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} /></label><label>{t('Sort')}<select value={sortKey} onChange={(event) => selectSort(event.target.value as CountrySortKey)}><option value="country">{t('Weakest accuracy')}</option><option value="play">{t('Most attempts')}</option><option value="score">{t('Best average score')}</option><option value="last">{t('Recently seen')}</option></select></label></div>
    <div className="table-scroll"><table><thead><tr>{header('name', t('Country'))}{header('seen', t('Seen'))}{header('study', t('Study'))}{header('play', t('Play'))}{header('review', t('Review'))}{header('correct', t('Correct'))}{header('country', t('Country'))}{header('region', t('Region'))}{header('score', t('Avg / median / best'))}{header('distance', t('Avg / median km'))}{header('time', t('Avg time'))}{header('last', t('Last seen'))}{header('due', t('Due'))}{header('sample', t('Sample'))}</tr></thead><tbody>{sorted.map((row) => <tr key={row.code} onClick={() => setSelected(row.code)} className={selected === row.code ? 'selected' : ''}><th>{name(row.code)}</th><td>{row.seen.length}</td><td>{row.exposure.length}</td><td>{row.played.length}</td><td>{row.reviewAttempts.length}</td><td>{row.value.ladder.country.correct}</td><td>{pct(row.value.ladder.country.rate)} <small>n={row.value.ladder.country.eligible}</small></td><td>{pct(row.value.ladder.region.rate)}</td><td>{num(row.value.averageScore)} / {num(row.value.medianScore)} / {Math.max(0, ...row.played.map((item) => item.score))}</td><td>{num(row.value.averageDistance, 1)} / {num(row.value.medianDistance, 1)}</td><td>{num(row.value.averageTime, 1)}s</td><td>{row.lastSeen ? new Date(row.lastSeen).toLocaleDateString() : '—'}</td><td>{row.due}</td><td><span className={`sample ${row.played.length < 15 ? 'low' : ''}`}>{t(sampleLabel(row.played.length))}</span></td></tr>)}</tbody></table></div>
    {current && <section className="country-detail stats-card"><h3>{name(current.code)} · {t('Details')}</h3><div className="metric-strip"><div><span>{t('Country')}</span><strong>{pct(current.value.ladder.country.rate)}</strong></div><div><span>{t('Region')}</span><strong>{pct(current.value.ladder.region.rate)}</strong></div><div><span>{t('Avg score')}</span><strong>{num(current.value.averageScore)}</strong></div><div><span>{t('Recent 10')}</span><strong>{num(metrics(current.played.slice(-10)).averageScore)}</strong></div><div><span>{t('Avg time')}</span><strong>{num(current.value.averageTime, 1)}s</strong></div></div>
      <div className="stats-ladders"><section><h3>{t('When actual')} = {name(current.code)}</h3>{counts(actualMistakes, (item) => item.guessedCountryCode).slice(0, 10).map(([code, count]) => <div className="data-row" key={code}><span>{name(code)}</span><b>{count}</b></div>)}</section><section><h3>{t('Mistaken for')} {name(current.code)}</h3>{counts(mistakenFor, (item) => item.countryCode).slice(0, 10).map(([code, count]) => <div className="data-row" key={code}><span>{name(code)}</span><b>{count}</b></div>)}</section></div>
      <h3>{t('Environment')}</h3><Simple rows={breakdown(current.played, (item) => item.environmentRequested || item.environment)} t={t} /><h3>{t('Movement')}</h3><Simple rows={breakdown(current.played, (item) => item.canMove ? 'Standard' : item.canPan || item.canZoom ? 'No Move' : 'NMPZ')} t={t} />
      <h3>{t('Recent attempts and reviews')}</h3><div className="attempt-list">{currentAll.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 20).map((item) => <div className="attempt-row" key={item.id}><span>{new Date(item.createdAt).toLocaleDateString()} · {t(item.source)}</span><span>{item.guessedCountryCode ? name(item.guessedCountryCode) : t('Country unresolved')}</span><strong>{item.score}</strong></div>)}</div>
    </section>}
  </>;
}

function Simple({ rows, t }: { rows: ReturnType<typeof breakdown>; t: (key: string) => string }) { return <div className="table-scroll"><table><thead><tr><th>{t('Group')}</th><th>{t('Attempts')}</th><th>{t('Country')}</th><th>{t('Region')}</th><th>{t('Avg score')}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><th>{t(row.key)}</th><td>{row.attempts}</td><td>{pct(row.country.rate)} <small>n={row.country.eligible}</small></td><td>{pct(row.region.rate)}</td><td>{num(row.averageScore)}</td></tr>)}</tbody></table></div>; }
