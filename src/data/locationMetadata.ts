import type { TrainerLocation } from '../types';

export function readLocationMetadata(db: IDBDatabase): Promise<TrainerLocation[]> {
  return new Promise((resolve, reject) => {
    const locations: TrainerLocation[] = [];
    const cursor = db.transaction('locations').objectStore('locations').openCursor();
    cursor.onsuccess = () => {
      if (!cursor.result) return resolve(locations);
      const { imageDataUrl: _image, ...location } = cursor.result.value as TrainerLocation;
      locations.push(location);
      cursor.result.continue();
    };
    cursor.onerror = () => reject(cursor.error);
  });
}
