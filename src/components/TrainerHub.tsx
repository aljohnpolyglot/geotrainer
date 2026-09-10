import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, CalendarClock, Database, Download, History, RefreshCw, Target, Upload, X } from "lucide-react";
import { COUNTRIES } from "../data/countries";
import { BUILT_IN_COLLECTIONS } from "../data/collections";
import { createBackup, importBackup, trainerDb, validateBackup } from "../data/trainerDb";
import type { Attempt, BookmarkLocation, ClueRecord, Collection, Environment, GameRecord, ReviewFilters, ReviewRecord, StudyVisit, TrainerLocation } from "../types";
import { formatDistance } from "../services/gameLogic";
import { StatisticsPanel } from "./StatisticsPanel";
import { ClueGallery } from "./ClueGallery";
export type HubTab = "progress" | "statistics" | "review" | "coverage" | "history" | "data";
type HistoryKind = "games" | "attempts" | "study" | "reviews";
interface TrainerHubProps {
  collections: Collection[];
  refreshKey: number;
  onReview: (attempt: Attempt, queue?: Attempt[], sourceLabel?: string) => void;
  onOpen: (location: TrainerLocation) => void;
  onTrainCountries: (countryCodes: string[], name: string) => void;
  onBookmark: (location: TrainerLocation) => void;
  onDataChanged: () => void;
  initialTab?: HubTab;
}
const dayStart = () => new Date().setHours(0, 0, 0, 0);
const date = (value?: number) => (value ? new Date(value).toLocaleDateString() : "—");
const countryName = (code: string) => COUNTRIES[code]?.name || code;
function CoverageMap({ locations, attempts, reviews, bookmarks, onOpen, onReview }: { locations: TrainerLocation[]; attempts: Attempt[]; reviews: ReviewRecord[]; bookmarks: BookmarkLocation[]; onOpen: (location: TrainerLocation) => void; onReview: (attempt: Attempt) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map>();
  const markers = useRef<google.maps.Marker[]>([]);
  const preview = useRef<google.maps.InfoWindow>();
  const [selected, setSelected] = useState<TrainerLocation>();
  const [overlay, setOverlay] = useState<"exposure" | "accuracy" | "score" | "weakness" | "due">("exposure");
  useEffect(() => {
    if (!element.current || typeof google === "undefined") return;
    map.current ||= new google.maps.Map(element.current, {
      center: { lat: 18, lng: 5 },
      zoom: 2,
      minZoom: 1,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    preview.current ||= new google.maps.InfoWindow({ disableAutoPan: true });
    const render = () => {
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
      const zoom = map.current?.getZoom() || 2;
      const cell = zoom < 4 ? 20 : zoom < 6 ? 5 : 0;
      const groups = new Map<string, TrainerLocation[]>();
      locations.forEach((location) => {
        const key = cell ? `${Math.round(location.lat / cell)},${Math.round(location.lng / cell)}` : location.id;
        groups.set(key, [...(groups.get(key) || []), location]);
      });
      groups.forEach((group) => {
        const location = group[0];
        const panoIds = new Set(group.map((item) => item.id));
        const locationAttempts = attempts.filter((item) => panoIds.has(item.panoId));
        const eligible = locationAttempts.filter((item) => item.guessedCountryCode);
        const accuracy = eligible.length ? eligible.filter((item) => item.guessedCountryCode === item.countryCode).length / eligible.length : null;
        const averageScore = locationAttempts.length ? locationAttempts.reduce((sum, item) => sum + item.score, 0) / locationAttempts.length : null;
        const due = reviews.some((item) => panoIds.has(item.panoId) && item.dueAt <= Date.now());
        const color = overlay === "due" ? (due ? "#ff6b5f" : "#586777") : overlay === "score" ? (averageScore === null ? "#586777" : averageScore >= 4000 ? "#68d5b0" : averageScore >= 2500 ? "#ffb000" : "#ff6b5f") : overlay === "accuracy" || overlay === "weakness" ? (accuracy === null ? "#586777" : accuracy >= .7 ? (overlay === "accuracy" ? "#68d5b0" : "#3d718d") : accuracy >= .4 ? "#ffb000" : (overlay === "accuracy" ? "#ff6b5f" : "#ef4c43")) : "#72b7d9";
        const position = {
          lat: group.reduce((sum, item) => sum + item.lat, 0) / group.length,
          lng: group.reduce((sum, item) => sum + item.lng, 0) / group.length,
        };
        const marker = new google.maps.Marker({
          map: map.current,
          position,
          label: group.length > 1 ? String(group.length) : undefined,
          title: [...new Set(group.map((item) => countryName(item.countryCode)))].slice(0, 5).join(", "),
          icon:
            group.length > 1
              ? undefined
              : {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: color,
                  fillOpacity: 1,
                  strokeColor: "#081018",
                  strokeWeight: 2,
                },
        });
        marker.addListener("mouseover", () => {
          const countries = [...new Set(group.map((item) => countryName(item.countryCode)))];
          const content = document.createElement("div");
          content.className = "map-cluster-preview";
          const metric = overlay === "exposure" ? `${group.reduce((sum, item) => sum + item.encounterCount, 0)} encounters` : overlay === "score" ? `avg ${averageScore === null ? "—" : Math.round(averageScore).toLocaleString()} pts` : overlay === "due" ? `${reviews.filter((item) => panoIds.has(item.panoId) && item.dueAt <= Date.now()).length} due` : `${accuracy === null ? "—" : Math.round(accuracy * 100) + "%"} accuracy`;
          content.textContent = `${group.length} panorama${group.length === 1 ? "" : "s"} · ${metric} · ${countries.slice(0, 4).join(", ")}${countries.length > 4 ? ` +${countries.length - 4}` : ""}`;
          preview.current?.setContent(content);
          preview.current?.open({ map: map.current, anchor: marker });
        });
        marker.addListener("mouseout", () => preview.current?.close());
        marker.addListener("click", () => {
          if (group.length === 1) return setSelected(location);
          const bounds = new google.maps.LatLngBounds();
          group.forEach((item) => bounds.extend({ lat: item.lat, lng: item.lng }));
          map.current?.fitBounds(bounds, 70);
          if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.current?.setZoom(Math.min(12, (map.current.getZoom() || 2) + 2));
        });
        markers.current.push(marker);
      });
    };
    render();
    const listener = map.current.addListener("idle", render);
    return () => {
      google.maps.event.removeListener(listener);
      markers.current.forEach((marker) => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markers.current = [];
    };
  }, [locations, attempts, reviews, overlay]);
  const selectedAttempts = selected ? attempts.filter((item) => item.panoId === selected.id) : [];
  const selectedReview = selected ? reviews.find((item) => item.panoId === selected.id) : undefined;
  return (
    <div className="coverage-map-wrap">
      <label className="coverage-map-overlay">Map layer<select value={overlay} onChange={(event) => setOverlay(event.target.value as typeof overlay)}><option value="exposure">Exposure</option><option value="accuracy">Accuracy</option><option value="score">Average score</option><option value="weakness">Weakness</option><option value="due">Reviews due</option></select></label>
      <div ref={element} className="coverage-map" aria-label="Map of encountered panoramas" />
      {selected && (
        <aside className="map-inspector">
          <button className="icon-button inspector-close" onClick={() => setSelected(undefined)} aria-label="Close location details">
            <X size={16} />
          </button>
          <strong>{countryName(selected.countryCode)}</strong>
          <span>
            {date(selected.firstSeenAt)} → {date(selected.lastSeenAt)}
          </span>
          <span>
            {selected.encounterCount} encounters · {selectedAttempts.length} attempts
          </span>
          <span>
            Best {Math.max(0, ...selectedAttempts.map((item) => item.score)).toLocaleString()} · Latest {selectedAttempts.at(-1)?.score.toLocaleString() || "—"}
          </span>
          <span>{selectedReview ? `Review due ${date(selectedReview.dueAt)}` : "Never reviewed"}</span>
          <span>{bookmarks.some((item) => item.panoId === selected.id) ? "Bookmarked" : "Not bookmarked"}</span>
          <div className="button-row">
            <button className="button secondary" onClick={() => onOpen(selected)}>
              Open location
            </button>
            {selectedAttempts[0] && (
              <button className="button primary" onClick={() => onReview(selectedAttempts[0])}>
                Review
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
export function TrainerHub({ collections, refreshKey, onReview, onOpen, onTrainCountries, onBookmark, onDataChanged, initialTab = "progress" }: TrainerHubProps) {
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [locations, setLocations] = useState<TrainerLocation[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [visits, setVisits] = useState<StudyVisit[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkLocation[]>([]);
  const [sessions, setSessions] = useState<Array<{ activeTimeSeconds: number; startedAt: number }>>([]);
  const [clues, setClues] = useState<ClueRecord[]>([]);
  const [clueCountry, setClueCountry] = useState("");
  const [lastExport, setLastExport] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<ReviewFilters>({ maxScore: 4000 });
  const [reviewCollection, setReviewCollection] = useState("all");
  const [queue, setQueue] = useState<Attempt[]>([]);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [historyKind, setHistoryKind] = useState<HistoryKind>("games");
  const [countryFilter, setCountryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [correctness, setCorrectness] = useState("all");
  useEffect(() => setTab(initialTab), [initialTab]);
  const load = async () => {
    setLoading(true);
    const [nextLocations, nextAttempts, nextGames, nextVisits, nextReviews, nextBookmarks, nextSessions, nextClues, exportAt] = await Promise.all([trainerDb.locations(), trainerDb.attempts(), trainerDb.games(), trainerDb.studyVisits(), trainerDb.reviews(), trainerDb.bookmarks(), trainerDb.sessions(), trainerDb.clues(), trainerDb.setting<string>("lastExportAt")]);
    setLocations(nextLocations);
    setAttempts(nextAttempts);
    setGames(nextGames);
    setVisits(nextVisits);
    setReviews(nextReviews);
    setBookmarks(nextBookmarks);
    setSessions(nextSessions);
    setClues(nextClues);
    setLastExport(exportAt);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, [refreshKey]);
  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      countryCodes: reviewCollection === "all" ? filters.countryCodes : collections.find((item) => item.id === reviewCollection)?.countryCodes,
    }),
    [filters, reviewCollection, collections],
  );
  useEffect(() => {
    void trainerDb.reviewQueue(effectiveFilters).then(setQueue);
  }, [effectiveFilters, refreshKey]);
  const reviewCriterion = filters.wrongCountry ? "Wrong Country" : filters.bookmarked ? "Bookmarked" : filters.due ? "Due Today" : filters.recent ? "Recently Missed" : filters.minScore !== undefined || filters.maxScore !== undefined ? `Score ${filters.minScore ?? 0}–${filters.maxScore ?? 5000}` : "Review Queue";
  const reviewSource = [filters.environment && `${filters.environment[0].toUpperCase()}${filters.environment.slice(1)}`, reviewCriterion].filter(Boolean).join(" · ");
  const startReview = (attempt: Attempt) => onReview(attempt, [attempt, ...queue.filter((item) => item.id !== attempt.id)], reviewSource);
  const today = dayStart();
  const todayVisits = visits.filter((item) => item.openedAt >= today);
  const todayAttempts = attempts.filter((item) => item.createdAt >= today);
  const reviewedPanos = new Set(reviews.map((item) => item.panoId));
  const correct = attempts.filter((item) => item.guessedCountryCode && item.guessedCountryCode === item.countryCode);
  const countryCodesSeen = new Set(locations.map((item) => item.countryCode));
  const allActive = sessions.reduce((sum, item) => sum + item.activeTimeSeconds, 0);
  const todayActive = sessions.filter((item) => item.startedAt >= today).reduce((sum, item) => sum + item.activeTimeSeconds, 0);
  const countries = useMemo(
    () =>
      Object.keys(COUNTRIES).map((code) => {
        const seenLocations = locations.filter((item) => item.countryCode === code);
        const played = attempts.filter((item) => item.countryCode === code);
        const right = played.filter((item) => item.guessedCountryCode === code).length;
        return {
          code,
          name: countryName(code),
          seen: seenLocations.length,
          played: played.length,
          reviewed: new Set(played.filter((item) => reviewedPanos.has(item.panoId)).map((item) => item.panoId)).size,
          correct: right,
          wrong: played.length - right,
          accuracy: played.length ? right / played.length : 0,
          average: played.length ? played.reduce((sum, item) => sum + item.score, 0) / played.length : 0,
          best: Math.max(0, ...played.map((item) => item.score)),
          lastSeen: Math.max(0, ...seenLocations.map((item) => item.lastSeenAt)),
          clues: clues.filter((clue) => clue.countryCode === code).length,
        };
      }),
    [locations, attempts, reviews, clues],
  );
  const weakCountries = countries
    .filter((item) => item.played)
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);
  const unseen = countries.filter((item) => !item.seen);
  const confusions = useMemo(() => {
    const counts = new Map<string, number>();
    attempts.forEach((item) => {
      if (item.guessedCountryCode && item.guessedCountryCode !== item.countryCode) {
        const key = `${item.countryCode}:${item.guessedCountryCode}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return [...counts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({ codes: key.split(":"), count }));
  }, [attempts]);
  const exportData = async () => {
    const backup = await createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `street-view-trainer-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setLastExport(backup.exportedAt);
    setMessage("Progress exported successfully.");
  };
  const importData = async (file: File, mode: "merge" | "replace") => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      validateBackup(parsed);
      if (mode === "replace" && !window.confirm("Replace all current trainer data with this backup? This cannot be undone.")) return;
      await importBackup(parsed, mode);
      await load();
      onDataChanged();
      setMessage(`Backup ${mode === "merge" ? "merged" : "restored"} successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed. Current data was not changed.");
    }
  };
  const filteredAttempts = attempts.filter((item) => (!countryFilter || item.countryCode === countryFilter) && (!collectionFilter || item.collectionId === collectionFilter) && (sourceFilter === "all" || item.source === sourceFilter) && (!dateFilter || item.createdAt >= new Date(`${dateFilter}T00:00:00`).getTime()) && (!minScore || item.score >= Number(minScore)) && (!maxDistance || (item.distanceKm !== null && item.distanceKm <= Number(maxDistance))) && (correctness === "all" || (correctness === "correct" ? item.guessedCountryCode === item.countryCode : item.guessedLat === null || (!!item.guessedCountryCode && item.guessedCountryCode !== item.countryCode))));
  const bookmarkedSet = new Set(bookmarks.map((item) => item.panoId));
  return (
    <section className="trainer-hub">
      <header className="hub-header">
        <div>
          <h1>Training log</h1>
          <p>Your encountered places, durable attempts, and next routes.</p>
        </div>
        <nav className="hub-tabs" aria-label="Training sections">
          {(["progress", "statistics", "review", "coverage", "history", "data"] as HubTab[]).map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>
      </header>
      {loading ? (
        <div className="hub-loading">
          <RefreshCw className="spin" /> Loading training log…
        </div>
      ) : (
        <div className="hub-content">
          {tab === "progress" && (
            <>
              <div className="metric-strip">
                <div>
                  <span>Today · locations</span>
                  <strong>{todayVisits.length}</strong>
                </div>
                <div>
                  <span>Today · play rounds</span>
                  <strong>{todayAttempts.filter((item) => item.source === "play").length}</strong>
                </div>
                <div>
                  <span>Today · reviews</span>
                  <strong>{todayAttempts.filter((item) => item.source === "review").length}</strong>
                </div>
                <div>
                  <span>Today · active study</span>
                  <strong>{Math.round(todayActive / 60)}m</strong>
                </div>
              </div>
              <div className="metric-strip all-time">
                <div>
                  <span>All time · locations</span>
                  <strong>{locations.length}</strong>
                </div>
                <div>
                  <span>Countries</span>
                  <strong>{countryCodesSeen.size}</strong>
                </div>
                <div>
                  <span>Attempts</span>
                  <strong>{attempts.length}</strong>
                </div>
                <div>
                  <span>Country accuracy</span>
                  <strong>{attempts.length ? Math.round((correct.length / attempts.length) * 100) : 0}%</strong>
                </div>
                <div>
                  <span>Average score</span>
                  <strong>{attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toLocaleString() : "—"}</strong>
                </div>
                <div>
                  <span>Active study</span>
                  <strong>{Math.round(allActive / 60)}m</strong>
                </div>
              </div>
              <div className="progress-columns">
                <section>
                  <h2>Weak countries</h2>
                  {weakCountries.length ? (
                    weakCountries.map((item) => (
                      <button className="data-row" key={item.code} onClick={() => onTrainCountries([item.code], `Weak · ${item.name}`)}>
                        <span>{item.name}</span>
                        <strong>{Math.round(item.average).toLocaleString()}</strong>
                      </button>
                    ))
                  ) : (
                    <p className="empty">Play a few rounds to reveal weak countries.</p>
                  )}
                </section>
                <section>
                  <h2>Common confusions</h2>
                  {confusions.length ? (
                    confusions.slice(0, 5).map((item) => (
                      <button className="data-row" key={item.codes.join(":")} onClick={() => onTrainCountries(item.codes, "Confusion drill")}>
                        <span>
                          {countryName(item.codes[0])} → {countryName(item.codes[1])}
                        </span>
                        <strong>{item.count}</strong>
                      </button>
                    ))
                  ) : (
                    <p className="empty">Country-resolved mistakes will appear here.</p>
                  )}
                </section>
                <section>
                  <h2>Reviews due</h2>
                  <button
                    className="data-row"
                    onClick={() => {
                      setFilters({ due: true });
                      setTab("review");
                    }}
                  >
                    <span>Ready now</span>
                    <strong>{reviews.filter((item) => item.dueAt <= Date.now()).length}</strong>
                  </button>
                </section>
              </div>
            </>
          )}
          {tab === "statistics" && <StatisticsPanel attempts={attempts} visits={visits} locations={locations} reviews={reviews} sessions={sessions} collections={collections} onTrainCountries={onTrainCountries} />}
          {tab === "review" && (
            <>
              <div className="filter-bar">
                <label>
                  Collection
                  <select value={reviewCollection} onChange={(e) => setReviewCollection(e.target.value)}>
                    <option value="all">All countries</option>
                    {collections.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Environment
                  <select
                    value={filters.environment || ""}
                    onChange={(e) =>
                      setFilters((filters) => ({
                        ...filters,
                        environment: (e.target.value || undefined) as Environment | undefined,
                      }))
                    }
                  >
                    <option value="">Any</option>
                    <option value="urban">Urban</option>
                    <option value="suburban">Suburban</option>
                    <option value="rural">Rural</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </label>
                <div className="preset-list" aria-label="Review criteria">
                  <button
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        wrongCountry: !f.wrongCountry,
                      }))
                    }
                    className={filters.wrongCountry ? "active" : ""}
                  >
                    Wrong country
                  </button>
                  {[4000, 3000, 2000, 1000].map((score) => (
                    <button
                      key={score}
                      className={filters.maxScore === score ? "active" : ""}
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          maxScore: f.maxScore === score ? undefined : score,
                        }))
                      }
                    >
                      Score &lt; {score}
                    </button>
                  ))}
                  <button onClick={() => setFilters((f) => ({ ...f, recent: !f.recent }))} className={filters.recent ? "active" : ""}>
                    Recently missed
                  </button>
                  <button
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        neverReviewed: !f.neverReviewed,
                      }))
                    }
                    className={filters.neverReviewed ? "active" : ""}
                  >
                    Never reviewed
                  </button>
                  <button onClick={() => setFilters((f) => ({ ...f, bookmarked: !f.bookmarked }))} className={filters.bookmarked ? "active" : ""}>
                    Bookmarked
                  </button>
                  <button onClick={() => setFilters((f) => ({ ...f, due: !f.due }))} className={filters.due ? "active" : ""}>
                    Due today
                  </button>
                  <span className="custom-score-range">
                    <input aria-label="Minimum review score" type="number" min="0" max="5000" placeholder="0" value={customMin} onChange={(e) => setCustomMin(e.target.value)} />
                    <span>–</span>
                    <input aria-label="Maximum review score" type="number" min="0" max="5000" placeholder="5000" value={customMax} onChange={(e) => setCustomMax(e.target.value)} />
                    <button
                      onClick={() =>
                        setFilters({
                          minScore: customMin ? Number(customMin) : undefined,
                          maxScore: customMax ? Number(customMax) : undefined,
                        })
                      }
                    >
                      Custom range
                    </button>
                  </span>
                </div>
              </div>
              <div className="queue-head">
                <div>
                  <h2>{queue.length} locations ready</h2>
                  <p>Criteria combine. The weakest matching panorama comes first.</p>
                </div>
                {queue[0] && (
                  <button className="button primary" onClick={() => startReview(queue[0])}>
                    <Target size={16} /> Start review
                  </button>
                )}
              </div>
              <div className="attempt-list">
                {queue.slice(0, 30).map((item) => (
                  <button className="attempt-row" key={item.id} onClick={() => startReview(item)}>
                    <span className="country-code">{item.countryCode}</span>
                    <span>
                      <strong>{countryName(item.countryCode)}</strong>
                      <small>
                        {date(item.createdAt)} · {item.source}
                      </small>
                    </span>
                    <span>{item.distanceKm === null ? "No guess" : formatDistance(item.distanceKm)}</span>
                    <strong>{item.score.toLocaleString()}</strong>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
                {!queue.length && <p className="empty">No attempts match this combination. Remove a criterion or play more rounds.</p>}
              </div>
              <section className="smart-collections">
                <h2>Smart training collections</h2>
                <div className="preset-list">
                  <button
                    onClick={() =>
                      onTrainCountries(
                        weakCountries.map((item) => item.code),
                        "Weak Countries",
                      )
                    }
                  >
                    Weak Countries
                  </button>
                  <button onClick={() => onTrainCountries([...new Set<string>(confusions.flatMap((item) => item.codes))], "Most Confused")}>Most Confused</button>
                  <button
                    onClick={() =>
                      onTrainCountries(
                        unseen.map((item) => item.code),
                        "Never Seen",
                      )
                    }
                  >
                    Never Seen
                  </button>
                  <button
                    onClick={() =>
                      onTrainCountries(
                        weakCountries.map((item) => item.code),
                        "Lowest Average Score",
                      )
                    }
                  >
                    Lowest Average Score
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ recent: true, maxScore: 4000 });
                    }}
                  >
                    Recent Mistakes
                  </button>
                  <button onClick={() => setFilters({ due: true })}>Due Reviews</button>
                </div>
              </section>
            </>
          )}
          {tab === "coverage" && (
            <>
              <div className="coverage-legend">
                <span className="study">Study only</span>
                <span className="correct">Correct play</span>
                <span className="wrong">Incorrect play</span>
                <span className="reviewed">Reviewed</span>
              </div>
              <CoverageMap locations={locations.filter((item) => !countryFilter || item.countryCode === countryFilter)} attempts={attempts} reviews={reviews} bookmarks={bookmarks} onOpen={onOpen} onReview={onReview} />
              <div className="table-tools">
                <label>
                  Country
                  <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                    <option value="">All supported countries</option>
                    {countries.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <span>{unseen.length} never seen</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Seen</th>
                      <th>Played</th>
                      <th>Reviewed</th>
                      <th>Correct</th>
                      <th>Wrong</th>
                      <th>Accuracy</th>
                      <th>Avg score</th>
                      <th>Best</th>
                      <th>Last seen</th>
                      <th>Known clues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countries
                      .filter((item) => !countryFilter || item.code === countryFilter)
                      .map((item) => (
                        <tr key={item.code} className={!item.seen ? "never-seen" : ""} onClick={() => setCountryFilter(item.code)}>
                          <th>{item.name}</th>
                          <td>{item.seen || "Never seen"}</td>
                          <td>{item.played}</td>
                          <td>{item.reviewed}</td>
                          <td>{item.correct}</td>
                          <td>{item.wrong}</td>
                          <td>{Math.round(item.accuracy * 100)}%</td>
                          <td>{item.played ? Math.round(item.average).toLocaleString() : "—"}</td>
                          <td>{item.best || "—"}</td>
                          <td>{date(item.lastSeen)}</td>
                          <td>{item.clues ? <button className="table-link" onClick={(event) => { event.stopPropagation(); setClueCountry(item.code); }}>{item.clues}</button> : "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {clueCountry && <ClueGallery country={countryName(clueCountry)} clues={clues.filter((item) => item.countryCode === clueCountry)} onClose={() => setClueCountry("")} onDelete={(id) => void trainerDb.deleteClue(id).then(() => { if (clues.filter((item) => item.countryCode === clueCountry).length === 1) setClueCountry(""); return load(); })} />}
            </>
          )}
          {tab === "history" && (
            <>
              <div className="history-switch">
                {(["games", "attempts", "study", "reviews"] as HistoryKind[]).map((item) => (
                  <button key={item} className={historyKind === item ? "active" : ""} onClick={() => setHistoryKind(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <div className="table-tools history-filters">
                <label>
                  Country
                  <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                    <option value="">All</option>
                    {countries.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {historyKind === "attempts" && (
                  <>
                    <label>
                      Collection
                      <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)}>
                        <option value="">All</option>
                        {collections.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      From
                      <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    </label>
                    <label>
                      Min score
                      <input type="number" min="0" max="5000" placeholder="0" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
                    </label>
                    <label>
                      Max km
                      <input type="number" min="0" placeholder="Any" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} />
                    </label>
                    <label>
                      Result
                      <select value={correctness} onChange={(e) => setCorrectness(e.target.value)}>
                        <option value="all">Correct + wrong</option>
                        <option value="correct">Correct</option>
                        <option value="wrong">Wrong</option>
                      </select>
                    </label>
                    <label>
                      Source
                      <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                        <option value="all">Play + review</option>
                        <option value="play">Play</option>
                        <option value="review">Review</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
              {historyKind === "games" && (
                <div className="attempt-list">
                  {games.map((game) => (
                    <div className="attempt-row" key={game.id}>
                      <span className="country-code">
                        <History size={15} />
                      </span>
                      <span>
                        <strong>{game.collectionName}</strong>
                        <small>
                          {date(game.createdAt)} · {game.rounds.length} rounds
                        </small>
                      </span>
                      <span>{game.settings.canMove ? "Standard" : game.settings.canPan || game.settings.canZoom ? "No Move" : "NMPZ"}</span>
                      <strong>{game.totalScore.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              )}
              {historyKind === "attempts" && (
                <div className="attempt-list">
                  {filteredAttempts
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((item) => {
                      const location = locations.find((loc) => loc.id === item.panoId);
                      return (
                        <div className="attempt-row" key={item.id}>
                          <span className="country-code">{item.countryCode}</span>
                          <span>
                            <strong>{countryName(item.countryCode)}</strong>
                            <small>
                              {date(item.createdAt)} · {item.source}
                            </small>
                          </span>
                          <span>{item.distanceKm === null ? "No guess" : formatDistance(item.distanceKm)}</span>
                          <strong>{item.score.toLocaleString()}</strong>
                          <div className="row-actions">
                            {location && (
                              <>
                                <button className="icon-button" onClick={() => onOpen(location)} aria-label="Open location">
                                  <ArrowUpRight size={15} />
                                </button>
                                <button className="icon-button" onClick={() => onBookmark(location)} aria-label="Bookmark">
                                  <Bookmark size={15} />
                                </button>
                              </>
                            )}
                            <button className="review-location-button" onClick={() => startReview(item)}>
                              Review This Location
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
              {historyKind === "study" && (
                <div className="attempt-list">
                  {visits
                    .filter((item) => !countryFilter || item.countryCode === countryFilter)
                    .sort((a, b) => b.openedAt - a.openedAt)
                    .map((item) => {
                      const location = locations.find((loc) => loc.id === item.panoId);
                      return (
                        <div className="attempt-row" key={item.id}>
                          <span className="country-code">{item.countryCode}</span>
                          <span>
                            <strong>{countryName(item.countryCode)}</strong>
                            <small>
                              {date(item.openedAt)} · {item.activeTimeSeconds}s active
                            </small>
                          </span>
                          <span>{item.wasRevealed ? "Revealed" : "Immersion"}</span>
                          {location && (
                            <>
                              <button className="icon-button" onClick={() => onBookmark(location)} aria-label="Bookmark">
                                <Bookmark size={15} />
                              </button>
                              <button className="icon-button" onClick={() => onOpen(location)} aria-label="Open">
                                <ArrowUpRight size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
              {historyKind === "reviews" && (
                <div className="attempt-list">
                  {reviews
                    .sort((a, b) => b.dueAt - a.dueAt)
                    .map((item) => (
                      <div className="attempt-row" key={item.id}>
                        <span className="country-code">
                          <CalendarClock size={15} />
                        </span>
                        <span>
                          <strong>{countryName(locations.find((loc) => loc.id === item.panoId)?.countryCode || "")}</strong>
                          <small>
                            {item.reviewCount} reviews · {item.lapseCount} lapses
                          </small>
                        </span>
                        <span>Due {date(item.dueAt)}</span>
                        <strong>{Math.round(item.intervalDays * 10) / 10}d</strong>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
          {tab === "data" && (
            <div className="data-panel">
              <Database size={28} />
              <div>
                <h2>Progress backup</h2>
                <p>One JSON file restores locations, attempts, games, study visits, reviews, bookmarks, collections, settings, and sessions.</p>
                <p className="export-status">Last export: {lastExport ? new Date(lastExport).toLocaleString() : "Never"}</p>
              </div>
              <div className="data-actions">
                <button className="button primary" onClick={() => void exportData()}>
                  <Download size={16} /> Export progress
                </button>
                <label className="button secondary">
                  <Upload size={16} /> Import · merge
                  <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && void importData(e.target.files[0], "merge")} />
                </label>
                <label className="button danger">
                  <Upload size={16} /> Import · replace
                  <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && void importData(e.target.files[0], "replace")} />
                </label>
              </div>
              {message && (
                <p className="data-message" role="status">
                  {message}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
