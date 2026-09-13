import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Attempt, Collection, ReviewRecord, StudyVisit, TrainerLocation, TrainingSession } from "../types";
import { activeSeconds, beginnerSummary, breakdown, continentBreakdown, countryBalancedAccuracy, environmentOf, filterByRange, metrics, movementMode, performanceAttempts, rangeBounds, regionBreakdown, reviewAnalytics, rollingBest, sampleLabel, type RangeKey } from "../analytics/statistics";
import { ConfusionStatistics, CoverageStatistics, ReviewStatistics, SessionStatistics } from "./StatisticsLearning";
import { CountryStatistics } from "./StatisticsGeography";
import { StatisticsProgress } from "./StatisticsProgress";
import { AnkiStatistics } from './AnkiStatistics';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { translate } from '../services/language';
import { sortRows, type SortDirection } from '../analytics/tableSorting';
import { trainerDb } from '../data/trainerDb';
import type { StatisticsSection } from './trainerHubTypes';
import { CollectionOptions } from './CollectionOptions';
type Props = { attempts: Attempt[]; visits: StudyVisit[]; locations: TrainerLocation[]; reviews: ReviewRecord[]; sessions: TrainingSession[]; collections: Collection[]; onTrainCountries: (codes: string[], name: string) => void; initialSection?: StatisticsSection; onSectionChange?: (section: StatisticsSection) => void; locationsPanel?: ReactNode; historyPanel?: ReactNode };
const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
const number = (value: number | null, digits = 0) => (value === null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: digits }));
const duration = (seconds: number) => (seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`);
const signedPp = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value * 100)} pp`;
const rangeLabels: Record<RangeKey, string> = { today: "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days", year: "This year", all: "All time", custom: "Custom" };
function Ladder({ title, value }: { title: string; value: ReturnType<typeof metrics> }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  return (
    <section className="stats-card ladder-card">
      <h3>{title}</h3>
      {(["continent", "region", "country"] as const).map((level) => (
        <div className="ladder-row" key={level}>
          <span>{t(level[0].toUpperCase() + level.slice(1))}</span>
          <strong>{percent(value.ladder[level].rate)}</strong>
          <small>
            n={value.ladder[level].eligible}
            {value.ladder[level].unknown ? ` · ${value.ladder[level].unknown} ${t('unknown')}` : ""}
          </small>
        </div>
      ))}
      <div className="stats-mini">
        <span>
          {t('Avg score')} <b>{number(value.averageScore)}</b>
        </span>
        <span>
          {t('Median km')} <b>{number(value.medianDistance, 1)} km</b>
        </span>
        <span>
          {t('Avg time')} <b>{number(value.averageTime, 1)}s</b>
        </span>
      </div>
    </section>
  );
}
type BreakdownSortKey = 'name' | 'attempts' | 'country' | 'region' | 'continent' | 'score' | 'distance' | 'time' | 'confidence';
function DataTable({ rows, kind }: { rows: ReturnType<typeof breakdown>; kind: 'Continent' | 'Region' }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [sortKey, setSortKey] = useState<BreakdownSortKey>('country');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const value = (row: ReturnType<typeof breakdown>[number]) => ({ name: row.key, attempts: row.attempts, country: row.country.rate, region: row.region.rate, continent: row.continent.rate, score: row.averageScore, distance: row.medianDistance, time: row.averageTime, confidence: row.attempts }[sortKey]);
  const sorted = sortRows(rows, value, sortDirection);
  const sortBy = (key: BreakdownSortKey) => { if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDirection('asc'); } };
  const header = (key: BreakdownSortKey, label: string) => <th aria-sort={sortKey === key ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className="sortable-heading" onClick={() => sortBy(key)} aria-label={`${t('Sort by')}: ${label}`}>{label}{sortKey === key ? ` ${sortDirection === 'asc' ? '↑' : '↓'}` : ''}</button></th>;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {header('name', t(kind))}
            {header('attempts', t('Attempts'))}
            {header('country', t('Country'))}
            {header('region', t('Region'))}
            {header('continent', t('Continent'))}
            {header('score', t('Avg score'))}
            {header('distance', t('Median km'))}
            {header('time', t('Avg time'))}
            {header('confidence', t('Confidence'))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.key}>
              <th>{row.key}</th>
              <td>{row.attempts}</td>
              <td>
                {percent(row.country.rate)}
                <small> n={row.country.eligible}</small>
              </td>
              <td>
                {percent(row.region.rate)}
                <small> n={row.region.eligible}</small>
              </td>
              <td>
                {percent(row.continent.rate)}
                <small> n={row.continent.eligible}</small>
              </td>
              <td>{number(row.averageScore)}</td>
              <td>{number(row.medianDistance, 1)}</td>
              <td>{number(row.averageTime, 1)}s</td>
              <td>
                <span className={`sample ${row.attempts < 15 ? "low" : ""}`}>{t(sampleLabel(row.attempts))}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function StatisticsPanel({ attempts, visits, locations, reviews, sessions, collections, onTrainCountries, initialSection = "overview", onSectionChange, locationsPanel, historyPanel }: Props) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [section, setSection] = useState<StatisticsSection>(initialSection);
  useEffect(() => setSection(initialSection), [initialSection]);
  const [range, setRange] = useState<RangeKey>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [environment, setEnvironment] = useState("");
  const [movement, setMovement] = useState("");
  const [collection, setCollection] = useState("");
  const [includeAiAssisted, setIncludeAiAssisted] = useState(true);
  useEffect(() => {
    let active = true;
    void trainerDb.setting<{ includeAiAssisted?: boolean }>('workspace.statistics').then((saved) => { if (active) setIncludeAiAssisted(saved?.includeAiAssisted !== false); });
    return () => { active = false; };
  }, []);
  const aiAssistedCount = useMemo(() => attempts.filter((item) => item.source === 'play' && item.aiAssisted === true).length, [attempts]);
  const updateIncludeAiAssisted = (value: boolean) => { setIncludeAiAssisted(value); void trainerDb.setSetting('workspace.statistics', { includeAiAssisted: value }); };
  const bounds = rangeBounds(range, Date.now(), custom);
  const play = useMemo(() => performanceAttempts(attempts, false, includeAiAssisted), [attempts, includeAiAssisted]);
  const ranged = useMemo(() => filterByRange<Attempt>(play, (item) => item.createdAt, bounds).filter((item) => (!environment || environmentOf(item) === environment) && (!movement || movementMode(item) === movement) && (!collection || item.collectionId === collection)), [play, bounds.from, bounds.to, environment, movement, collection]);
  const all = metrics(play);
  const thirtyBounds = rangeBounds("30d");
  const thirtyAttempts = filterByRange<Attempt>(play, (item) => item.createdAt, thirtyBounds);
  const thirty = metrics(thirtyAttempts);
  const previousThirty = metrics(play.filter((item) => item.createdAt >= thirtyBounds.from - 30 * 86400000 && item.createdAt < thirtyBounds.from));
  const reviewsData = reviewAnalytics(attempts, reviews);
  const balanced = countryBalancedAccuracy(ranged);
  const active = activeSeconds(sessions, bounds);
  const todayBounds = rangeBounds("today");
  const todayPlay = filterByRange<Attempt>(play, (item) => item.createdAt, todayBounds);
  const todayVisits = filterByRange<StudyVisit>(visits, (item) => item.openedAt, todayBounds);
  const modeStats = ['Standard', 'No Move', 'NMPZ'].map((mode) => {
    const items = ranged.filter((item) => movementMode(item) === mode);
    return { mode, count: items.length, average: items.length ? items.reduce((sum, item) => sum + item.score, 0) / items.length : null };
  });
  return (
    <div className="statistics-panel">
      <div className="statistics-title">
        <div>
          <h2>{t('Training progress')}</h2>
          <p>{t(includeAiAssisted ? 'Canonical history only · AI-assisted Play included' : 'Canonical history only · AI-assisted Play excluded')}</p>
        </div>
        <nav>
          {(["overview", "geography", "progress", "reviews", "confusions", "coverage", "sessions", "locations", "history"] as StatisticsSection[]).map((item) => (
            <button className={section === item ? "active" : ""} onClick={() => { setSection(item); onSectionChange?.(item); }} key={item}>
              {t(item[0].toUpperCase() + item.slice(1))}
            </button>
          ))}
        </nav>
      </div>
      <div className="filter-bar stats-filters">
        <label>
          {t('Range')}
          <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>
            {Object.entries(rangeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
        {range === "custom" && (
          <>
            <label>
              {t('From')}
              <input type="date" value={custom.from} onChange={(event) => setCustom({ ...custom, from: event.target.value })} />
            </label>
            <label>
              {t('To')}
              <input type="date" value={custom.to} onChange={(event) => setCustom({ ...custom, to: event.target.value })} />
            </label>
          </>
        )}
        <label>
          {t('Environment')}
          <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
            <option value="">{t('All')}</option>
            <option value="urban">{t('Urban')}</option>
            <option value="suburban">{t('Suburban')}</option>
            <option value="rural">{t('Rural')}</option>
            <option value="mixed">{t('Mixed')}</option>
          </select>
        </label>
        <label>
          {t('Movement')}
          <select value={movement} onChange={(event) => setMovement(event.target.value)}>
            <option value="">{t('All')}</option>
            <option>{t('Standard')}</option>
            <option>{t('No Move')}</option>
            <option>{t('NMPZ')}</option>
          </select>
        </label>
        <label>
          {t('Collection')}
          <select value={collection} onChange={(event) => setCollection(event.target.value)}>
            <CollectionOptions collections={collections} allLabel={t('All')} customLabel={t('Custom collections')} />
          </select>
        </label>
      </div>
      <div className="stats-ai-control">
        <div className="stats-ai-count"><strong>{aiAssistedCount}</strong><span>{t('AI-assisted Play rounds')}</span></div>
        <label className="stats-ai-toggle"><input type="checkbox" checked={includeAiAssisted} onChange={(event) => updateIncludeAiAssisted(event.target.checked)} />{t('Include AI-assisted Play')}</label>
      </div>
      {section === "overview" && (
        <>
          <section className="stats-summary">
            <h3>{t('Current pattern')}</h3>
            <ul>
              {beginnerSummary(ranged).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <div className="stats-ladders">
            <Ladder title={t('Last 30 days')} value={thirty} />
            <Ladder title={t('All time')} value={all} />
          </div>
          <div className="metric-strip">
            <div>
                <span>{t('Today · study')}</span>
              <strong>{todayVisits.length}</strong>
            </div>
            <div>
                <span>{t('Today · play')}</span>
              <strong>{todayPlay.length}</strong>
            </div>
            <div>
                <span>{t('Reviews')}</span>
              <strong>{reviewsData.completed}</strong>
            </div>
            <div>
                <span>{t('Active time')}</span>
              <strong>{duration(active)}</strong>
            </div>
            <div>
                <span>{t('Country-balanced')}</span>
              <strong>{percent(balanced.rate)}</strong>
              <small>{balanced.countries} countries · min n=5</small>
            </div>
          </div>
          <section>
            <h3>{t('Movement')}</h3>
            <div className="metric-strip">{modeStats.map((item) => <div key={item.mode}><span>{t(item.mode)}</span><strong>{item.count}</strong><small>{t('Avg score')}: {number(item.average)}</small></div>)}</div>
          </section>
          <div className="stats-callouts">
            <span>
              {t('30-day country change')} <b>{thirty.ladder.country.rate === null || previousThirty.ladder.country.rate === null ? "—" : signedPp(thirty.ladder.country.rate - previousThirty.ladder.country.rate)}</b>
            </span>
            <span>
              {t('Best rolling 20')} <b>{percent(rollingBest(play, 20, (items) => metrics(items).ladder.country.rate))}</b>
            </span>
            <span>
              {t('Best rolling 50')} <b>{percent(rollingBest(play, 50, (items) => metrics(items).ladder.country.rate))}</b>
            </span>
          </div>
        </>
      )}
      {section === "geography" && (
        <>
          <h3>{t('Continents')}</h3>
          <DataTable rows={continentBreakdown(ranged)} kind="Continent" />
          <h3>{t('Regions')}</h3>
          <DataTable rows={regionBreakdown(ranged)} kind="Region" />
          <h3>{t('Countries')}</h3>
          <CountryStatistics play={ranged} attempts={attempts} visits={visits} locations={locations} reviews={reviews} />
        </>
      )}
      {section === "progress" && <StatisticsProgress attempts={ranged} sessions={sessions} visits={visits} reviews={reviews} collections={collections} locations={locations} includeAssisted={includeAiAssisted} />}
      {section === "reviews" && <><ReviewStatistics attempts={attempts} reviews={reviews} /><AnkiStatistics attempts={attempts} reviews={reviews} visits={visits} locations={locations} /></>}
      {section === "confusions" && <ConfusionStatistics attempts={ranged} onTrainCountries={onTrainCountries} />}
      {section === "coverage" && <CoverageStatistics locations={locations} visits={visits} attempts={attempts} includeAssisted={includeAiAssisted} />}
      {section === "sessions" && <SessionStatistics sessions={sessions} attempts={attempts} visits={visits} includeAssisted={includeAiAssisted} />}
      {section === "locations" && locationsPanel}
      {section === "history" && historyPanel}
      {!ranged.length && !["coverage", "sessions", "locations", "history"].includes(section) && <p className="empty">{t(includeAiAssisted ? 'No eligible Play attempts match these filters.' : 'No eligible non-assisted Play attempts match these filters.')}</p>}
    </div>
  );
}
