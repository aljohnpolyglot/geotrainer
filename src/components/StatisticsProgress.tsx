import { useState } from 'react';
import type { Attempt, Collection, ReviewRecord, StudyVisit, TrainingSession } from '../types';
import { COUNTRIES } from '../data/countries';
import { geographyFor } from '../analytics/geography';
import { activitySeries, collectionStatistics, learningVelocity, personalBests, targetedTrainingComparisons } from '../analytics/advanced';
import { breakdown, environmentOf, metrics, movementMode } from '../analytics/statistics';

const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const num = (value: number | null, digits = 0) => value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: digits });
const name = (code: string) => COUNTRIES[code]?.name || code;

function CompactTable({ title, rows }: { title: string; rows: ReturnType<typeof breakdown> }) {
  const total = rows.reduce((sum, row) => sum + row.attempts, 0);
  return <section><h3>{title}</h3><div className="table-scroll"><table><thead><tr><th>Group</th><th>Attempts</th><th>Share</th><th>Country</th><th>Region</th><th>Avg score</th><th>Avg km</th><th>Avg time</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><th>{row.key}</th><td>{row.attempts}</td><td>{total ? `${Math.round(row.attempts / total * 100)}%` : '—'}</td><td>{pct(row.country.rate)} <small>n={row.country.eligible}</small></td><td>{pct(row.region.rate)} <small>n={row.region.eligible}</small></td><td>{num(row.averageScore)}</td><td>{num(row.averageDistance, 1)}</td><td>{num(row.averageTime, 1)}s</td></tr>)}</tbody></table></div></section>;
}

function Matrix({ attempts, row, columns, column }: { attempts: Attempt[]; row: (item: Attempt) => string | undefined; columns: string[]; column: (item: Attempt) => string | undefined }) {
  const rows = [...new Set(attempts.map(row).filter((value): value is string => !!value))].sort();
  return <div className="table-scroll"><table><thead><tr><th>Group</th>{columns.map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map((key) => <tr key={key}><th>{key}</th>{columns.map((col) => { const value = metrics(attempts.filter((item) => row(item) === key && column(item) === col)).ladder.country; return <td key={col}>{pct(value.rate)}<small> n={value.eligible}</small></td>; })}</tr>)}</tbody></table></div>;
}

export function StatisticsProgress({ attempts, sessions, visits, reviews, collections, locations = [] }: { attempts: Attempt[]; sessions: TrainingSession[]; visits: StudyVisit[]; reviews: ReviewRecord[]; collections: Collection[]; locations?: import('../types').TrainerLocation[] }) {
  const [grouping, setGrouping] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const periodKey = (stamp: number) => {
    const date = new Date(stamp);
    if (grouping === 'monthly') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (grouping === 'weekly') { const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7); return start.toLocaleDateString(); }
    return date.toLocaleDateString();
  };
  const periods = breakdown(attempts, (item) => periodKey(item.createdAt)).sort((a, b) => a.key.localeCompare(b.key));
  const distance = metrics(attempts);
  const best = personalBests(attempts, sessions, visits);
  const activity = activitySeries(sessions, attempts, visits).slice(-90);
  const collectionsData = collectionStatistics(attempts, reviews, collections);
  const velocity = learningVelocity(attempts, locations);
  const targeted = targetedTrainingComparisons(attempts, visits, collections);
  return <>
    <div className="table-tools"><label>Group<select value={grouping} onChange={(event) => setGrouping(event.target.value as typeof grouping)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label></div>
    <section className="stats-trend"><h3>Recognition over time</h3>{periods.map((period) => <div className="trend-row" key={period.key}><span>{period.key}</span><i style={{ width: `${(period.country.rate || 0) * 100}%` }} /><b>{pct(period.country.rate)}</b><small>region {pct(period.region.rate)} · continent {pct(period.continent.rate)} · score {num(period.averageScore)} · {num(period.averageTime, 1)}s · n={period.country.eligible}</small></div>)}</section>
    <div className="metric-strip"><div><span>Mean distance</span><strong>{num(distance.averageDistance, 1)} km</strong></div><div><span>Median</span><strong>{num(distance.medianDistance, 1)} km</strong></div><div><span>p75</span><strong>{num(distance.p75Distance, 1)} km</strong></div><div><span>p90</span><strong>{num(distance.p90Distance, 1)} km</strong></div><div><span>Lowest median · 20</span><strong>{best.lowestMedian20 === null ? '—' : `${num(best.lowestMedian20, 1)} km`}</strong></div></div>
    <section><h3>Learning velocity</h3><div className="metric-strip"><div><span>New countries · week</span><strong>{velocity.newCountriesThisWeek}</strong></div><div><span>Newly mastered · month</span><strong>{velocity.newlyMasteredThisMonth}</strong><small>≥70% over 10</small></div><div><span>Accuracy gain · month</span><strong>{velocity.accuracyGain === null ? '—' : `${velocity.accuracyGain >= 0 ? '+' : ''}${Math.round(velocity.accuracyGain * 100)} pp`}</strong></div><div><span>Score gain · month</span><strong>{velocity.scoreGain === null ? '—' : `${velocity.scoreGain >= 0 ? '+' : ''}${num(velocity.scoreGain)}`}</strong></div></div></section>
    <CompactTable title="Speed vs accuracy" rows={breakdown(attempts, (item) => item.timeSpentSeconds < 10 ? '<10s' : item.timeSpentSeconds < 20 ? '10–20s' : item.timeSpentSeconds < 30 ? '20–30s' : item.timeSpentSeconds < 60 ? '30–60s' : '>60s')} />
    <CompactTable title="Score distribution" rows={breakdown(attempts, (item) => item.score < 1000 ? '0–999' : item.score < 2000 ? '1000–1999' : item.score < 3000 ? '2000–2999' : item.score < 4000 ? '3000–3999' : item.score < 4500 ? '4000–4499' : item.score < 5000 ? '4500–4999' : '5000')} />
    <h3>Country × Environment</h3><Matrix attempts={attempts} row={(item) => name(item.countryCode)} columns={['urban', 'suburban', 'rural', 'mixed']} column={environmentOf} />
    <h3>Region × Environment</h3><Matrix attempts={attempts} row={(item) => geographyFor(item.countryCode)?.region} columns={['urban', 'suburban', 'rural', 'mixed']} column={environmentOf} />
    <h3>Country × Movement</h3><Matrix attempts={attempts} row={(item) => name(item.countryCode)} columns={['Standard', 'No Move', 'NMPZ']} column={movementMode} />
    <h3>Region × Movement</h3><Matrix attempts={attempts} row={(item) => geographyFor(item.countryCode)?.region} columns={['Standard', 'No Move', 'NMPZ']} column={movementMode} />
    {targeted.length > 0 && <section><h3>Before / after targeted training</h3><p className="stats-note">Descriptive only. The first matching Study drill is the split point.</p><div className="table-scroll"><table><thead><tr><th>Drill</th><th>Before</th><th>After</th><th>Country change</th><th>Score change</th></tr></thead><tbody>{targeted.map((item) => <tr key={item.key}><th>{item.name}<small>{new Date(item.startedAt).toLocaleDateString()}</small></th><td>{pct(item.before.ladder.country.rate)} · n={item.before.ladder.country.eligible}</td><td>{pct(item.after.ladder.country.rate)} · n={item.after.ladder.country.eligible}</td><td>{item.before.ladder.country.rate === null || item.after.ladder.country.rate === null ? '—' : `${Math.round((item.after.ladder.country.rate - item.before.ladder.country.rate) * 100)} pp`}</td><td>{item.before.averageScore === null || item.after.averageScore === null ? '—' : num(item.after.averageScore - item.before.averageScore)}</td></tr>)}</tbody></table></div></section>}
    <section><h3>Activity · last 90 active days</h3><div className="activity-heatmap">{activity.map((item) => <i key={item.day} className={`level-${Math.min(4, Math.ceil(item.interactions / 5))}`} title={`${item.day}: ${item.interactions} interactions, ${item.minutes} active minutes`} />)}</div></section>
    <section><h3>Collection statistics</h3><div className="table-scroll"><table><thead><tr><th>Collection</th><th>Attempts</th><th>Country</th><th>Region</th><th>Avg score</th><th>Median km</th><th>Reviews</th><th>Due</th></tr></thead><tbody>{collectionsData.map((item) => <tr key={item.key}><th>{item.name}</th><td>{item.attempts}</td><td>{pct(item.country.rate)} <small>n={item.country.eligible}</small></td><td>{pct(item.region.rate)}</td><td>{num(item.averageScore)}</td><td>{num(item.medianDistance, 1)}</td><td>{item.reviewed}</td><td>{item.due}</td></tr>)}</tbody></table></div></section>
  </>;
}
