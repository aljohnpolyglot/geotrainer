import { useEffect, useState } from 'react';
import { onTrainerDbChange, trainerDb } from '../data/trainerDb';
import { savedReviewMatcher } from '../data/reviewIdentity';

export function useSavedReviewMatcher(ready: boolean, sourceId?: string) {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ key: string; matcher: ReturnType<typeof savedReviewMatcher> }>();
  const key = `${sourceId || ''}:${revision}`;
  useEffect(() => onTrainerDbChange(({ operation }) => {
    if (operation.endsWith(':reviews') || operation.startsWith('backup:')) setRevision((value) => value + 1);
  }), []);
  useEffect(() => {
    if (!ready) { setSnapshot(undefined); return; }
    let active = true;
    void Promise.all([trainerDb.reviews(), trainerDb.locations(), trainerDb.attempts()])
      .then(([reviews, locations, attempts]) => { if (active) setSnapshot({ key, matcher: savedReviewMatcher(reviews, locations, attempts) }); })
      .catch(() => { if (active) setSnapshot(undefined); });
    return () => { active = false; };
  }, [ready, sourceId, revision]);
  return ready && snapshot?.key === key ? snapshot.matcher : undefined;
}
