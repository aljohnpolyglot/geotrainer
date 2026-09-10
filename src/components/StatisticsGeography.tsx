import { useMemo, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import type { Attempt, ReviewRecord, StudyVisit, TrainerLocation } from '../types';
import { geographyFor } from '../analytics/geography';
import { breakdown, metrics, recognition, sampleLabel } from '../analytics/statistics';

const name = (code: string) => COUNTRIES[code]?.name || code;
const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const num = (value: number | null, digits = 0) => value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: digits });

export function CountryStatistics({ play, attempts, visits, locations, reviews }: { play: Attempt[]; attempts: Attempt[]; visits: StudyVisit[]; locations: TrainerLocation[]; reviews: ReviewRecord[] }) {
  const [continent, setContinent] = useState(''); const [region, setRegion] = useState(''); const [minimum, setMinimum] = useState(0);
  const [sort, setSort] = useState('accuracy'); const [selected, setSelected] = useState('');
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
  const sorted = [...rows].sort((a, b) => sort === 'attempts' ? b.played.length - a.played.length : sort === 'score' ? (b.value.averageScore || 0) - (a.value.averageScore || 0) : sort === 'last' ? b.lastSeen - a.lastSeen : (a.value.ladder.country.rate ?? 1) - (b.value.ladder.country.rate ?? 1));
  const continents = [...new Set(Object.keys(COUNTRIES).map((code) => geographyFor(code)?.continent).filter(Boolean))].sort();
  const regions = [...new Set(Object.keys(COUNTRIES).map((code) => geographyFor(code)?.region).filter(Boolean))].sort();
  const current = rows.find((item) => item.code === selected); const currentAll = selected ? attempts.filter((item) => item.countryCode === selected) : [];
  const actualMistakes = selected ? play.filter((item) => item.countryCode === selected && item.guessedCountryCode && item.guessedCountryCode !== selected) : [];
  const mistakenFor = selected ? play.filter((item) => item.countryCode !== selected && item.guessedCountryCode === selected) : [];
  const counts = (items: Attempt[], key: (item: Attempt) => string | undefined) => [...items.reduce((map, item) => { const value = key(item); if (value) map.set(value, (map.get(value) || 0) + 1); return map; }, new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  return <>
    <div className="filter-bar stats-filters"><label>Continent<select value={continent} onChange={(event) => setContinent(event.target.value)}><option value="">All</option>{continents.map((item) => <option key={item}>{item}</option>)}</select></label><label>Region<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">All</option>{regions.map((item) => <option key={item}>{item}</option>)}</select></label><label>Minimum attempts<input type="number" min="0" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} /></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="accuracy">Weakest accuracy</option><option value="attempts">Most attempts</option><option value="score">Best average score</option><option value="last">Recently seen</option></select></label></div>
    <div className="table-scroll"><table><thead><tr><th>Country</th><th>Seen</th><th>Study</th><th>Play</th><th>Review</th><th>Correct</th><th>Country</th><th>Region</th><th>Avg / median / best</th><th>Avg / median km</th><th>Avg time</th><th>Last seen</th><th>Due</th><th>Sample</th></tr></thead><tbody>{sorted.map((row) => <tr key={row.code} onClick={() => setSelected(row.code)} className={selected === row.code ? 'selected' : ''}><th>{name(row.code)}</th><td>{row.seen.length}</td><td>{row.exposure.length}</td><td>{row.played.length}</td><td>{row.reviewAttempts.length}</td><td>{row.value.ladder.country.correct}</td><td>{pct(row.value.ladder.country.rate)} <small>n={row.value.ladder.country.eligible}</small></td><td>{pct(row.value.ladder.region.rate)}</td><td>{num(row.value.averageScore)} / {num(row.value.medianScore)} / {Math.max(0, ...row.played.map((item) => item.score))}</td><td>{num(row.value.averageDistance, 1)} / {num(row.value.medianDistance, 1)}</td><td>{num(row.value.averageTime, 1)}s</td><td>{row.lastSeen ? new Date(row.lastSeen).toLocaleDateString() : '—'}</td><td>{row.due}</td><td><span className={`sample ${row.played.length < 15 ? 'low' : ''}`}>{sampleLabel(row.played.length)}</span></td></tr>)}</tbody></table></div>
    {current && <section className="country-detail stats-card"><h3>{name(current.code)} · detail</h3><div className="metric-strip"><div><span>Country</span><strong>{pct(current.value.ladder.country.rate)}</strong></div><div><span>Region</span><strong>{pct(current.value.ladder.region.rate)}</strong></div><div><span>Avg score</span><strong>{num(current.value.averageScore)}</strong></div><div><span>Recent 10</span><strong>{num(metrics(current.played.slice(-10)).averageScore)}</strong></div><div><span>Avg time</span><strong>{num(current.value.averageTime, 1)}s</strong></div></div>
      <div className="stats-ladders"><section><h3>When actual = {name(current.code)}</h3>{counts(actualMistakes, (item) => item.guessedCountryCode).slice(0, 10).map(([code, count]) => <div className="data-row" key={code}><span>{name(code)}</span><b>{count}</b></div>)}</section><section><h3>Mistaken for {name(current.code)}</h3>{counts(mistakenFor, (item) => item.countryCode).slice(0, 10).map(([code, count]) => <div className="data-row" key={code}><span>{name(code)}</span><b>{count}</b></div>)}</section></div>
      <h3>Environment</h3><Simple rows={breakdown(current.played, (item) => item.environmentRequested || item.environment)} /><h3>Movement</h3><Simple rows={breakdown(current.played, (item) => item.canMove ? 'Standard' : item.canPan || item.canZoom ? 'No Move' : 'NMPZ')} />
      <h3>Recent attempts and reviews</h3><div className="attempt-list">{currentAll.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 20).map((item) => <div className="attempt-row" key={item.id}><span>{new Date(item.createdAt).toLocaleDateString()} · {item.source}</span><span>{item.guessedCountryCode ? name(item.guessedCountryCode) : 'Country unresolved'}</span><strong>{item.score}</strong></div>)}</div>
    </section>}
  </>;
}

function Simple({ rows }: { rows: ReturnType<typeof breakdown> }) { return <div className="table-scroll"><table><thead><tr><th>Group</th><th>Attempts</th><th>Country</th><th>Region</th><th>Avg score</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><th>{row.key}</th><td>{row.attempts}</td><td>{pct(row.country.rate)} <small>n={row.country.eligible}</small></td><td>{pct(row.region.rate)}</td><td>{num(row.averageScore)}</td></tr>)}</tbody></table></div>; }
