import { useMemo, useState } from "react";
import type { Attempt, Collection, ReviewRecord, StudyVisit, TrainerLocation, TrainingSession } from "../types";
import { activeSeconds, beginnerSummary, breakdown, continentBreakdown, countryBalancedAccuracy, environmentOf, filterByRange, metrics, movementMode, performanceAttempts, rangeBounds, regionBreakdown, reviewAnalytics, rollingBest, sampleLabel, type RangeKey } from "../analytics/statistics";
import { ConfusionStatistics, CoverageStatistics, ReviewStatistics, SessionStatistics } from "./StatisticsLearning";
import { CountryStatistics } from "./StatisticsGeography";
import { StatisticsProgress } from "./StatisticsProgress";
type Section = "overview" | "geography" | "progress" | "reviews" | "confusions" | "coverage" | "sessions";
type Props = { attempts: Attempt[]; visits: StudyVisit[]; locations: TrainerLocation[]; reviews: ReviewRecord[]; sessions: TrainingSession[]; collections: Collection[]; onTrainCountries: (codes: string[], name: string) => void };
const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
const number = (value: number | null, digits = 0) => (value === null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: digits }));
const duration = (seconds: number) => (seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`);
const signedPp = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value * 100)} pp`;
const rangeLabels: Record<RangeKey, string> = { today: "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days", year: "This year", all: "All time", custom: "Custom" };
function Ladder({ title, value }: { title: string; value: ReturnType<typeof metrics> }) {
  return (
    <section className="stats-card ladder-card">
      <h3>{title}</h3>
      {(["continent", "region", "country"] as const).map((level) => (
        <div className="ladder-row" key={level}>
          <span>{level}</span>
          <strong>{percent(value.ladder[level].rate)}</strong>
          <small>
            n={value.ladder[level].eligible}
            {value.ladder[level].unknown ? ` · ${value.ladder[level].unknown} unknown` : ""}
          </small>
        </div>
      ))}
      <div className="stats-mini">
        <span>
          Avg score <b>{number(value.averageScore)}</b>
        </span>
        <span>
          Median distance <b>{number(value.medianDistance, 1)} km</b>
        </span>
        <span>
          Avg time <b>{number(value.averageTime, 1)}s</b>
        </span>
      </div>
    </section>
  );
}
function DataTable({ rows, kind }: { rows: ReturnType<typeof breakdown>; kind: string }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{kind}</th>
            <th>Attempts</th>
            <th>Country</th>
            <th>Region</th>
            <th>Continent</th>
            <th>Avg score</th>
            <th>Median km</th>
            <th>Avg time</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
                <span className={`sample ${row.attempts < 15 ? "low" : ""}`}>{sampleLabel(row.attempts)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function StatisticsPanel({ attempts, visits, locations, reviews, sessions, collections, onTrainCountries }: Props) {
  const [section, setSection] = useState<Section>("overview");
  const [range, setRange] = useState<RangeKey>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [environment, setEnvironment] = useState("");
  const [movement, setMovement] = useState("");
  const [collection, setCollection] = useState("");
  const bounds = rangeBounds(range, Date.now(), custom);
  const play = useMemo(() => performanceAttempts(attempts), [attempts]);
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
  return (
    <div className="statistics-panel">
      <div className="statistics-title">
        <div>
          <h2>Training progress</h2>
          <p>Canonical history only · AI-assisted Play excluded</p>
        </div>
        <nav>
          {(["overview", "geography", "progress", "reviews", "confusions", "coverage", "sessions"] as Section[]).map((item) => (
            <button className={section === item ? "active" : ""} onClick={() => setSection(item)} key={item}>
              {item}
            </button>
          ))}
        </nav>
      </div>
      <div className="filter-bar stats-filters">
        <label>
          Range
          <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>
            {Object.entries(rangeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {range === "custom" && (
          <>
            <label>
              From
              <input type="date" value={custom.from} onChange={(event) => setCustom({ ...custom, from: event.target.value })} />
            </label>
            <label>
              To
              <input type="date" value={custom.to} onChange={(event) => setCustom({ ...custom, to: event.target.value })} />
            </label>
          </>
        )}
        <label>
          Environment
          <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
            <option value="">All</option>
            <option value="urban">Urban</option>
            <option value="suburban">Suburban</option>
            <option value="rural">Rural</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label>
          Movement
          <select value={movement} onChange={(event) => setMovement(event.target.value)}>
            <option value="">All</option>
            <option>Standard</option>
            <option>No Move</option>
            <option>NMPZ</option>
          </select>
        </label>
        <label>
          Collection
          <select value={collection} onChange={(event) => setCollection(event.target.value)}>
            <option value="">All</option>
            {collections.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {section === "overview" && (
        <>
          <section className="stats-summary">
            <h3>Current pattern</h3>
            <ul>
              {beginnerSummary(ranged).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <div className="stats-ladders">
            <Ladder title="Last 30 days" value={thirty} />
            <Ladder title="All time" value={all} />
          </div>
          <div className="metric-strip">
            <div>
              <span>Today · study</span>
              <strong>{todayVisits.length}</strong>
            </div>
            <div>
              <span>Today · play</span>
              <strong>{todayPlay.length}</strong>
            </div>
            <div>
              <span>Reviews</span>
              <strong>{reviewsData.completed}</strong>
            </div>
            <div>
              <span>Active time</span>
              <strong>{duration(active)}</strong>
            </div>
            <div>
              <span>Country-balanced</span>
              <strong>{percent(balanced.rate)}</strong>
              <small>{balanced.countries} countries · min n=5</small>
            </div>
          </div>
          <div className="stats-callouts">
            <span>
              30-day country change <b>{thirty.ladder.country.rate === null || previousThirty.ladder.country.rate === null ? "—" : signedPp(thirty.ladder.country.rate - previousThirty.ladder.country.rate)}</b>
            </span>
            <span>
              Best rolling 20 <b>{percent(rollingBest(play, 20, (items) => metrics(items).ladder.country.rate))}</b>
            </span>
            <span>
              Best rolling 50 <b>{percent(rollingBest(play, 50, (items) => metrics(items).ladder.country.rate))}</b>
            </span>
          </div>
        </>
      )}
      {section === "geography" && (
        <>
          <h3>Continents</h3>
          <DataTable rows={continentBreakdown(ranged).sort((a, b) => (a.country.rate ?? 1) - (b.country.rate ?? 1))} kind="Continent" />
          <h3>Regions</h3>
          <DataTable rows={regionBreakdown(ranged).sort((a, b) => (a.country.rate ?? 1) - (b.country.rate ?? 1))} kind="Region" />
          <h3>Countries</h3>
          <CountryStatistics play={ranged} attempts={attempts} visits={visits} locations={locations} reviews={reviews} />
        </>
      )}
      {section === "progress" && <StatisticsProgress attempts={ranged} sessions={sessions} visits={visits} reviews={reviews} collections={collections} locations={locations} />}
      {section === "reviews" && <ReviewStatistics attempts={attempts} reviews={reviews} />}
      {section === "confusions" && <ConfusionStatistics attempts={ranged} onTrainCountries={onTrainCountries} />}
      {section === "coverage" && <CoverageStatistics locations={locations} visits={visits} attempts={attempts} />}
      {section === "sessions" && <SessionStatistics sessions={sessions} attempts={attempts} visits={visits} />}
      {!ranged.length && section !== "coverage" && section !== "sessions" && <p className="empty">No eligible non-assisted Play attempts match these filters.</p>}
    </div>
  );
}
