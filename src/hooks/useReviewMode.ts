import { useCallback, useEffect, useRef, useState } from 'react';
import { Attempt, GameRound, LocationResult, ReviewGrade, ReviewSessionKind } from '../types';
import { calculateDistanceKm, calculateRoundScore } from '../services/gameLogic';
import { reverseGeocodeLocation } from '../services/geocoding';
import { defaultLocationGenerator } from '../services/locationGenerator';
import { reviewGradeForCorrection, reviewGradeForPerformance, shouldScheduleReview, trainerDb } from '../data/trainerDb';

export function useReviewMode(ctx: any) {
  const { dbReady, mapsReady, reviewAttempt, setReviewAttempt, currentLocation, setCurrentLocation, setIsLoading,
    setErrorMessage, compassPreference, setTrainerRefreshKey, roundStartTimeRef, setIsSubmittingGuess,
    isSubmittingGuess, coachNote, reviewCompass, setCoachNote } = ctx;
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
  const [reviewStats, setReviewStats] = useState<Array<{ previous: number; current: number; grade: ReviewGrade }>>([]);
  const [reviewComplete, setReviewComplete] = useState(false);
  const reviewGradingRef = useRef(false);
  const reviewRestoreAttemptedRef = useRef(false);

  const openReviewAttempt = useCallback(async (attempt: Attempt) => {
    setReviewAttempt(attempt); setReviewResult(null); setReviewAttemptRecord(null); setReviewElapsed(0); setCurrentLocation(null); setCoachNote(null); setIsLoading(true); setErrorMessage(null);
    try {
      const reopened = await defaultLocationGenerator.reopenLocation({ panoId: attempt.panoId, lat: attempt.actualLat, lng: attempt.actualLng, countryCode: attempt.countryCode });
      setCurrentLocation(reopened); roundStartTimeRef.current = Date.now();
      const [attempts, intervals] = await Promise.all([trainerDb.attempts(), trainerDb.reviewIntervals(attempt.panoId)]);
      setReviewHistory(attempts.filter((item) => item.panoId === attempt.panoId).sort((a, b) => b.createdAt - a.createdAt)); setReviewIntervals(intervals);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Review location is unavailable.'); setReviewAttempt(null); } finally { setIsLoading(false); }
  }, [setCoachNote, setCurrentLocation, setErrorMessage, setIsLoading, setReviewAttempt, roundStartTimeRef]);

  const handleStartReview = useCallback(async (attempt: Attempt, queue: Attempt[] = [attempt], source = 'History', kind: ReviewSessionKind = 'practice') => {
    const compass = attempt.showCompass ?? compassPreference;
    setReviewQueue(queue); setReviewOriginalQueue(queue); setReviewInitialTotal(queue.length); setReviewStats([]); setReviewComplete(false); setReviewSource(source); setReviewKind(kind);
    ctx.setReviewCompass(compass);
    await trainerDb.setSetting('review.active', { attemptIds: queue.map((item) => item.id), source, kind, initialTotal: queue.length, compass });
    await openReviewAttempt(attempt);
  }, [compassPreference, ctx, openReviewAttempt]);

  useEffect(() => {
    if (!dbReady || !mapsReady || reviewRestoreAttemptedRef.current || reviewAttempt) return;
    reviewRestoreAttemptedRef.current = true;
    void (async () => {
      const saved = await trainerDb.setting<{ attemptIds: string[]; source: string; kind?: ReviewSessionKind; initialTotal: number; compass?: boolean } | null>('review.active');
      if (!saved?.attemptIds.length) return;
      const attempts = await trainerDb.attempts(); const byId = new Map(attempts.map((item) => [item.id, item]));
      const queue = saved.attemptIds.map((id) => byId.get(id)).filter((item): item is Attempt => !!item); if (!queue.length) return;
      const kind = saved.kind ?? (saved.source === 'Game mistakes' ? 'correction' : saved.source.includes('Due Today') ? 'due' : 'practice');
      setReviewQueue(queue); setReviewOriginalQueue(queue); setReviewInitialTotal(saved.initialTotal); setReviewSource(saved.source); setReviewKind(kind); ctx.setReviewCompass(saved.compass ?? queue[0].showCompass ?? compassPreference); setReviewStats([]); await openReviewAttempt(queue[0]);
    })();
  }, [compassPreference, dbReady, mapsReady, openReviewAttempt, reviewAttempt, ctx]);

  useEffect(() => { if (!reviewAttempt || reviewResult) return; const timer = window.setInterval(() => setReviewElapsed(Math.max(0, Math.round((Date.now() - roundStartTimeRef.current) / 1000))), 1000); return () => window.clearInterval(timer); }, [reviewAttempt, reviewResult, roundStartTimeRef]);

  const handleReviewGuess = useCallback(async (guess: { lat: number; lng: number } | null) => {
    if (!reviewAttempt || !currentLocation || reviewResult) return;
    setIsSubmittingGuess(true);
    const distanceKm = guess ? calculateDistanceKm(guess.lat, guess.lng, reviewAttempt.actualLat, reviewAttempt.actualLng) : null;
    const score = distanceKm === null ? 0 : calculateRoundScore(distanceKm);
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - roundStartTimeRef.current) / 1000));
    const round: GameRound = { roundNumber: 1, location: { ...currentLocation, lat: reviewAttempt.actualLat, lng: reviewAttempt.actualLng, countryCode: reviewAttempt.countryCode }, guess, distanceKm, score, timeSpentSeconds };
    const id = `review-attempt-${crypto.randomUUID()}`;
    const attempt: Attempt = { id, gameId: `review-${new Date().toISOString().slice(0, 10)}`, roundNumber: 1, panoId: reviewAttempt.panoId, actualLat: reviewAttempt.actualLat, actualLng: reviewAttempt.actualLng, countryCode: reviewAttempt.countryCode, guessedLat: guess?.lat ?? null, guessedLng: guess?.lng ?? null, guessedCountryCode: guess ? (await reverseGeocodeLocation(guess.lat, guess.lng))?.countryCode : undefined, distanceKm, score, timeSpentSeconds, collectionId: reviewAttempt.collectionId, canMove: reviewAttempt.canMove, canPan: reviewAttempt.canPan, canZoom: reviewAttempt.canZoom, showCompass: ctx.reviewCompass, environment: reviewAttempt.environment ?? 'mixed', environmentRequested: reviewAttempt.environmentRequested ?? reviewAttempt.environment ?? 'mixed', urbanLevel: reviewAttempt.urbanLevel ?? 3, samplingMode: reviewAttempt.samplingMode ?? 'natural', createdAt: Date.now(), source: 'review', sourceAttemptId: reviewAttempt.id, locationId: reviewAttempt.panoId, reviewAttemptId: id, isFallbackPanorama: !!currentLocation.isFallback, fallbackPanorama: currentLocation.isFallback, originalPanoId: currentLocation.originalPanoId, learnSource: reviewAttempt.learnSource, metaLessonId: reviewAttempt.metaLessonId, ...(coachNote ? { coachUsed: true, coachMode: coachNote.mode, coachModel: coachNote.model, coachGeneratedAt: coachNote.generatedAt, coachAnalysis: coachNote.analysis } : {}) };
    setReviewAttemptRecord(attempt); setReviewResult(round); setIsSubmittingGuess(false);
  }, [coachNote, currentLocation, reviewAttempt, reviewResult, roundStartTimeRef, setIsSubmittingGuess, ctx.reviewCompass]);

  const handleReviewNext = useCallback(async () => {
    if (!reviewAttempt || !reviewResult || !reviewAttemptRecord || reviewGradingRef.current) return;
    const correctCountry = reviewAttemptRecord.guessedCountryCode === reviewAttemptRecord.countryCode;
    const schedulerPreferences = await trainerDb.schedulerPreferences();
    const grade = reviewKind === 'correction' ? reviewGradeForCorrection(reviewResult.score, reviewAttemptRecord.countryCode, reviewAttemptRecord.guessedCountryCode, schedulerPreferences.strictness) : reviewGradeForPerformance(reviewResult.score, reviewResult.timeSpentSeconds, correctCountry, schedulerPreferences.maximumAnswerSeconds, schedulerPreferences.strictness);
    reviewGradingRef.current = true;
    try {
      const previous = (await trainerDb.reviews()).find((item) => item.panoId === reviewAttempt.panoId); const scheduled = shouldScheduleReview(reviewKind, previous, Date.now(), schedulerPreferences);
      const schedule = scheduled ? await trainerDb.gradeReview(reviewAttempt.panoId, grade, reviewKind === 'correction' && grade !== 'again' ? 1 : undefined) : previous;
      await trainerDb.saveAttempt({ ...reviewAttemptRecord, grade, reviewedAt: Date.now(), previousDueAt: previous?.dueAt, nextDueAt: schedule?.dueAt, intervalDays: schedule?.intervalDays });
      const stats = [...reviewStats, { previous: reviewAttempt.score, current: reviewResult.score, grade }]; setReviewStats(stats);
      const remaining = reviewQueue.slice(1); if (grade === 'again') remaining.push(reviewAttempt); setReviewQueue(remaining); setTrainerRefreshKey((key: number) => key + 1);
      if (!remaining.length) { setReviewAttempt(null); setReviewResult(null); setCurrentLocation(null); setReviewComplete(true); await trainerDb.setSetting('review.active', null); } else { await trainerDb.setSetting('review.active', { attemptIds: remaining.map((item) => item.id), source: reviewSource, kind: reviewKind, initialTotal: reviewInitialTotal, compass: ctx.reviewCompass }); await openReviewAttempt(remaining[0]); }
    } finally { reviewGradingRef.current = false; }
  }, [ctx.reviewCompass, currentLocation, openReviewAttempt, reviewAttempt, reviewAttemptRecord, reviewInitialTotal, reviewKind, reviewQueue, reviewResult, reviewSource, reviewStats, setCurrentLocation, setReviewAttempt, setTrainerRefreshKey]);

  const clearReviewSession = useCallback(() => { setReviewAttempt(null); setReviewResult(null); setReviewAttemptRecord(null); setReviewQueue([]); setReviewComplete(false); void trainerDb.setSetting('review.active', null); }, [setReviewAttempt]);
  return { reviewResult, setReviewResult, reviewAttemptRecord, setReviewAttemptRecord, reviewQueue, setReviewQueue, reviewOriginalQueue, reviewSource, reviewKind, reviewHistory, reviewIntervals, reviewElapsed, reviewInitialTotal, reviewStats, reviewComplete, reviewGradingRef, handleStartReview, handleReviewGuess, handleReviewNext, clearReviewSession, openReviewAttempt };
}
