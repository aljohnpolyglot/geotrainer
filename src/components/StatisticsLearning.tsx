import { COUNTRIES } from '../data/countries';
import type { Attempt, ReviewRecord, StudyVisit, TrainerLocation, TrainingSession } from '../types';
import { coverageByContinent, exposurePerformance, regionConfusions, retentionAndLapses, sessionStatistics } from '../analytics/advanced';
import { confusions, reviewAnalytics } from '../analytics/statistics';

const name = (code: string) => COUNTRIES[code]?.name || code;
const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const num = (value: number | null) => value === null ? '—' : Math.round(value).toLocaleString();
const duration = (seconds: number) => seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h ${Math.round(seconds % 3600 / 60)}m`;

export function ReviewStatistics({ attempts, reviews }: { attempts: Attempt[]; reviews: ReviewRecord[] }) {
  const data = reviewAnalytics(attempts, reviews);
  const learning = retentionAndLapses(attempts);
  const today = new Date().setHours(0, 0, 0, 0);
  const week = today - 6 * 86400000;
  const reviewAttempts = attempts.filter((item) => item.source === 'review');
  return <>
    <div className="metric-strip"><div><span>Today</span><strong>{reviewAttempts.filter((item) => item.createdAt >= today).length}</strong></div><div><span>7 days</span><strong>{reviewAttempts.filter((item) => item.createdAt >= week).length}</strong></div><div><span>All time</span><strong>{data.completed}</strong></div><div><span>Due</span><strong>{data.due}</strong></div><div><span>Locations</span><strong>{data.locations}</strong></div><div><span>Avg improvement</span><strong>{num(data.averageImprovement)}</strong><small>n={data.eligible}</small></div></div>
    <div className="stats-callouts"><span>Improved <b>{data.improved}</b></span><span>Country corrected <b>{data.corrected}</b></span>{Object.entries(data.gradeCounts).map(([grade, count]) => <span key={grade}>{grade} <b>{count}</b></span>)}</div>
    <section><h3>Retention</h3><div className="stats-callouts">{learning.retention.map((item) => <span key={item.days}>{item.days}-day <b>{item.eligible >= 5 ? pct(item.rate) : 'Low sample'}</b><small> n={item.eligible}</small></span>)}</div></section>
    <section><h3>Review improvement history</h3><div className="table-scroll"><table><thead><tr><th>Date</th><th>Country</th><th>Before</th><th>Review</th><th>Score Δ</th><th>Distance gain</th><th>Time Δ</th></tr></thead><tbody>{data.improvements.slice().reverse().map((item) => <tr key={item.attempt.id}><td>{new Date(item.attempt.createdAt).toLocaleDateString()}</td><th>{name(item.attempt.countryCode)}</th><td>{item.original.score}</td><td>{item.attempt.score}</td><td>{item.score > 0 ? '+' : ''}{item.score}</td><td>{item.distance === null ? '—' : `${item.distance > 0 ? '+' : ''}${Math.round(item.distance)} km`}</td><td>{item.attempt.timeSpentSeconds - item.original.timeSpentSeconds}s</td></tr>)}</tbody></table></div></section>
    <div className="stats-ladders"><section className="stats-card"><h3>Lapsed countries</h3>{learning.lapseCountries.slice(0, 12).map((item) => <div className="data-row" key={item.key}><span>{name(item.key)}</span><b>{item.count}</b></div>)}{!learning.lapseCountries.length && <p className="empty">No learned-to-wrong review transitions yet.</p>}</section><section className="stats-card"><h3>Lapsed locations</h3>{learning.lapseLocations.slice(0, 12).map((item) => <div className="data-row" key={item.key}><span>{item.key.slice(0, 14)}…</span><b>{item.count}</b></div>)}{!learning.lapseLocations.length && <p className="empty">No location lapses yet.</p>}</section></div>
  </>;
}

export function ConfusionStatistics({ attempts, onTrainCountries }: { attempts: Attempt[]; onTrainCountries: (codes: string[], name: string) => void }) {
  const country = confusions(attempts); const regions = regionConfusions(attempts);
  const list = (title: string, items: typeof country.directional, symbol: string) => <section className="stats-card"><h3>{title}</h3>{items.slice(0, 25).map((item) => <button className="data-row" key={item.codes.join(':')} onClick={() => onTrainCountries(item.codes, 'Confusion drill')}><span>{name(item.codes[0])} {symbol} {name(item.codes[1])}</span><b>{item.count}</b></button>)}{!items.length && <p className="empty">No resolved country confusions yet.</p>}</section>;
  return <><div className="stats-ladders">{list('Directional', country.directional, '→')}{list('Symmetric', country.symmetric, '↔')}</div><section className="stats-card"><h3>Region confusions</h3>{regions.slice(0, 25).map((item) => <div className="data-row" key={item.pair}><span>{item.pair}</span><b>{item.count}</b></div>)}{!regions.length && <p className="empty">No resolved region confusions yet.</p>}</section></>;
}

export function CoverageStatistics({ locations, visits, attempts }: { locations: TrainerLocation[]; visits: StudyVisit[]; attempts: Attempt[] }) {
  const seen = new Set(locations.map((item) => item.countryCode));
  const coverage = coverageByContinent(locations); const exposure = exposurePerformance(visits, attempts);
  return <><div className="metric-strip"><div><span>Supported</span><strong>{Object.keys(COUNTRIES).length}</strong></div><div><span>Countries seen</span><strong>{seen.size}</strong></div><div><span>Never seen</span><strong>{Object.keys(COUNTRIES).length - seen.size}</strong></div><div><span>Unique panoramas</span><strong>{locations.length}</strong></div><div><span>Coverage</span><strong>{pct(seen.size / Object.keys(COUNTRIES).length)}</strong></div></div>
    <section><h3>Coverage by continent</h3><div className="table-scroll"><table><thead><tr><th>Continent</th><th>Seen</th><th>Supported</th><th>Coverage</th></tr></thead><tbody>{coverage.map((item) => <tr key={item.continent}><th>{item.continent}</th><td>{item.seen}</td><td>{item.supported}</td><td>{pct(item.seen / item.supported)}</td></tr>)}</tbody></table></div></section>
    <section><h3>Study exposure vs Play performance</h3><p className="stats-note">Descriptive only; exposure does not prove causation.</p><div className="table-scroll"><table><thead><tr><th>Country</th><th>Study scenes</th><th>Study time</th><th>Revealed</th><th>Play</th><th>Accuracy</th><th>Sample</th></tr></thead><tbody>{exposure.map((item) => <tr key={item.code}><th>{name(item.code)}</th><td>{item.exposures}</td><td>{duration(item.studySeconds)}</td><td>{item.revealed}</td><td>{item.played}</td><td>{pct(item.accuracy.rate)}</td><td>n={item.accuracy.eligible}</td></tr>)}</tbody></table></div></section>
  </>;
}

export function SessionStatistics({ sessions, attempts, visits }: { sessions: TrainingSession[]; attempts: Attempt[]; visits: StudyVisit[] }) {
  const data = sessionStatistics(sessions, attempts, visits);
  return <><div className="metric-strip"><div><span>Sessions</span><strong>{sessions.length}</strong></div><div><span>Total active</span><strong>{duration(sessions.reduce((sum, item) => sum + item.activeTimeSeconds, 0))}</strong></div><div><span>Longest</span><strong>{duration(Math.max(0, ...sessions.map((item) => item.activeTimeSeconds)))}</strong></div><div><span>Best eligible</span><strong>{data.bestAccuracy?.accuracy.eligible >= 10 ? pct(data.bestAccuracy.accuracy.rate) : '—'}</strong></div><div><span>Most reviews</span><strong>{data.mostReviews?.reviews || 0}</strong></div><div><span>Fastest ≥70%</span><strong>{data.fastestAccurate ? duration(data.fastestAccurate.activeTimeSeconds) : '—'}</strong></div></div>
    <div className="attempt-list">{data.rows.map((item) => <div className="attempt-row session-row" key={item.id}><span><strong>{new Date(item.startedAt).toLocaleDateString()}</strong><small>{duration(item.activeTimeSeconds)} · {item.countries} countries</small></span><span>{item.study} Study · {item.play} Play · {item.reviews} Review</span><strong>{pct(item.accuracy.rate)} <small>n={item.accuracy.eligible}</small></strong><span>Avg {num(item.averageScore)}</span></div>)}</div>
  </>;
}
