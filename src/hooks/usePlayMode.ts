import { useCallback, useEffect, useRef, useState } from 'react';
import { Attempt, GameRecord, GameRound, GameSettings, LocationResult } from '../types';
import { calculateDistanceKm, calculateRoundScore, resumeRoundStartedAt } from '../services/gameLogic';
import { reverseGeocodeLocation } from '../services/geocoding';
import { defaultLocationGenerator } from '../services/locationGenerator';
import { isLatestRequest } from '../services/requestIntegrity';
import { reviewGradeForPerformance, shouldAutoSchedulePlayReview, trainerDb } from '../data/trainerDb';
import { COUNTRIES } from '../data/countries';
import { captureStreetViewImage, getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { pickImportedLocation } from '../services/importedMap';

export function usePlayMode(ctx: any) {
  const { allCollections, currentLocation, setCurrentLocation, setIsLoading, setErrorMessage, setIsRevealed,
    abortControllerRef, latestGenerationRequestRef, generationPendingRef,
    setTrainerRefreshKey, coachNote, playAiAssistedRef, roundStartTimeRef, setIsSubmittingGuess,
    dbReady, pastGames, setPastGames, setShowHome, setAppMode, mapsReady, restoredPlayPanoRef } = ctx;
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [playElapsed, setPlayElapsed] = useState(0);
  const [activeRoundResult, setActiveRoundResult] = useState<GameRound | null>(null);
  const [summaryGameRecord, setSummaryGameRecord] = useState<GameRecord | null>(null);
  const [summaryRound, setSummaryRound] = useState<GameRound | null>(null);
  const [isSubmittingGuess, setLocalSubmittingGuess] = useState(false);
  const gameIdRef = useRef('');
  const roundSubmittedRef = useRef(false);
  const generationFailedRef = useRef(false);
  const roundPausedAtRef = useRef<number | null>(null);
  const setSubmitting = (value: boolean) => { setLocalSubmittingGuess(value); setIsSubmittingGuess(value); };

  const fetchLocationForRound = useCallback(async (settings: GameSettings) => {
    const col = allCollections.find((item: any) => item.id === settings.collectionId) || allCollections[0];
    const countryCodes = settings.countryCodes?.length ? settings.countryCodes : settings.countryCode ? [settings.countryCode] : col?.countryCodes;
    if (!settings.importedMapId && (!col || !countryCodes?.length)) { generationFailedRef.current = true; setErrorMessage('Game collection has no valid countries.'); return; }
    const requestId = ++latestGenerationRequestRef.current; generationPendingRef.current = true; abortControllerRef.current?.abort();
    const abortController = new AbortController(); abortControllerRef.current = abortController;
    setCurrentLocation(null); setIsLoading(true); setErrorMessage(null); setIsRevealed(false); ctx.setStatusMessage('Finding round location...');
    try {
      const result = settings.importedMapId
        ? await pickImportedLocation(settings.importedMapId, new Set(gameRounds.map((round) => round.location.panoId)), abortController.signal, settings.canMove, 0, new Set(gameRounds.flatMap((round) => round.location.importedMapPointIndex === undefined ? [] : [round.location.importedMapPointIndex])), { environment: settings.environment ?? 'mixed', urbanLevel: settings.urbanLevel ?? 3, samplingMode: settings.samplingMode ?? 'natural', panoramaSource: settings.panoramaSource || (settings.allowContributors === true ? 'mixed' : 'official'), allowInteriors: settings.allowInteriors === true })
        : await defaultLocationGenerator.findRandomLocation(countryCodes, abortController.signal, (msg) => { if (isLatestRequest(requestId, latestGenerationRequestRef.current)) ctx.setStatusMessage(msg); }, { environment: settings.environment ?? 'mixed', urbanLevel: settings.urbanLevel ?? 3, samplingMode: settings.samplingMode ?? 'natural', panoramaSource: settings.panoramaSource || (settings.allowContributors === true ? 'mixed' : 'official'), allowInteriors: settings.allowInteriors === true }, { requestId, collectionId: settings.countryCodes?.length || settings.countryCode ? `focus:${countryCodes.join(',')}` : col.id, requireNavigation: settings.canMove, locationTargets: settings.locationTargets });
      if (isLatestRequest(requestId, latestGenerationRequestRef.current)) { generationFailedRef.current = false; playAiAssistedRef.current = false; ctx.setCoachNote(null); setCurrentLocation(result); roundSubmittedRef.current = false; roundStartTimeRef.current = Date.now(); setPlayElapsed(0); setTimeRemaining(settings.timeLimitSeconds > 0 ? settings.timeLimitSeconds : null); }
    } catch (err: unknown) { if (!isLatestRequest(requestId, latestGenerationRequestRef.current) || (err instanceof Error && err.name === 'AbortError')) return; generationFailedRef.current = true; setErrorMessage(err instanceof Error ? err.message : 'Failed to generate game location'); }
    finally { if (isLatestRequest(requestId, latestGenerationRequestRef.current)) { generationPendingRef.current = false; setIsLoading(false); ctx.setStatusMessage(''); } }
  }, [abortControllerRef, allCollections, ctx, gameRounds, generationPendingRef, latestGenerationRequestRef, roundStartTimeRef, setCurrentLocation, setErrorMessage, setIsLoading, setIsRevealed]);

  const handleStartGame = useCallback((settings: GameSettings) => {
    generationFailedRef.current = false; setShowHome(false); ctx.setIsNewGameModalOpen(false); setAppMode('play'); setIsGameActive(true); setGameSettings(settings); setGameRounds([]); setCurrentRoundIndex(0); setActiveRoundResult(null); setSummaryGameRecord(null); setSummaryRound(null); gameIdRef.current = `game-${crypto.randomUUID()}`; roundSubmittedRef.current = false; if (mapsReady) void fetchLocationForRound(settings);
  }, [ctx, fetchLocationForRound, mapsReady, setAppMode, setGameSettings, setShowHome]);

  useEffect(() => { if (mapsReady && isGameActive && gameSettings && !currentLocation && !ctx.isLoading && !generationFailedRef.current) void fetchLocationForRound(gameSettings); }, [currentLocation, fetchLocationForRound, gameSettings, isGameActive, mapsReady, ctx.isLoading]);
  useEffect(() => {
    const target = restoredPlayPanoRef?.current;
    if (!isGameActive) { if (restoredPlayPanoRef) restoredPlayPanoRef.current = null; return; }
    if (!dbReady || !mapsReady || !target || !currentLocation || currentLocation.panoId !== target) return;
    restoredPlayPanoRef.current = null;
    let active = true;
    setIsLoading(true);
    void defaultLocationGenerator.reopenLocation(currentLocation)
      .then((reopened) => { if (active) setCurrentLocation(reopened); })
      .catch((error) => { if (active) setErrorMessage(error instanceof Error ? error.message : 'This saved panorama is unavailable.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [currentLocation, dbReady, isGameActive, mapsReady, restoredPlayPanoRef, setCurrentLocation, setErrorMessage, setIsLoading]);

  const handleGuessSubmit = useCallback(async (guess: { lat: number; lng: number } | null) => {
    if (!currentLocation || !gameSettings || activeRoundResult || roundSubmittedRef.current) return;
    roundSubmittedRef.current = true; setSubmitting(true);
    const timeSpent = Math.max(1, Math.round((Date.now() - roundStartTimeRef.current) / 1000));
    const distanceKm = guess ? calculateDistanceKm(guess.lat, guess.lng, currentLocation.lat, currentLocation.lng) : null; const score = distanceKm === null ? 0 : calculateRoundScore(distanceKm);
    const [guessedCountryCode, imageDataUrl] = await Promise.all([guess ? reverseGeocodeLocation(guess.lat, guess.lng).then((value) => value?.countryCode) : undefined, captureStreetViewImage(currentLocation.panoId)]);
    const roundRecord: GameRound = { roundNumber: currentRoundIndex + 1, location: currentLocation, guess, distanceKm, score, timeSpentSeconds: timeSpent, guessedCountryCode };
    const attempt: Attempt = { id: `${gameIdRef.current}:${roundRecord.roundNumber}`, gameId: gameIdRef.current, roundNumber: roundRecord.roundNumber, panoId: currentLocation.panoId, actualLat: currentLocation.lat, actualLng: currentLocation.lng, countryCode: currentLocation.countryCode, guessedLat: guess?.lat ?? null, guessedLng: guess?.lng ?? null, distanceKm, score, timeSpentSeconds: timeSpent, collectionId: gameSettings.collectionId, canMove: gameSettings.canMove, canPan: gameSettings.canPan, canZoom: gameSettings.canZoom, showCompass: gameSettings.showCompass ?? true, environment: currentLocation.environment ?? gameSettings.environment ?? 'mixed', environmentRequested: currentLocation.environmentRequested ?? gameSettings.environment ?? 'mixed', urbanLevel: gameSettings.urbanLevel ?? 3, samplingMode: gameSettings.samplingMode ?? 'natural', createdAt: Date.now(), source: 'play', heading: getStreetViewSnapshot(currentLocation.panoId)?.heading, aiAssisted: playAiAssistedRef.current || undefined, guessedCountryCode, ...(coachNote ? { coachUsed: true, coachMode: coachNote.mode, coachModel: coachNote.model, coachGeneratedAt: coachNote.generatedAt, coachAnalysis: coachNote.analysis } : {}) };
    const scheduler = await trainerDb.schedulerPreferences(); const grade = reviewGradeForPerformance(score, timeSpent, guessedCountryCode === currentLocation.countryCode, scheduler.maximumAnswerSeconds, scheduler.strictness);
    await Promise.all([trainerDb.encounter({ ...currentLocation, ...(imageDataUrl ? { imageDataUrl } : {}) }), trainerDb.saveAttempt(attempt), shouldAutoSchedulePlayReview(score, currentLocation.countryCode, guessedCountryCode, scheduler) ? trainerDb.scheduleFirstPlay(currentLocation.panoId, grade, currentLocation) : Promise.resolve()]);
    setGameRounds((rounds) => [...rounds, roundRecord]); setActiveRoundResult(roundRecord); setSubmitting(false); setTrainerRefreshKey((key: number) => key + 1);
  }, [activeRoundResult, coachNote, currentLocation, currentRoundIndex, gameSettings, playAiAssistedRef, roundStartTimeRef, setTrainerRefreshKey]);

  useEffect(() => { if (!isGameActive || activeRoundResult || summaryGameRecord || !currentLocation) return; const timer = window.setInterval(() => setPlayElapsed(Math.max(0, Math.round((Date.now() - roundStartTimeRef.current) / 1000))), 1000); return () => window.clearInterval(timer); }, [activeRoundResult, currentLocation, isGameActive, roundStartTimeRef, summaryGameRecord]);
  useEffect(() => { if (!isGameActive || activeRoundResult || summaryGameRecord || !currentLocation) { roundPausedAtRef.current = null; return; } const visibility = () => { if (document.visibilityState === 'hidden') roundPausedAtRef.current ??= Date.now(); else { roundStartTimeRef.current = resumeRoundStartedAt(roundStartTimeRef.current, roundPausedAtRef.current, Date.now()); roundPausedAtRef.current = null; } }; visibility(); document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, [activeRoundResult, currentLocation, isGameActive, roundStartTimeRef, summaryGameRecord]);
  useEffect(() => { if (!isGameActive || timeRemaining === null || activeRoundResult || summaryGameRecord) return; if (timeRemaining <= 0) { void handleGuessSubmit(null); return; } const timer = window.setInterval(() => { if (document.visibilityState === 'visible') setTimeRemaining((prev) => prev !== null && prev > 0 ? prev - 1 : 0); }, 1000); return () => window.clearInterval(timer); }, [activeRoundResult, handleGuessSubmit, isGameActive, summaryGameRecord, timeRemaining]);

  const handleNextRound = useCallback(() => {
    if (!gameSettings) return;
    if (currentRoundIndex + 1 < gameSettings.roundCount) { setCurrentRoundIndex((index) => index + 1); setActiveRoundResult(null); void fetchLocationForRound(gameSettings); return; }
    const totalScore = gameRounds.reduce((acc, round) => acc + round.score, 0); const col = allCollections.find((item: any) => item.id === gameSettings.collectionId) || allCollections[0];
    const focus = gameSettings.countryCodes?.length ? gameSettings.countryCodes : gameSettings.countryCode ? [gameSettings.countryCode] : [];
    const completedGame: GameRecord = { id: gameIdRef.current, createdAt: Date.now(), collectionId: gameSettings.collectionId, collectionName: gameSettings.importedMapName || (focus.length ? focus.map((code) => COUNTRIES[code]?.name || code).join(' + ') : col.name), settings: gameSettings, totalScore, maxPossibleScore: gameSettings.roundCount * 5000, rounds: gameRounds };
    setPastGames(dbReady ? [completedGame, ...pastGames] : ctx.saveGameRecord(completedGame)); void trainerDb.saveGame(completedGame); setIsGameActive(false); setActiveRoundResult(null); setSummaryGameRecord(completedGame);
  }, [allCollections, currentRoundIndex, dbReady, fetchLocationForRound, gameRounds, gameSettings, pastGames, setPastGames, ctx]);

  const handleAbandonGame = useCallback(() => { if (!window.confirm('Abandon this game? Current round progress will not be saved.')) return; abortControllerRef.current?.abort(); setIsGameActive(false); setGameRounds([]); setActiveRoundResult(null); setSummaryGameRecord(null); setSummaryRound(null); setGameSettings(null); setTimeRemaining(null); setCurrentLocation(null); roundSubmittedRef.current = false; }, [abortControllerRef, setCurrentLocation, setGameSettings]);
  return { isGameActive, setIsGameActive, gameSettings, setGameSettings, gameRounds, setGameRounds, currentRoundIndex, setCurrentRoundIndex, timeRemaining, setTimeRemaining, playElapsed, setPlayElapsed, activeRoundResult, setActiveRoundResult, summaryGameRecord, setSummaryGameRecord, summaryRound, setSummaryRound, isSubmittingGuess, fetchLocationForRound, handleStartGame, handleGuessSubmit, handleNextRound, handleAbandonGame, gameIdRef, roundSubmittedRef };
}
