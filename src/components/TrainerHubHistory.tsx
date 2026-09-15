import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarClock, History } from "lucide-react";
import { formatDistance } from "../services/gameLogic";
import type { HistoryPanelProps } from "./trainerHubTypes";
import { countryName, elapsed, pageBounds, timestamp, useHubTranslate } from "./trainerHubUtils";
import { CountryFlag } from "./CountryFlag";
import { CollectionOptions } from "./CollectionOptions";
import { useLanguagePreferences } from "../services/useLanguagePreferences";

export function HistoryPanel({ historyKind, setHistoryKind, countryFilter, setCountryFilter, collectionFilter, setCollectionFilter, dateFilter, setDateFilter, minScore, setMinScore, maxDistance, setMaxDistance, correctness, setCorrectness, sourceFilter, setSourceFilter, collections, countries, games, filteredAttempts, visits, clues, notebookNotes, reviews, locations, startReview, onSelectGame }: HistoryPanelProps) {
  const t = useHubTranslate();
  const { ui } = useLanguagePreferences();
  const [page, setPage] = useState(1);
  const streetViewUrl = (panoId: string) => `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(panoId)}`;
  const historyLabels = { games: t("games"), attempts: t("attemptsHistory"), study: t("study"), reviews: t("reviewsHistory") };
  const attemptsRows = filteredAttempts.slice().sort((a, b) => b.createdAt - a.createdAt);
  const studyRows = visits.filter((item) => !countryFilter || item.countryCode === countryFilter).slice().sort((a, b) => b.openedAt - a.openedAt);
  const chronologicalVisits = visits.slice().sort((a, b) => a.openedAt - b.openedAt);
  const visitAudit = (item: typeof visits[number]) => {
    const prior = chronologicalVisits.some((visit) => visit.openedAt < item.openedAt && visit.panoId === item.panoId);
    const end = item.closedAt || item.openedAt + Math.max(1, item.activeTimeSeconds) * 1000;
    const near = (at: number, panoId: string, countryCode: string) => (panoId === item.panoId || countryCode === item.countryCode) && at >= item.openedAt - 300_000 && at <= end + 300_000;
    const saved = clues.filter((clue) => clue.origin === 'personal' && near(clue.createdAt, clue.panoId, clue.countryCode)).length + notebookNotes.filter((note) => near(note.updatedAt, note.panoId, note.countryCode)).length;
    return { prior, saved };
  };
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
    {historyKind === "games" && <div className="attempt-list">{games.slice(paging.start, paging.end).map((game) => <button type="button" className="attempt-row" onClick={() => onSelectGame(game)} key={game.id}><span className="country-code"><History size={15} /></span><span><strong>{game.collectionName}</strong><small>{timestamp(game.createdAt, ui)} · {game.rounds.length} {t("rounds")}</small></span><span>{game.settings.canMove ? t("standard") : game.settings.canPan || game.settings.canZoom ? t("noMove") : t("nmpz")}</span><strong>{game.totalScore.toLocaleString()}</strong></button>)}</div>}
    {historyKind === "attempts" && <div className="attempt-list">{attemptsRows.slice(paging.start, paging.end).map((item) => <div className="attempt-row" key={item.id}><span className="country-code"><CountryFlag code={item.countryCode} /></span><span><strong>{countryName(item.countryCode)}</strong><small>{timestamp(item.createdAt, ui)} · {item.source === "play" ? t("play") : t("review")}{item.aiAssisted && <b className="history-ai-badge">{t("AI-assisted")}</b>}</small></span><span>{item.distanceKm === null ? t("noGuess") : formatDistance(item.distanceKm)}</span><strong>{item.score.toLocaleString()}</strong><div className="row-actions"><a className="icon-button" href={streetViewUrl(item.panoId)} target="_blank" rel="noreferrer" aria-label={t("openLocation")}><ArrowUpRight size={15} /></a><button className="review-location-button" onClick={() => startReview(item)}>{t("reviewThisLocation")}</button></div></div>)}</div>}
    {historyKind === "study" && <div className="attempt-list">{studyRows.slice(paging.start, paging.end).map((item) => { const audit = visitAudit(item); return <div className="attempt-row" key={item.id}><span className="country-code"><CountryFlag code={item.countryCode} /></span><span><strong>{countryName(item.countryCode)}</strong><small>{timestamp(item.openedAt, ui)} · {elapsed(item.activeTimeSeconds)} {t("active")}</small></span><span><strong>{t(audit.prior ? "Re-encounter" : "New card")}</strong><small>{audit.saved} {t("knownClues")}</small></span><span>{item.wasRevealed ? t("revealed") : t("immersion")}</span><a className="icon-button" href={streetViewUrl(item.panoId)} target="_blank" rel="noreferrer" aria-label={t("openLocation")}><ArrowUpRight size={15} /></a></div>; })}</div>}
    {historyKind === "reviews" && <div className="attempt-list">{reviewRows.slice(paging.start, paging.end).map((item) => { const code = locations.find((location) => location.id === item.panoId)?.countryCode || ""; return <div className="attempt-row" key={item.id}><span className="country-code">{code ? <CountryFlag code={code} /> : <CalendarClock size={15} />}</span><span><strong>{countryName(code)}</strong><small>{item.reviewCount} {t("review")} · {item.lapseCount} {t("lapses")}</small></span><span>{t("due")} {timestamp(item.dueAt, ui)}</span><strong>{Math.round(item.intervalDays * 10) / 10}d</strong></div>; })}</div>}
    {paging.pages > 1 && <nav className="clue-pagination" aria-label={historyLabels[historyKind]}><button type="button" disabled={paging.current === 1} onClick={() => setPage(paging.current - 1)}>{t("Previous")}</button><span aria-live="polite">{paging.current} / {paging.pages}</span><button type="button" disabled={paging.current === paging.pages} onClick={() => setPage(paging.current + 1)}>{t("Next")}</button></nav>}
  </>;
}
