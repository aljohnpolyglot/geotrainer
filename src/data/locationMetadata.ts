import type { ClueRecord, TrainerLocation } from '../types';
import { clueImageFingerprint } from './clueDedup';

export const METADATA_STORES = ['locationMetadata', 'clueMetadata'] as const;
export const metadataStoreFor = (store: string) => store === 'locations' ? METADATA_STORES[0] : store === 'clues' ? METADATA_STORES[1] : undefined;

export function writeMetadata(tx: IDBTransaction, store: string, value: unknown) {
  const target = metadataStoreFor(store);
  if (!target) return;
  const { imageDataUrl, ...metadata } = value as TrainerLocation & ClueRecord;
  tx.objectStore(target).put(store === 'clues' ? { ...metadata, imageDataUrl: imageDataUrl?.startsWith('data:') ? '' : imageDataUrl || '', imageFingerprint: metadata.imageFingerprint || clueImageFingerprint(imageDataUrl) || undefined } : metadata);
}

export function upgradeMetadataStores(db: IDBDatabase, tx: IDBTransaction) {
  for (const store of ['locations', 'clues']) {
    const target = metadataStoreFor(store)!;
    if (db.objectStoreNames.contains(target)) continue;
    db.createObjectStore(target, { keyPath: 'id' });
    const cursor = tx.objectStore(store).openCursor();
    cursor.onsuccess = () => {
      if (!cursor.result) return;
      writeMetadata(tx, store, cursor.result.value);
      cursor.result.continue();
    };
  }
}

export function readLocationMetadata(db: IDBDatabase): Promise<TrainerLocation[]> {
  return new Promise((resolve, reject) => {
    const query = db.transaction('locationMetadata').objectStore('locationMetadata').getAll();
    query.onsuccess = () => resolve(query.result);
    query.onerror = () => reject(query.error);
  });
}
