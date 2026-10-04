import { BUILT_IN_COLLECTIONS } from '../data/collections';
import type { Collection, LocationPoolTarget } from '../types';

export function canStartMetaLesson(available: boolean | null, completed: number, total: number, selectedLessonId?: string): boolean {
  return available === true && total > 0 && completed < total && Boolean(selectedLessonId);
}

export function normalizeStudySetup<T extends { collectionId: string; countryCodes?: string[]; locationTargets?: LocationPoolTarget[] }>(settings: T, collections: Collection[]): T {
  const selectable = collections.some((item) => item.id === settings.collectionId && (item.isCustom || BUILT_IN_COLLECTIONS.some((builtIn) => builtIn.id === item.id)));
  return selectable ? settings : { ...settings, collectionId: 'world', countryCodes: undefined, locationTargets: undefined };
}
