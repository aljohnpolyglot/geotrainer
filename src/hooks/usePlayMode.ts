import { configuredCountryScoreFloor } from '../data/reviewGrading';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Attempt, GameRecord, GameRound, GameSettings, LocationResult } from '../types';
import { calculateDistanceKm, calculateRoundScore, resumeRoundStartedAt } from '../services/gameLogic';
import { creditedGuessCountry, reverseGeocodeLocation } from '../services/geocoding';
import { defaultLocationGenerator } from '../services/locationGenerator';
import { isLatestRequest } from '../services/requestIntegrity';
import { reviewGradeForPerformance, shouldAutoSchedulePlayReview, trainerDb } from '../data/trainerDb';
import { COUNTRIES } from '../data/countries';
import { captureStreetViewImage, getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { pickImportedLocation } from '../services/importedMap';
import { learningPriorityTarget, leastExposureCountryOrder, trainedWorldCountries } from '../services/learningPriority';
import { loadCityPools } from '../services/cityPools';
import { NextLocationPreparation } from '../services/nextLocationPreparation';
import { playUiSound } from '../services/audio';

export function usePlayMode(ctx: any) {
  const { allCollections, currentLocation, setCurrentLocation, setIsLoading, setErrorMessage, setIsRevealed,
    abortControllerRef, latestGenerationRequestRef, generationPendingRef,
    setTrainerRefreshKey, coachNote, setCoachNote, playAiAssistedRef, roundStartTimeRef, setIsSubmittingGuess,
    dbReady, pastGames, setPastGames, setShowHome, setAppMode, mapsReady, restoredPlayPanoRef, appMode, showHome } = ctx;
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
  const playGuessRef = useRef<{ lat: number; lng: number } | null>(null);
  const setPlayGuess = useCallback((guess: { lat: number; lng: number } | null) => { playGuessRef.current = guess; }, []);
  const generationFailedRef = useRef(false);
  const roundPausedAtRef = useRef<number | null>(null);
  const lastTimerCueRef = useRef<number | null>(null);
  const preparedRoundRef = useRef(new NextLocationPreparation<LocationResult>());
  const setSubmitting = (value: boolean) => { setLocalSubmittingGuess(value); setIsSubmittingGuess(value); };

  const findRoundLocation = async (settings: GameSettings, signal: AbortSignal, previousRounds: GameRound[], currentPanoId?: string, requestId?: number): Promise<LocationResult> => {
    const col = allCollections.find((item: any) => item.id === settings.collectionId) || allCollections[0];
    const countryCodes = settings.countryCodes?.length ? settings.countryCodes : settings.countryCode ? [settings.countryCode] : col?.countryCodes;
    if (!settings.importedMapId && (!col || !countryCodes?.length)) throw new Error('Game collection has no valid countries.');
    let priorityCountryCodes = countryCodes;
    let priorityTarget: ReturnType<typeof learningPriorityTarget> = { countryCodes: countryCodes || [] };
    let preferredCountryCodes: string[] | undefined;
    const priority = settings.priority ?? 'random';
    if (!settings.importedMapId && !settings.locationTargets?.length && countryCodes?.length && priority !== 'random') {
      const history = await trainerDb.locationMetadata();
      const wholeWorld = col?.id === 'world' && !settings.countryCodes?.length && !settings.countryCode;
      priorityCountryCodes = priority === 'least-exposure' && wholeWorld ? trainedWorldCountries(countryCodes) : countryCodes;
      if (!priorityCountryCodes.length) priorityCountryCodes = countryCodes;
      priorityTarget = learningPriorityTarget(priority, priorityCountryCodes, history);
      if (priority === 'least-exposure' && priorityTarget.countryCodes.length === 1) priorityTarget = learningPriorityTarget(priority, priorityTarget.countryCodes, history, Math.random, await loadCityPools(priorityTarget.countryCodes[0]));
      if (priorityTarget.countryCodes.length === 1 && priorityCountryCodes.length > 1) preferredCountryCodes = priority === 'least-exposure' ? leastExposureCountryOrder(priorityCountryCodes, history, priorityTarget.countryCodes[0]) : [priorityTarget.countryCodes[0], ...priorityCountryCodes.filter((code: string) => code !== priorityTarget.countryCodes[0])];
    }
    const known = settings.importedMapId && settings.skipSeenImported === true ? await Promise.all([trainerDb.locationMetadata(), trainerDb.bookmarks(), trainerDb.attempts()]).then(([locations, bookmarks, attempts]) => [...locations, ...bookmarks, ...attempts.map((attempt) => ({ panoId: attempt.panoId, lat: attempt.actualLat, lng: attempt.actualLng, countryCode: attempt.countryCode }))]) : [];
    const excluded = new Set([...previousRounds.map((round) => round.location.panoId), currentPanoId].filter((id): id is string => !!id));
    return settings.importedMapId
      ? pickImportedLocation(settings.importedMapId, excluded, signal, settings.canMove, 0, new Set(previousRounds.flatMap((round) => round.location.importedMapPointIndex === undefined ? [] : [round.location.importedMapPointIndex])), { environment: settings.environment ?? 'mixed', urbanLevel: settings.urbanLevel ?? 3, samplingMode: settings.samplingMode ?? 'natural', panoramaSource: settings.panoramaSource || (settings.allowContributors === true ? 'mixed' : 'official'), allowInteriors: settings.allowInteriors === true }, settings.importedMapOrder ?? 'shuffle', known)
      : defaultLocationGenerator.findRandomLocation(preferredCountryCodes ? priorityCountryCodes : priorityTarget.countryCodes, signal, (msg) => { if (requestId !== undefined && isLatestRequest(requestId, latestGenerationRequestRef.current)) ctx.setStatusMessage(msg); }, { environment: settings.environment ?? 'mixed', urbanLevel: settings.urbanLevel ?? 3, samplingMode: settings.samplingMode ?? 'natural', panoramaSource: settings.panoramaSource || (settings.allowContributors === true ? 'mixed' : 'official'), allowInteriors: settings.allowInteriors === true, includeWater: settings.includeWater !== false && priority === 'random' }, { requestId, collectionId: settings.countryCodes?.length || settings.countryCode ? `focus:${countryCodes.join(',')}` : col.id, preferredCandidate: priorityTarget.preferredCandidate, preferredCountryCodes, requireNavigation: settings.canMove, locationTargets: settings.locationTargets, excludedPanoIds: excluded });
  };

  const fetchLocationForRound = useCallback(async (settings: GameSettings, roundIndex = currentRoundIndex) => {
    const requestId = ++latestGenerationRequestRef.current; generationPendingRef.current = true; abortControllerRef.current?.abort();
    const abortController = new AbortController(); abortControllerRef.current = abortController;
    setCurrentLocation(null); setIsLoading(true); setErrorMessage(null); setIsRevealed(false); ctx.setStatusMessage('Finding round location...');
    try {
      const key = gameIdRef.current + ':' + roundIndex + ':' + settings.collectionId;
      const prepared = preparedRoundRef.current.take(key, abortController.signal);
      const result = await (prepared ? prepared.catch(() => findRoundLocation(settings, abortController.signal, gameRounds, currentLocation?.panoId, requestId)) : findRoundLocation(settings, abortController.signal, gameRounds, currentLocation?.panoId, requestId));
      if (isLatestRequest(requestId, latestGenerationRequestRef.current)) { generationFailedRef.current = false; playAiAssistedRef.current = false; setCoachNote(null); playGuessRef.current = null; setCurrentLocation(result); roundSubmittedRef.current = false; roundStartTimeRef.current = Date.now(); setPlayElapsed(0); setTimeRemaining(settings.timeLimitSeconds > 0 ? settings.timeLimitSeconds : null); }
    } catch (err: unknown) { if (!isLatestRequest(requestId, latestGenerationRequestRef.current) || (err instanceof Error && err.name === 'AbortError')) return; generationFailedRef.current = true; setErrorMessage(err instanceof Error ? err.message : 'Failed to generate game location'); }
    finally { if (isLatestRequest(requestId, latestGenerationRequestRef.current)) { generationPendingRef.current = false; setIsLoading(false); ctx.setStatusMessage(''); } }
  }, [abortControllerRef, allCollections, ctx, gameRounds, generationPendingRef, latestGenerationRequestRef, roundStartTimeRef, setCoachNote, setCurrentLocation, setErrorMessage, setIsLoading, setIsRevealed]);

  useEffect(() => {
    if (!mapsReady || !isGameActive || appMode !== 'play' || showHome || !gameSettings || !currentLocation || currentRoundIndex + 1 >= gameSettings.roundCount) { preparedRoundRef.current.clear(); return; }
    const key = gameIdRef.current + ':' + (currentRoundIndex + 1) + ':' + gameSettings.collectionId;
    let timer: number | null = null;
    const onVisibility = () => {
      if (timer !== null) window.clearTimeout(timer);
      if (document.hidden) { preparedRoundRef.current.clear(); return; }
      timer = window.setTimeout(() => preparedRoundRef.current.prepare(key, (signal) => findRoundLocation(gameSettings, signal, gameRounds, currentLocation.panoId)), 750);
    };
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => { if (timer !== null) window.clearTimeout(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [mapsReady, isGameActive, appMode, showHome, gameSettings, currentLocation?.panoId, currentRoundIndex, gameRounds]);

  const handleStartGame = useCallback((settings: GameSettings) => {
    preparedRoundRef.current.clear(); generationFailedRef.current = false; setShowHome(false); ctx.setIsNewGameModalOpen(false); setAppMode('play'); setIsGameActive(true); setGameSettings(settings); setGameRounds([]); setCurrentRoundIndex(0); setActiveRoundResult(null); setSummaryGameRecord(null); gameIdRef.current = `game-${crypto.randomUUID()}`; roundSubmittedRef.current = false; if (mapsReady) void fetchLocationForRound(settings, 0);
  }, [ctx, fetchLocationForRound, mapsReady, setAppMode, setGameSettings, setShowHome]);

  useEffect(() => { if (mapsReady && isGameActive && gameSettings && !currentLocation && !ctx.isLoading && !generationPendingRef.current && !generationFailedRef.current) void fetchLocationForRound(gameSettings); }, [currentLocation, fetchLocationForRound, gameSettings, isGameActive, mapsReady, ctx.isLoading]);
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
    const aiAssisted = playAiAssistedRef.current || undefined;
    roundSubmittedRef.current = true; setSubmitting(true);
    const timeSpent = Math.max(1, Math.round((Date.now() - roundStartTimeRef.current) / 1000));
    const distanceKm = guess ? calculateDistanceKm(guess.lat, guess.lng, currentLocation.lat, currentLocation.lng) : null; const score = distanceKm === null ? 0 : calculateRoundScore(distanceKm);
    const [guessedCountryCode, imageDataUrl] = await Promise.all([guess ? reverseGeocodeLocation(guess.lat, guess.lng).then((value) => creditedGuessCountry(currentLocation.countryCode, value?.countryCode, distanceKm)) : undefined, captureStreetViewImage(currentLocation.panoId)]);
    const roundRecord: GameRound = { roundNumber: currentRoundIndex + 1, location: { ...currentLocation, heading: getStreetViewSnapshot(currentLocation.panoId)?.heading ?? currentLocation.heading }, guess, distanceKm, score, timeSpentSeconds: timeSpent, guessedCountryCode };
    const attempt: Attempt = { id: `${gameIdRef.current}:${roundRecord.roundNumber}`, gameId: gameIdRef.current, roundNumber: roundRecord.roundNumber, panoId: currentLocation.panoId, actualLat: currentLocation.lat, actualLng: currentLocation.lng, countryCode: currentLocation.countryCode, guessedLat: guess?.lat ?? null, guessedLng: guess?.lng ?? null, distanceKm, score, timeSpentSeconds: timeSpent, collectionId: gameSettings.collectionId, canMove: gameSettings.canMove, canPan: gameSettings.canPan, canZoom: gameSettings.canZoom, showCompass: gameSettings.showCompass ?? true, environment: currentLocation.environment ?? gameSettings.environment ?? 'mixed', environmentRequested: currentLocation.environmentRequested ?? gameSettings.environment ?? 'mixed', urbanLevel: gameSettings.urbanLevel ?? 3, samplingMode: gameSettings.samplingMode ?? 'natural', createdAt: Date.now(), source: 'play', heading: getStreetViewSnapshot(currentLocation.panoId)?.heading, aiAssisted, guessedCountryCode, ...(coachNote ? { coachUsed: true, coachMode: coachNote.mode, coachModel: coachNote.model, coachGeneratedAt: coachNote.generatedAt, coachAnalysis: coachNote.analysis } : {}) };
    if (currentLocation.sourcePointHash) attempt.sourcePointHash = currentLocation.sourcePointHash;
    const scheduler = await trainerDb.schedulerPreferences(); const grade = reviewGradeForPerformance(score, timeSpent, guessedCountryCode === currentLocation.countryCode, scheduler.maximumAnswerSeconds, scheduler.strictness, configuredCountryScoreFloor(attempt.countryCode, scheduler));
    await Promise.all([trainerDb.encounter({ ...currentLocation, ...(imageDataUrl ? { imageDataUrl } : {}) }), trainerDb.saveAttempt(attempt), shouldAutoSchedulePlayReview(score, currentLocation.countryCode, guessedCountryCode, scheduler) ? trainerDb.scheduleFirstPlay(currentLocation.panoId, grade, currentLocation) : Promise.resolve()]);
    setGameRounds((rounds) => [...rounds, roundRecord]); setActiveRoundResult(roundRecord); setSubmitting(false); setTrainerRefreshKey((key: number) => key + 1);
  }, [activeRoundResult, coachNote, currentLocation, currentRoundIndex, gameSettings, playAiAssistedRef, roundStartTimeRef, setTrainerRefreshKey]);

  useEffect(() => { if (!isGameActive || activeRoundResult || summaryGameRecord || !currentLocation) return; const timer = window.setInterval(() => setPlayElapsed(Math.max(0, Math.round((Date.now() - roundStartTimeRef.current) / 1000))), 1000); return () => window.clearInterval(timer); }, [activeRoundResult, currentLocation, isGameActive, roundStartTimeRef, summaryGameRecord]);
  useEffect(() => { if (!isGameActive || activeRoundResult || summaryGameRecord || !currentLocation) { roundPausedAtRef.current = null; return; } const visibility = () => { if (document.visibilityState === 'hidden') roundPausedAtRef.current ??= Date.now(); else { roundStartTimeRef.current = resumeRoundStartedAt(roundStartTimeRef.current, roundPausedAtRef.current, Date.now()); roundPausedAtRef.current = null; } }; visibility(); document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, [activeRoundResult, currentLocation, isGameActive, roundStartTimeRef, summaryGameRecord]);
  useEffect(() => {
    const previous = lastTimerCueRef.current; lastTimerCueRef.current = timeRemaining;
    if (timeRemaining === null || previous === null || timeRemaining >= previous || timeRemaining > 10 || !isGameActive || activeRoundResult || summaryGameRecord || !currentLocation || appMode !== 'play' || showHome || document.hidden || roundSubmittedRef.current) return;
    playUiSound(timeRemaining === 0 ? 'timeup' : 'tick');
  }, [activeRoundResult, appMode, currentLocation, isGameActive, showHome, summaryGameRecord, timeRemaining]);
  useEffect(() => { if (!isGameActive || timeRemaining === null || activeRoundResult || summaryGameRecord) return; if (timeRemaining <= 0) { void handleGuessSubmit(playGuessRef.current); return; } const timer = window.setInterval(() => { if (document.visibilityState === 'visible') setTimeRemaining((prev) => prev !== null && prev > 0 ? prev - 1 : 0); }, 1000); return () => window.clearInterval(timer); }, [activeRoundResult, handleGuessSubmit, isGameActive, summaryGameRecord, timeRemaining]);

  const handleNextRound = useCallback(() => {
    if (!gameSettings) return;
    if (currentRoundIndex + 1 < gameSettings.roundCount) { setCurrentRoundIndex((index) => index + 1); setActiveRoundResult(null); void fetchLocationForRound(gameSettings, currentRoundIndex + 1); return; }
    const totalScore = gameRounds.reduce((acc, round) => acc + round.score, 0); const col = allCollections.find((item: any) => item.id === gameSettings.collectionId) || allCollections[0];
    const focus = gameSettings.countryCodes?.length ? gameSettings.countryCodes : gameSettings.countryCode ? [gameSettings.countryCode] : [];
    const completedGame: GameRecord = { id: gameIdRef.current, createdAt: Date.now(), collectionId: gameSettings.collectionId, collectionName: gameSettings.importedMapName || (focus.length ? focus.map((code) => COUNTRIES[code]?.name || code).join(' + ') : col.name), settings: gameSettings, totalScore, maxPossibleScore: gameSettings.roundCount * 5000, rounds: gameRounds };
    setPastGames(dbReady ? [completedGame, ...pastGames] : ctx.saveGameRecord(completedGame)); void trainerDb.saveGame(completedGame); setIsGameActive(false); setActiveRoundResult(null); setSummaryGameRecord(completedGame);
  }, [allCollections, currentRoundIndex, dbReady, fetchLocationForRound, gameRounds, gameSettings, pastGames, setPastGames, ctx]);

  const handleAbandonGame = useCallback(() => { if (!window.confirm('Abandon this game? Current round progress will not be saved.')) return; preparedRoundRef.current.clear(); abortControllerRef.current?.abort(); setIsGameActive(false); setGameRounds([]); setActiveRoundResult(null); setSummaryGameRecord(null); setSummaryRound(null); setGameSettings(null); setTimeRemaining(null); setCurrentLocation(null); roundSubmittedRef.current = false; }, [abortControllerRef, setCurrentLocation, setGameSettings]);
  return { isGameActive, setIsGameActive, gameSettings, setGameSettings, gameRounds, setGameRounds, currentRoundIndex, setCurrentRoundIndex, timeRemaining, setTimeRemaining, playElapsed, setPlayElapsed, activeRoundResult, setActiveRoundResult, summaryGameRecord, setSummaryGameRecord, summaryRound, setSummaryRound, isSubmittingGuess, fetchLocationForRound, handleStartGame, handleGuessSubmit, handleNextRound, handleAbandonGame, setPlayGuess, gameIdRef, roundSubmittedRef };
}
