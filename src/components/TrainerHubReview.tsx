import { ArrowUpRight, Target } from "lucide-react";
import type { Environment } from "../types";
import { formatDistance } from "../services/gameLogic";
import type { ReviewPanelProps } from "./trainerHubTypes";
import { countryName, date, useHubTranslate } from "./trainerHubUtils";
import { CountryFlag } from "./CountryFlag";
import { CollectionOptions } from "./CollectionOptions";
import { useLanguagePreferences } from "../services/useLanguagePreferences";

export function ReviewPanel({ collections, reviewCollection, setReviewCollection, filters, setFilters, customMin, setCustomMin, customMax, setCustomMax, queue, dueCount = 0, reviewCount = 0, nextDueAt, reviewTimeZone, startReview, weakCountries, unseen, confusions, onTrainCountries }: ReviewPanelProps) {
  const t = useHubTranslate();
  const { ui } = useLanguagePreferences();
  const nextDueLabel = nextDueAt ? new Date(nextDueAt).toLocaleString(ui, { dateStyle: 'medium', timeStyle: 'short', ...(reviewTimeZone ? { timeZone: reviewTimeZone } : {}) }) : '';
  const heldByDailyLimits = filters.due && reviewCollection === 'all' && !filters.environment ? Math.max(0, dueCount - queue.length) : 0;
  const dailyLimitReached = !queue.length && heldByDailyLimits > 0;
  const scorePreset = filters.minScore !== undefined || (filters.maxScore !== undefined && ![4000, 3000, 2000, 1000].includes(filters.maxScore)) ? 'custom' : filters.maxScore === undefined ? 'any' : String(filters.maxScore);
  return <>
    <section className="daily-review-block" aria-labelledby="daily-review-title">
      <div><span className="daily-review-kicker">{t("dueToday")}</span><h2 id="daily-review-title">{queue.length ? `${queue.length} ${t("locationsReady")}` : dailyLimitReached ? t("Daily review limit reached") : reviewCount ? t("dailyReviewsComplete") : t("noReviewsScheduled")}</h2><p>{queue.length ? `${t("dueDescription")}${heldByDailyLimits ? ` ${heldByDailyLimits} ${t("waitingBehindDailyLimits")}` : ''}` : heldByDailyLimits ? `${heldByDailyLimits} ${t("waitingBehindDailyLimits")}` : nextDueAt ? `${t("tryAgainAt")}: ${nextDueLabel}` : reviewCount ? t("dailyReviewsComplete") : t("noReviewsScheduled")}</p></div>
      <button className="button primary daily-review-action" disabled={!queue[0]} onClick={() => queue[0] && startReview(queue[0])}><Target size={20} /> {t("reviewAction")}</button>
    </section>
    <div className="filter-bar">
      <label>{t("collection")}<select value={reviewCollection} onChange={(event) => setReviewCollection(event.target.value)}><CollectionOptions collections={collections} allValue="all" allLabel={t("allCountries")} customLabel={t("Custom collections")} /></select></label>
      <label>{t("environment")}<select value={filters.environment || ""} onChange={(event) => setFilters((current) => ({ ...current, environment: (event.target.value || undefined) as Environment | undefined }))}><option value="">{t("any")}</option><option value="urban">{t("urban")}</option><option value="suburban">{t("suburban")}</option><option value="rural">{t("rural")}</option><option value="mixed">{t("mixed")}</option></select></label>
      <div className="preset-list" aria-label={t("review")}>
        <button onClick={() => setFilters({ due: true })} className={filters.due ? "active" : ""}>{t("dueToday")}</button>
        <button onClick={() => setFilters((current) => ({ ...current, due: false, wrongCountry: !current.wrongCountry }))} className={filters.wrongCountry ? "active" : ""}>{t("wrongCountry")}</button>
        <label className="score-preset"><span>{t("scoreBelow")}</span><select value={scorePreset} onChange={(event) => { const value = event.target.value; setFilters((current) => ({ ...current, due: false, minScore: value === 'custom' ? current.minScore : undefined, maxScore: value === 'any' || value === 'custom' ? (value === 'custom' ? current.maxScore : undefined) : Number(value) })); }}>{["any", 4000, 3000, 2000, 1000].map((score) => <option key={score} value={score}>{score === "any" ? t("any") : `${t("scoreBelow")} ${score}`}</option>)}<option value="custom">{t("customRange")}</option></select></label>
        <button onClick={() => setFilters((current) => ({ ...current, due: false, recent: !current.recent }))} className={filters.recent ? "active" : ""}>{t("recentlyMissed")}</button>
        <button onClick={() => setFilters((current) => ({ ...current, due: false, neverReviewed: !current.neverReviewed }))} className={filters.neverReviewed ? "active" : ""}>{t("neverReviewed")}</button>
        {scorePreset === "custom" && <span className="custom-score-range"><input aria-label={t("minReviewScore")} type="number" min="0" max="5000" placeholder="0" value={customMin} onChange={(event) => setCustomMin(event.target.value)} /><span>–</span><input aria-label={t("maxReviewScore")} type="number" min="0" max="5000" placeholder="5000" value={customMax} onChange={(event) => setCustomMax(event.target.value)} /><button onClick={() => setFilters({ minScore: customMin ? Number(customMin) : undefined, maxScore: customMax ? Number(customMax) : undefined })}>{t("customRange")}</button></span>}
      </div>
    </div>
    <div className="queue-head"><div><h2>{queue.length} {t("locationsReady")}</h2><p>{filters.due ? t("dueDescription") : t("customDescription")}</p></div>{queue[0] && <button className="button primary" onClick={() => startReview(queue[0])}><Target size={16} /> {t("reviewAction")}</button>}</div>
    <div className="attempt-list">{queue.slice(0, 30).map((item) => { const isNewCard = item.source === "study"; return <button className="attempt-row" key={item.id} onClick={() => startReview(item)}><span className="country-code"><CountryFlag code={item.countryCode} /></span><span><strong>{countryName(item.countryCode)}</strong><small>{date(item.createdAt)} · {isNewCard ? t("study") : item.source === "play" ? t("play") : t("review")}</small></span><span>{isNewCard ? t("New card") : item.distanceKm === null ? t("noGuess") : formatDistance(item.distanceKm)}</span><strong>{isNewCard ? "—" : item.score.toLocaleString()}</strong><ArrowUpRight size={15} /></button>; })}{!queue.length && <p className="empty">{filters.due ? (nextDueAt ? `${t(dailyLimitReached ? "Daily review limit reached" : "dailyReviewsComplete")} · ${t("tryAgainAt")}: ${nextDueLabel}` : reviewCount ? t(dailyLimitReached ? "Daily review limit reached" : "dailyReviewsComplete") : t("noReviewsScheduled")) : t("emptyQueue")}</p>}</div>
    <section className="smart-collections"><h2>{t("smartCollections")}</h2><p className="smart-collection-note">{t("smartCollectionDescription")}</p><div className="preset-list">
      <button onClick={() => onTrainCountries(weakCountries.map((item) => item.code), t("weakCountriesAction"))}>{t("weakCountriesAction")}</button>
      <button onClick={() => onTrainCountries([...new Set<string>(confusions.flatMap((item) => item.codes))], t("mostConfused"))}>{t("mostConfused")}</button>
      <button onClick={() => onTrainCountries(unseen.map((item) => item.code), t("neverSeen"))}>{t("neverSeen")}</button>
      <button onClick={() => onTrainCountries(weakCountries.map((item) => item.code), t("lowestAverage"))}>{t("lowestAverage")}</button>
      <button onClick={() => setFilters({ recent: true, maxScore: 4000 })}>{t("recentMistakes")}</button>
      <button onClick={() => setFilters({ due: true })}>{t("dueReviews")}</button>
    </div></section>
  </>;
}
