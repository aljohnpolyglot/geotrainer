import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Attempt, ReviewRecord, TrainerLocation } from "../types";
import { countryName, date, useHubTranslate } from "./trainerHubUtils";
import { CountryFlag } from "./CountryFlag";
import { CoverageChoropleth } from "./CoverageChoropleth";
import type { CoverageOverlay } from "./trainerHubUtils";
import { mapPresentationOptions, useMapPreferences } from "../services/mapPreferences";

interface CoverageMapProps {
  locations: TrainerLocation[];
  attempts: Attempt[];
  reviews: ReviewRecord[];
  onOpen: (location: TrainerLocation) => void;
  onReview: (attempt: Attempt) => void;
}

export function CoverageMap({ locations, attempts, reviews, onOpen, onReview }: CoverageMapProps) {
  const t = useHubTranslate();
  const mapPreferences = useMapPreferences();
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map>();
  const markers = useRef<google.maps.Marker[]>([]);
  const preview = useRef<google.maps.InfoWindow>();
  const [selected, setSelected] = useState<TrainerLocation>();
  const [overlay, setOverlay] = useState<CoverageOverlay>("exposure");

  useEffect(() => {
    if (!element.current || typeof google === "undefined") return;
    map.current ||= new google.maps.Map(element.current, { center: { lat: 18, lng: 5 }, zoom: 2, minZoom: 1, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains("dark")) });
    map.current.setOptions(mapPresentationOptions(mapPreferences, document.documentElement.classList.contains("dark")));
    preview.current ||= new google.maps.InfoWindow({ disableAutoPan: true });
    const render = () => {
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
      const zoom = map.current?.getZoom() || 2;
      const cell = zoom < 4 ? 20 : zoom < 6 ? 5 : 0;
      const groups = new Map<string, TrainerLocation[]>();
      locations.forEach((location) => {
        const key = overlay === "mastery" && zoom < 4 ? `country:${location.countryCode}` : cell ? `${Math.round(location.lat / cell)},${Math.round(location.lng / cell)}` : location.id;
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
        const groupReviews = reviews.filter((item) => panoIds.has(item.panoId));
        const mastery = groupReviews.length ? groupReviews.reduce((sum, item) => sum + Math.min(1, Math.log2(item.intervalDays + 1) / 10) * Math.min(1, item.reviewCount / 20) * (1 - Math.min(.65, item.lapseCount / Math.max(1, item.reviewCount))), 0) / groupReviews.length : 0;
        const color = overlay === "mastery" ? (groupReviews.length ? `hsl(${220 - mastery * 172} 82% ${38 + mastery * 24}%)` : "#586777") : overlay === "due" ? (due ? "#ff6b5f" : "#586777") : overlay === "score" ? (averageScore === null ? "#586777" : averageScore >= 4000 ? "#68d5b0" : averageScore >= 2500 ? "#ffb000" : "#ff6b5f") : overlay === "accuracy" || overlay === "weakness" ? (accuracy === null ? "#586777" : accuracy >= .7 ? (overlay === "accuracy" ? "#68d5b0" : "#3d718d") : accuracy >= .4 ? "#ffb000" : (overlay === "accuracy" ? "#ff6b5f" : "#ef4c43")) : "#72b7d9";
        const position = { lat: group.reduce((sum, item) => sum + item.lat, 0) / group.length, lng: group.reduce((sum, item) => sum + item.lng, 0) / group.length };
        const marker = new google.maps.Marker({
          map: map.current,
          position,
          label: group.length > 1 ? String(group.length) : undefined,
          title: [...new Set(group.map((item) => countryName(item.countryCode)))].slice(0, 5).join(", "),
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: Math.min(18, 6 + Math.sqrt(group.length) * 2), fillColor: color, fillOpacity: .92, strokeColor: "#081018", strokeWeight: 2 },
        });
        marker.addListener("mouseover", () => {
          const countries = [...new Set(group.map((item) => countryName(item.countryCode)))];
          const content = document.createElement("div");
          content.className = "map-cluster-preview";
          const metric = overlay === "mastery" ? `${t("Mastery")}: ${groupReviews.length ? Math.round(mastery * 100) + "%" : "—"}` : overlay === "exposure" ? `${group.reduce((sum, item) => sum + item.encounterCount, 0)} ${t("encounters")}` : overlay === "score" ? `${t("averageScoreMap")}: ${averageScore === null ? "—" : Math.round(averageScore).toLocaleString()} pts` : overlay === "due" ? `${reviews.filter((item) => panoIds.has(item.panoId) && item.dueAt <= Date.now()).length} ${t("due")}` : `${accuracy === null ? "—" : Math.round(accuracy * 100) + "%"} ${t("accuracy")}`;
          const text = document.createElement("span"); text.textContent = `${group.length} ${group.length === 1 ? t("panorama") : t("panoramas")} · ${metric} · ${countries.slice(0, 4).join(", ")}${countries.length > 4 ? ` +${countries.length - 4}` : ""}`;
          if (location.imageDataUrl) { const image = document.createElement("img"); image.src = location.imageDataUrl; image.alt = ""; content.append(image); }
          content.append(text);
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
      markers.current.forEach((marker) => { google.maps.event.clearInstanceListeners(marker); marker.setMap(null); });
      markers.current = [];
    };
  }, [locations, attempts, reviews, overlay, t, mapPreferences]);

  useEffect(() => {
    if (!element.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width && entry.contentRect.height && map.current) google.maps.event.trigger(map.current, "resize");
    });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  const selectedAttempts = selected ? attempts.filter((item) => item.panoId === selected.id) : [];
  const selectedReview = selected ? reviews.find((item) => item.panoId === selected.id) : undefined;
  return <>
    <div className="coverage-map-wrap">
      <label className="coverage-map-overlay">{t("mapLayer")}<select value={overlay} onChange={(event) => setOverlay(event.target.value as typeof overlay)}><option value="exposure">{t("exposure")}</option><option value="mastery">{t("Mastery")}</option><option value="accuracy">{t("accuracy")}</option><option value="score">{t("averageScoreMap")}</option><option value="weakness">{t("weakness")}</option><option value="due">{t("reviewsDueMap")}</option></select></label>
      {overlay === "mastery" && <div className="coverage-mastery-legend" aria-label={`${t("Mastery")} 0–100%`}><span>0%</span><i /><span>100%</span></div>}
      <div ref={element} className="coverage-map" aria-label={t("mapAria")} />
      {selected && <aside className="map-inspector">
        <button className="icon-button inspector-close" onClick={() => setSelected(undefined)} aria-label={t("closeLocation")}><X size={16} /></button>
        <strong className="country-name"><CountryFlag code={selected.countryCode} />{countryName(selected.countryCode)}</strong>
        {selected.imageDataUrl && <img className="map-inspector-image" src={selected.imageDataUrl} alt="" />}
        <span>{date(selected.firstSeenAt)} → {date(selected.lastSeenAt)}</span>
        <span>{selected.encounterCount} {t("encounters")} · {selectedAttempts.length} {t("attemptsCount")}</span>
        <span>{t("best")} {Math.max(0, ...selectedAttempts.map((item) => item.score)).toLocaleString()} · {t("latest")} {selectedAttempts.at(-1)?.score.toLocaleString() || "—"}</span>
        <span>{selectedReview ? `${t("reviewDue")} ${date(selectedReview.dueAt)}` : t("neverReviewedMap")}</span>
        <div className="button-row"><button className="button secondary" onClick={() => onOpen(selected)}>{t("openLocation")}</button>{selectedAttempts[0] && <button className="button primary" onClick={() => onReview(selectedAttempts[0])}>{t("reviewAction")}</button>}</div>
      </aside>}
    </div>
    <CoverageChoropleth locations={locations} attempts={attempts} reviews={reviews} overlay={overlay} />
  </>;
}
