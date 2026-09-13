import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { COUNTRIES } from "../data/countries";
import { isReviewDue, nextScheduledReviewAt, trainerDb } from "../data/trainerDb";
import { savedMetaLessonIds } from "../data/metaLessons";
import { meaningfulSessions } from "../analytics/advanced";
import { performanceAttempts } from "../analytics/statistics";
import type { Attempt, ClueRecord, Collection, GameRecord, LearnedMeta, NotebookNote, ReviewFilters, ReviewRecord, ReviewSessionKind, SchedulerPreferences, StudyVisit, TrainerLocation } from "../types";
import { StatisticsPanel } from "./StatisticsPanel";
import { CoveragePanel } from "./TrainerHubCoveragePanel";
import { HistoryPanel } from "./TrainerHubHistory";
import { ProgressPanel } from "./TrainerHubProgress";
import { ReviewPanel } from "./TrainerHubReview";
import { TrainerHubClues } from "./TrainerHubClues";
import type { HistoryKind, HubTab, StatisticsSection, TrainerHubProps } from "./trainerHubTypes";
import { countryName, useHubTranslate } from "./trainerHubUtils";

const dayStart = () => new Date().setHours(0, 0, 0, 0);

export type { HubTab } from "./trainerHubTypes";

export function TrainerHub({ collections, refreshKey, onReview, onOpen, onTrainCountries, onSelectGame, initialTab = "review", initialHistoryKind = "games", initialStatisticsSection = "overview", onViewStateChange }: TrainerHubProps) {
  const t = useHubTranslate();
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [locations, setLocations] = useState<TrainerLocation[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [visits, setVisits] = useState<StudyVisit[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [scheduler, setScheduler] = useState<SchedulerPreferences>();
  const [sessions, setSessions] = useState<Array<{ activeTimeSeconds: number; startedAt: number }>>([]);
  const [clues, setClues] = useState<ClueRecord[]>([]);
  const [learnedMetas, setLearnedMetas] = useState<LearnedMeta[]>([]);
  const [notebookNotes, setNotebookNotes] = useState<NotebookNote[]>([]);
  const [clueCountry, setClueCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReviewFilters>({ due: true });
  const [reviewCollection, setReviewCollection] = useState("all");
  const [queue, setQueue] = useState<Attempt[]>([]);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [historyKind, setHistoryKind] = useState<HistoryKind>(initialHistoryKind);
  const [statisticsSection, setStatisticsSection] = useState<StatisticsSection>(initialStatisticsSection);
  const restoredViewRef = useRef(false);

  const persistView = (next: { tab?: HubTab; historyKind?: HistoryKind; statisticsSection?: StatisticsSection }) => {
    const value = { tab: next.tab || tab, historyKind: next.historyKind || historyKind, statisticsSection: next.statisticsSection || statisticsSection };
    setTab(value.tab); setHistoryKind(value.historyKind); setStatisticsSection(value.statisticsSection); onViewStateChange?.(value);
    if (restoredViewRef.current) void trainerDb.setting<Record<string, unknown>>('workspace.panels').then((saved) => trainerDb.setSetting('workspace.panels', { ...saved, ...value }));
  };
  const [countryFilter, setCountryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [correctness, setCorrectness] = useState("all");

  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => {
    void trainerDb.setting<{ tab?: HubTab; historyKind?: HistoryKind; statisticsSection?: StatisticsSection }>('workspace.panels').then((saved) => {
      const tabs: HubTab[] = ["progress", "statistics", "review", "clues", "coverage", "history"];
      const histories: HistoryKind[] = ["games", "attempts", "study", "reviews"];
      const sections: StatisticsSection[] = ["overview", "geography", "progress", "reviews", "confusions", "coverage", "sessions", "locations", "history"];
      // A routed surface is explicit; only the generic hub entry restores its last tab.
      if (initialTab === "progress" && saved?.tab && tabs.includes(saved.tab)) setTab(saved.tab);
      if (saved?.historyKind && histories.includes(saved.historyKind)) setHistoryKind(saved.historyKind);
      if (saved?.statisticsSection && sections.includes(saved.statisticsSection)) setStatisticsSection(saved.statisticsSection);
      restoredViewRef.current = true;
    });
  }, []);
  const load = async () => {
    setLoading(true);
    const [nextLocations, nextAttempts, nextGames, nextVisits, nextReviews, nextSessions, nextClues, nextScheduler, nextMetas, nextNotes, savedOnlyMigrated] = await Promise.all([trainerDb.locations(), trainerDb.attempts(), trainerDb.games(), trainerDb.studyVisits(), trainerDb.reviews(), trainerDb.sessions(), trainerDb.clues(), trainerDb.schedulerPreferences(), trainerDb.setting<LearnedMeta[]>('meta.learned'), trainerDb.setting<NotebookNote[]>('notebook.notes'), trainerDb.setting<boolean>('meta.savedOnlyMigrated')]);
    const savedMetaIds = savedMetaLessonIds(nextAttempts);
    const visibleMetas = savedOnlyMigrated ? nextMetas || [] : (nextMetas || []).filter((meta) => savedMetaIds.has(meta.id));
    if (!savedOnlyMigrated) void Promise.all([trainerDb.setSetting('meta.learned', visibleMetas), trainerDb.setSetting('meta.savedOnlyMigrated', true)]);
    setLocations(nextLocations); setAttempts(nextAttempts); setGames(nextGames); setVisits(nextVisits); setReviews(nextReviews); setSessions(meaningfulSessions(nextSessions, nextAttempts, nextVisits)); setClues(nextClues); setScheduler(nextScheduler); setLearnedMetas(visibleMetas); setNotebookNotes(nextNotes || []); setLoading(false);
  };
  useEffect(() => { void load(); }, [refreshKey]);
  const effectiveFilters = useMemo(() => ({ ...filters, countryCodes: reviewCollection === "all" ? filters.countryCodes : collections.find((item) => item.id === reviewCollection)?.countryCodes }), [filters, reviewCollection, collections]);
  useEffect(() => { void trainerDb.reviewQueue(effectiveFilters).then(setQueue); }, [effectiveFilters, refreshKey]);
  const reviewCriterion = filters.wrongCountry ? "Wrong Country" : filters.bookmarked ? "Bookmarked" : filters.due ? "Due Today" : filters.recent ? "Recently Missed" : filters.minScore !== undefined || filters.maxScore !== undefined ? `Score ${filters.minScore ?? 0}–${filters.maxScore ?? 5000}` : "Review Queue";
  const reviewSource = [filters.environment && `${filters.environment[0].toUpperCase()}${filters.environment.slice(1)}`, reviewCriterion].filter(Boolean).join(" · ");
  const reviewKind: ReviewSessionKind = filters.due ? "due" : "practice";
  const dueCount = scheduler ? reviews.filter((review) => isReviewDue(review, Date.now(), scheduler)).length : 0;
  const nextDueAt = scheduler ? nextScheduledReviewAt(reviews, Date.now(), scheduler) : undefined;
  const startReview = (attempt: Attempt) => onReview(attempt, [attempt, ...queue.filter((item) => item.id !== attempt.id)], reviewSource, reviewKind);
  const gradedAttempts = useMemo(() => performanceAttempts(attempts, true, true), [attempts]);
  const today = dayStart();
  const todayVisits = visits.filter((item) => item.openedAt >= today);
  const todayAttempts = gradedAttempts.filter((item) => item.createdAt >= today);
  const reviewedPanos = new Set(reviews.map((item) => item.panoId));
  const correct = gradedAttempts.filter((item) => item.guessedCountryCode && item.guessedCountryCode === item.countryCode);
  const countryCodesSeen = new Set(locations.map((item) => item.countryCode));
  const allActive = sessions.reduce((sum, item) => sum + item.activeTimeSeconds, 0);
  const todayActive = sessions.filter((item) => item.startedAt >= today).reduce((sum, item) => sum + item.activeTimeSeconds, 0);
  const countries = useMemo(() => Object.keys(COUNTRIES).map((code) => {
    const seenLocations = locations.filter((item) => item.countryCode === code);
    const played = gradedAttempts.filter((item) => item.countryCode === code);
    const right = played.filter((item) => item.guessedCountryCode === code).length;
    return { code, name: countryName(code), seen: seenLocations.length, played: played.length, reviewed: new Set(played.filter((item) => reviewedPanos.has(item.panoId)).map((item) => item.panoId)).size, correct: right, wrong: played.length - right, accuracy: played.length ? right / played.length : 0, average: played.length ? played.reduce((sum, item) => sum + item.score, 0) / played.length : 0, best: Math.max(0, ...played.map((item) => item.score)), lastSeen: Math.max(0, ...seenLocations.map((item) => item.lastSeenAt)), clues: clues.filter((clue) => clue.countryCode === code).length };
  }), [locations, gradedAttempts, reviews, clues]);
  const weakCountries = countries.filter((item) => item.played).sort((a, b) => a.average - b.average).slice(0, 5);
  const unseen = countries.filter((item) => !item.seen);
  const confusions = useMemo(() => {
    const counts = new Map<string, number>();
    gradedAttempts.forEach((item) => { if (item.guessedCountryCode && item.guessedCountryCode !== item.countryCode) { const key = `${item.countryCode}:${item.guessedCountryCode}`; counts.set(key, (counts.get(key) || 0) + 1); } });
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, count]) => ({ codes: key.split(":"), count }));
  }, [gradedAttempts]);
  const filteredAttempts = gradedAttempts.filter((item) => (!countryFilter || item.countryCode === countryFilter) && (!collectionFilter || item.collectionId === collectionFilter) && (sourceFilter === "all" || item.source === sourceFilter) && (!dateFilter || item.createdAt >= new Date(`${dateFilter}T00:00:00`).getTime()) && (!minScore || item.score >= Number(minScore)) && (!maxDistance || (item.distanceKm !== null && item.distanceKm <= Number(maxDistance))) && (correctness === "all" || (correctness === "correct" ? item.guessedCountryCode === item.countryCode : !!item.guessedCountryCode && item.guessedCountryCode !== item.countryCode)));

  const historyPanel = <HistoryPanel historyKind={historyKind} setHistoryKind={(next) => persistView({ historyKind: next })} setCountryFilter={setCountryFilter} countryFilter={countryFilter} collectionFilter={collectionFilter} setCollectionFilter={setCollectionFilter} dateFilter={dateFilter} setDateFilter={setDateFilter} minScore={minScore} setMinScore={setMinScore} maxDistance={maxDistance} setMaxDistance={setMaxDistance} correctness={correctness} setCorrectness={setCorrectness} sourceFilter={sourceFilter} setSourceFilter={setSourceFilter} collections={collections} countries={countries} games={games} filteredAttempts={filteredAttempts} visits={visits} reviews={reviews} locations={locations} onOpen={onOpen} startReview={startReview} onSelectGame={onSelectGame} />;
  return <section className="trainer-hub">
  <header className="hub-header"><div><h1>{tab === "statistics" ? t("tabStatistics") : tab === "clues" ? t("Clues") : t("tabReview")}</h1><p>{tab === "statistics" ? t("tagline") : tab === "clues" ? t("Your saved visual clues, organized for study.") : t("dueDescription")}</p></div></header>
    {loading ? <div className="hub-loading"><RefreshCw className="spin" /> {t("loading")}</div> : <div className="hub-content">
      {tab === "progress" && <ProgressPanel todayVisits={todayVisits} todayAttempts={todayAttempts} todayActive={todayActive} allActive={allActive} locationsCount={locations.length} countryCount={countryCodesSeen.size} attempts={gradedAttempts} correctCount={correct.length} weakCountries={weakCountries} confusions={confusions} dueCount={reviews.filter((item) => item.dueAt <= Date.now()).length} setFilters={setFilters} setTab={(next) => persistView({ tab: next })} onTrainCountries={onTrainCountries} />}
      {tab === "statistics" && <StatisticsPanel attempts={attempts} visits={visits} locations={locations} reviews={reviews} sessions={sessions} collections={collections} onTrainCountries={onTrainCountries} initialSection={statisticsSection} onSectionChange={(next) => persistView({ statisticsSection: next })} locationsPanel={<CoveragePanel locations={locations} attempts={attempts} reviews={reviews} countries={countries} unseen={unseen} clues={clues} countryFilter={countryFilter} setCountryFilter={setCountryFilter} clueCountry={clueCountry} setClueCountry={setClueCountry} load={load} onOpen={onOpen} onReview={onReview} />} historyPanel={historyPanel} />}
      {tab === "review" && <ReviewPanel collections={collections} reviewCollection={reviewCollection} setReviewCollection={setReviewCollection} filters={filters} setFilters={setFilters} customMin={customMin} setCustomMin={setCustomMin} customMax={customMax} setCustomMax={setCustomMax} queue={queue} dueCount={dueCount} reviewCount={reviews.length} nextDueAt={nextDueAt} reviewTimeZone={scheduler?.reviewTimeZone} startReview={startReview} weakCountries={weakCountries} unseen={unseen} confusions={confusions} onTrainCountries={onTrainCountries} />}
      {tab === "clues" && <TrainerHubClues clues={clues} learnedMetas={learnedMetas} notebookNotes={notebookNotes} locations={locations} onDelete={(id) => { void trainerDb.deleteClue(id).then(load); }} onTrainCountries={onTrainCountries} />}
      {tab === "coverage" && <CoveragePanel locations={locations} attempts={attempts} reviews={reviews} countries={countries} unseen={unseen} clues={clues} countryFilter={countryFilter} setCountryFilter={setCountryFilter} clueCountry={clueCountry} setClueCountry={setClueCountry} load={load} onOpen={onOpen} onReview={onReview} />}
      {tab === "history" && historyPanel}
    </div>}
  </section>;
}
