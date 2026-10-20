import type {
  Attempt, BookmarkLocation, ClueRecord, Collection,
  GameRecord, LocationResult,
  ReviewFilters, ReviewGrade, ReviewRecord,
  ReviewSessionKind,
  SettingRecord,
  SchedulerPreferences,
  StudyVisit,
  TrainerLocation,
  TrainingSession,
} from '../types';
export { normalizeGamePreferences, normalizeLocationTargets } from './trainerPreferences';
import { nextReviewAt, nextReviewDayBoundary, reviewDayStart } from './reviewTiming';
import { coalesceNearbyReviews, nearbyReview, createReviewLookup, uniqueReviewSources } from './reviewIdentity';
import { DEFAULT_SCHEDULER_PREFERENCES, normalizeSchedulerPreferences, shuffleInPlace } from './reviewPreferences';
import { nextGeneralizationLevel } from './reviewVariation';
import { intervalsFor } from './reviewGrading';
import { rebalanceReviewDates, reconcileReviewAttempt } from './reviewSchedule';
import { planReviewRollover } from './reviewRollover';
import { clueImageFingerprint } from './clueDedup';
import { repairSavedNotebookAssistance } from './assistanceRepair';
import { panoramaHash } from '../services/locationHash';
import { readLocationMetadata, METADATA_STORES, metadataStoreFor, writeMetadata } from './locationMetadata';
import type { DueShift } from './reviewRebalance';
export { effectiveReviewDueAt, nextReviewAt, nextReviewDayBoundary, nextScheduledReviewAt, reviewDayStart } from './reviewTiming';
export { DEFAULT_SCHEDULER_PREFERENCES, hardOrAgainScoreForStrictness, normalizeSchedulerPreferences, shuffleInPlace } from './reviewPreferences';
export { gameMistakes, isCountryMistake, passingScoreFor, reviewGradeForCorrection, reviewGradeForPerformance, reviewGradeForScore, shouldAutoSchedulePlayReview } from './reviewGrading';
export { reconcileReviewAttempt } from './reviewSchedule';
import { openDatabase, request, complete, STORE_NAMES, type StoreName } from './trainerDatabase';
export { STORE_NAMES, type StoreName } from './trainerDatabase';
export type TrainerDbChange = { operation: string; allowsSavedContentDecrease?: boolean };
const changeListeners = new Set<(change: TrainerDbChange) => void>(); const notifyChange = (change: TrainerDbChange) => changeListeners.forEach((listener) => listener(change));
export const isReviewDue = (review: ReviewRecord, now: number, preferences: SchedulerPreferences) => review.intervalDays < 1 ? review.dueAt <= now : reviewDayStart(review.dueAt, preferences) <= reviewDayStart(now, preferences);
export const shouldScheduleReview = (kind: ReviewSessionKind, review: ReviewRecord | undefined, now: number, preferences: SchedulerPreferences) => kind !== 'practice' || (!!review && isReviewDue(review, now, preferences));
let settingWrites = Promise.resolve();
async function all<T>(storeName: StoreName | typeof METADATA_STORES[number]): Promise<T[]> {
  const db = await openDatabase();
  return request(db.transaction(storeName).objectStore(storeName).getAll()) as Promise<T[]>;
}
async function locationMetadata(): Promise<TrainerLocation[]> {
  return readLocationMetadata(await openDatabase());
}
async function get<T>(storeName: StoreName | typeof METADATA_STORES[number], key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase();
  return request(db.transaction(storeName).objectStore(storeName).get(key)) as Promise<T | undefined>;
}
async function put<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase();
  const metadata = metadataStoreFor(storeName);
  const tx = db.transaction(metadata ? [storeName, metadata] : storeName, 'readwrite');
  tx.objectStore(storeName).put(value);
  writeMetadata(tx, storeName, value);
  await complete(tx);
  notifyChange({ operation: `put:${storeName}` });
}
async function remove(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  const metadata = metadataStoreFor(storeName);
  const tx = db.transaction(metadata ? [storeName, metadata] : storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  if (metadata) tx.objectStore(metadata).delete(key);
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
  const tx = db.transaction([...STORE_NAMES, ...METADATA_STORES], 'readwrite');
  const writeAll = (name: StoreName, values: unknown[]) => values.forEach((value) => { tx.objectStore(name).put(value); writeMetadata(tx, name, value); });
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
  const [attempts, reviews, locations, storedPreferences] = await Promise.all([all<Attempt>('attempts'), all<ReviewRecord>('reviews'), locationMetadata(), get<SettingRecord>('settings', 'schedulerPreferences')]);
  const preferences = normalizeSchedulerPreferences(storedPreferences?.value);
  const latest = new Map<string, Attempt>();
  attempts.filter((item) => item.source === 'review').forEach((item) => { if (!latest.get(item.panoId) || latest.get(item.panoId)!.createdAt < item.createdAt) latest.set(item.panoId, item); });
  const repaired = reviews.map((review) => reconcileReviewAttempt(review, latest.get(review.panoId) || {} as Attempt, preferences));
  const merged = coalesceNearbyReviews(repaired, locations, attempts).reviews;
  if (merged.length === reviews.length && !repaired.some((review, index) => review !== reviews[index])) return;
  const db = await openDatabase(); const tx = db.transaction('reviews', 'readwrite'); tx.objectStore('reviews').clear(); merged.forEach((review) => tx.objectStore('reviews').put(review));
  await complete(tx); notifyChange({ operation: 'reconcile:reviews' });
}
let reviewMaintenance = Promise.resolve();
function maintainReviews() {
  const write = reviewMaintenance.then(async () => {
    await reconcileSavedReviews();
    const [reviews, storedPreferences] = await Promise.all([all<ReviewRecord>('reviews'), get<SettingRecord>('settings', 'schedulerPreferences')]);
    const shifts = planReviewRollover(reviews, Date.now(), normalizeSchedulerPreferences(storedPreferences?.value));
    if (shifts.length) { await rebalanceReviewDates(shifts, openDatabase); notifyChange({ operation: 'rollover:reviews' }); }
  });
  reviewMaintenance = write.catch(() => {}); return write;
}
export async function initTrainerDb(): Promise<void> {
  await openDatabase();
  await migrateLocalStorageV1();
  await maintainReviews();
  await repairSavedNotebookAssistance(trainerDb);
}
export const trainerDb = {
  count: async (storeName: 'locations' | 'attempts') => request((await openDatabase()).transaction(storeName).objectStore(storeName).count()),
  locations: () => all<TrainerLocation>('locations'),
  locationMetadata,
  location: (panoId: string) => get<TrainerLocation>('locations', panoId),
  attempts: () => all<Attempt>('attempts'),
  attemptsForPano: async (panoId: string) => {
    const db = await openDatabase();
    return request(db.transaction('attempts').objectStore('attempts').index('panoId').getAll(panoId)) as Promise<Attempt[]>;
  },
  games: async () => (await all<GameRecord>('games')).sort((a, b) => b.createdAt - a.createdAt),
  studyVisits: () => all<StudyVisit>('studyVisits'),
  reviews: async () => {
    await maintainReviews();
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), locationMetadata(), all<Attempt>('attempts')]);
    return coalesceNearbyReviews(reviews, locations, attempts).reviews;
  },
  async rebalanceReviews(shifts: DueShift[]): Promise<void> {
    if (!shifts.length) return;
    await rebalanceReviewDates(shifts, openDatabase);
    notifyChange({ operation: 'rebalance:reviews' });
  },
  bookmarks: async () => (await all<BookmarkLocation>('bookmarks')).sort((a, b) => b.savedAt - a.savedAt),
  collections: () => all<Collection>('collections'),
  sessions: () => all<TrainingSession>('sessions'),
  clues: async () => (await all<ClueRecord>('clues')).sort((a, b) => b.createdAt - a.createdAt),
  clueMetadata: async () => (await all<ClueRecord>('clueMetadata')).sort((a, b) => b.createdAt - a.createdAt),
  clue: (id: string) => get<ClueRecord>('clues', id),
  setting: async <T>(key: string) => (await get<SettingRecord>('settings', key))?.value as T | undefined,
  settingsByPrefix: async (prefix: string) => request((await openDatabase()).transaction('settings').objectStore('settings').getAll(IDBKeyRange.bound(prefix, prefix + '\uffff'))) as Promise<SettingRecord[]>,
  deleteSetting: (key: string) => remove('settings', key),
  schedulerPreferences: async () => normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value),
  async reviewState(panoId: string, location?: Pick<LocationResult, 'lat' | 'lng' | 'countryCode' | 'sourcePointHash'>): Promise<ReviewRecord | undefined> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), locationMetadata(), all<Attempt>('attempts')]);
    const target = location || locations.find((item) => item.panoId === panoId) || attempts.find((item) => item.panoId === panoId);
    return target ? nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, lat: 'actualLat' in target ? target.actualLat : target.lat, lng: 'actualLng' in target ? target.actualLng : target.lng, countryCode: target.countryCode, sourcePointHash: target.sourcePointHash }) : get<ReviewRecord>('reviews', panoId);
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
  saveAttempt: async (attempt: Attempt) => {
    const sourceHash = attempt.sourcePointHash || (await get<TrainerLocation>('locationMetadata', attempt.panoId))?.sourcePointHash;
    return put('attempts', { ...attempt, panoramaHash: await panoramaHash(attempt.panoId), ...(sourceHash ? { sourcePointHash: sourceHash } : {}) });
  },
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
      panoramaHash: await panoramaHash(location.panoId),
      lastSeenAt: seenAt,
      encounterCount: previous.encounterCount + 1,
    } : {
      ...location,
      panoramaHash: await panoramaHash(location.panoId),
      id: location.panoId,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      encounterCount: 1,
    };
    await put('locations', next);
    return next;
  },

  async stampSourcePointHash(panoId: string, hash: string): Promise<void> {
    const location = await get<TrainerLocation>('locations', panoId);
    if (location && location.sourcePointHash !== hash) await put('locations', { ...location, sourcePointHash: hash });
  },

  async saveLocationImage(panoId: string, imageDataUrl: string): Promise<void> {
    const location = await get<TrainerLocation>('locations', panoId);
    if (location) await put('locations', { ...location, imageDataUrl });
  },

  async reviewQueue(filters: ReviewFilters): Promise<Attempt[]> {
    await maintainReviews();
    const [attempts, storedReviews, locations, bookmarks, storedPreferences] = await Promise.all([
      all<Attempt>('attempts'), all<ReviewRecord>('reviews'), locationMetadata(), all<BookmarkLocation>('bookmarks'), get<SettingRecord>('settings', 'schedulerPreferences'),
    ]);
    const { reviews, aliases } = coalesceNearbyReviews(storedReviews, locations, attempts);
    const preferences = normalizeSchedulerPreferences(storedPreferences?.value);
    const reviewByPano = new Map(reviews.map((item) => [item.panoId, item]));
    const lookup = createReviewLookup(reviews, locations, attempts);
    aliases.forEach((canonical, alias) => reviewByPano.set(alias, reviewByPano.get(canonical)!));
    attempts.forEach((attempt) => { if (!reviewByPano.has(attempt.panoId)) { const match = lookup({ panoId: attempt.panoId, lat: attempt.actualLat, lng: attempt.actualLng, countryCode: attempt.countryCode }); if (match) reviewByPano.set(attempt.panoId, match); } });
    const bookmarked = new Set(bookmarks.map((item) => item.panoId));
    const now = Date.now();
    const recentCutoff = now - (filters.recentDays || 30) * 864e5;
    const hasScoreFilter = filters.minScore !== undefined || filters.maxScore !== undefined;
    const ranked = attempts
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
        : a.score - b.score || b.createdAt - a.createdAt);
    const queue = uniqueReviewSources(ranked, (attempt) => reviewByPano.get(attempt.panoId)?.panoId || attempt.panoId);
    if (preferences.reviewOrder === 'random') shuffleInPlace(queue);
    if (!filters.due) return queue;
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

  async gradeReview(panoId: string, grade: ReviewGrade, intervalOverride?: number, variation?: { level?: number; kind?: 'original' | 'heading' | 'spatial' }, context?: { previous?: ReviewRecord; preferences: SchedulerPreferences }): Promise<ReviewRecord> {
    const previous = context ? context.previous : await trainerDb.reviewState(panoId);
    const preferences = context?.preferences || await trainerDb.schedulerPreferences();
    const oldInterval = previous?.intervalDays || 0;
    const intervalDays = Math.min(preferences.maximumIntervalDays, intervalOverride ?? intervalsFor(oldInterval, preferences)[grade]);
    const now = Date.now();
    const next: ReviewRecord = {
      ...previous,
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

  async updateReviewGeneralization(panoId: string, grade: ReviewGrade, variation: { level?: number; kind?: 'original' | 'heading' | 'spatial' }, context?: { previous?: ReviewRecord }): Promise<ReviewRecord | undefined> {
    const previous = context ? context.previous : await trainerDb.reviewState(panoId);
    if (!previous || !variation.kind || variation.kind === 'original') return previous;
    const next = { ...previous, generalizationLevel: nextGeneralizationLevel(previous.generalizationLevel ?? variation.level, variation.level, variation.kind, grade), generalizationUpdatedAt: Date.now() };
    await put('reviews', next); return next;
  },

  async scheduleFirstPlay(panoId: string, grade: ReviewGrade, location?: Pick<LocationResult, 'lat' | 'lng' | 'countryCode' | 'sourcePointHash'>): Promise<ReviewRecord> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), locationMetadata(), all<Attempt>('attempts')]);
    const existing = nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, ...(location || locations.find((item) => item.panoId === panoId) || { lat: NaN, lng: NaN, countryCode: '' }) });
    if (existing) return existing;
    const now = Date.now();
    const preferences = normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value);
    const intervalDays: Record<ReviewGrade, number> = { again: preferences.firstReviewDays, hard: preferences.firstReviewDays, good: 7, easy: preferences.easyFirstIntervalDays };
    const days = Math.min(preferences.maximumIntervalDays, intervalDays[grade]);
    const created: ReviewRecord = { id: panoId, panoId, panoramaHash: await panoramaHash(panoId), sourcePointHash: location?.sourcePointHash, dueAt: nextReviewAt(now, days, preferences), intervalDays: days, gradingHistory: [], lapseCount: 0, reviewCount: 0 };
    await put('reviews', created);
    return created;
  },

  async queueForReview(panoId: string, dueNow = false, location?: Pick<LocationResult, 'lat' | 'lng' | 'countryCode' | 'sourcePointHash'>): Promise<ReviewRecord> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), locationMetadata(), all<Attempt>('attempts')]);
    const existing = nearbyReview(coalesceNearbyReviews(reviews, locations, attempts).reviews, locations, attempts, { panoId, ...(location || locations.find((item) => item.panoId === panoId) || { lat: NaN, lng: NaN, countryCode: '' }) });
    if (existing) {
      if (!dueNow || existing.dueAt <= Date.now()) return existing;
      const queued = { ...existing, dueAt: Date.now() };
      await put('reviews', queued);
      return queued;
    }
    const now = Date.now();
    const preferences = normalizeSchedulerPreferences((await get<SettingRecord>('settings', 'schedulerPreferences'))?.value);
    const created: ReviewRecord = { id: panoId, panoId, panoramaHash: await panoramaHash(panoId), sourcePointHash: location?.sourcePointHash, dueAt: dueNow ? now : nextReviewAt(now, preferences.firstReviewDays, preferences), intervalDays: 0, gradingHistory: [], lapseCount: 0, reviewCount: 0 };
    await put('reviews', created);
    return created;
  },

  async reviewIntervals(panoId: string): Promise<Record<ReviewGrade, number>> {
    const [reviews, locations, attempts] = await Promise.all([all<ReviewRecord>('reviews'), locationMetadata(), all<Attempt>('attempts')]);
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
  const tx = db.transaction([...STORE_NAMES, ...METADATA_STORES], 'readwrite');
  if (mode === 'replace') [...STORE_NAMES, ...METADATA_STORES].forEach((name) => tx.objectStore(name).clear());
  for (const name of STORE_NAMES) {
    for (const item of value.data[name] || []) { tx.objectStore(name).put(item); writeMetadata(tx, name, item); }
  }
  await complete(tx);
  await repairSavedNotebookAssistance(trainerDb);
  notifyChange({ operation: `backup:${mode}`, allowsSavedContentDecrease: mode === 'replace' });
  await maintainReviews();
}
export async function clearTrainerDbForTesting(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction([...STORE_NAMES, ...METADATA_STORES], 'readwrite');
  [...STORE_NAMES, ...METADATA_STORES].forEach((name) => tx.objectStore(name).clear());
  await complete(tx);
}
