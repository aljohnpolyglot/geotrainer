import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarClock, History } from "lucide-react";
import { formatDistance } from "../services/gameLogic";
import type { HistoryPanelProps } from "./trainerHubTypes";
import { countryName, date, pageBounds, useHubTranslate } from "./trainerHubUtils";
import { CountryFlag } from "./CountryFlag";
import { CollectionOptions } from "./CollectionOptions";

export function HistoryPanel({ historyKind, setHistoryKind, countryFilter, setCountryFilter, collectionFilter, setCollectionFilter, dateFilter, setDateFilter, minScore, setMinScore, maxDistance, setMaxDistance, correctness, setCorrectness, sourceFilter, setSourceFilter, collections, countries, games, filteredAttempts, visits, reviews, locations, startReview, onSelectGame }: HistoryPanelProps) {
  const t = useHubTranslate();
  const [page, setPage] = useState(1);
  const streetViewUrl = (panoId: string) => `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(panoId)}`;
  const historyLabels = { games: t("games"), attempts: t("attemptsHistory"), study: t("study"), reviews: t("reviewsHistory") };
  const attemptsRows = filteredAttempts.slice().sort((a, b) => b.createdAt - a.createdAt);
  const studyRows = visits.filter((item) => !countryFilter || item.countryCode === countryFilter).slice().sort((a, b) => b.openedAt - a.openedAt);
  const reviewRows = reviews.slice().sort((a, b) => b.dueAt - a.dueAt);
  const total = historyKind === "games" ? games.length : historyKind === "attempts" ? attemptsRows.length : historyKind === "study" ? studyRows.length : reviewRows.length;
  const paging = pageBounds(total, page, 10);
  useEffect(() => setPage(1), [historyKind, countryFilter, collectionFilter, dateFilter, minScore, maxDistance, correctness, sourceFilter]);
  return <>
    <div className="history-switch">{(["games", "attempts", "study", "reviews"] as const).map((item) => <button key={item} className={historyKind === item ? "active" : ""} onClick={() => setHistoryKind(item)}>{historyLabels[item]}</button>)}</div>
    <div className="table-tools history-filters">
      <label>{t("tableCountry")}<select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="">{t("all")}</option>{countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      {historyKind === "attempts" && <>
        <label>{t("collectionFilter")}<select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}><CollectionOptions collections={collections} allLabel={t("all")} customLabel={t("Custom collections")} /></select></label>
        <label>{t("from")}<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
        <label>{t("minScore")}<input type="number" min="0" max="5000" placeholder="0" value={minScore} onChange={(event) => setMinScore(event.target.value)} /></label>
        <label>{t("maxKm")}<input type="number" min="0" placeholder={t("any")} value={maxDistance} onChange={(event) => setMaxDistance(event.target.value)} /></label>
        <label>{t("result")}<select value={correctness} onChange={(event) => setCorrectness(event.target.value)}><option value="all">{t("correctAndWrong")}</option><option value="correct">{t("correct")}</option><option value="wrong">{t("wrong")}</option></select></label>
        <label>{t("source")}<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">{t("playAndReview")}</option><option value="play">{t("play")}</option><option value="review">{t("review")}</option></select></label>
      </>}
    </div>
    {historyKind === "games" && <div className="attempt-list">{games.slice(paging.start, paging.end).map((game) => <button type="button" className="attempt-row" onClick={() => onSelectGame(game)} key={game.id}><span className="country-code"><History size={15} /></span><span><strong>{game.collectionName}</strong><small>{date(game.createdAt)} · {game.rounds.length} {t("rounds")}</small></span><span>{game.settings.canMove ? t("standard") : game.settings.canPan || game.settings.canZoom ? t("noMove") : t("nmpz")}</span><strong>{game.totalScore.toLocaleString()}</strong></button>)}</div>}
    {historyKind === "attempts" && <div className="attempt-list">{attemptsRows.slice(paging.start, paging.end).map((item) => { const location = locations.find((entry) => entry.id === item.panoId); return <div className="attempt-row" key={item.id}><span className="country-code"><CountryFlag code={item.countryCode} /></span><span><strong>{countryName(item.countryCode)}</strong><small>{date(item.createdAt)} · {item.source === "play" ? t("play") : t("review")}{item.aiAssisted && <b className="history-ai-badge">{t("AI-assisted")}</b>}</small></span><span>{item.distanceKm === null ? t("noGuess") : formatDistance(item.distanceKm)}</span><strong>{item.score.toLocaleString()}</strong><div className="row-actions">{location && <a className="icon-button" href={streetViewUrl(location.panoId)} target="_blank" rel="noreferrer" aria-label={t("openLocation")}><ArrowUpRight size={15} /></a>}<button className="review-location-button" onClick={() => startReview(item)}>{t("reviewThisLocation")}</button></div></div>; })}</div>}
    {historyKind === "study" && <div className="attempt-list">{studyRows.slice(paging.start, paging.end).map((item) => { const location = locations.find((entry) => entry.id === item.panoId); return <div className="attempt-row" key={item.id}><span className="country-code"><CountryFlag code={item.countryCode} /></span><span><strong>{countryName(item.countryCode)}</strong><small>{date(item.openedAt)} · {item.activeTimeSeconds}s {t("active")}</small></span><span>{item.wasRevealed ? t("revealed") : t("immersion")}</span>{location && <a className="icon-button" href={streetViewUrl(location.panoId)} target="_blank" rel="noreferrer" aria-label={t("openLocation")}><ArrowUpRight size={15} /></a>}</div>; })}</div>}
    {historyKind === "reviews" && <div className="attempt-list">{reviewRows.slice(paging.start, paging.end).map((item) => { const code = locations.find((location) => location.id === item.panoId)?.countryCode || ""; return <div className="attempt-row" key={item.id}><span className="country-code">{code ? <CountryFlag code={code} /> : <CalendarClock size={15} />}</span><span><strong>{countryName(code)}</strong><small>{item.reviewCount} {t("review")} · {item.lapseCount} {t("lapses")}</small></span><span>{t("due")} {date(item.dueAt)}</span><strong>{Math.round(item.intervalDays * 10) / 10}d</strong></div>; })}</div>}
    {paging.pages > 1 && <nav className="clue-pagination" aria-label={historyLabels[historyKind]}><button type="button" disabled={paging.current === 1} onClick={() => setPage(paging.current - 1)}>{t("Previous")}</button><span aria-live="polite">{paging.current} / {paging.pages}</span><button type="button" disabled={paging.current === paging.pages} onClick={() => setPage(paging.current + 1)}>{t("Next")}</button></nav>}
  </>;
}
