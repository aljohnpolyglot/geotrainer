import type { Dispatch, SetStateAction } from "react";
import type { Attempt, ClueRecord, Collection, GameRecord, NotebookNote, ReviewFilters, ReviewRecord, ReviewSessionKind, StudyVisit, TrainerLocation } from "../types";

export type HubTab = "progress" | "statistics" | "review" | "clues" | "coverage" | "history";
export type HistoryKind = "games" | "attempts" | "study" | "reviews";
export type StatisticsSection = "overview" | "geography" | "progress" | "reviews" | "confusions" | "coverage" | "sessions" | "locations" | "history";

export interface TrainerHubProps {
  collections: Collection[];
  refreshKey: number;
  onReview: (attempt: Attempt, queue?: Attempt[], sourceLabel?: string, kind?: ReviewSessionKind) => void;
  onOpen: (location: TrainerLocation) => void;
  onTrainCountries: (countryCodes: string[], name: string) => void;
  onDataChanged: () => void;
  onSelectGame: (game: GameRecord) => void;
  initialTab?: HubTab;
  initialHistoryKind?: HistoryKind;
  initialStatisticsSection?: StatisticsSection;
  onViewStateChange?: (value: { tab: HubTab; historyKind: HistoryKind; statisticsSection: StatisticsSection }) => void;
}

export interface CountryStats {
  code: string;
  name: string;
  seen: number;
  played: number;
  reviewed: number;
  correct: number;
  wrong: number;
  accuracy: number;
  average: number;
  best: number;
  lastSeen: number;
  clues: number;
}

export interface ReviewPanelProps {
  collections: Collection[];
  reviewCollection: string;
  setReviewCollection: (value: string) => void;
  filters: ReviewFilters;
  setFilters: Dispatch<SetStateAction<ReviewFilters>>;
  customMin: string;
  setCustomMin: (value: string) => void;
  customMax: string;
  setCustomMax: (value: string) => void;
  queue: Attempt[];
  dueCount?: number;
  nextDueAt?: number;
  reviewCount?: number;
  reviewTimeZone?: string;
  startReview: (attempt: Attempt) => void;
  weakCountries: CountryStats[];
  unseen: CountryStats[];
  confusions: Array<{ codes: string[]; count: number }>;
  onTrainCountries: (countryCodes: string[], name: string) => void;
}

export interface CoveragePanelProps {
  locations: TrainerLocation[];
  attempts: Attempt[];
  reviews: ReviewRecord[];
  countries: CountryStats[];
  unseen: CountryStats[];
  clues: ClueRecord[];
  countryFilter: string;
  setCountryFilter: (value: string) => void;
  clueCountry: string;
  setClueCountry: (value: string) => void;
  load: () => Promise<void>;
  onOpen: (location: TrainerLocation) => void;
}

export interface HistoryPanelProps {
  historyKind: HistoryKind;
  setHistoryKind: (value: HistoryKind) => void;
  countryFilter: string;
  setCountryFilter: (value: string) => void;
  collectionFilter: string;
  setCollectionFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  minScore: string;
  setMinScore: (value: string) => void;
  maxDistance: string;
  setMaxDistance: (value: string) => void;
  correctness: string;
  setCorrectness: (value: string) => void;
  sourceFilter: string;
  setSourceFilter: (value: string) => void;
  collections: Collection[];
  countries: CountryStats[];
  games: GameRecord[];
  filteredAttempts: Attempt[];
  visits: StudyVisit[];
  clues: ClueRecord[];
  notebookNotes: NotebookNote[];
  reviews: ReviewRecord[];
  locations: TrainerLocation[];
  onOpen: (location: TrainerLocation) => void;
  startReview: (attempt: Attempt) => void;
  onSelectGame: (game: GameRecord) => void;
}
