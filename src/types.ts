/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountrySeed {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  // Representative coordinates distributed across coverage zones
  samplePoints: Array<{ lat: number; lng: number }>;
}

export interface Collection {
  id: string;
  name: string;
  countryCodes: string[];
  isCustom?: boolean;
}

export interface LocationResult {
  countryCode: string;
  lat: number;
  lng: number;
  panoId: string;
  exactAddress?: string;
  locality?: string;
  adminArea?: string;
  isFallback?: boolean;
  isFallbackPanorama?: boolean;
  originalPanoId?: string;
  environment?: Environment;
  environmentRequested?: Environment;
  urbanLevel?: UrbanLevel;
  heading?: number;
  importedMapPointIndex?: number;
  importedMapProgress?: number;
  importedMapCompletedPointIndexes?: number[];
}

export interface BookmarkLocation {
  id: string;
  panoId: string;
  lat: number;
  lng: number;
  countryCode: string;
  countryName: string;
  savedAt: number;
  exactAddress?: string;
  locality?: string;
  adminArea?: string;
  note?: string;
}

export interface LocationGenerator {
  findRandomLocation(
    countryCodes: string[],
    signal?: AbortSignal,
    onStatusUpdate?: (status: string) => void,
    options?: EnvironmentSettings,
    context?: LocationRequestContext
  ): Promise<LocationResult>;
}

export interface LocationRequestContext {
  requestId?: number;
  collectionId?: string;
  excludedPanoIds?: ReadonlySet<string>;
  requireNavigation?: boolean;
  preferredCandidate?: { lat: number; lng: number; countryCode: string; minRadiusKm?: number; radiusKm?: number };
  preferredCountryCodes?: readonly string[];
  locationTargets?: LocationPoolTarget[];
  /** Test/diagnostic ceiling; normal generation retries until aborted. */
  maxAttempts?: number;
}

export type AppMode = 'study' | 'play' | 'review';
export type LearnSource = 'custom' | 'meta' | 'map' | 'uploaded';
export type ReviewSessionKind = 'practice' | 'due' | 'correction';
export type SupportedLanguage = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'sv';
export type CompassStyle = 'bar' | 'dial';
export type CoachStyle = 'quick' | 'meta' | 'elimination' | 'deep-geography' | 'memory' | 'pro-analyst';
export type ExplanationDepth = 'short' | 'normal' | 'deep';
export interface CoachPreferences { style: CoachStyle; depth: ExplanationDepth; askEveryTime: boolean; }
export type StreetViewState = { locationPanoId: string; panoId: string; heading: number; pitch: number; zoom: number };
export interface LanguagePreferences {
  ui: SupportedLanguage;
  game: SupportedLanguage;
  ai: SupportedLanguage;
}
export interface SchedulerPreferences {
  strictness: 'beginner' | 'balanced' | 'pro';
  newCardsPerDay: number;
  maximumReviewsPerDay: number;
  firstReviewDays: number;
  relearningMinutes: number;
  easyFirstIntervalDays: number;
  maximumIntervalDays: number;
  maximumAnswerSeconds: number;
  reviewOrder: 'due' | 'random';
  autoReviewScore: number;
  autoReviewWrongCountry: boolean;
  /** Optional migration-safe daily boundary settings. */
  reviewDayResetMinutes?: number;
  reviewTimeZone?: string;
  reviewTimeZoneAuto?: boolean;
  reviewViewVariationEnabled?: boolean;
  reviewViewVariationDifficulty?: number;
}
export type Environment = 'mixed' | 'urban' | 'suburban' | 'rural';
export type UrbanLevel = 1 | 2 | 3;
export type SamplingMode = 'natural' | 'balanced';
export type LearnPriority = 'random' | 'familiar' | 'least-exposure';
export type PanoramaSource = 'mixed' | 'official' | 'contributor';
export interface CityPoolCity { name: string; names?: Partial<Record<SupportedLanguage, string>>; lat: number; lng: number; population: number; class: 'major' | 'regional' | 'local'; urbanRadiusKm: number; }
export interface CityPoolRegion { id: string; name: string; names?: Partial<Record<SupportedLanguage, string>>; cities: CityPoolCity[]; }
export type LocationPoolTarget =
  | { kind: 'region'; countryCode: string; regionId: string; regionName: string }
  | { kind: 'city'; countryCode: string; regionId: string; regionName: string; city: CityPoolCity };
export type MapTypePreference = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
export type MapPalettePreference = 'auto' | 'light' | 'dark';
export type ResultMapZoomPreference = 'closest' | 'country' | 'region' | 'world';
export type CountryBorderWidth = 'thin' | 'standard' | 'bold';
export type CountryBorderColor = 'auto' | 'light' | 'dark' | 'accent';
export type MapGesturePreference = 'auto' | 'cooperative' | 'greedy';
export interface MapPreferences {
  showImageryDate: boolean;
  showRoadLabels: boolean;
  motionTracking: boolean;
  movementStyle: 'click' | 'arrows';
  mapType: MapTypePreference;
  mapPalette?: MapPalettePreference;
  resultMapZoom?: ResultMapZoomPreference;
  gestureHandling: MapGesturePreference;
  clickableIcons: boolean;
  showCountryBorders?: boolean;
  showRegionBorders?: boolean;
  countryBorderWidth?: CountryBorderWidth;
  countryBorderColor?: CountryBorderColor;
}
export interface EnvironmentSettings { environment: Environment; urbanLevel: UrbanLevel; samplingMode?: SamplingMode; panoramaSource?: PanoramaSource; allowContributors?: boolean; allowInteriors?: boolean; }

export interface GameSettings {
  roundCount: number;
  collectionId: string;
  importedMapId?: string;
  importedMapName?: string;
  countryCode?: string; // Optional single-country pool; omitted for saved-game compatibility
  countryCodes?: string[]; // Optional focused comparison pool; omitted for saved-game compatibility
  locationTargets?: LocationPoolTarget[]; // Optional regional/city pools; omitted for saved-game compatibility
  canMove: boolean; // Walking along roads
  canPan: boolean;  // 360 camera rotation
  canZoom: boolean; // Zoom in / out
  showCompass?: boolean; // Optional for backwards-compatible saved games
  aiCoachEnabled?: boolean; // Optional for backwards-compatible saved games
  environment?: Environment;
  urbanLevel?: UrbanLevel;
  samplingMode?: SamplingMode;
  panoramaSource?: PanoramaSource; // Optional for backwards-compatible saved games
  allowContributors?: boolean; // Optional for backwards-compatible saved games
  allowInteriors?: boolean; // Optional for backwards-compatible saved games
  timeLimitSeconds: number; // 0 = unlimited, or 30, 60, 90, 120, 180
}

export interface GameRound {
  roundNumber: number;
  location: LocationResult;
  guess: { lat: number; lng: number } | null;
  distanceKm: number | null;
  score: number;
  timeSpentSeconds: number;
  guessedCountryCode?: string;
  locality?: string;
  adminArea?: string;
  formattedAddress?: string;
}

export interface GameRecord {
  id: string;
  createdAt: number;
  collectionId: string;
  collectionName: string;
  settings: GameSettings;
  totalScore: number;
  maxPossibleScore: number;
  rounds: GameRound[];
}

export interface TrainerLocation extends LocationResult {
  id: string;
  firstSeenAt: number;
  lastSeenAt: number;
  encounterCount: number;
  isFallback?: boolean;
  originalPanoId?: string;
  imageDataUrl?: string;
}

export interface StudyVisit {
  id: string;
  panoId: string;
  lat: number;
  lng: number;
  countryCode: string;
  collectionId: string;
  openedAt: number;
  closedAt?: number;
  activeTimeSeconds: number;
  wasRevealed: boolean;
  bookmarked: boolean;
  country?: string;
  locality?: string;
  adminArea?: string;
  exactAddress?: string;
  environment?: Environment;
  environmentRequested?: Environment;
  urbanLevel?: UrbanLevel;
  samplingMode?: SamplingMode;
  coachUsed?: boolean;
  coachMode?: CoachMode;
  coachModel?: string;
  coachGeneratedAt?: number;
  coachAnalysis?: CoachAnalysis;
  learnSource?: LearnSource;
  metaLessonId?: string;
}

export interface Attempt {
  id: string;
  gameId: string;
  roundNumber: number;
  panoId: string;
  actualLat: number;
  actualLng: number;
  countryCode: string;
  guessedLat: number | null;
  guessedLng: number | null;
  guessedCountryCode?: string;
  distanceKm: number | null;
  score: number;
  timeSpentSeconds: number;
  collectionId: string;
  canMove: boolean;
  canPan: boolean;
  canZoom: boolean;
  showCompass?: boolean;
  environment?: Environment;
  environmentRequested?: Environment;
  urbanLevel?: UrbanLevel;
  samplingMode?: SamplingMode;
  createdAt: number;
  source: 'study' | 'play' | 'review';
  fallbackPanorama?: boolean;
  originalPanoId?: string;
  sourceAttemptId?: string;
  locationId?: string;
  reviewAttemptId?: string;
  grade?: ReviewGrade;
  reviewedAt?: number;
  previousDueAt?: number;
  nextDueAt?: number;
  intervalDays?: number;
  isFallbackPanorama?: boolean;
  coachUsed?: boolean;
  coachMode?: CoachMode;
  coachModel?: string;
  coachGeneratedAt?: number;
  coachAnalysis?: CoachAnalysis;
  aiAssisted?: boolean;
  learnSource?: LearnSource;
  metaLessonId?: string;
  heading?: number;
  shownPanoId?: string;
  shownLat?: number;
  shownLng?: number;
  shownHeading?: number;
  distanceFromAnchorM?: number;
  reviewViewKind?: 'original' | 'heading' | 'spatial';
  generalizationLevel?: number;
}

export interface MetaLesson {
  id: string;
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
  text: string;
  note?: string;
  imageUrl: string;
  temporallySensitive?: boolean;
}

export type CoachMode = 'hints' | 'analyze' | 'analyze360' | 'explain' | 'cards' | 'clue' | 'clue-safe';
export interface CoachAnalysis {
  style?: CoachStyle;
  depth?: ExplanationDepth;
  confidence: 'low' | 'medium' | 'high';
  region: string;
  locationEstimate?: { level: 'region' | 'city' | 'exact'; label: string; confidence: 'medium' | 'high'; basis: string[] };
  description?: string;
  regionalRead?: { label: string; confidence: 'low' | 'medium' | 'high'; reason: string };
  candidates: Array<{ countryCode: string; confidence: number; rationale?: string }>;
  strongClues: string[];
  weakClues: string[];
  contradictions?: string[];
  confusions: string[];
  nextThingsToInspect: string[];
  coreCard?: { front: string[]; backExplanation: string };
  extraCards: Array<{ category: string; front: string[]; back: string; clueStrength: number }>;
}

export interface ClueRecord {
  id: string;
  countryCode: string;
  panoId: string;
  lat?: number;
  lng?: number;
  createdAt: number;
  imageDataUrl: string;
  imagePath?: string;
  imageFingerprint?: string;
  model: string;
  analysis: CoachAnalysis;
  origin?: 'personal' | 'coach';
}

export interface LearnedMeta {
  id: string;
  countryCode: string;
  learnedAt: number;
}

export interface NotebookNote {
  id?: string;
  panoId: string;
  countryCode: string;
  text: string;
  category?: string;
  clueId?: string;
  updatedAt: number;
  deletedAt?: number;
}

export interface CoachHistoryNote {
  id: string;
  panoId: string;
  countryCode: string;
  mode: CoachMode;
  model: string;
  generatedAt: number;
  analysis: CoachAnalysis;
  clueId?: string;
  deletedAt?: number;
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewRecord {
  id: string;
  panoId: string;
  dueAt: number;
  intervalDays: number;
  gradingHistory: Array<{ grade: ReviewGrade; at: number }>;
  lapseCount: number;
  reviewCount: number;
  lastReviewedAt?: number;
  generalizationLevel?: number;
  generalizationUpdatedAt?: number;
}

export interface TrainingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  activeTimeSeconds: number;
}

export type ActiveWorkspace =
  | { mode: 'home' }
  | { mode: 'review'; surface?: 'review' | 'statistics' | 'clues' }
  | { mode: 'study'; location: LocationResult; learnSource?: LearnSource; metaLessonId?: string; countryCodes?: string[]; locationTargets?: LocationPoolTarget[]; importedMapId?: string; importedMapVariation?: number }
  | { mode: 'play'; gameId: string; settings: GameSettings; rounds: GameRound[]; currentRoundIndex: number; currentLocation: LocationResult | null; activeRoundResult: GameRound | null; timeRemaining: number | null; roundStartedAt: number; roundElapsedSeconds?: number };

export interface SettingRecord {
  key: string;
  value: unknown;
  updatedAt?: number;
}

export interface ReviewFilters {
  countryCodes?: string[];
  minScore?: number;
  maxScore?: number;
  wrongCountry?: boolean;
  recent?: boolean;
  recentDays?: number;
  neverReviewed?: boolean;
  bookmarked?: boolean;
  due?: boolean;
  environment?: Environment;
}
