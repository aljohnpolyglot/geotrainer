import { upgradeMetadataStores } from './locationMetadata';
import { upgradePanoramaHistoryIndexes } from './panoramaHistory';

const DB_NAME = 'street-view-trainer';
const DB_VERSION = 5;
export const STORE_NAMES = [
  'locations', 'attempts', 'games', 'studyVisits', 'reviews',
  'bookmarks', 'collections', 'settings', 'sessions', 'clues',
] as const;
export type StoreName = (typeof STORE_NAMES)[number];
let database: Promise<IDBDatabase> | undefined;
export const request = <T>(value: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
export const complete = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Database transaction aborted'));
  });
export function openDatabase(): Promise<IDBDatabase> {
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
      upgradeMetadataStores(db, opening.transaction!);
      upgradePanoramaHistoryIndexes(opening.transaction!);
    };
    opening.onsuccess = () => { const db = opening.result; db.onversionchange = () => { db.close(); database = undefined; }; resolve(db); };
    opening.onerror = () => reject(opening.error);
    opening.onblocked = () => reject(new Error('Close other app tabs to upgrade the training database.'));
  });
  return database;
}
