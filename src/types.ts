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
}

export type AppMode = 'study' | 'play' | 'review';
export type ReviewSessionKind = 'practice' | 'due' | 'correction';
export type SupportedLanguage = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'sv';
export type CompassStyle = 'bar' | 'dial';
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
  /** Optional migration-safe daily boundary settings. */
  reviewDayResetMinutes?: number;
  reviewTimeZone?: string;
  reviewTimeZoneAuto?: boolean;
}
export type Environment = 'mixed' | 'urban' | 'suburban' | 'rural';
export type UrbanLevel = 1 | 2 | 3;
export type SamplingMode = 'natural' | 'balanced';
export interface EnvironmentSettings { environment: Environment; urbanLevel: UrbanLevel; samplingMode?: SamplingMode; }

export interface GameSettings {
  roundCount: number;
  collectionId: string;
  canMove: boolean; // Walking along roads
  canPan: boolean;  // 360 camera rotation
  canZoom: boolean; // Zoom in / out
  showCompass?: boolean; // Optional for backwards-compatible saved games
  aiCoachEnabled?: boolean; // Optional for backwards-compatible saved games
  environment?: Environment;
  urbanLevel?: UrbanLevel;
  samplingMode?: SamplingMode;
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
}

export type CoachMode = 'hints' | 'analyze' | 'analyze360' | 'explain' | 'cards' | 'clue' | 'clue-safe';
export interface CoachAnalysis {
  confidence: 'low' | 'medium' | 'high';
  region: string;
  description?: string;
  candidates: Array<{ countryCode: string; confidence: number }>;
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
  model: string;
  analysis: CoachAnalysis;
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
}

export interface TrainingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  activeTimeSeconds: number;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface ReviewFilters {
  countryCodes?: string[];
  minScore?: number;
  maxScore?: number;
  wrongCountry?: boolean;
  recent?: boolean;
  neverReviewed?: boolean;
  bookmarked?: boolean;
  due?: boolean;
  environment?: Environment;
}
