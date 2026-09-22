import type {
  Attempt, BookmarkLocation, ClueRecord, Collection,
  GameRecord, GameSettings,
  LocationPoolTarget, LocationResult,
  ReviewFilters,
  ReviewGrade,
  ReviewRecord,
  ReviewSessionKind,
  SettingRecord,
  SchedulerPreferences,
  StudyVisit,
  TrainerLocation,
  TrainingSession,
} from '../types';
import { COUNTRIES } from './countries';
import { resolveClueImages } from '../services/clueImages';
import { nextReviewAt, nextReviewDayBoundary, reviewDayStart } from './reviewTiming';
import { coalesceNearbyReviews, nearbyReview } from './reviewIdentity';
import { DEFAULT_SCHEDULER_PREFERENCES, normalizeSchedulerPreferences, shuffleInPlace } from './reviewPreferences';
import { nextGeneralizationLevel } from './reviewVariation';
import { intervalsFor, reviewGradeForPerformance } from './reviewGrading';
import { clueImageFingerprint } from './clueDedup';
export { effectiveReviewDueAt, nextReviewAt, nextReviewDayBoundary, nextScheduledReviewAt, reviewDayStart } from './reviewTiming';
export { DEFAULT_SCHEDULER_PREFERENCES, normalizeSchedulerPreferences, shuffleInPlace } from './reviewPreferences';
export { gameMistakes, isCountryMistake, passingScoreFor, reviewGradeForCorrection, reviewGradeForPerformance, reviewGradeForScore } from './reviewGrading';
const DB_NAME = 'street-view-trainer';
const DB_VERSION = 3;
export const STORE_NAMES = [
  'locations', 'attempts', 'games', 'studyVisits', 'reviews',
  'bookmarks', 'collections', 'settings', 'sessions', 'clues',
] as const;
export type StoreName = (typeof STORE_NAMES)[number];
export type TrainerDbChange = { operation: string; allowsSavedContentDecrease?: boolean };
const changeListeners = new Set<(change: TrainerDbChange) => void>(); const notifyChange = (change: TrainerDbChange) => changeListeners.forEach((listener) => listener(change));
const validLocationTarget = (value: unknown): value is LocationPoolTarget => {
  if (!value || typeof value !== 'object') return false;
  const target = value as Partial<LocationPoolTarget> & { city?: Record<string, unknown> };
  if ((target.kind !== 'region' && target.kind !== 'city') || typeof target.countryCode !== 'string' || !(target.countryCode in COUNTRIES) || typeof target.regionId !== 'string' || typeof target.regionName !== 'string') return false;
  return target.kind === 'region' || !!target.city && typeof target.city.name === 'string' && Number.isFinite(target.city.lat) && Number.isFinite(target.city.lng) && Number.isFinite(target.city.population) && Number.isFinite(target.city.urbanRadiusKm) && ['major', 'regional', 'local'].includes(String(target.city.class));
};
export const normalizeLocationTargets = (value: unknown) => Array.isArray(value) ? value.filter(validLocationTarget) : [];
export const normalizeGamePreferences = (value: unknown, showCompass = true): GameSettings => {
  const source = value && typeof value === 'object' ? value as Partial<GameSettings> : {};
  const rounds = Number(source.roundCount);
  const countryCodes = Array.isArray(source.countryCodes) ? [...new Set(source.countryCodes.filter((code): code is string => typeof code === 'string' && code in COUNTRIES))] : [];
  const locationTargets = normalizeLocationTargets(source.locationTargets);
  const panoramaSource = source.panoramaSource === 'mixed' || source.panoramaSource === 'contributor' ? source.panoramaSource : source.allowContributors === true ? 'mixed' : 'official';
  return {
    roundCount: Number.isInteger(rounds) && rounds >= 1 && rounds <= 100 ? rounds : 5,
    collectionId: typeof source.collectionId === 'string' ? source.collectionId : 'world',
    ...(typeof source.importedMapId === 'string' ? { importedMapId: source.importedMapId } : {}),
    ...(typeof source.importedMapName === 'string' ? { importedMapName: source.importedMapName } : {}),
    ...(typeof source.countryCode === 'string' && source.countryCode in COUNTRIES ? { countryCode: source.countryCode } : {}),
    ...(countryCodes.length ? { countryCodes } : {}),
    ...(locationTargets.length ? { locationTargets } : {}),
    canMove: typeof source.canMove === 'boolean' ? source.canMove : true,
    canPan: typeof source.canPan === 'boolean' ? source.canPan : true,
    canZoom: typeof source.canZoom === 'boolean' ? source.canZoom : true,
    showCompass: typeof source.showCompass === 'boolean' ? source.showCompass : showCompass,
    aiCoachEnabled: typeof source.aiCoachEnabled === 'boolean' ? source.aiCoachEnabled : true,
    environment: source.environment === 'urban' || source.environment === 'suburban' || source.environment === 'rural' ? source.environment : 'mixed',
    urbanLevel: source.urbanLevel === 1 || source.urbanLevel === 2 ? source.urbanLevel : 3,
    samplingMode: source.samplingMode === 'balanced' ? 'balanced' : 'natural',
    panoramaSource,
    allowContributors: panoramaSource !== 'official',
    allowInteriors: source.allowInteriors === true,
    timeLimitSeconds: [0, 30, 60, 90, 120].includes(Number(source.timeLimitSeconds)) ? Number(source.timeLimitSeconds) : 0,
  };
};
export const isReviewDue = (review: ReviewRecord, now: number, preferences: SchedulerPreferences) => review.intervalDays < 1 ? review.dueAt <= now : reviewDayStart(review.dueAt, preferences) <= reviewDayStart(now, preferences);
export const shouldScheduleReview = (kind: ReviewSessionKind, review: ReviewRecord | undefined, now: number, preferences: SchedulerPreferences) => kind !== 'practice' || (!!review && isReviewDue(review, now, preferences));
export function reconcileReviewAttempt(review: ReviewRecord, attempt: Attempt, preferences: SchedulerPreferences): ReviewRecord {
  const at = attempt.reviewedAt || attempt.createdAt;
  if (attempt.source !== 'review' || (review.lastReviewedAt || 0) > at) return review;
  const grade = attempt.grade || reviewGradeForPerformance(attempt.score, attempt.timeSpentSeconds, attempt.guessedCountryCode === attempt.countryCode, preferences.maximumAnswerSeconds, preferences.strictness);
  const intervalDays = attempt.intervalDays ?? Math.min(preferences.maximumIntervalDays, intervalsFor(review.intervalDays, preferences)[grade]);
  if (review.lastReviewedAt === at) return attempt.nextDueAt !== undefined && (review.dueAt !== attempt.nextDueAt || review.intervalDays !== intervalDays) ? { ...review, dueAt: attempt.nextDueAt, intervalDays } : review;
  return { ...review, dueAt: attempt.nextDueAt ?? nextReviewAt(at, intervalDays, preferences), intervalDays, gradingHistory: [...(review.gradingHistory || []), { grade, at }], lapseCount: review.lapseCount + (grade === 'again' ? 1 : 0), reviewCount: review.reviewCount + 1, lastReviewedAt: at };
}
let database: Promise<IDBDatabase> | undefined;
let settingWrites = Promise.resolve();
const request = <T>(value: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
const complete = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Database transaction aborted'));
  });
function openDatabase(): Promise<IDBDatabase> {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, DB_VERSION);
    opening.onupgradeneeded = () => {
      const db = opening.result;
      const create = (name: StoreName, keyPath: string) =>
        db.objectStoreNames.contains(name) ? opening.transaction!.objectStore(name) : db.createObjectStore(name, { keyPath });
      const index = (store: IDBObjectStore, name: string, keyPath: string) => {
        if (!store.indexNames.contains(name)) store.createIndex(name, keyPath);
      };
      const locations = create('locations', 'id');
      const attempts = create('attempts', 'id');
      const games = create('games', 'id');
      const visits = create('studyVisits', 'id');
      const reviews = create('reviews', 'id');
      create('bookmarks', 'panoId');
      create('collections', 'id');
      create('settings', 'key');
      create('sessions', 'id');
      const clues = create('clues', 'id');
      index(locations, 'countryCode', 'countryCode');
      for (const [name, key] of [['panoId', 'panoId'], ['countryCode', 'countryCode'], ['createdAt', 'createdAt'], ['source', 'source'], ['collectionId', 'collectionId'], ['environmentRequested', 'environmentRequested'], ['gameId', 'gameId']]) index(attempts, name, key);
      index(games, 'createdAt', 'createdAt');
      for (const [name, key] of [['panoId', 'panoId'], ['openedAt', 'openedAt'], ['countryCode', 'countryCode'], ['collectionId', 'collectionId'], ['environmentRequested', 'environmentRequested']]) index(visits, name, key);
      index(reviews, 'dueAt', 'dueAt');
      index(clues, 'countryCode', 'countryCode');
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
    opening.onblocked = () => reject(new Error('Close other app tabs to upgrade the training database.'));
  });
  return database;
}
async function all<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return request(db.transaction(storeName).objectStore(storeName).getAll()) as Promise<T[]>;
}
async function get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase();
  return request(db.transaction(storeName).objectStore(storeName).get(key)) as Promise<T | undefined>;
}
async function put<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(value);
  await complete(tx);
  notifyChange({ operation: `put:${storeName}` });
}
async function remove(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  await complete(tx);
  notifyChange({ operation: `delete:${storeName}`, allowsSavedContentDecrease: true });
}

export function onTrainerDbChange(listener: (change: TrainerDbChange) => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

const readLegacyArray = <T>(key: string): T[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

async function migrateLocalStorageV1(): Promise<void> {
  if ((await get<SettingRecord>('settings', 'migration.localStorageV1.completed'))?.value) return;

  const games = readLegacyArray<GameRecord>('sv_game_history_v1');
  const bookmarks = readLegacyArray<BookmarkLocation>('sv_saved_bookmarks_v1');
  const collections = readLegacyArray<Collection>('sv_custom_collections_v1');
  const selectedCollection = localStorage.getItem('sv_last_selected_collection_id');
  const locations = new Map<string, TrainerLocation>();
  const attempts: Attempt[] = [];

  const encounter = (location: LocationResult, seenAt: number) => {
    const previous = locations.get(location.panoId);
    locations.set(location.panoId, previous ? {
      ...previous,
      lastSeenAt: Math.max(previous.lastSeenAt, seenAt),
      encounterCount: previous.encounterCount + 1,
    } : {
      ...location,
      id: location.panoId,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      encounterCount: 1,
    });
  };

  for (const bookmark of bookmarks) encounter(bookmark, bookmark.savedAt || Date.now());
  for (const game of games) {
    for (const round of game.rounds || []) {
      encounter(round.location, game.createdAt);
      attempts.push({
        id: `legacy:${game.id}:${round.roundNumber}`,
        gameId: game.id,
        roundNumber: round.roundNumber,
        panoId: round.location.panoId,
        actualLat: round.location.lat,
        actualLng: round.location.lng,
        countryCode: round.location.countryCode,
        guessedLat: round.guess?.lat ?? null,
        guessedLng: round.guess?.lng ?? null,
        distanceKm: round.distanceKm,
        score: round.score,
        timeSpentSeconds: round.timeSpentSeconds,
        collectionId: game.collectionId,
        canMove: game.settings.canMove,
        canPan: game.settings.canPan,
        canZoom: game.settings.canZoom,
        showCompass: game.settings.showCompass ?? true,
        environment: game.settings.environment ?? 'mixed',
        urbanLevel: game.settings.urbanLevel ?? 3,
        createdAt: game.createdAt + round.roundNumber,
        source: 'play',
      });
    }
  }

  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  const writeAll = (name: StoreName, values: unknown[]) => values.forEach((value) => tx.objectStore(name).put(value));
  writeAll('locations', [...locations.values()]);
  writeAll('attempts', attempts);
  writeAll('games', games);
  writeAll('bookmarks', bookmarks);
  writeAll('collections', collections.map((collection) => ({ ...collection, isCustom: true })));
  if (selectedCollection) tx.objectStore('settings').put({ key: 'selectedCollectionId', value: selectedCollection });
  tx.objectStore('settings').put({ key: 'migration.localStorageV1.completed', value: true });
  await complete(tx);
}

async function reconcileSavedReviews() {
  const [attempts, reviews, locations, storedPreferences] = await Promise.all([all<Attempt>('attempts'), all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), get<SettingRecord>('settings', 'schedulerPreferences')]);
  const preferences = normalizeSchedulerPreferences(storedPreferences?.value);
  const latest = new Map<string, Attempt>();
  attempts.filter((item) => item.source === 'review').forEach((item) => { if (!latest.get(item.panoId) || latest.get(item.panoId)!.createdAt < item.createdAt) latest.set(item.panoId, item); });
  const repaired = reviews.map((review) => reconcileReviewAttempt(review, latest.get(review.panoId) || {} as Attempt, preferences));
  const merged = coalesceNearbyReviews(repaired, locations, attempts).reviews;
  if (merged.length === reviews.length && !repaired.some((review, index) => review !== reviews[index])) return;
  const db = await openDatabase(); const tx = db.transaction('reviews', 'readwrite'); tx.objectStore('reviews').clear(); merged.forEach((review) => tx.objectStore('reviews').put(review));
  await complete(tx); notifyChange({ operation: 'reconcile:reviews' });
}

export async function initTrainerDb(): Promise<void> {
  await openDatabase();
  await migrateLocalStorageV1();
  await reconcileSavedReviews();
}

export const trainerDb = {
  locations: () => all<TrainerLocation>('locations'),
  attempts: () => all<Attempt>('attempts'),
  games: async () => (await all<GameRecord>('games')).sort((a, b) => b.createdAt - a.createdAt),
  studyVisits: () => all<StudyVisit>('studyVisits'),
  reviews: async () => {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<Attempt>('attempts')]);
    return coalesceNearbyReviews(reviews, locations, attempts).reviews;
  },
  bookmarks: async () => (await all<BookmarkLocation>('bookmarks')).sort((a, b) => b.savedAt - a.savedAt),
  collections: () => all<Collection>('collections'),
  sessions: () => all<TrainingSession>('sessions'),
  clues: async () => resolveClueImages((await all<ClueRecord>('clues')).sort((a, b) => b.createdAt - a.createdAt)),
  setting: async <T>(key: string) => (await get<SettingRecord>('settings', key))?.value as T | undefined,
  schedulerPreferences: async () => normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value),
  async reviewState(panoId: string): Promise<ReviewRecord | undefined> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<Attempt>('attempts')]);
    const target = locations.find((item) => item.panoId === panoId) || attempts.find((item) => item.panoId === panoId);
    return target ? nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, lat: 'actualLat' in target ? target.actualLat : target.lat, lng: 'actualLng' in target ? target.actualLng : target.lng, countryCode: target.countryCode }) : get<ReviewRecord>('reviews', panoId);
  },
  setSetting: (key: string, value: unknown) => {
    const write = settingWrites.then(async () => {
      const previous = await get<SettingRecord>('settings', key);
      if (!previous || JSON.stringify(previous.value) !== JSON.stringify(value)) await put('settings', { key, value, updatedAt: Date.now() });
    });
    settingWrites = write.catch(() => {});
    return write;
  },
  saveGame: (game: GameRecord) => put('games', game),
  deleteGame: (id: string) => remove('games', id),
  clearGames: async () => {
    const db = await openDatabase();
    const tx = db.transaction('games', 'readwrite');
    tx.objectStore('games').clear();
    await complete(tx);
    notifyChange({ operation: 'clear:games' });
  },
  saveAttempt: (attempt: Attempt) => put('attempts', attempt),
  saveVisit: (visit: StudyVisit) => put('studyVisits', visit),
  saveSession: (session: TrainingSession) => put('sessions', session),
  saveClue: (clue: ClueRecord) => put('clues', { ...clue, imageFingerprint: clue.imageFingerprint || clueImageFingerprint(clue.imageDataUrl) || undefined }),
  deleteClue: async (id: string) => {
    const deleted = (await get<SettingRecord>('settings', 'clues.deleted'))?.value as Array<{ id: string; deletedAt: number }> | undefined;
    await put('settings', { key: 'clues.deleted', value: [{ id, deletedAt: Date.now() }, ...(deleted || []).filter((item) => item.id !== id)], updatedAt: Date.now() });
    await remove('clues', id);
  },
  saveBookmark: (bookmark: BookmarkLocation) => put('bookmarks', bookmark),
  deleteBookmark: (panoId: string) => remove('bookmarks', panoId),
  saveCollection: (collection: Collection) => put('collections', { ...collection, isCustom: true }),
  deleteCollection: (id: string) => remove('collections', id),

  async encounter(location: LocationResult & { imageDataUrl?: string }, seenAt = Date.now()): Promise<TrainerLocation> {
    const previous = await get<TrainerLocation>('locations', location.panoId);
    const next: TrainerLocation = previous ? {
      ...previous,
      ...location,
      lastSeenAt: seenAt,
      encounterCount: previous.encounterCount + 1,
    } : {
      ...location,
      id: location.panoId,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      encounterCount: 1,
    };
    await put('locations', next);
    return next;
  },

  async saveLocationImage(panoId: string, imageDataUrl: string): Promise<void> {
    const location = await get<TrainerLocation>('locations', panoId);
    if (location) await put('locations', { ...location, imageDataUrl });
  },

  async reviewQueue(filters: ReviewFilters): Promise<Attempt[]> {
    await reconcileSavedReviews();
    const [attempts, storedReviews, locations, bookmarks, storedPreferences] = await Promise.all([
      all<Attempt>('attempts'), all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<BookmarkLocation>('bookmarks'), get<SettingRecord>('settings', 'schedulerPreferences'),
    ]);
    const { reviews, aliases } = coalesceNearbyReviews(storedReviews, locations, attempts);
    const preferences = normalizeSchedulerPreferences(storedPreferences?.value);
    const reviewByPano = new Map(reviews.map((item) => [item.panoId, item]));
    aliases.forEach((canonical, alias) => reviewByPano.set(alias, reviewByPano.get(canonical)!));
    attempts.forEach((attempt) => { if (!reviewByPano.has(attempt.panoId)) { const match = nearbyReview(reviews, locations, attempts, { panoId: attempt.panoId, lat: attempt.actualLat, lng: attempt.actualLng, countryCode: attempt.countryCode }); if (match) reviewByPano.set(attempt.panoId, match); } });
    const bookmarked = new Set(bookmarks.map((item) => item.panoId));
    const now = Date.now();
    const recentCutoff = now - (filters.recentDays || 30) * 864e5;
    const hasScoreFilter = filters.minScore !== undefined || filters.maxScore !== undefined;
    const queue = attempts
      .filter((attempt) => !filters.countryCodes?.length || filters.countryCodes.includes(attempt.countryCode))
      .filter((attempt) => !filters.environment || (attempt.environmentRequested ?? attempt.environment ?? 'mixed') === filters.environment)
      .filter((attempt) => {
        const scoreMatches = hasScoreFilter && attempt.source !== 'study' && (filters.minScore === undefined || attempt.score >= filters.minScore) && (filters.maxScore === undefined || attempt.score < filters.maxScore);
        const countryMatches = !!filters.wrongCountry && !!attempt.guessedCountryCode && attempt.guessedCountryCode !== attempt.countryCode;
        return (!hasScoreFilter && !filters.wrongCountry) || scoreMatches || countryMatches;
      })
      .filter((attempt) => (!filters.recent || (attempt.source !== 'study' && attempt.createdAt >= recentCutoff && attempt.score < 4000)) && (!filters.recentDays || attempt.createdAt >= recentCutoff))
      .filter((attempt) => !filters.neverReviewed || !reviewByPano.has(attempt.panoId))
      .filter((attempt) => !filters.bookmarked || bookmarked.has(attempt.panoId))
      .filter((attempt) => !filters.due || (!!reviewByPano.get(attempt.panoId) && isReviewDue(reviewByPano.get(attempt.panoId)!, now, preferences)))
      .sort((a, b) => filters.due
        ? (reviewByPano.get(a.panoId)?.dueAt || 0) - (reviewByPano.get(b.panoId)?.dueAt || 0)
        : a.score - b.score || b.createdAt - a.createdAt)
      .filter((attempt, index, values) => values.findIndex((other) => (reviewByPano.get(other.panoId)?.panoId || other.panoId) === (reviewByPano.get(attempt.panoId)?.panoId || attempt.panoId)) === index);
    if (!filters.due) return queue;
    if (preferences.reviewOrder === 'random') shuffleInPlace(queue);
    const today = reviewDayStart(now, preferences); const nowForLimits = now;
    const reviewsToday = reviews.reduce((total, review) => total + (review.gradingHistory?.filter(({ at }) => at >= today && at <= nowForLimits).length || (review.lastReviewedAt && review.lastReviewedAt >= today && review.lastReviewedAt <= nowForLimits ? 1 : 0)), 0);
    const newCardsToday = reviews.filter((review) => {
      if (!review.reviewCount) return false;
      const firstReviewAt = review.gradingHistory?.[0]?.at ?? (review.reviewCount === 1 ? review.lastReviewedAt : undefined);
      return firstReviewAt !== undefined && firstReviewAt >= today && firstReviewAt <= nowForLimits;
    }).length;
    const newIds = new Set(queue.filter((attempt) => !reviewByPano.get(attempt.panoId)?.reviewCount).slice(0, Math.max(0, preferences.newCardsPerDay - newCardsToday)).map((attempt) => attempt.id));
    return queue.filter((attempt) => reviewByPano.get(attempt.panoId)?.reviewCount || newIds.has(attempt.id)).slice(0, Math.max(0, preferences.maximumReviewsPerDay - reviewsToday));
  },

  async gradeReview(panoId: string, grade: ReviewGrade, intervalOverride?: number, variation?: { level?: number; kind?: 'original' | 'heading' | 'spatial' }): Promise<ReviewRecord> {
    const [storedReviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<Attempt>('attempts')]);
    const target = locations.find((item) => item.panoId === panoId) || attempts.find((item) => item.panoId === panoId);
    const previous = target ? nearbyReview(coalesceNearbyReviews(storedReviews, locations, attempts).reviews, locations, attempts, { panoId, lat: 'actualLat' in target ? target.actualLat : target.lat, lng: 'actualLng' in target ? target.actualLng : target.lng, countryCode: target.countryCode }) : await get<ReviewRecord>('reviews', panoId);
    const preferences = normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value);
    const oldInterval = previous?.intervalDays || 0;
    const intervalDays = Math.min(preferences.maximumIntervalDays, intervalOverride ?? intervalsFor(oldInterval, preferences)[grade]);
    const now = Date.now();
    const next: ReviewRecord = {
      id: previous?.panoId || panoId,
      panoId: previous?.panoId || panoId,
      dueAt: nextReviewAt(now, intervalDays, preferences),
      intervalDays,
      gradingHistory: [...(previous?.gradingHistory || []), { grade, at: now }],
      lapseCount: (previous?.lapseCount || 0) + (grade === 'again' ? 1 : 0),
      reviewCount: (previous?.reviewCount || 0) + 1,
      lastReviewedAt: now,
      ...(variation?.kind && variation.kind !== 'original' ? { generalizationLevel: nextGeneralizationLevel(previous?.generalizationLevel ?? variation.level, variation.level, variation.kind, grade), generalizationUpdatedAt: now } : {}),
    };
    await put('reviews', next);
    return next;
  },

  async updateReviewGeneralization(panoId: string, grade: ReviewGrade, variation: { level?: number; kind?: 'original' | 'heading' | 'spatial' }): Promise<ReviewRecord | undefined> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<Attempt>('attempts')]);
    const target = locations.find((item) => item.panoId === panoId) || attempts.find((item) => item.panoId === panoId);
    const previous = target ? nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, lat: 'actualLat' in target ? target.actualLat : target.lat, lng: 'actualLng' in target ? target.actualLng : target.lng, countryCode: target.countryCode }) : undefined;
    if (!previous || !variation.kind || variation.kind === 'original') return previous;
    const next = { ...previous, generalizationLevel: nextGeneralizationLevel(previous.generalizationLevel ?? variation.level, variation.level, variation.kind, grade), generalizationUpdatedAt: Date.now() };
    await put('reviews', next); return next;
  },

  async scheduleFirstPlay(panoId: string, grade: ReviewGrade, location?: Pick<LocationResult, 'lat' | 'lng' | 'countryCode'>): Promise<ReviewRecord> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<Attempt>('attempts')]);
    const existing = nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, ...(location || locations.find((item) => item.panoId === panoId) || { lat: NaN, lng: NaN, countryCode: '' }) });
    if (existing) return existing;
    const now = Date.now();
    const preferences = normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value);
    const intervalDays: Record<ReviewGrade, number> = { again: preferences.firstReviewDays, hard: preferences.firstReviewDays, good: 7, easy: preferences.easyFirstIntervalDays };
    const days = Math.min(preferences.maximumIntervalDays, intervalDays[grade]);
    const created: ReviewRecord = { id: panoId, panoId, dueAt: nextReviewAt(now, days, preferences), intervalDays: days, gradingHistory: [], lapseCount: 0, reviewCount: 0 };
    await put('reviews', created);
    return created;
  },

  async queueForReview(panoId: string, dueNow = false, location?: Pick<LocationResult, 'lat' | 'lng' | 'countryCode'>): Promise<ReviewRecord> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<Attempt>('attempts')]);
    const existing = nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, ...(location || locations.find((item) => item.panoId === panoId) || { lat: NaN, lng: NaN, countryCode: '' }) });
    if (existing) {
      if (!dueNow || existing.dueAt <= Date.now()) return existing;
      const queued = { ...existing, dueAt: Date.now() };
      await put('reviews', queued);
      return queued;
    }
    const now = Date.now();
    const preferences = normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value);
    const created: ReviewRecord = { id: panoId, panoId, dueAt: dueNow ? now : nextReviewAt(now, preferences.firstReviewDays, preferences), intervalDays: 0, gradingHistory: [], lapseCount: 0, reviewCount: 0 };
    await put('reviews', created);
    return created;
  },

  async reviewIntervals(panoId: string): Promise<Record<ReviewGrade, number>> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), all<TrainerLocation>('locations'), all<Attempt>('attempts')]);
    const target = locations.find((item) => item.panoId === panoId) || attempts.find((item) => item.panoId === panoId);
    const review = target ? nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, lat: 'actualLat' in target ? target.actualLat : target.lat, lng: 'actualLng' in target ? target.actualLng : target.lng, countryCode: target.countryCode }) : undefined;
    const oldInterval = review?.intervalDays || 0;
    const preferences = normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value);
    return intervalsFor(oldInterval, preferences);
  },
};

export interface TrainerBackup {
  format: 'street-view-trainer';
  schemaVersion: 1;
  exportedAt: string;
  data: Record<StoreName, unknown[]>;
}

export async function createBackup(trackExport = true): Promise<TrainerBackup> {
  const exportedAt = new Date().toISOString();
  if (trackExport) await trainerDb.setSetting('lastExportAt', exportedAt);
  const entries = await Promise.all(STORE_NAMES.map(async (name) => [name, await all(name)] as const));
  const backup: TrainerBackup = {
    format: 'street-view-trainer',
    schemaVersion: 1,
    exportedAt,
    data: Object.fromEntries(entries) as Record<StoreName, unknown[]>,
  };
  return backup;
}

export function validateBackup(value: unknown): asserts value is TrainerBackup {
  if (!value || typeof value !== 'object') throw new Error('Backup must be a JSON object.');
  const backup = value as Partial<TrainerBackup>;
  if (backup.format !== 'street-view-trainer' || backup.schemaVersion !== 1 || !backup.data) {
    throw new Error('Unsupported backup format or schema version.');
  }
  for (const name of STORE_NAMES) {
    if (name === 'clues' && backup.data[name] === undefined) continue;
    if (!Array.isArray(backup.data[name])) throw new Error(`Backup is missing the ${name} list.`);
  }
  const requiredKeys: Partial<Record<StoreName, string>> = {
    locations: 'id', attempts: 'id', games: 'id', studyVisits: 'id', reviews: 'id',
    bookmarks: 'panoId', collections: 'id', settings: 'key', sessions: 'id', clues: 'id',
  };
  for (const name of STORE_NAMES) {
    if (name === 'clues' && backup.data[name] === undefined) continue;
    const key = requiredKeys[name]!;
    if (backup.data[name].some((item) => !item || typeof item !== 'object' || !(key in item))) {
      throw new Error(`Backup contains an invalid ${name} record.`);
    }
  }
}

export async function importBackup(value: unknown, mode: 'merge' | 'replace'): Promise<void> {
  validateBackup(value);
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  if (mode === 'replace') STORE_NAMES.forEach((name) => tx.objectStore(name).clear());
  for (const name of STORE_NAMES) {
    for (const item of value.data[name] || []) tx.objectStore(name).put(item);
  }
  await complete(tx);
  notifyChange({ operation: `backup:${mode}`, allowsSavedContentDecrease: mode === 'replace' });
  await reconcileSavedReviews();
}

export async function clearTrainerDbForTesting(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  STORE_NAMES.forEach((name) => tx.objectStore(name).clear());
  await complete(tx);
}
