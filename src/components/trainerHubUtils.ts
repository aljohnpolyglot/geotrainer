import { useCallback } from "react";
import { COUNTRIES } from "../data/countries";
import { useLanguagePreferences } from "../services/useLanguagePreferences";
import { translate } from "../services/language";
import type { ClueRecord, LearnedMeta, NotebookNote } from "../types";
import type { CountryStats } from "./trainerHubTypes";

export const date = (value?: number) => (value ? new Date(value).toLocaleDateString() : "—");
export const countryName = (code: string) => COUNTRIES[code]?.name || code;
export const savedClueCount = (clues: ClueRecord[], notes: NotebookNote[], metas: LearnedMeta[]) => {
  const linked = new Set(notes.flatMap((note) => note.clueId ? [note.clueId] : []));
  return clues.filter((clue) => !linked.has(clue.id)).length + notes.length + metas.length;
};
export const pageBounds = (total: number, page: number, size = 20) => { const pages = Math.max(1, Math.ceil(total / size)); const current = Math.min(Math.max(1, page), pages); return { current, pages, start: (current - 1) * size, end: current * size }; };
export type CoverageSortKey = keyof Pick<CountryStats, "name" | "seen" | "played" | "reviewed" | "correct" | "wrong" | "accuracy" | "average" | "best" | "lastSeen" | "clues">;
export const sortCoverageCountries = (items: CountryStats[], key: CoverageSortKey, direction: 1 | -1) => [...items].sort((a, b) => {
  const left = a[key]; const right = b[key];
  return (typeof left === "string" ? left.localeCompare(String(right)) : Number(left) - Number(right)) * direction;
});
export function useHubTranslate() {
  const { ui } = useLanguagePreferences();
  return useCallback((key: string) => translate(ui, key), [ui]);
}
