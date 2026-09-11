import { ClueGallery } from "./ClueGallery";
import { CoverageMap } from "./TrainerHubCoverage";
import type { CoveragePanelProps } from "./trainerHubTypes";
import { countryName, date, sortCoverageCountries, useHubTranslate, type CoverageSortKey } from "./trainerHubUtils";
import { trainerDb } from "../data/trainerDb";

export function CoveragePanel({ locations, attempts, reviews, countries, unseen, clues, countryFilter, setCountryFilter, clueCountry, setClueCountry, load, onOpen, onReview }: CoveragePanelProps) {
  const t = useHubTranslate();
  const [sort, setSort] = useState<{ key: CoverageSortKey; direction: 1 | -1 }>({ key: "name", direction: 1 });
  const rows = useMemo(() => sortCoverageCountries(countries.filter((item) => !countryFilter || item.code === countryFilter), sort.key, sort.direction), [countries, countryFilter, sort]);
  const header = (key: CoverageSortKey, label: string) => <th aria-sort={sort.key === key ? (sort.direction === 1 ? "ascending" : "descending") : "none"}><button type="button" className="sortable-heading" onClick={() => setSort((current) => ({ key, direction: current.key === key ? current.direction === 1 ? -1 : 1 : 1 }))}>{label}<span aria-hidden="true">{sort.key === key ? sort.direction === 1 ? " ↑" : " ↓" : " ↕"}</span></button></th>;
  return <>
    <div className="coverage-legend"><span className="study">{t("studyOnly")}</span><span className="correct">{t("correctPlay")}</span><span className="wrong">{t("incorrectPlay")}</span><span className="reviewed">{t("reviewedLegend")}</span></div>
    <CoverageMap locations={locations.filter((item) => !countryFilter || item.countryCode === countryFilter)} attempts={attempts} reviews={reviews} onOpen={onOpen} onReview={onReview} />
    <div className="table-tools"><label>{t("tableCountry")}<select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="">{t("allSupportedCountries")}</option>{countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label><span>{unseen.length} {t("neverSeenCount")}</span></div>
    <div className="table-scroll"><table><thead><tr>{header("name", t("tableCountry"))}{header("seen", t("seen"))}{header("played", t("played"))}{header("reviewed", t("reviewedCount"))}{header("correct", t("correct"))}{header("wrong", t("wrong"))}{header("accuracy", t("accuracyTable"))}{header("average", t("averageScoreTable"))}{header("best", t("bestTable"))}{header("lastSeen", t("lastSeen"))}{header("clues", t("knownClues"))}</tr></thead><tbody>
      {rows.map((item) => <tr key={item.code} className={!item.seen ? "never-seen" : ""} onClick={() => setCountryFilter(item.code)}><th>{item.name}</th><td>{item.seen || t("neverSeen")}</td><td>{item.played}</td><td>{item.reviewed}</td><td>{item.correct}</td><td>{item.wrong}</td><td>{Math.round(item.accuracy * 100)}%</td><td>{item.played ? Math.round(item.average).toLocaleString() : "—"}</td><td>{item.best || "—"}</td><td>{date(item.lastSeen)}</td><td>{item.clues ? <button className="table-link" onClick={(event) => { event.stopPropagation(); setClueCountry(item.code); }}>{item.clues}</button> : "—"}</td></tr>)}
    </tbody></table></div>
    {clueCountry && <ClueGallery country={countryName(clueCountry)} clues={clues.filter((item) => item.countryCode === clueCountry)} onClose={() => setClueCountry("")} onOpen={(clue) => { const saved = locations.find((item) => item.panoId === clue.panoId); if (saved) onOpen(saved); else if (clue.lat !== undefined && clue.lng !== undefined) onOpen({ id: `clue-location:${clue.id}`, panoId: clue.panoId, lat: clue.lat, lng: clue.lng, countryCode: clue.countryCode, firstSeenAt: clue.createdAt, lastSeenAt: clue.createdAt, encounterCount: 1 }); }} onDelete={(id) => void trainerDb.deleteClue(id).then(() => { if (clues.filter((item) => item.countryCode === clueCountry).length === 1) setClueCountry(""); return load(); })} />}
  </>;
}
import { useMemo, useState } from "react";
