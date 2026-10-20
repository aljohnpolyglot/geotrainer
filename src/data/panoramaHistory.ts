import type { Attempt, ClueRecord, StudyVisit, TrainerLocation } from '../types';
import { nearbyReviewPoint } from './reviewIdentity';

type Point = { panoId: string; lat: number; lng: number; countryCode: string };
const stores = ['locationMetadata', 'attempts', 'studyVisits', 'clueMetadata'] as const;
const read = <T>(query: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  query.onsuccess = () => resolve(query.result);
  query.onerror = () => reject(query.error);
});

export function upgradePanoramaHistoryIndexes(tx: IDBTransaction) {
  for (const name of stores) {
    const store = tx.objectStore(name);
    if (!store.indexNames.contains('countryLatitude')) store.createIndex('countryLatitude', ['countryCode', name === 'attempts' ? 'actualLat' : 'lat']);
    if (!store.indexNames.contains('panoId')) store.createIndex('panoId', 'panoId');
  }
}

export async function readPanoramaHistory(db: IDBDatabase, current: Point) {
  const relatedPanos = new Set([current.panoId]);
  let nearbyClues: ClueRecord[] = [];
  if (Number.isFinite(current.lat) && Number.isFinite(current.lng)) {
    // 0.0005 degrees of latitude exceeds 50 m, including at the poles.
    const range = IDBKeyRange.bound([current.countryCode, current.lat - .0005], [current.countryCode, current.lat + .0005]);
    const tx = db.transaction([...stores]);
    const [locations, attempts, visits, clues] = await Promise.all([
      read<TrainerLocation[]>(tx.objectStore('locationMetadata').index('countryLatitude').getAll(range)),
      read<Attempt[]>(tx.objectStore('attempts').index('countryLatitude').getAll(range)),
      read<StudyVisit[]>(tx.objectStore('studyVisits').index('countryLatitude').getAll(range)),
      read<ClueRecord[]>(tx.objectStore('clueMetadata').index('countryLatitude').getAll(range)),
    ]);
    nearbyClues = clues.filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number' && nearbyReviewPoint(current, { ...item, lat: item.lat, lng: item.lng }));
    for (const item of [...locations, ...visits]) {
      if (typeof item.lat === 'number' && typeof item.lng === 'number' && nearbyReviewPoint(current, { ...item, lat: item.lat, lng: item.lng })) relatedPanos.add(item.panoId);
    }
    for (const item of attempts) {
      if (nearbyReviewPoint(current, { panoId: item.panoId, lat: item.actualLat, lng: item.actualLng, countryCode: item.countryCode })) relatedPanos.add(item.panoId);
    }
  }
  const clueStore = db.transaction('clueMetadata').objectStore('clueMetadata').index('panoId');
  const exactClues = (await Promise.all([...relatedPanos].map((panoId) => read<ClueRecord[]>(clueStore.getAll(panoId))))).flat();
  const clues = [...new Map([...nearbyClues, ...exactClues].map((item) => [item.id, item])).values()];
  clues.forEach((item) => relatedPanos.add(item.panoId));
  const tx = db.transaction(['attempts', 'studyVisits']);
  const forPanos = async <T>(name: string) => (await Promise.all([...relatedPanos].map((panoId) => read<T[]>(tx.objectStore(name).index('panoId').getAll(panoId))))).flat();
  const [attempts, visits] = await Promise.all([forPanos<Attempt>('attempts'), forPanos<StudyVisit>('studyVisits')]);
  return { relatedPanos, attempts, visits, clues };
}
