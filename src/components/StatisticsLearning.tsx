import { COUNTRIES } from '../data/countries';
import type { Attempt, ReviewRecord, StudyVisit, TrainerLocation, TrainingSession } from '../types';
import { coverageByContinent, exposurePerformance, regionConfusions, retentionAndLapses, sessionStatistics } from '../analytics/advanced';
import { confusions, reviewAnalytics } from '../analytics/statistics';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';

const name = (code: string) => COUNTRIES[code]?.name || code;
const pct = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const num = (value: number | null) => value === null ? '—' : Math.round(value).toLocaleString();
const duration = (seconds: number) => seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h ${Math.round(seconds % 3600 / 60)}m`;

export function ReviewStatistics({ attempts, reviews }: { attempts: Attempt[]; reviews: ReviewRecord[] }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const data = reviewAnalytics(attempts, reviews);
  const learning = retentionAndLapses(attempts);
  const today = new Date().setHours(0, 0, 0, 0);
  const week = today - 6 * 86400000;
  const reviewAttempts = attempts.filter((item) => item.source === 'review');
  return <>
    <div className="metric-strip"><div><span>{t('Today')}</span><strong>{reviewAttempts.filter((item) => item.createdAt >= today).length}</strong></div><div><span>{t('7 days')}</span><strong>{reviewAttempts.filter((item) => item.createdAt >= week).length}</strong></div><div><span>{t('All time')}</span><strong>{data.completed}</strong></div><div><span>{t('Due')}</span><strong>{data.due}</strong></div><div><span>{t('Locations')}</span><strong>{data.locations}</strong></div><div><span>{t('Avg improvement')}</span><strong>{num(data.averageImprovement)}</strong><small>n={data.eligible}</small></div></div>
    <div className="stats-callouts"><span>{t('Improved')} <b>{data.improved}</b></span><span>{t('Country corrected')} <b>{data.corrected}</b></span>{Object.entries(data.gradeCounts).map(([grade, count]) => <span key={grade}>{t(grade)} <b>{count}</b></span>)}</div>
    <section><h3>{t('Retention')}</h3><div className="stats-callouts">{learning.retention.map((item) => <span key={item.days}>{item.days}d <b>{item.eligible >= 5 ? pct(item.rate) : t('Low sample')}</b><small> n={item.eligible}</small></span>)}</div></section>
    <section><h3>{t('Review improvement history')}</h3><div className="table-scroll"><table><thead><tr><th>{t('Date')}</th><th>{t('Country')}</th><th>{t('Before')}</th><th>{t('Review')}</th><th>{t('Score Δ')}</th><th>{t('Distance gain')}</th><th>{t('Time Δ')}</th></tr></thead><tbody>{data.improvements.slice().reverse().map((item) => <tr key={item.attempt.id}><td>{new Date(item.attempt.createdAt).toLocaleDateString()}</td><th><CountryFlag code={item.attempt.countryCode} />{name(item.attempt.countryCode)}</th><td>{item.original.score}</td><td>{item.attempt.score}</td><td>{item.score > 0 ? '+' : ''}{item.score}</td><td>{item.distance === null ? '—' : `${item.distance > 0 ? '+' : ''}${Math.round(item.distance)} km`}</td><td>{item.attempt.timeSpentSeconds - item.original.timeSpentSeconds}s</td></tr>)}</tbody></table></div></section>
    <div className="stats-ladders"><section className="stats-card"><h3>{t('Lapsed countries')}</h3>{learning.lapseCountries.slice(0, 12).map((item) => <div className="data-row" key={item.key}><span><CountryFlag code={item.key} />{name(item.key)}</span><b>{item.count}</b></div>)}{!learning.lapseCountries.length && <p className="empty">{t('No learned-to-wrong review transitions yet.')}</p>}</section><section className="stats-card"><h3>{t('Lapsed locations')}</h3>{learning.lapseLocations.slice(0, 12).map((item) => <div className="data-row" key={item.key}><span>{item.key.slice(0, 14)}…</span><b>{item.count}</b></div>)}{!learning.lapseLocations.length && <p className="empty">{t('No location lapses yet.')}</p>}</section></div>
  </>;
}

export function ConfusionStatistics({ attempts, onTrainCountries }: { attempts: Attempt[]; onTrainCountries: (codes: string[], name: string) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const country = confusions(attempts); const regions = regionConfusions(attempts);
  const list = (title: string, items: typeof country.directional, symbol: string) => <section className="stats-card"><h3>{t(title)}</h3>{items.slice(0, 25).map((item) => <button className="data-row" key={item.codes.join(':')} onClick={() => onTrainCountries(item.codes, t('Confusion drill'))}><span><CountryFlag code={item.codes[0]} />{name(item.codes[0])} {symbol} <CountryFlag code={item.codes[1]} />{name(item.codes[1])}</span><b>{item.count}</b></button>)}{!items.length && <p className="empty">{t('No resolved country confusions yet.')}</p>}</section>;
  return <><div className="stats-ladders">{list('Directional', country.directional, '→')}{list('Symmetric', country.symmetric, '↔')}</div><section className="stats-card"><h3>{t('Region confusions')}</h3>{regions.slice(0, 25).map((item) => <div className="data-row" key={item.pair}><span>{item.pair}</span><b>{item.count}</b></div>)}{!regions.length && <p className="empty">{t('No resolved region confusions yet.')}</p>}</section></>;
}

export function CoverageStatistics({ locations, visits, attempts, includeAssisted = false }: { locations: TrainerLocation[]; visits: StudyVisit[]; attempts: Attempt[]; includeAssisted?: boolean }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const seen = new Set(locations.map((item) => item.countryCode));
  const coverage = coverageByContinent(locations); const exposure = exposurePerformance(visits, attempts, includeAssisted);
  return <><div className="metric-strip"><div><span>{t('Supported')}</span><strong>{Object.keys(COUNTRIES).length}</strong></div><div><span>{t('Countries seen')}</span><strong>{seen.size}</strong></div><div><span>{t('Never seen')}</span><strong>{Object.keys(COUNTRIES).length - seen.size}</strong></div><div><span>{t('Unique panoramas')}</span><strong>{locations.length}</strong></div><div><span>{t('Coverage')}</span><strong>{pct(seen.size / Object.keys(COUNTRIES).length)}</strong></div></div>
    <section><h3>{t('Coverage by continent')}</h3><div className="table-scroll"><table><thead><tr><th>{t('Continent')}</th><th>{t('Seen')}</th><th>{t('Supported')}</th><th>{t('Coverage')}</th></tr></thead><tbody>{coverage.map((item) => <tr key={item.continent}><th>{item.continent}</th><td>{item.seen}</td><td>{item.supported}</td><td>{pct(item.seen / item.supported)}</td></tr>)}</tbody></table></div></section>
    <section><h3>{t('Study exposure vs Play performance')}</h3><p className="stats-note">{t('Descriptive only; exposure does not prove causation.')}</p><div className="table-scroll"><table><thead><tr><th>{t('Country')}</th><th>{t('Study scenes')}</th><th>{t('Study time')}</th><th>{t('Revealed')}</th><th>{t('Play')}</th><th>{t('Accuracy')}</th><th>{t('Sample')}</th></tr></thead><tbody>{exposure.map((item) => <tr key={item.code}><th><CountryFlag code={item.code} />{name(item.code)}</th><td>{item.exposures}</td><td>{duration(item.studySeconds)}</td><td>{item.revealed}</td><td>{item.played}</td><td>{pct(item.accuracy.rate)}</td><td>n={item.accuracy.eligible}</td></tr>)}</tbody></table></div></section>
  </>;
}

export function SessionStatistics({ sessions, attempts, visits, includeAssisted = false }: { sessions: TrainingSession[]; attempts: Attempt[]; visits: StudyVisit[]; includeAssisted?: boolean }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const data = sessionStatistics(sessions, attempts, visits, includeAssisted);
  return <><div className="metric-strip"><div><span>{t('Sessions')}</span><strong>{data.rows.length}</strong></div><div><span>{t('Total active')}</span><strong>{duration(data.rows.reduce((sum, item) => sum + item.activeTimeSeconds, 0))}</strong></div><div><span>{t('Longest')}</span><strong>{duration(Math.max(0, ...data.rows.map((item) => item.activeTimeSeconds)))}</strong></div><div><span>{t('Best eligible')}</span><strong>{data.bestAccuracy?.accuracy.eligible >= 10 ? pct(data.bestAccuracy.accuracy.rate) : '—'}</strong></div><div><span>{t('Most reviews')}</span><strong>{data.mostReviews?.reviews || 0}</strong></div><div><span>{t('Fastest ≥70%')}</span><strong>{data.fastestAccurate ? duration(data.fastestAccurate.activeTimeSeconds) : '—'}</strong></div></div>
    <div className="attempt-list">{data.rows.map((item) => <div className="attempt-row session-row" key={item.id}><span><strong>{new Date(item.startedAt).toLocaleDateString()}</strong><small>{duration(item.activeTimeSeconds)} · {item.countries} {t('countries')}</small></span><span>{item.study} {t('Study')} · {item.play} {t('Play')} · {item.reviews} {t('Review')}</span><strong>{pct(item.accuracy.rate)} <small>n={item.accuracy.eligible}</small></strong><span>{t('Avg score')} {num(item.averageScore)}</span></div>)}</div>
  </>;
}
