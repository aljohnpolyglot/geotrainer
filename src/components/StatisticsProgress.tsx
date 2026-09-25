import { useState } from 'react';
import type { Attempt, Collection, ReviewRecord, StudyVisit, TrainingSession } from '../types';
import { COUNTRIES } from '../data/countries';
import { geographyFor } from '../analytics/geography';
import { activitySeries, collectionStatistics, learningVelocity, personalBests, targetedTrainingComparisons } from '../analytics/advanced';
import { breakdown, environmentOf, metrics, movementMode } from '../analytics/statistics';
import { sortRows, type SortDirection } from '../analytics/tableSorting';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';

const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const num = (value: number | null, digits = 0) => value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: digits });
const name = (code: string) => COUNTRIES[code]?.name || code;

function SortHeader({ label, active, direction, onSort, sortLabel }: { label: string; active: boolean; direction: SortDirection; onSort: () => void; sortLabel: string }) {
  return <th aria-sort={active ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className="sortable-heading" onClick={onSort} aria-label={`${sortLabel}: ${label}`}>{label}{active ? ` ${direction === 'asc' ? '↑' : '↓'}` : ''}</button></th>;
}

function CompactTable({ title, rows }: { title: string; rows: ReturnType<typeof breakdown> }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [sortKey, setSortKey] = useState<'group' | 'attempts' | 'share' | 'country' | 'region' | 'score' | 'distance' | 'time'>('group');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const total = rows.reduce((sum, row) => sum + row.attempts, 0);
  const sorted = sortRows(rows, (row) => ({ group: row.key, attempts: row.attempts, share: row.attempts, country: row.country.rate, region: row.region.rate, score: row.averageScore, distance: row.averageDistance, time: row.averageTime }[sortKey]), sortDirection);
  const header = (key: typeof sortKey, label: string) => <SortHeader label={label} active={sortKey === key} direction={sortDirection} onSort={() => { if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDirection('asc'); } }} sortLabel={t('Sort by')} />;
  return <section><h3>{title}</h3><div className="table-scroll"><table><thead><tr>{header('group', t('Group'))}{header('attempts', t('Attempts'))}{header('share', t('Share'))}{header('country', t('Country'))}{header('region', t('Region'))}{header('score', t('Avg score'))}{header('distance', t('Avg km'))}{header('time', t('Avg time'))}</tr></thead><tbody>{sorted.map((row) => <tr key={row.key}><th>{row.key}</th><td>{row.attempts}</td><td>{total ? `${Math.round(row.attempts / total * 100)}%` : '—'}</td><td>{pct(row.country.rate)} <small>n={row.country.eligible}</small></td><td>{pct(row.region.rate)} <small>n={row.region.eligible}</small></td><td>{num(row.averageScore)}</td><td>{num(row.averageDistance, 1)}</td><td>{num(row.averageTime, 1)}s</td></tr>)}</tbody></table></div></section>;
}

function Matrix({ attempts, row, columns, column, countryRows = false }: { attempts: Attempt[]; row: (item: Attempt) => string | undefined; columns: string[]; column: (item: Attempt) => string | undefined; countryRows?: boolean }) {
  const rows = [...new Set(attempts.map(row).filter((value): value is string => !!value))].sort();
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [sortKey, setSortKey] = useState<string>('group'); const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const cell = (key: string, col: string) => metrics(attempts.filter((item) => row(item) === key && column(item) === col)).ladder.country;
  const sorted = sortRows(rows, (key) => sortKey === 'group' ? countryRows ? name(key) : key : cell(key, sortKey).rate, sortDirection);
  const header = (key: string, label: string) => <th key={key} aria-sort={sortKey === key ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className="sortable-heading" onClick={() => { if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDirection('asc'); } }} aria-label={`${t('Sort by')}: ${label}`}>{label}{sortKey === key ? ` ${sortDirection === 'asc' ? '↑' : '↓'}` : ''}</button></th>;
  return <div className="table-scroll"><table><thead><tr>{header('group', t('Group'))}{columns.map((item) => header(item, t(item)))}</tr></thead><tbody>{sorted.map((key) => <tr key={key}><th>{countryRows && <CountryFlag code={key} />}{countryRows ? name(key) : key}</th>{columns.map((col) => { const value = cell(key, col); return <td key={col}>{pct(value.rate)}<small> n={value.eligible}</small></td>; })}</tr>)}</tbody></table></div>;
}

export function StatisticsProgress({ attempts, sessions, visits, reviews, collections, locations = [], includeAssisted = false }: { attempts: Attempt[]; sessions: TrainingSession[]; visits: StudyVisit[]; reviews: ReviewRecord[]; collections: Collection[]; locations?: import('../types').TrainerLocation[]; includeAssisted?: boolean }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [grouping, setGrouping] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const periodKey = (stamp: number) => {
    const date = new Date(stamp);
    if (grouping === 'monthly') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (grouping === 'weekly') { const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7); return start.toLocaleDateString(); }
    return date.toLocaleDateString();
  };
  const periods = breakdown(attempts, (item) => periodKey(item.createdAt)).sort((a, b) => a.key.localeCompare(b.key));
  const distance = metrics(attempts);
  const best = personalBests(attempts, sessions, visits, includeAssisted);
  const activity = activitySeries(sessions, attempts, visits).slice(-90);
  const collectionsData = collectionStatistics(attempts, reviews, collections, includeAssisted);
  const velocity = learningVelocity(attempts, locations, Date.now(), includeAssisted);
  const targeted = targetedTrainingComparisons(attempts, visits, collections, includeAssisted);
  const [targetedSort, setTargetedSort] = useState<'drill' | 'before' | 'after' | 'country' | 'score'>('drill'); const [targetedDirection, setTargetedDirection] = useState<SortDirection>('asc');
  const [collectionSort, setCollectionSort] = useState<'collection' | 'attempts' | 'country' | 'region' | 'score' | 'distance' | 'reviews' | 'due'>('collection'); const [collectionDirection, setCollectionDirection] = useState<SortDirection>('asc');
  const sortedTargeted = sortRows(targeted, (item) => ({ drill: item.name, before: item.before.ladder.country.rate, after: item.after.ladder.country.rate, country: item.before.ladder.country.rate === null || item.after.ladder.country.rate === null ? null : item.after.ladder.country.rate - item.before.ladder.country.rate, score: item.before.averageScore === null || item.after.averageScore === null ? null : item.after.averageScore - item.before.averageScore }[targetedSort]), targetedDirection);
  const sortedCollections = sortRows(collectionsData, (item) => ({ collection: item.name, attempts: item.attempts, country: item.country.rate, region: item.region.rate, score: item.averageScore, distance: item.medianDistance, reviews: item.reviewed, due: item.due }[collectionSort]), collectionDirection);
  const header = <T extends string>(key: T, active: T, direction: SortDirection, setKey: (value: T) => void, setDirection: (value: SortDirection) => void, label: string) => <SortHeader label={label} active={active === key} direction={direction} onSort={() => { if (active === key) setDirection(direction === 'asc' ? 'desc' : 'asc'); else { setKey(key); setDirection('asc'); } }} sortLabel={t('Sort by')} />;
  return <>
    <div className="table-tools"><label>{t('Group')}<select value={grouping} onChange={(event) => setGrouping(event.target.value as typeof grouping)}><option value="daily">{t('Daily')}</option><option value="weekly">{t('Weekly')}</option><option value="monthly">{t('Monthly')}</option></select></label></div>
    <section className="stats-trend"><h3>{t('Recognition over time')}</h3>{periods.map((period) => <div className="trend-row" key={period.key}><span>{period.key}</span><i style={{ width: `${(period.country.rate || 0) * 100}%` }} /><b>{pct(period.country.rate)}</b><small>{t('region')} {pct(period.region.rate)} · {t('continent')} {pct(period.continent.rate)} · {t('score')} {num(period.averageScore)} · {num(period.averageTime, 1)}s · n={period.country.eligible}</small></div>)}</section>
    <div className="metric-strip"><div><span>{t('Mean distance')}</span><strong>{num(distance.averageDistance, 1)} km</strong></div><div><span>{t('Median')}</span><strong>{num(distance.medianDistance, 1)} km</strong></div><div><span>p75</span><strong>{num(distance.p75Distance, 1)} km</strong></div><div><span>p90</span><strong>{num(distance.p90Distance, 1)} km</strong></div><div><span>{t('Lowest median · 20')}</span><strong>{best.lowestMedian20 === null ? '—' : `${num(best.lowestMedian20, 1)} km`}</strong></div></div>
    <section><h3>{t('Learning velocity')}</h3><div className="metric-strip"><div><span>{t('New countries · week')}</span><strong>{velocity.newCountriesThisWeek}</strong></div><div><span>{t('Newly mastered · month')}</span><strong>{velocity.newlyMasteredThisMonth}</strong><small>≥70% · n≥10</small></div><div><span>{t('Accuracy gain · month')}</span><strong>{velocity.accuracyGain === null ? '—' : `${velocity.accuracyGain >= 0 ? '+' : ''}${Math.round(velocity.accuracyGain * 100)} pp`}</strong></div><div><span>{t('Score gain · month')}</span><strong>{velocity.scoreGain === null ? '—' : `${velocity.scoreGain >= 0 ? '+' : ''}${num(velocity.scoreGain)}`}</strong></div></div></section>
    <CompactTable title={t('Speed vs accuracy')} rows={breakdown(attempts, (item) => item.timeSpentSeconds < 10 ? '<10s' : item.timeSpentSeconds < 20 ? '10–20s' : item.timeSpentSeconds < 30 ? '20–30s' : item.timeSpentSeconds < 60 ? '30–60s' : '>60s')} />
    <CompactTable title={t('Score distribution')} rows={breakdown(attempts, (item) => item.score < 1000 ? '0–999' : item.score < 2000 ? '1000–1999' : item.score < 3000 ? '2000–2999' : item.score < 4000 ? '3000–3999' : item.score < 4500 ? '4000–4499' : item.score < 5000 ? '4500–4999' : '5000')} />
    <h3>{t('Country')} × {t('Environment')}</h3><Matrix attempts={attempts} row={(item) => item.countryCode} columns={['urban', 'suburban', 'rural', 'mixed']} column={environmentOf} countryRows />
    <h3>{t('Region')} × {t('Environment')}</h3><Matrix attempts={attempts} row={(item) => geographyFor(item.countryCode)?.region} columns={['urban', 'suburban', 'rural', 'mixed']} column={environmentOf} />
    <h3>{t('Country')} × {t('Movement')}</h3><Matrix attempts={attempts} row={(item) => item.countryCode} columns={['Standard', 'No Move', 'NMPZ']} column={movementMode} countryRows />
    <h3>{t('Region')} × {t('Movement')}</h3><Matrix attempts={attempts} row={(item) => geographyFor(item.countryCode)?.region} columns={['Standard', 'No Move', 'NMPZ']} column={movementMode} />
    {targeted.length > 0 && <section><h3>{t('Before / after targeted training')}</h3><p className="stats-note">{t('Descriptive only. The first matching Study drill is the split point.')}</p><div className="table-scroll"><table><thead><tr>{header('drill', targetedSort, targetedDirection, setTargetedSort, setTargetedDirection, t('Drill'))}{header('before', targetedSort, targetedDirection, setTargetedSort, setTargetedDirection, t('Before'))}{header('after', targetedSort, targetedDirection, setTargetedSort, setTargetedDirection, t('After'))}{header('country', targetedSort, targetedDirection, setTargetedSort, setTargetedDirection, t('Country change'))}{header('score', targetedSort, targetedDirection, setTargetedSort, setTargetedDirection, t('Score change'))}</tr></thead><tbody>{sortedTargeted.map((item) => <tr key={item.key}><th>{item.name}<small>{new Date(item.startedAt).toLocaleDateString()}</small></th><td>{pct(item.before.ladder.country.rate)} · n={item.before.ladder.country.eligible}</td><td>{pct(item.after.ladder.country.rate)} · n={item.after.ladder.country.eligible}</td><td>{item.before.ladder.country.rate === null || item.after.ladder.country.rate === null ? '—' : `${Math.round((item.after.ladder.country.rate - item.before.ladder.country.rate) * 100)} pp`}</td><td>{item.before.averageScore === null || item.after.averageScore === null ? '—' : num(item.after.averageScore - item.before.averageScore)}</td></tr>)}</tbody></table></div></section>}
    <section><h3>{t('Activity · last 90 active days')}</h3><div className="activity-heatmap">{activity.map((item) => <i key={item.day} className={`level-${Math.min(4, Math.ceil(item.interactions / 5))}`} title={`${item.day}: ${item.interactions} ${t('interactions')}, ${item.minutes} ${t('active minutes')}`} />)}</div></section>
    <section><h3>{t('Collection statistics')}</h3><div className="table-scroll"><table><thead><tr>{header('collection', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Collection'))}{header('attempts', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Attempts'))}{header('country', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Country'))}{header('region', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Region'))}{header('score', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Avg score'))}{header('distance', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Median km'))}{header('reviews', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Reviews'))}{header('due', collectionSort, collectionDirection, setCollectionSort, setCollectionDirection, t('Due'))}</tr></thead><tbody>{sortedCollections.map((item) => <tr key={item.key}><th>{item.name}</th><td>{item.attempts}</td><td>{pct(item.country.rate)} <small>n={item.country.eligible}</small></td><td>{pct(item.region.rate)}</td><td>{num(item.averageScore)}</td><td>{num(item.medianDistance, 1)}</td><td>{item.reviewed}</td><td>{item.due}</td></tr>)}</tbody></table></div></section>
  </>;
}
