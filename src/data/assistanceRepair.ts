import type { Attempt, ClueRecord, CoachHistoryNote } from '../types';
import { nearbyReviewPoint } from './reviewIdentity';

export function repairNotebookAssistance(attempts: Attempt[], clues: ClueRecord[], coachNotes: CoachHistoryNote[]): Attempt[] {
  // ponytail: scans saved clues per assisted round; index by panorama/time if large histories become slow.
  return attempts.map((attempt) => {
    if (attempt.source !== 'play' || !attempt.aiAssisted || attempt.coachUsed || attempt.coachAnalysis || attempt.coachGeneratedAt) return attempt;
    const start = attempt.createdAt - Math.max(0, attempt.timeSpentSeconds) * 1000;
    const duringRound = (at: number) => at >= start && at <= attempt.createdAt;
    const point = { panoId: attempt.panoId, lat: attempt.actualLat, lng: attempt.actualLng, countryCode: attempt.countryCode };
    const matching = clues.filter((clue) => duringRound(clue.createdAt) && (clue.panoId === attempt.panoId || typeof clue.lat === 'number' && typeof clue.lng === 'number' && nearbyReviewPoint(point, { ...clue, lat: clue.lat, lng: clue.lng })));
    // Plain Notebook images have an empty analysis; clue and 360° analyses retain their evidence.
    const plainNotebook = (clue: ClueRecord) => clue.model === 'Notebook' && !!clue.analysis
      && !clue.analysis.region && !clue.analysis.description && !clue.analysis.coreCard
      && !clue.analysis.locationEstimate && !clue.analysis.regionalRead
      && [clue.analysis.candidates, clue.analysis.strongClues, clue.analysis.weakClues, clue.analysis.contradictions,
        clue.analysis.confusions, clue.analysis.nextThingsToInspect, clue.analysis.extraCards].every((items) => !items?.length);
    if (!matching.some(plainNotebook) || matching.some((clue) => !plainNotebook(clue))) return attempt;
    if (coachNotes.some((note) => duringRound(note.generatedAt) && note.panoId === attempt.panoId)) return attempt;
    return { ...attempt, aiAssisted: false };
  });
}

type RepairDb = {
  attempts: () => Promise<Attempt[]>;
  clues: () => Promise<ClueRecord[]>;
  setting: <T>(key: string) => Promise<T | undefined>;
  saveAttempt: (attempt: Attempt) => Promise<void>;
};

export async function repairSavedNotebookAssistance(db: RepairDb) {
  const [attempts, clues, notes = []] = await Promise.all([db.attempts(), db.clues(), db.setting<CoachHistoryNote[]>('coach.notes')]);
  const repaired = repairNotebookAssistance(attempts, clues, notes);
  await Promise.all(repaired.filter((attempt, index) => attempt !== attempts[index]).map((attempt) => db.saveAttempt(attempt)));
}
