import type {
  Attempt,
  BookmarkLocation,
  ClueRecord,
  Collection,
  GameRecord,
  LocationResult,
  ReviewFilters,
  ReviewGrade,
  ReviewRecord,
  SettingRecord,
  StudyVisit,
  TrainerLocation,
  TrainingSession,
} from '../types';

const DB_NAME = 'street-view-trainer';
const DB_VERSION = 3;
export const STORE_NAMES = [
  'locations', 'attempts', 'games', 'studyVisits', 'reviews',
  'bookmarks', 'collections', 'settings', 'sessions', 'clues',
] as const;
export type StoreName = (typeof STORE_NAMES)[number];
const changeListeners = new Set<() => void>();
const notifyChange = () => changeListeners.forEach((listener) => listener());
const intervalsFor = (oldInterval: number): Record<ReviewGrade, number> => ({
  again: 5 / 1440,
  hard: Math.max(1, oldInterval * 1.5),
  good: Math.max(3, oldInterval * 2),
  easy: Math.max(7, oldInterval * 2.5),
});

export const reviewGradeForScore = (score: number): ReviewGrade =>
  score < 2000 ? 'again' : score < 3000 ? 'hard' : score < 4500 ? 'good' : 'easy';

let database: Promise<IDBDatabase> | undefined;

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
  notifyChange();
}

async function remove(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  await complete(tx);
  notifyChange();
}

export function onTrainerDbChange(listener: () => void): () => void {
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

export async function initTrainerDb(): Promise<void> {
  await openDatabase();
  await migrateLocalStorageV1();
}

export const trainerDb = {
  locations: () => all<TrainerLocation>('locations'),
  attempts: () => all<Attempt>('attempts'),
  games: async () => (await all<GameRecord>('games')).sort((a, b) => b.createdAt - a.createdAt),
  studyVisits: () => all<StudyVisit>('studyVisits'),
  reviews: () => all<ReviewRecord>('reviews'),
  bookmarks: async () => (await all<BookmarkLocation>('bookmarks')).sort((a, b) => b.savedAt - a.savedAt),
  collections: () => all<Collection>('collections'),
  sessions: () => all<TrainingSession>('sessions'),
  clues: async () => (await all<ClueRecord>('clues')).sort((a, b) => b.createdAt - a.createdAt),
  setting: async <T>(key: string) => (await get<SettingRecord>('settings', key))?.value as T | undefined,
  setSetting: (key: string, value: unknown) => put('settings', { key, value }),
  saveGame: (game: GameRecord) => put('games', game),
  deleteGame: (id: string) => remove('games', id),
  clearGames: async () => {
    const db = await openDatabase();
    const tx = db.transaction('games', 'readwrite');
    tx.objectStore('games').clear();
    await complete(tx);
    notifyChange();
  },
  saveAttempt: (attempt: Attempt) => put('attempts', attempt),
  saveVisit: (visit: StudyVisit) => put('studyVisits', visit),
  saveSession: (session: TrainingSession) => put('sessions', session),
  saveClue: (clue: ClueRecord) => put('clues', clue),
  deleteClue: (id: string) => remove('clues', id),
  saveBookmark: (bookmark: BookmarkLocation) => put('bookmarks', bookmark),
  deleteBookmark: (panoId: string) => remove('bookmarks', panoId),
  saveCollection: (collection: Collection) => put('collections', { ...collection, isCustom: true }),
  deleteCollection: (id: string) => remove('collections', id),

  async encounter(location: LocationResult, seenAt = Date.now()): Promise<TrainerLocation> {
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

  async reviewQueue(filters: ReviewFilters): Promise<Attempt[]> {
    const [attempts, reviews, bookmarks] = await Promise.all([
      all<Attempt>('attempts'), all<ReviewRecord>('reviews'), all<BookmarkLocation>('bookmarks'),
    ]);
    const reviewByPano = new Map(reviews.map((item) => [item.panoId, item]));
    const bookmarked = new Set(bookmarks.map((item) => item.panoId));
    const now = Date.now();
    const recentCutoff = now - 30 * 864e5;
    return attempts
      .filter((attempt) => !filters.countryCodes?.length || filters.countryCodes.includes(attempt.countryCode))
      .filter((attempt) => !filters.environment || (attempt.environmentRequested ?? attempt.environment ?? 'mixed') === filters.environment)
      .filter((attempt) => filters.minScore === undefined || attempt.score >= filters.minScore)
      .filter((attempt) => filters.maxScore === undefined || attempt.score < filters.maxScore)
      .filter((attempt) => !filters.wrongCountry || attempt.guessedLat === null || (!!attempt.guessedCountryCode && attempt.guessedCountryCode !== attempt.countryCode))
      .filter((attempt) => !filters.recent || (attempt.createdAt >= recentCutoff && attempt.score < 4000))
      .filter((attempt) => !filters.neverReviewed || !reviewByPano.has(attempt.panoId))
      .filter((attempt) => !filters.bookmarked || bookmarked.has(attempt.panoId))
      .filter((attempt) => !filters.due || (!!reviewByPano.get(attempt.panoId) && reviewByPano.get(attempt.panoId)!.dueAt <= now))
      .sort((a, b) => a.score - b.score || b.createdAt - a.createdAt)
      .filter((attempt, index, values) => values.findIndex((other) => other.panoId === attempt.panoId) === index);
  },

  async gradeReview(panoId: string, grade: ReviewGrade): Promise<ReviewRecord> {
    const previous = await get<ReviewRecord>('reviews', panoId);
    const oldInterval = previous?.intervalDays || 0;
    const intervalDays = intervalsFor(oldInterval)[grade];
    const now = Date.now();
    const next: ReviewRecord = {
      id: panoId,
      panoId,
      dueAt: now + intervalDays * 864e5,
      intervalDays,
      gradingHistory: [...(previous?.gradingHistory || []), { grade, at: now }],
      lapseCount: (previous?.lapseCount || 0) + (grade === 'again' ? 1 : 0),
      reviewCount: (previous?.reviewCount || 0) + 1,
      lastReviewedAt: now,
    };
    await put('reviews', next);
    return next;
  },

  async queueForReview(panoId: string, dueNow = false): Promise<ReviewRecord> {
    const existing = await get<ReviewRecord>('reviews', panoId);
    if (existing) {
      if (!dueNow || existing.dueAt <= Date.now()) return existing;
      const queued = { ...existing, dueAt: Date.now() };
      await put('reviews', queued);
      return queued;
    }
    const created: ReviewRecord = { id: panoId, panoId, dueAt: Date.now(), intervalDays: 0, gradingHistory: [], lapseCount: 0, reviewCount: 0 };
    await put('reviews', created);
    return created;
  },

  async reviewIntervals(panoId: string): Promise<Record<ReviewGrade, number>> {
    const oldInterval = (await get<ReviewRecord>('reviews', panoId))?.intervalDays || 0;
    return intervalsFor(oldInterval);
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
  notifyChange();
}

export async function clearTrainerDbForTesting(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  STORE_NAMES.forEach((name) => tx.objectStore(name).clear());
  await complete(tx);
}
