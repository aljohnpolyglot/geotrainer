import type { Attempt, ReviewRecord, ReviewFilters, StudyVisit } from "../types";
import type { CountryStats, HubTab } from "./trainerHubTypes";
import { countryName, useHubTranslate } from "./trainerHubUtils";
import { CountryFlag } from "./CountryFlag";

interface ProgressPanelProps {
  todayVisits: StudyVisit[];
  todayAttempts: Attempt[];
  todayActive: number;
  allActive: number;
  locationsCount: number;
  countryCount: number;
  attempts: Attempt[];
  correctCount: number;
  weakCountries: CountryStats[];
  confusions: Array<{ codes: string[]; count: number }>;
  dueCount: number;
  setFilters: (filters: ReviewFilters) => void;
  setTab: (tab: HubTab) => void;
  onTrainCountries: (countryCodes: string[], name: string) => void;
}

export function ProgressPanel({ todayVisits, todayAttempts, todayActive, allActive, locationsCount, countryCount, attempts, correctCount, weakCountries, confusions, dueCount, setFilters, setTab, onTrainCountries }: ProgressPanelProps) {
  const t = useHubTranslate();
  return <>
    <div className="metric-strip">
      <div><span>{t("todayLocations")}</span><strong>{todayVisits.length}</strong></div>
      <div><span>{t("todayPlayRounds")}</span><strong>{todayAttempts.filter((item) => item.source === "play").length}</strong></div>
      <div><span>{t("todayReviews")}</span><strong>{todayAttempts.filter((item) => item.source === "review").length}</strong></div>
      <div><span>{t("todayActiveStudy")}</span><strong>{Math.round(todayActive / 60)}m</strong></div>
    </div>
    <div className="metric-strip all-time">
      <div><span>{t("allTimeLocations")}</span><strong>{locationsCount}</strong></div>
      <div><span>{t("countries")}</span><strong>{countryCount}</strong></div>
      <div><span>{t("attempts")}</span><strong>{attempts.length}</strong></div>
      <div><span>{t("countryAccuracy")}</span><strong>{attempts.length ? Math.round((correctCount / attempts.length) * 100) : 0}%</strong></div>
      <div><span>{t("averageScore")}</span><strong>{attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length).toLocaleString() : "—"}</strong></div>
      <div><span>{t("activeStudy")}</span><strong>{Math.round(allActive / 60)}m</strong></div>
    </div>
    <div className="progress-columns">
      <section><h2>{t("weakCountries")}</h2>{weakCountries.length ? weakCountries.map((item) => <button className="data-row" key={item.code} onClick={() => onTrainCountries([item.code], `${t("weakCountries")} · ${item.name}`)}><span><CountryFlag code={item.code} />{item.name}</span><strong>{Math.round(item.average).toLocaleString()}</strong></button>) : <p className="empty">{t("playRoundsHint")}</p>}</section>
      <section><h2>{t("commonConfusions")}</h2>{confusions.length ? confusions.slice(0, 5).map((item) => <button className="data-row" key={item.codes.join(":")} onClick={() => onTrainCountries(item.codes, t("commonConfusions"))}><span><CountryFlag code={item.codes[0]} />{countryName(item.codes[0])} → <CountryFlag code={item.codes[1]} />{countryName(item.codes[1])}</span><strong>{item.count}</strong></button>) : <p className="empty">{t("mistakeHint")}</p>}</section>
      <section><h2>{t("reviewsDue")}</h2><button className="data-row" onClick={() => { setFilters({ due: true }); setTab("review"); }}><span>{t("readyNow")}</span><strong>{dueCount}</strong></button></section>
    </div>
  </>;
}
