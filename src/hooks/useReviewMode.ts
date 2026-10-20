import { allowNearbyIslandReview, configuredCountryScoreFloor, intervalsFor } from '../data/reviewGrading';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Attempt, GameRound, LocationResult, ReviewGrade, ReviewSessionKind } from '../types';
import { calculateDistanceKm, calculateRoundScore, resumeRoundStartedAt } from '../services/gameLogic';
import { creditedGuessCountry, nearbyIslandGuess, reverseGeocodeLocation } from '../services/geocoding';
import { defaultLocationGenerator } from '../services/locationGenerator';
import { onTrainerDbChange, reviewGradeForCorrection, reviewGradeForPerformance, shouldScheduleReview, trainerDb } from '../data/trainerDb';
import { planReviewVariation } from '../data/reviewVariation';
import { isLatestRequest } from '../services/requestIntegrity';
import { getStreetViewSnapshot } from '../services/streetViewSnapshot';

type ReviewStat = { previous: number; current: number; grade: ReviewGrade; attemptId?: string };
type SavedReviewSession = { attemptIds: string[]; source: string; kind?: ReviewSessionKind; initialTotal: number; compass?: boolean; stats?: ReviewStat[] };
export const restoredReviewProgress = (saved: Pick<SavedReviewSession, 'initialTotal' | 'stats'>, remaining: number) => {
  const stats = Array.isArray(saved.stats) ? saved.stats : [];
  return { stats, initialTotal: Math.max(saved.initialTotal || 0, stats.length + remaining) };
};
export const queueAfterReview = (queue: Attempt[], current: Attempt, grade: ReviewGrade) => grade === 'again' ? [...queue.slice(1), current] : queue.slice(1);
export const failedEarlierInSession = (stats: ReviewStat[], attemptId: string) => stats.some((item) => item.attemptId === attemptId && item.grade === 'again');
export const upcomingReviewCards = (queue: Attempt[], currentId: string) => queue.filter((item) => item.id !== currentId).slice(0, 5);

async function prepareReviewCard(attempt: Attempt) {
  const anchor = { panoId: attempt.panoId, lat: attempt.actualLat, lng: attempt.actualLng, countryCode: attempt.countryCode, heading: attempt.heading, environment: attempt.environment };
  const [preferences, review, history, reopenedAnchor] = await Promise.all([trainerDb.schedulerPreferences(), trainerDb.reviewState(attempt.panoId), trainerDb.attemptsForPano(attempt.panoId), defaultLocationGenerator.reopenLocation(anchor, { fallbackRadiusM: 50, maxOriginalDistanceKm: .05, officialFallback: true })]);
  const plan = planReviewVariation(!!preferences.reviewViewVariationEnabled, preferences.reviewViewVariationDifficulty, review, attempt.heading, attempt.environment);
  history.sort((a, b) => b.createdAt - a.createdAt);
  const recentlyShown = new Set(history.filter((item) => item.source === 'review' && item.shownPanoId).slice(0, 3).map((item) => item.shownPanoId!));
  const reopened = await defaultLocationGenerator.resolveReviewLocation(anchor, plan, recentlyShown, reopenedAnchor);
  return { preferences, review, history, plan, reopened };
}

export function useReviewMode(ctx: any) {
  const { dbReady, mapsReady, reviewAttempt, setReviewAttempt, currentLocation, setCurrentLocation, setIsLoading,
    setErrorMessage, compassPreference, setTrainerRefreshKey, roundStartTimeRef, setIsSubmittingGuess,
    isSubmittingGuess, coachNote, reviewCompass, setCoachNote, reviewDisplayedPanoId } = ctx;
  const [reviewResult, setReviewResult] = useState<GameRound | null>(null);
  const [reviewAttemptRecord, setReviewAttemptRecord] = useState<Attempt | null>(null);
  const [reviewQueue, setReviewQueue] = useState<Attempt[]>([]);
  const [reviewOriginalQueue, setReviewOriginalQueue] = useState<Attempt[]>([]);
  const [reviewSource, setReviewSource] = useState('Review Queue');
  const [reviewKind, setReviewKind] = useState<ReviewSessionKind>('practice');
  const [reviewHistory, setReviewHistory] = useState<Attempt[]>([]);
  const [reviewIntervals, setReviewIntervals] = useState<Record<ReviewGrade, number>>({ again: 5 / 1440, hard: 1, good: 3, easy: 7 });
  const [reviewElapsed, setReviewElapsed] = useState(0);
  const [reviewInitialTotal, setReviewInitialTotal] = useState(1);
  const [reviewStats, setReviewStats] = useState<ReviewStat[]>([]);
  const [reviewComplete, setReviewComplete] = useState(false);
  const reviewGradingRef = useRef(false);
  const reviewRestoreAttemptedRef = useRef(false);
  const reviewVariationRef = useRef<{ kind: 'original' | 'heading' | 'spatial'; level: number; distanceM: number; shownPanoId: string; shownHeading?: number } | undefined>(undefined);
  const reviewOpenRequestRef = useRef(0);
  const preparedCardsRef = useRef(new Map<string, Promise<Awaited<ReturnType<typeof prepareReviewCard>>>>());
  const prefetchEpochRef = useRef(0);
  const roundPausedAtRef = useRef<number | null>(null);

  useEffect(() => onTrainerDbChange(({ operation }) => {
    if (operation.startsWith('backup:') || operation === 'reconcile:reviews') { prefetchEpochRef.current++; preparedCardsRef.current.clear(); }
  }), []);

  useEffect(() => {
    if (ctx.appMode !== 'review' || ctx.showHome || !reviewAttempt) { prefetchEpochRef.current++; preparedCardsRef.current.clear(); return; }
    if (!currentLocation || reviewDisplayedPanoId !== currentLocation.panoId) return;
    const upcoming = upcomingReviewCards(reviewQueue, reviewAttempt.id);
    const retained = new Set(upcoming.map((attempt) => attempt.id));
    for (const id of preparedCardsRef.current.keys()) if (!retained.has(id)) preparedCardsRef.current.delete(id);
    let cancelled = false;
    let idleId: number | null = null;
    let index = 0;
    let preparing = false;
    const epoch = prefetchEpochRef.current;
    const schedule = () => {
      if (cancelled || epoch !== prefetchEpochRef.current || document.hidden || preparing || idleId !== null || index >= upcoming.length) return;
      const prepare = async () => {
        idleId = null;
        if (cancelled || epoch !== prefetchEpochRef.current || document.hidden) return;
        preparing = true;
        const attempt = upcoming[index++];
        let pending = preparedCardsRef.current.get(attempt.id);
        if (!pending) {
          pending = prepareReviewCard(attempt);
          preparedCardsRef.current.set(attempt.id, pending);
        }
        try { await pending; } catch { if (preparedCardsRef.current.get(attempt.id) === pending) preparedCardsRef.current.delete(attempt.id); }
        preparing = false;
        schedule();
      };
      idleId = window.requestIdleCallback ? window.requestIdleCallback(prepare, { timeout: 1500 }) : window.setTimeout(prepare, 750);
    };
    const onVisibility = () => { if (!document.hidden) schedule(); };
    document.addEventListener('visibilitychange', onVisibility);
    schedule();
    return () => { cancelled = true; if (idleId !== null) { if (window.cancelIdleCallback) window.cancelIdleCallback(idleId); else window.clearTimeout(idleId); } document.removeEventListener('visibilitychange', onVisibility); };
  }, [ctx.appMode, ctx.showHome, reviewQueue, reviewAttempt?.id, currentLocation?.panoId, reviewDisplayedPanoId]);

  const openReviewAttempt = useCallback(async (attempt: Attempt) => {
    const requestId = ++reviewOpenRequestRef.current;
    reviewVariationRef.current = undefined;
    setReviewAttempt(attempt); setReviewResult(null); setReviewAttemptRecord(null); setReviewElapsed(0); setCurrentLocation(null); setCoachNote(null); setIsLoading(true); setErrorMessage(null);
    try {
      const cached = preparedCardsRef.current.get(attempt.id);
      preparedCardsRef.current.delete(attempt.id);
      const { preferences, review, history, plan, reopened } = await (cached ? cached.catch(() => prepareReviewCard(attempt)) : prepareReviewCard(attempt));
      if (!isLatestRequest(requestId, reviewOpenRequestRef.current)) return;
      const kind = plan.kind === 'spatial' && reopened.panoId !== attempt.panoId && !reopened.isFallback ? 'spatial' : plan.kind === 'heading' ? 'heading' : 'original';
      reviewVariationRef.current = { kind, level: kind === 'spatial' ? plan.generalizationLevel : 0, distanceM: kind === 'spatial' ? calculateDistanceKm(attempt.actualLat, attempt.actualLng, reopened.lat, reopened.lng) * 1000 : 0, shownPanoId: reopened.panoId, shownHeading: reopened.heading };
      setCurrentLocation(reopened); setIsLoading(false); roundStartTimeRef.current = Date.now();
      setReviewHistory(history); setReviewIntervals(intervalsFor(review?.intervalDays || 0, preferences));
    } catch (error) { if (isLatestRequest(requestId, reviewOpenRequestRef.current)) { setErrorMessage(error instanceof Error ? error.message : 'Review location is unavailable.'); setReviewAttempt(null); } } finally { if (isLatestRequest(requestId, reviewOpenRequestRef.current)) setIsLoading(false); }
  }, [setCoachNote, setCurrentLocation, setErrorMessage, setIsLoading, setReviewAttempt, roundStartTimeRef]);

  const handleStartReview = useCallback(async (attempt: Attempt, queue: Attempt[] = [attempt], source = 'History', kind: ReviewSessionKind = 'practice') => {
    prefetchEpochRef.current++; preparedCardsRef.current.clear();
    const compass = attempt.showCompass ?? compassPreference;
    ctx.setShowHome(false); ctx.setAppMode('review');
    setReviewQueue(queue); setReviewOriginalQueue(queue); setReviewInitialTotal(queue.length); setReviewStats([]); setReviewComplete(false); setReviewSource(source); setReviewKind(kind);
    ctx.setReviewCompass(compass);
    await trainerDb.setSetting('review.active', { attemptIds: queue.map((item) => item.id), source, kind, initialTotal: queue.length, compass, stats: [] } satisfies SavedReviewSession);
    await openReviewAttempt(attempt);
  }, [compassPreference, ctx, openReviewAttempt]);

  useEffect(() => {
    if (!dbReady || !mapsReady || reviewRestoreAttemptedRef.current || reviewAttempt) return;
    reviewRestoreAttemptedRef.current = true;
    void (async () => {
      const saved = await trainerDb.setting<SavedReviewSession | null>('review.active');
      if (!saved?.attemptIds.length) return;
      const attempts = await trainerDb.attempts(); const byId = new Map(attempts.map((item) => [item.id, item]));
      const queue = saved.attemptIds.map((id) => byId.get(id)).filter((item): item is Attempt => !!item); if (!queue.length) return;
      const kind = saved.kind ?? (saved.source === 'Game mistakes' ? 'correction' : saved.source.includes('Due Today') ? 'due' : 'practice');
      const progress = restoredReviewProgress(saved, queue.length);
      setReviewQueue(queue); setReviewOriginalQueue(queue); setReviewInitialTotal(progress.initialTotal); setReviewSource(saved.source); setReviewKind(kind); ctx.setReviewCompass(saved.compass ?? queue[0].showCompass ?? compassPreference); setReviewStats(progress.stats); await openReviewAttempt(queue[0]);
    })();
  }, [compassPreference, dbReady, mapsReady, openReviewAttempt, reviewAttempt, ctx]);

  useEffect(() => {
    if (!currentLocation || reviewDisplayedPanoId !== currentLocation.panoId || reviewResult) return;
    roundStartTimeRef.current = Date.now();
  }, [reviewDisplayedPanoId, currentLocation?.panoId, roundStartTimeRef]);
  useEffect(() => { if (!reviewAttempt || reviewResult || !currentLocation || reviewDisplayedPanoId !== currentLocation.panoId) return; const timer = window.setInterval(() => setReviewElapsed(Math.max(0, Math.round((Date.now() - roundStartTimeRef.current) / 1000))), 1000); return () => window.clearInterval(timer); }, [reviewAttempt, reviewResult, reviewDisplayedPanoId, currentLocation?.panoId, roundStartTimeRef]);
  useEffect(() => { if (!reviewAttempt || reviewResult || !currentLocation) { roundPausedAtRef.current = null; return; } const visibility = () => { if (document.visibilityState === 'hidden') roundPausedAtRef.current ??= Date.now(); else { roundStartTimeRef.current = resumeRoundStartedAt(roundStartTimeRef.current, roundPausedAtRef.current, Date.now()); roundPausedAtRef.current = null; } }; visibility(); document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, [currentLocation, reviewAttempt, reviewResult, roundStartTimeRef]);

  const handleReviewGuess = useCallback(async (guess: { lat: number; lng: number } | null) => {
    if (!reviewAttempt || !currentLocation || reviewDisplayedPanoId !== currentLocation.panoId || reviewResult || reviewGradingRef.current) return;
    setIsSubmittingGuess(true); reviewGradingRef.current = true;
    try {
      const distanceKm = guess ? calculateDistanceKm(guess.lat, guess.lng, reviewAttempt.actualLat, reviewAttempt.actualLng) : null;
      const score = distanceKm === null ? 0 : calculateRoundScore(distanceKm);
      const timeSpentSeconds = Math.max(1, Math.round((Date.now() - roundStartTimeRef.current) / 1000));
      const round: GameRound = { roundNumber: 1, location: { ...currentLocation, lat: reviewAttempt.actualLat, lng: reviewAttempt.actualLng, countryCode: reviewAttempt.countryCode, heading: getStreetViewSnapshot(currentLocation.panoId)?.heading ?? currentLocation.heading }, guess, distanceKm, score, timeSpentSeconds };
      const id = `review-attempt-${crypto.randomUUID()}`;
      const variation = reviewVariationRef.current;
      const [scheduler, previous, geocoded] = await Promise.all([trainerDb.schedulerPreferences(), trainerDb.reviewState(reviewAttempt.panoId), guess ? reverseGeocodeLocation(guess.lat, guess.lng) : undefined]);
      const attempt: Attempt = { id, gameId: `review-${new Date().toISOString().slice(0, 10)}`, roundNumber: 1, panoId: reviewAttempt.panoId, actualLat: reviewAttempt.actualLat, actualLng: reviewAttempt.actualLng, countryCode: reviewAttempt.countryCode, guessedLat: guess?.lat ?? null, guessedLng: guess?.lng ?? null, guessedCountryCode: guess ? creditedGuessCountry(reviewAttempt.countryCode, geocoded?.countryCode, distanceKm) : undefined, distanceKm, score, timeSpentSeconds, collectionId: reviewAttempt.collectionId, canMove: reviewAttempt.canMove, canPan: reviewAttempt.canPan, canZoom: reviewAttempt.canZoom, showCompass: ctx.reviewCompass, environment: reviewAttempt.environment ?? 'mixed', environmentRequested: reviewAttempt.environmentRequested ?? reviewAttempt.environment ?? 'mixed', urbanLevel: reviewAttempt.urbanLevel ?? 3, samplingMode: reviewAttempt.samplingMode ?? 'natural', createdAt: Date.now(), source: 'review', sourceAttemptId: reviewAttempt.id, locationId: reviewAttempt.panoId, reviewAttemptId: id, isFallbackPanorama: !!currentLocation.isFallback, fallbackPanorama: currentLocation.isFallback, originalPanoId: currentLocation.originalPanoId, learnSource: reviewAttempt.learnSource, metaLessonId: reviewAttempt.metaLessonId, ...(variation ? { shownPanoId: variation.shownPanoId, shownLat: currentLocation.lat, shownLng: currentLocation.lng, shownHeading: variation.shownHeading, distanceFromAnchorM: variation.distanceM, reviewViewKind: variation.kind, generalizationLevel: variation.level } : {}), ...(coachNote ? { coachUsed: true, coachMode: coachNote.mode, coachModel: coachNote.model, coachGeneratedAt: coachNote.generatedAt, coachAnalysis: coachNote.analysis } : {}) };
      const correctCountry = attempt.guessedCountryCode === attempt.countryCode;
      const grade = allowNearbyIslandReview(reviewKind === 'correction' ? reviewGradeForCorrection(score, attempt.countryCode, attempt.guessedCountryCode, scheduler) : reviewGradeForPerformance(score, timeSpentSeconds, correctCountry, scheduler.maximumAnswerSeconds, scheduler.strictness, configuredCountryScoreFloor(attempt.countryCode, scheduler)), nearbyIslandGuess(attempt.countryCode, attempt.guessedCountryCode, distanceKm));
      const scheduled = failedEarlierInSession(reviewStats, reviewAttempt.id) || shouldScheduleReview(reviewKind, previous, Date.now(), scheduler);
      const schedule = scheduled ? await trainerDb.gradeReview(reviewAttempt.panoId, grade, reviewKind === 'correction' && grade !== 'again' ? 1 : undefined, { level: attempt.generalizationLevel, kind: attempt.reviewViewKind }, { previous, preferences: scheduler }) : await trainerDb.updateReviewGeneralization(reviewAttempt.panoId, grade, { level: attempt.generalizationLevel, kind: attempt.reviewViewKind }, { previous }) || previous;
      const savedAttempt = { ...attempt, grade, reviewedAt: Date.now(), previousDueAt: previous?.dueAt, nextDueAt: schedule?.dueAt, intervalDays: schedule?.intervalDays };
      if (reviewAttempt.sourcePointHash) savedAttempt.sourcePointHash = reviewAttempt.sourcePointHash;
      await trainerDb.saveAttempt(savedAttempt);
      for (const item of reviewQueue) if (item.countryCode === reviewAttempt.countryCode && calculateDistanceKm(item.actualLat, item.actualLng, reviewAttempt.actualLat, reviewAttempt.actualLng) <= .05) preparedCardsRef.current.delete(item.id);
      const stats = [...reviewStats, { previous: reviewAttempt.score, current: score, grade, attemptId: reviewAttempt.id }];
      const remaining = queueAfterReview(reviewQueue, reviewAttempt, grade);
      await trainerDb.setSetting('review.active', remaining.length ? { attemptIds: remaining.map((item) => item.id), source: reviewSource, kind: reviewKind, initialTotal: reviewInitialTotal, compass: ctx.reviewCompass, stats } satisfies SavedReviewSession : null);
      setReviewAttemptRecord(savedAttempt); setReviewResult(round); setReviewStats(stats); setReviewQueue(remaining); setTrainerRefreshKey((key: number) => key + 1);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Could not save this review.'); }
    finally { reviewGradingRef.current = false; setIsSubmittingGuess(false); }
  }, [reviewDisplayedPanoId, coachNote, currentLocation, reviewAttempt, reviewInitialTotal, reviewKind, reviewQueue, reviewResult, reviewSource, reviewStats, roundStartTimeRef, setErrorMessage, setIsSubmittingGuess, setTrainerRefreshKey, ctx.reviewCompass]);

  const handleReviewNext = useCallback(async () => {
    if (!reviewAttempt || !reviewResult || !reviewAttemptRecord || reviewGradingRef.current) return;
    if (!reviewQueue.length) { setReviewAttempt(null); setReviewResult(null); setCurrentLocation(null); setReviewComplete(true); }
    else await openReviewAttempt(reviewQueue[0]);
  }, [openReviewAttempt, reviewAttempt, reviewAttemptRecord, reviewQueue, reviewResult, setCurrentLocation, setReviewAttempt]);

  const clearReviewSession = useCallback(() => { reviewOpenRequestRef.current += 1; prefetchEpochRef.current++; preparedCardsRef.current.clear(); setReviewAttempt(null); setReviewResult(null); setReviewAttemptRecord(null); setReviewQueue([]); setReviewComplete(false); void trainerDb.setSetting('review.active', null); }, [setReviewAttempt]);
  return { reviewResult, setReviewResult, reviewAttemptRecord, setReviewAttemptRecord, reviewQueue, setReviewQueue, reviewOriginalQueue, reviewSource, reviewKind, reviewHistory, reviewIntervals, reviewElapsed, reviewInitialTotal, reviewStats, reviewComplete, reviewGradingRef, handleStartReview, handleReviewGuess, handleReviewNext, clearReviewSession, openReviewAttempt };
}
