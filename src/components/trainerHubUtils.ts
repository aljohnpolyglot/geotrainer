import { useCallback } from "react";
import { COUNTRIES } from "../data/countries";
import { useLanguagePreferences } from "../services/useLanguagePreferences";
import { translate } from "../services/language";
import type { Attempt, ClueRecord, CoachHistoryNote, LearnedMeta, NotebookNote, ReviewRecord, TrainerLocation } from "../types";
import type { CountryStats } from "./trainerHubTypes";

export const date = (value?: number) => (value ? new Date(value).toLocaleDateString() : "—");
export const timestamp = (value: number, locale: string) => new Date(value).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'medium' });
export const timestampRange = (start: number, end: number, locale: string) => `${timestamp(start, locale)} – ${timestamp(end, locale)}`;
export const countryName = (code: string) => COUNTRIES[code]?.name || code;
export const notebookClueLinks = (clues: ClueRecord[], notes: NotebookNote[]) => {
  const used = new Set<string>(); const links = new Map<NotebookNote, string>();
  notes.forEach((note) => {
    if (note.clueId && clues.some((clue) => clue.id === note.clueId)) { used.add(note.clueId); links.set(note, note.clueId); }
  });
  const candidates = notes.flatMap((note) => links.has(note) ? [] : clues.filter((clue) => !used.has(clue.id) && clue.origin === 'personal' && clue.panoId === note.panoId && Math.abs(clue.createdAt - note.updatedAt) <= 300_000).map((clue) => ({ note, clue, distance: Math.abs(clue.createdAt - note.updatedAt) }))).sort((a, b) => a.distance - b.distance);
  candidates.forEach(({ note, clue }) => { if (!links.has(note) && !used.has(clue.id)) { used.add(clue.id); links.set(note, clue.id); } });
  return links;
};
export const savedClueCount = (clues: ClueRecord[], notes: NotebookNote[], metas: LearnedMeta[], coachNotes: CoachHistoryNote[] = []) => {
  const linked = new Set([...notebookClueLinks(clues, notes).values(), ...coachNotes.flatMap((note) => note.clueId ? [note.clueId] : [])]);
  return clues.filter((clue) => !linked.has(clue.id)).length + notes.length + metas.length + coachNotes.length;
};
export const pageBounds = (total: number, page: number, size = 20) => { const pages = Math.max(1, Math.ceil(total / size)); const current = Math.min(Math.max(1, page), pages); return { current, pages, start: (current - 1) * size, end: current * size }; };
export type CoverageOverlay = "exposure" | "accuracy" | "score" | "weakness" | "due" | "mastery";

export function coverageCountryCounts(locations: TrainerLocation[]): Record<string, { panoramas: number; encounters: number }> {
  return locations.reduce<Record<string, { panoramas: number; encounters: number }>>((counts, item) => {
    const current = counts[item.countryCode] || { panoramas: 0, encounters: 0 };
    counts[item.countryCode] = { panoramas: current.panoramas + 1, encounters: current.encounters + item.encounterCount };
    return counts;
  }, {});
}
export const coverageCountryValues = (locations: TrainerLocation[], attempts: Attempt[], reviews: ReviewRecord[], overlay: CoverageOverlay, now = Date.now()) => {
  const panos = new Map(locations.map((item) => [item.id, item.countryCode]));
  const grouped = new Map<string, { locations: TrainerLocation[]; attempts: Attempt[]; reviews: ReviewRecord[] }>();
  locations.forEach((item) => grouped.set(item.countryCode, { locations: [...(grouped.get(item.countryCode)?.locations || []), item], attempts: grouped.get(item.countryCode)?.attempts || [], reviews: grouped.get(item.countryCode)?.reviews || [] }));
  attempts.forEach((item) => { const code = panos.get(item.panoId) || item.countryCode; const group = grouped.get(code); if (group) group.attempts.push(item); });
  reviews.forEach((item) => { const group = grouped.get(panos.get(item.panoId) || ""); if (group) group.reviews.push(item); });
  const raw = [...grouped].map(([code, group]) => {
    const eligible = group.attempts.filter((item) => item.guessedCountryCode);
    const accuracy = eligible.length ? eligible.filter((item) => item.guessedCountryCode === item.countryCode).length / eligible.length : null;
    const mastery = group.reviews.length ? group.reviews.reduce((sum, item) => sum + Math.min(1, Math.log2(item.intervalDays + 1) / 10) * Math.min(1, item.reviewCount / 20) * (1 - Math.min(.65, item.lapseCount / Math.max(1, item.reviewCount))), 0) / group.reviews.length : null;
    return [code, overlay === "exposure" ? group.locations.reduce((sum, item) => sum + item.encounterCount, 0) : overlay === "accuracy" ? accuracy : overlay === "score" ? (group.attempts.length ? group.attempts.reduce((sum, item) => sum + item.score, 0) / group.attempts.length / 5000 : null) : overlay === "weakness" ? (accuracy === null ? null : 1 - accuracy) : overlay === "due" ? group.reviews.filter((item) => item.dueAt <= now).length : mastery] as const;
  });
  const ceiling = Math.max(1, ...raw.map(([, value]) => value || 0));
  return Object.fromEntries(raw.map(([code, value]) => [code, value === null ? null : (overlay === "exposure" || overlay === "due") ? value / ceiling : value])) as Record<string, number | null>;
};
export type CoverageSortKey = keyof Pick<CountryStats, "name" | "seen" | "played" | "reviewed" | "correct" | "wrong" | "accuracy" | "average" | "best" | "lastSeen" | "clues">;
export const sortCoverageCountries = (items: CountryStats[], key: CoverageSortKey, direction: 1 | -1) => [...items].sort((a, b) => {
  const left = a[key]; const right = b[key];
  return (typeof left === "string" ? left.localeCompare(String(right)) : Number(left) - Number(right)) * direction;
});
export function useHubTranslate() {
  const { ui } = useLanguagePreferences();
  return useCallback((key: string) => translate(ui, key), [ui]);
}
