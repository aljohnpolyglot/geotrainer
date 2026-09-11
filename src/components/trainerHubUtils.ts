import { useCallback } from "react";
import { COUNTRIES } from "../data/countries";
import { useLanguagePreferences } from "../services/useLanguagePreferences";
import { translate } from "../services/language";
import type { CountryStats } from "./trainerHubTypes";

export const date = (value?: number) => (value ? new Date(value).toLocaleDateString() : "—");
export const countryName = (code: string) => COUNTRIES[code]?.name || code;
export type CoverageSortKey = keyof Pick<CountryStats, "name" | "seen" | "played" | "reviewed" | "correct" | "wrong" | "accuracy" | "average" | "best" | "lastSeen" | "clues">;
export const sortCoverageCountries = (items: CountryStats[], key: CoverageSortKey, direction: 1 | -1) => [...items].sort((a, b) => {
  const left = a[key]; const right = b[key];
  return (typeof left === "string" ? left.localeCompare(String(right)) : Number(left) - Number(right)) * direction;
});
export function useHubTranslate() {
  const { ui } = useLanguagePreferences();
  return useCallback((key: string) => translate(ui, key), [ui]);
}
