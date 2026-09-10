/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Collection,
  LocationResult,
  BookmarkLocation,
  AppMode,
  GameSettings,
  GameRound,
  GameRecord,
  Attempt,
  ReviewGrade,
  StudyVisit,
  TrainerLocation,
  TrainingSession,
  Environment,
  UrbanLevel,
  SamplingMode,
  CoachAnalysis,
  CoachMode,
} from './types';
import {
  BUILT_IN_COLLECTIONS,
  BUILT_IN_COLLECTION_GROUPS,
  getCustomCollections,
  saveCustomCollection,
  deleteCustomCollection,
} from './data/collections';
import { COUNTRIES } from './data/countries';
import {
  getBookmarks,
  saveBookmark,
  deleteBookmark,
  isLocationBookmarked,
} from './data/bookmarks';
import {
  getGameHistory,
  saveGameRecord,
  deleteGameRecord,
  clearGameHistory,
} from './data/games';
import { calculateDistanceKm, calculateRoundScore, formatTime } from './services/gameLogic';
import { getFlagCdnUrl, reverseGeocodeLocation } from './services/geocoding';
import { initTrainerDb, reviewGradeForScore, trainerDb } from './data/trainerDb';
import { defaultLocationGenerator } from './services/locationGenerator';
import { isCurrentPanorama, isLatestRequest } from './services/requestIntegrity';
import { StreetViewContainer } from './components/StreetViewContainer';
import { CustomCollectionModal } from './components/CustomCollectionModal';
import { BookmarksModal } from './components/BookmarksModal';
import { LocationCard } from './components/LocationCard';
import { GuessMap } from './components/GuessMap';
import { RoundResultModal } from './components/RoundResultModal';
import { GameSummaryModal } from './components/GameSummaryModal';
import { NewGameModal } from './components/NewGameModal';
import { GameHistoryModal } from './components/GameHistoryModal';
import { TrainerHub } from './components/TrainerHub';
import type { HubTab } from './components/TrainerHub';
import { MainMenu } from './components/MainMenu';
import { ReviewResultPanel } from './components/ReviewResultPanel';
import { AiCoach } from './components/AiCoach';
import { CoverageStudyModal } from './components/CoverageStudyModal';
import {
  Shuffle,
  ChevronDown,
  Plus,
  Settings2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Gamepad2,
  Trophy,
  History,
  Clock,
  Play,
  XCircle,
  Target,
  House,
  Compass,
  Sun,
  ChartNoAxesCombined,
} from 'lucide-react';

const LAST_COLLECTION_STORAGE_KEY = 'sv_last_selected_collection_id';
const COMPASS_STORAGE_KEY = 'sv_show_compass';
const SUN_HINTS_STORAGE_KEY = 'sv_sun_training_hints';
const ENVIRONMENT_STORAGE_KEY = 'sv_environment';
const URBAN_LEVEL_STORAGE_KEY = 'sv_urban_level';
const SAMPLING_STORAGE_KEY = 'sv_sampling_mode';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('study');
  const [customCollections, setCustomCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('world');
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Exact location reveal & bookmarks state (Study mode)
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BookmarkLocation[]>([]);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState<boolean>(false);
  const [compassPreference, setCompassPreference] = useState(() => localStorage.getItem(COMPASS_STORAGE_KEY) !== 'false');
  const [sunTrainingHints, setSunTrainingHints] = useState(() => localStorage.getItem(SUN_HINTS_STORAGE_KEY) === 'true');
  const [reviewCompass, setReviewCompass] = useState(true);
  const [studyEnvironment, setStudyEnvironment] = useState<Environment>(() => (localStorage.getItem(ENVIRONMENT_STORAGE_KEY) as Environment) || 'mixed');
  const [studyUrbanLevel, setStudyUrbanLevel] = useState<UrbanLevel>(() => Number(localStorage.getItem(URBAN_LEVEL_STORAGE_KEY) || 3) as UrbanLevel);
  const [studySampling, setStudySampling] = useState<SamplingMode>(() => (localStorage.getItem(SAMPLING_STORAGE_KEY) as SamplingMode) || 'natural');

  // Play Mode State
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [playElapsed, setPlayElapsed] = useState(0);
  const [activeRoundResult, setActiveRoundResult] = useState<GameRound | null>(null);
  const [summaryGameRecord, setSummaryGameRecord] = useState<GameRecord | null>(null);
  const [pastGames, setPastGames] = useState<GameRecord[]>([]);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);
  const roundStartTimeRef = useRef<number>(Date.now());
  const roundSubmittedRef = useRef(false);
  const playAiAssistedRef = useRef(false);
  const gameIdRef = useRef<string>('');

  const [dbReady, setDbReady] = useState(false);
  const [trainerRefreshKey, setTrainerRefreshKey] = useState(0);
  const [trainerStartTab, setTrainerStartTab] = useState<HubTab>('progress');
  const [coveragePreview, setCoveragePreview] = useState<TrainerLocation | null>(null);
  const [showHome, setShowHome] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const [temporaryCollection, setTemporaryCollection] = useState<Collection | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<Attempt | null>(null);
  const [reviewResult, setReviewResult] = useState<GameRound | null>(null);
  const [reviewAttemptRecord, setReviewAttemptRecord] = useState<Attempt | null>(null);
  const [reviewQueue, setReviewQueue] = useState<Attempt[]>([]);
  const [reviewOriginalQueue, setReviewOriginalQueue] = useState<Attempt[]>([]);
  const [reviewSource, setReviewSource] = useState('Review Queue');
  const [reviewHistory, setReviewHistory] = useState<Attempt[]>([]);
  const [reviewIntervals, setReviewIntervals] = useState<Record<ReviewGrade, number>>({ again: 5 / 1440, hard: 1, good: 3, easy: 7 });
  const [reviewElapsed, setReviewElapsed] = useState(0);
  const [reviewInitialTotal, setReviewInitialTotal] = useState(1);
  const [reviewStats, setReviewStats] = useState<Array<{ previous: number; current: number; grade: ReviewGrade }>>([]);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [studyReviewSaving, setStudyReviewSaving] = useState(false);
  const [studyReviewSaved, setStudyReviewSaved] = useState(false);
  const [coachNote, setCoachNote] = useState<{ mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis } | null>(null);
  const reviewGradingRef = useRef(false);
  const reviewRestoreAttemptedRef = useRef(false);
  const currentVisitRef = useRef<StudyVisit | null>(null);
  const activeStartedAtRef = useRef<number | null>(null);
  const sessionRef = useRef<TrainingSession>({
    id: `session-${crypto.randomUUID()}`,
    startedAt: Date.now(),
    activeTimeSeconds: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestGenerationRequestRef = useRef(0);
  const latestPanoramaSyncRef = useRef(0);
  const recentStudyPanosRef = useRef<string[]>([]);
  const currentLocationRef = useRef<LocationResult | null>(null);
  const generationPendingRef = useRef(false);
  const isMapsReadyRef = useRef<boolean>(false);
  const hasAutoFetchedRef = useRef<boolean>(false);
  const studyEnvironmentRef = useRef(studyEnvironment);
  const studyUrbanLevelRef = useRef(studyUrbanLevel);
  const studySamplingRef = useRef(studySampling);
  studyEnvironmentRef.current = studyEnvironment;
  studyUrbanLevelRef.current = studyUrbanLevel;
  studySamplingRef.current = studySampling;
  currentLocationRef.current = currentLocation;

  // Load custom collections, bookmarks, and past games on mount
  useEffect(() => {
    const custom = getCustomCollections();
    setCustomCollections(custom);

    const savedBookmarks = getBookmarks();
    setBookmarks(savedBookmarks);

    const savedGames = getGameHistory();
    setPastGames(savedGames);

    const savedId = localStorage.getItem(LAST_COLLECTION_STORAGE_KEY);
    if (savedId) {
      const exists =
        BUILT_IN_COLLECTIONS.some((c) => c.id === savedId) ||
        custom.some((c) => c.id === savedId);
      if (exists) {
        setSelectedCollectionId(savedId);
      }
    }
    void initTrainerDb()
      .then(async () => {
        const [dbCollections, dbBookmarks, dbGames, dbSelected] = await Promise.all([
          trainerDb.collections(), trainerDb.bookmarks(), trainerDb.games(), trainerDb.setting<string>('selectedCollectionId'),
        ]);
        setCustomCollections(dbCollections);
        setBookmarks(dbBookmarks);
        setPastGames(dbGames);
        if (dbSelected) setSelectedCollectionId(dbSelected);
        setDbReady(true);
        setTrainerRefreshKey((key) => key + 1);
      })
      .catch((error) => {
        console.error('Trainer database failed to initialize; legacy data remains available.', error);
        setErrorMessage('Training database could not be opened. Existing legacy progress is still available.');
      });
  }, []);

  // Get active collection object
  const allCollections = [...BUILT_IN_COLLECTIONS, ...customCollections, ...(temporaryCollection ? [temporaryCollection] : [])];
  const activeCollection =
    allCollections.find((c) => c.id === selectedCollectionId) || BUILT_IN_COLLECTIONS[0];
  const activeCollectionRef = useRef(activeCollection);
  activeCollectionRef.current = activeCollection;

  const flushStudyActive = useCallback((resume = false) => {
    const startedAt = activeStartedAtRef.current;
    const visit = currentVisitRef.current;
    if (startedAt && visit) {
      const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
      visit.activeTimeSeconds += elapsed;
      sessionRef.current.activeTimeSeconds += elapsed;
      void trainerDb.saveVisit({ ...visit });
      void trainerDb.saveSession({ ...sessionRef.current });
    }
    activeStartedAtRef.current = resume && document.visibilityState === 'visible' && !!visit ? Date.now() : null;
  }, []);

  const closeStudyVisit = useCallback(() => {
    flushStudyActive(false);
    if (currentVisitRef.current) {
      currentVisitRef.current.closedAt = Date.now();
      void trainerDb.saveVisit({ ...currentVisitRef.current });
      currentVisitRef.current = null;
    }
  }, [flushStudyActive]);

  useEffect(() => {
    if (!dbReady) return;
    closeStudyVisit();
    if (showHome || appMode !== 'study' || !currentLocation || isLoading) return;
    const openedAt = Date.now();
    const visit: StudyVisit = {
      id: `visit-${crypto.randomUUID()}`,
      panoId: currentLocation.panoId,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      countryCode: currentLocation.countryCode,
      collectionId: selectedCollectionId,
      environment: currentLocation.environment ?? studyEnvironmentRef.current,
      environmentRequested: currentLocation.environmentRequested ?? studyEnvironmentRef.current,
      urbanLevel: currentLocation.urbanLevel ?? studyUrbanLevelRef.current,
      samplingMode: studySamplingRef.current,
      openedAt,
      activeTimeSeconds: 0,
      wasRevealed: false,
      bookmarked: bookmarks.some((item) => item.panoId === currentLocation.panoId),
    };
    currentVisitRef.current = visit;
    activeStartedAtRef.current = document.visibilityState === 'visible' ? openedAt : null;
    void Promise.all([trainerDb.encounter(currentLocation, openedAt), trainerDb.saveVisit(visit)]).then(() => setTrainerRefreshKey((key) => key + 1));
  }, [dbReady, showHome, appMode, currentLocation?.panoId, isLoading]);

  useEffect(() => {
    const onVisibility = () => flushStudyActive(document.visibilityState === 'visible');
    const onBlur = () => flushStudyActive(false);
    const onFocus = () => flushStudyActive(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      closeStudyVisit();
      sessionRef.current.endedAt = Date.now();
      void trainerDb.saveSession({ ...sessionRef.current });
    };
  }, [flushStudyActive, closeStudyVisit]);

  useEffect(() => {
    if (!isRevealed || !currentVisitRef.current) return;
    currentVisitRef.current.wasRevealed = true;
    void trainerDb.saveVisit({ ...currentVisitRef.current });
  }, [isRevealed]);

  const handleStudyMetadata = useCallback((details: { panoId: string; country?: string; countryCode?: string; exactAddress?: string; locality?: string; adminArea?: string }) => {
    if (!currentVisitRef.current || !isCurrentPanorama(details.panoId, currentVisitRef.current.panoId) || !isCurrentPanorama(details.panoId, currentLocationRef.current?.panoId)) return;
    Object.assign(currentVisitRef.current, details);
    void trainerDb.saveVisit({ ...currentVisitRef.current });
  }, []);

  const handleStudyPanoramaChanged = useCallback(async (location: LocationResult) => {
    if (generationPendingRef.current || currentLocationRef.current?.panoId === location.panoId) return;
    setIsRevealed(false);
    const syncId = ++latestPanoramaSyncRef.current;
    const generationId = latestGenerationRequestRef.current;
    const resolved = await reverseGeocodeLocation(location.lat, location.lng);
    if (syncId !== latestPanoramaSyncRef.current || !isLatestRequest(generationId, latestGenerationRequestRef.current)) return;
    if (!resolved?.countryCode) {
      setCurrentLocation(null);
      playAiAssistedRef.current = false;
      setErrorMessage('The moved panorama could not be geographically verified. Generate another location.');
      return;
    }
    setCurrentLocation({ ...location, countryCode: resolved.countryCode });
    recentStudyPanosRef.current = [location.panoId, ...recentStudyPanosRef.current.filter((id) => id !== location.panoId)].slice(0, 15);
  }, []);

  // Core randomizer location fetcher
  const fetchNextLocation = useCallback(async () => {
    const collection = activeCollectionRef.current;
    if (!collection || collection.countryCodes.length === 0) {
      setErrorMessage('Current collection has no countries selected.');
      return;
    }

    const requestId = ++latestGenerationRequestRef.current;
    generationPendingRef.current = true;
    latestPanoramaSyncRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setCurrentLocation(null);
    setCoachNote(null);
    setIsLoading(true);
    setErrorMessage(null);
    setIsRevealed(false); // Reset reveal toggle for fresh immersion!
    setStatusMessage('Finding random Street View panorama...');

    try {
      const result = await defaultLocationGenerator.findRandomLocation(
        collection.countryCodes,
        abortController.signal,
        (msg) => { if (isLatestRequest(requestId, latestGenerationRequestRef.current)) setStatusMessage(msg); },
        { environment: studyEnvironmentRef.current, urbanLevel: studyUrbanLevelRef.current, samplingMode: studySamplingRef.current },
        { requestId, collectionId: collection.id, excludedPanoIds: new Set(recentStudyPanosRef.current) }
      );

      if (!isLatestRequest(requestId, latestGenerationRequestRef.current)) return;
      recentStudyPanosRef.current = [result.panoId, ...recentStudyPanosRef.current.filter((id) => id !== result.panoId)].slice(0, 15);
      setCurrentLocation(result);
    } catch (err: unknown) {
      if (!isLatestRequest(requestId, latestGenerationRequestRef.current) || (err instanceof Error && err.name === 'AbortError')) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to generate random location';
      console.error('Error fetching random street view:', err);
      setErrorMessage(message);
    } finally {
      if (isLatestRequest(requestId, latestGenerationRequestRef.current)) {
        generationPendingRef.current = false;
        setIsLoading(false);
        setStatusMessage('');
      }
    }
  }, []);

  // Callback when Google Maps API has fully loaded
  const handleMapsLoaded = useCallback(() => {
    isMapsReadyRef.current = true;
    setMapsReady(true);
    if (!showHome && appMode === 'study' && !currentLocation && !hasAutoFetchedRef.current) {
      hasAutoFetchedRef.current = true;
      fetchNextLocation();
    }
  }, [fetchNextLocation, showHome, appMode, currentLocation]);

  // Save selected collection change
  const handleSelectCollection = (id: string) => {
    if (id === '__create_new__') {
      setEditingCollection(null);
      setIsModalOpen(true);
      return;
    }
    setSelectedCollectionId(id);
    if (dbReady) void trainerDb.setSetting('selectedCollectionId', id);
    else localStorage.setItem(LAST_COLLECTION_STORAGE_KEY, id);
    if (isMapsReadyRef.current && appMode === 'study') {
      setTimeout(() => {
        fetchNextLocation();
      }, 0);
    }
  };

  // Check if current location is bookmarked
  const currentIsBookmarked = currentLocation
    ? isLocationBookmarked(currentLocation.panoId, bookmarks)
    : false;

  // Toggle bookmark for current location
  const handleToggleBookmark = useCallback(
    (details?: { exactAddress?: string; locality?: string; adminArea?: string }) => {
      if (!currentLocation) return;

      if (currentIsBookmarked) {
        const updated = dbReady ? bookmarks.filter((item) => item.panoId !== currentLocation.panoId) : deleteBookmark(currentLocation.panoId);
        setBookmarks(updated);
        void trainerDb.deleteBookmark(currentLocation.panoId);
        if (currentVisitRef.current) currentVisitRef.current.bookmarked = false;
      } else {
        const countryName =
          COUNTRIES[currentLocation.countryCode]?.name || currentLocation.countryCode;
        const newBookmark: BookmarkLocation = {
          id: `bm-${Date.now()}`,
          panoId: currentLocation.panoId,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          countryCode: currentLocation.countryCode,
          countryName,
          savedAt: Date.now(),
          exactAddress: details?.exactAddress,
          locality: details?.locality,
          adminArea: details?.adminArea,
        };
        const updated = dbReady ? [newBookmark, ...bookmarks.filter((item) => item.panoId !== newBookmark.panoId)] : saveBookmark(newBookmark);
        setBookmarks(updated);
        void trainerDb.saveBookmark(newBookmark);
        if (currentVisitRef.current) currentVisitRef.current.bookmarked = true;
      }
      if (currentVisitRef.current) void trainerDb.saveVisit({ ...currentVisitRef.current });
      setTrainerRefreshKey((key) => key + 1);
    },
    [currentLocation, currentIsBookmarked, bookmarks, dbReady]
  );

  // Reopen a saved bookmark in the Street View panorama
  const handleSelectBookmark = (bookmark: BookmarkLocation) => {
    setCurrentLocation({
      countryCode: bookmark.countryCode,
      lat: bookmark.lat,
      lng: bookmark.lng,
      panoId: bookmark.panoId,
    });
    setIsRevealed(true);
  };

  // ---------------- GAME MODE LOGIC ----------------

  // Fetch location for a specific game round
  const fetchLocationForRound = useCallback(
    async (settings: GameSettings) => {
      const col = allCollections.find((c) => c.id === settings.collectionId) || BUILT_IN_COLLECTIONS[0];
      if (!col || col.countryCodes.length === 0) {
        setErrorMessage('Game collection has no valid countries.');
        return;
      }

      const requestId = ++latestGenerationRequestRef.current;
      generationPendingRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setCurrentLocation(null);
      setIsLoading(true);
      setErrorMessage(null);
      setIsRevealed(false);
      setStatusMessage('Finding round location...');

      try {
        const result = await defaultLocationGenerator.findRandomLocation(
          col.countryCodes,
          abortController.signal,
          (msg) => { if (isLatestRequest(requestId, latestGenerationRequestRef.current)) setStatusMessage(msg); },
          { environment: settings.environment ?? 'mixed', urbanLevel: settings.urbanLevel ?? 3, samplingMode: settings.samplingMode ?? 'natural' },
          { requestId, collectionId: col.id }
        );

        if (isLatestRequest(requestId, latestGenerationRequestRef.current)) {
          setCurrentLocation(result);
          roundSubmittedRef.current = false;
          roundStartTimeRef.current = Date.now();
          setPlayElapsed(0);
          setTimeRemaining(settings.timeLimitSeconds > 0 ? settings.timeLimitSeconds : null);
        }
      } catch (err: unknown) {
        if (!isLatestRequest(requestId, latestGenerationRequestRef.current) || (err instanceof Error && err.name === 'AbortError')) return;
        const message = err instanceof Error ? err.message : 'Failed to generate game location';
        setErrorMessage(message);
      } finally {
        if (isLatestRequest(requestId, latestGenerationRequestRef.current)) {
          generationPendingRef.current = false;
          setIsLoading(false);
          setStatusMessage('');
        }
      }
    },
    [allCollections]
  );

  // Start new game with configured settings
  const handleStartGame = (settings: GameSettings) => {
    setShowHome(false);
    setIsNewGameModalOpen(false);
    setAppMode('play');
    setIsGameActive(true);
    setGameSettings(settings);
    setGameRounds([]);
    setCurrentRoundIndex(0);
    setActiveRoundResult(null);
    setSummaryGameRecord(null);
    gameIdRef.current = `game-${crypto.randomUUID()}`;
    roundSubmittedRef.current = false;

    if (mapsReady) fetchLocationForRound(settings);
  };

  useEffect(() => {
    if (mapsReady && isGameActive && gameSettings && !currentLocation && !isLoading) {
      fetchLocationForRound(gameSettings);
    }
  }, [mapsReady, isGameActive, gameSettings, currentLocation, isLoading, fetchLocationForRound]);

  // Submit guess for current round
  const handleGuessSubmit = useCallback(
    (guess: { lat: number; lng: number } | null) => {
      if (!currentLocation || !gameSettings || activeRoundResult || roundSubmittedRef.current) return;
      roundSubmittedRef.current = true;

      setIsSubmittingGuess(true);
      const timeSpent = Math.max(
        1,
        Math.round((Date.now() - roundStartTimeRef.current) / 1000)
      );

      let distanceKm: number | null = null;
      let score = 0;

      if (guess) {
        distanceKm = calculateDistanceKm(
          guess.lat,
          guess.lng,
          currentLocation.lat,
          currentLocation.lng
        );
        score = calculateRoundScore(distanceKm);
      }

      const roundRecord: GameRound = {
        roundNumber: currentRoundIndex + 1,
        location: currentLocation,
        guess,
        distanceKm,
        score,
        timeSpentSeconds: timeSpent,
      };

      const updatedRounds = [...gameRounds, roundRecord];
      setGameRounds(updatedRounds);
      setActiveRoundResult(roundRecord);
      setIsSubmittingGuess(false);

      const attempt: Attempt = {
        id: `${gameIdRef.current}:${roundRecord.roundNumber}`,
        gameId: gameIdRef.current,
        roundNumber: roundRecord.roundNumber,
        panoId: currentLocation.panoId,
        actualLat: currentLocation.lat,
        actualLng: currentLocation.lng,
        countryCode: currentLocation.countryCode,
        guessedLat: guess?.lat ?? null,
        guessedLng: guess?.lng ?? null,
        distanceKm,
        score,
        timeSpentSeconds: timeSpent,
        collectionId: gameSettings.collectionId,
        canMove: gameSettings.canMove,
        canPan: gameSettings.canPan,
        canZoom: gameSettings.canZoom,
        showCompass: gameSettings.showCompass ?? true,
        environment: gameSettings.environment ?? 'mixed',
        environmentRequested: gameSettings.environment ?? 'mixed',
        urbanLevel: gameSettings.urbanLevel ?? 3,
        samplingMode: gameSettings.samplingMode ?? 'natural',
        createdAt: Date.now(),
        source: 'play',
        aiAssisted: playAiAssistedRef.current || undefined,
      };
      void (async () => {
        if (guess) attempt.guessedCountryCode = (await reverseGeocodeLocation(guess.lat, guess.lng))?.countryCode;
        await Promise.all([trainerDb.encounter(currentLocation), trainerDb.saveAttempt(attempt)]);
        setTrainerRefreshKey((key) => key + 1);
      })();
    },
    [currentLocation, gameSettings, activeRoundResult, currentRoundIndex, gameRounds]
  );

  // Timer countdown for active game
  useEffect(() => {
    if (!isGameActive || activeRoundResult || summaryGameRecord || !currentLocation) return;
    const timer = window.setInterval(() => setPlayElapsed(Math.max(0, Math.round((Date.now() - roundStartTimeRef.current) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [isGameActive, activeRoundResult, summaryGameRecord, currentLocation?.panoId]);

  useEffect(() => {
    if (!isGameActive || timeRemaining === null || activeRoundResult || summaryGameRecord) {
      return;
    }

    if (timeRemaining <= 0) {
      handleGuessSubmit(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, timeRemaining, activeRoundResult, summaryGameRecord, handleGuessSubmit]);

  // Next round or finalize game
  const handleNextRound = () => {
    if (!gameSettings) return;

    if (currentRoundIndex + 1 < gameSettings.roundCount) {
      const nextIdx = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIdx);
      setActiveRoundResult(null);
      fetchLocationForRound(gameSettings);
    } else {
      // Final round completed: save game
      const totalScore = gameRounds.reduce((acc, r) => acc + r.score, 0);
      const maxPossibleScore = gameSettings.roundCount * 5000;
      const col =
        allCollections.find((c) => c.id === gameSettings.collectionId) || BUILT_IN_COLLECTIONS[0];

      const completedGame: GameRecord = {
        id: gameIdRef.current,
        createdAt: Date.now(),
        collectionId: gameSettings.collectionId,
        collectionName: col.name,
        settings: gameSettings,
        totalScore,
        maxPossibleScore,
        rounds: gameRounds,
      };

      const updated = dbReady ? [completedGame, ...pastGames] : saveGameRecord(completedGame);
      void trainerDb.saveGame(completedGame);
      setPastGames(updated);
      setIsGameActive(false);
      setActiveRoundResult(null);
      setSummaryGameRecord(completedGame);
    }
  };

  // Abandon active game
  const handleAbandonGame = () => {
    if (window.confirm('Abandon this game? Current round progress will not be saved.')) {
      abortControllerRef.current?.abort();
      setIsGameActive(false);
      setGameRounds([]);
      setActiveRoundResult(null);
      setSummaryGameRecord(null);
      setGameSettings(null);
      setTimeRemaining(null);
      setCurrentLocation(null);
      roundSubmittedRef.current = false;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        studyReviewSaving ||
        isModalOpen ||
        isBookmarksModalOpen ||
        isNewGameModalOpen ||
        isHistoryModalOpen ||
        activeRoundResult ||
        summaryGameRecord ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      if (appMode === 'study') {
        if (e.code === 'Space' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          fetchNextLocation();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setIsRevealed((prev) => !prev);
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          handleToggleBookmark();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    appMode,
    fetchNextLocation,
    handleToggleBookmark,
    isModalOpen,
    isBookmarksModalOpen,
    isNewGameModalOpen,
    isHistoryModalOpen,
    activeRoundResult,
    summaryGameRecord,
    studyReviewSaving,
  ]);

  // Handle saving custom collection
  const handleSaveCollection = (collection: Omit<Collection, 'isCustom'>) => {
    const saved = { ...collection, isCustom: true };
    const updated = dbReady
      ? [...customCollections.filter((item) => item.id !== collection.id), saved]
      : saveCustomCollection(collection);
    void trainerDb.saveCollection({ ...collection, isCustom: true });
    setCustomCollections(updated);
    setSelectedCollectionId(collection.id);
    if (dbReady) void trainerDb.setSetting('selectedCollectionId', collection.id);
    else localStorage.setItem(LAST_COLLECTION_STORAGE_KEY, collection.id);
  };

  // Handle deleting custom collection
  const handleDeleteCollection = (id: string) => {
    const updated = dbReady ? customCollections.filter((item) => item.id !== id) : deleteCustomCollection(id);
    void trainerDb.deleteCollection(id);
    setCustomCollections(updated);
    if (selectedCollectionId === id) {
      setSelectedCollectionId('world');
      if (dbReady) void trainerDb.setSetting('selectedCollectionId', 'world');
      else localStorage.setItem(LAST_COLLECTION_STORAGE_KEY, 'world');
    }
  };

  const openReviewAttempt = async (attempt: Attempt) => {
    setShowHome(false);
    setAppMode('review');
    setReviewAttempt(attempt);
    setReviewResult(null);
    setReviewAttemptRecord(null);
    setReviewElapsed(0);
    setCurrentLocation(null);
    setCoachNote(null);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const reopened = await defaultLocationGenerator.reopenLocation({
        panoId: attempt.panoId,
        lat: attempt.actualLat,
        lng: attempt.actualLng,
        countryCode: attempt.countryCode,
      });
      setCurrentLocation(reopened);
      roundStartTimeRef.current = Date.now();
      const [attempts, intervals] = await Promise.all([trainerDb.attempts(), trainerDb.reviewIntervals(attempt.panoId)]);
      setReviewHistory(attempts.filter((item) => item.panoId === attempt.panoId).sort((a, b) => b.createdAt - a.createdAt));
      setReviewIntervals(intervals);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Review location is unavailable.');
      setReviewAttempt(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = async (attempt: Attempt, queue: Attempt[] = [attempt], source = 'History') => {
    const compass = attempt.showCompass ?? compassPreference;
    setReviewQueue(queue);
    setReviewOriginalQueue(queue);
    setReviewInitialTotal(queue.length);
    setReviewStats([]);
    setReviewComplete(false);
    setReviewSource(source);
    setReviewCompass(compass);
    await trainerDb.setSetting('review.active', { attemptIds: queue.map((item) => item.id), source, initialTotal: queue.length, compass });
    await openReviewAttempt(attempt);
  };

  useEffect(() => {
    if (!dbReady || !mapsReady || reviewRestoreAttemptedRef.current || reviewAttempt) return;
    reviewRestoreAttemptedRef.current = true;
    void (async () => {
      const saved = await trainerDb.setting<{ attemptIds: string[]; source: string; initialTotal: number; compass?: boolean } | null>('review.active');
      if (!saved?.attemptIds.length) return;
      const attempts = await trainerDb.attempts();
      const byId = new Map(attempts.map((item) => [item.id, item]));
      const queue = saved.attemptIds.map((id) => byId.get(id)).filter((item): item is Attempt => !!item);
      if (!queue.length) return;
      setReviewQueue(queue); setReviewOriginalQueue(queue); setReviewInitialTotal(saved.initialTotal); setReviewSource(saved.source); setReviewCompass(saved.compass ?? queue[0].showCompass ?? compassPreference); setReviewStats([]);
      await openReviewAttempt(queue[0]);
    })();
  }, [dbReady, mapsReady, reviewAttempt]);

  useEffect(() => {
    if (!reviewAttempt || reviewResult) return;
    const timer = window.setInterval(() => setReviewElapsed(Math.max(0, Math.round((Date.now() - roundStartTimeRef.current) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [reviewAttempt, reviewResult]);

  const handleReviewGuess = async (guess: { lat: number; lng: number } | null) => {
    if (!reviewAttempt || !currentLocation || reviewResult) return;
    setIsSubmittingGuess(true);
    const distanceKm = guess ? calculateDistanceKm(guess.lat, guess.lng, reviewAttempt.actualLat, reviewAttempt.actualLng) : null;
    const score = distanceKm === null ? 0 : calculateRoundScore(distanceKm);
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - roundStartTimeRef.current) / 1000));
    const round: GameRound = {
      roundNumber: 1,
      location: { ...currentLocation, lat: reviewAttempt.actualLat, lng: reviewAttempt.actualLng, countryCode: reviewAttempt.countryCode },
      guess,
      distanceKm,
      score,
      timeSpentSeconds,
    };
    const id = `review-attempt-${crypto.randomUUID()}`;
    const attempt: Attempt = {
      id,
      gameId: `review-${new Date().toISOString().slice(0, 10)}`,
      roundNumber: 1,
      panoId: reviewAttempt.panoId,
      actualLat: reviewAttempt.actualLat,
      actualLng: reviewAttempt.actualLng,
      countryCode: reviewAttempt.countryCode,
      guessedLat: guess?.lat ?? null,
      guessedLng: guess?.lng ?? null,
      guessedCountryCode: guess ? (await reverseGeocodeLocation(guess.lat, guess.lng))?.countryCode : undefined,
      distanceKm,
      score,
      timeSpentSeconds,
      collectionId: reviewAttempt.collectionId,
      canMove: reviewAttempt.canMove,
      canPan: reviewAttempt.canPan,
      canZoom: reviewAttempt.canZoom,
      showCompass: reviewCompass,
      environment: reviewAttempt.environment ?? 'mixed',
      environmentRequested: reviewAttempt.environmentRequested ?? reviewAttempt.environment ?? 'mixed',
      urbanLevel: reviewAttempt.urbanLevel ?? 3,
      samplingMode: reviewAttempt.samplingMode ?? 'natural',
      createdAt: Date.now(),
      source: 'review',
      sourceAttemptId: reviewAttempt.id,
      locationId: reviewAttempt.panoId,
      reviewAttemptId: id,
      isFallbackPanorama: !!currentLocation.isFallback,
      fallbackPanorama: currentLocation.isFallback,
      originalPanoId: currentLocation.originalPanoId,
      ...(coachNote ? { coachUsed: true, coachMode: coachNote.mode, coachModel: coachNote.model, coachGeneratedAt: coachNote.generatedAt, coachAnalysis: coachNote.analysis } : {}),
    };
    setReviewAttemptRecord(attempt);
    setReviewResult(round);
    setIsSubmittingGuess(false);
  };

  const handleReviewNext = async () => {
    if (!reviewAttempt || !reviewResult || !reviewAttemptRecord || reviewGradingRef.current) return;
    const grade = reviewGradeForScore(reviewResult.score);
    reviewGradingRef.current = true;
    try {
      const previous = (await trainerDb.reviews()).find((item) => item.panoId === reviewAttempt.panoId);
      const schedule = await trainerDb.gradeReview(reviewAttempt.panoId, grade);
      await trainerDb.saveAttempt({
        ...reviewAttemptRecord, grade, reviewedAt: schedule.lastReviewedAt,
        previousDueAt: previous?.dueAt, nextDueAt: schedule.dueAt, intervalDays: schedule.intervalDays,
      });
      const stats = [...reviewStats, { previous: reviewAttempt.score, current: reviewResult.score, grade }];
      setReviewStats(stats);
      const remaining = reviewQueue.slice(1);
      if (grade === 'again') remaining.splice(Math.min(1, remaining.length), 0, reviewAttempt);
      setReviewQueue(remaining);
      setTrainerRefreshKey((key) => key + 1);
      if (!remaining.length) {
        setReviewAttempt(null); setReviewResult(null); setCurrentLocation(null); setReviewComplete(true);
        await trainerDb.setSetting('review.active', null);
      } else {
        await trainerDb.setSetting('review.active', { attemptIds: remaining.map((item) => item.id), source: reviewSource, initialTotal: reviewInitialTotal, compass: reviewCompass });
        await openReviewAttempt(remaining[0]);
      }
    } finally {
      reviewGradingRef.current = false;
    }
  };

  const handleSaveCoach = useCallback((note: { mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis }) => {
    setCoachNote(note);
    if (appMode === 'study' && currentVisitRef.current && currentVisitRef.current.panoId === currentLocationRef.current?.panoId) {
      Object.assign(currentVisitRef.current, { coachUsed: true, coachMode: note.mode, coachModel: note.model, coachGeneratedAt: note.generatedAt, coachAnalysis: note.analysis });
      void trainerDb.saveVisit({ ...currentVisitRef.current });
    } else if (appMode === 'review') {
      setReviewAttemptRecord((attempt) => attempt ? { ...attempt, coachUsed: true, coachMode: note.mode, coachModel: note.model, coachGeneratedAt: note.generatedAt, coachAnalysis: note.analysis } : attempt);
    }
  }, [appMode]);

  const handleSaveClue = useCallback(async (clue: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis }) => {
    const location = currentLocationRef.current;
    if (!location) return;
    await trainerDb.saveClue({ id: `clue-${crypto.randomUUID()}`, countryCode: location.countryCode, panoId: location.panoId, createdAt: clue.generatedAt, ...clue });
    if (appMode === 'play') playAiAssistedRef.current = true;
    setTrainerRefreshKey((key) => key + 1);
  }, [appMode]);

  const handleSaveStudyForReview = async () => {
    if (!currentLocation || studyReviewSaving) return;
    setStudyReviewSaving(true);
    try {
      const now = Date.now();
      const id = `study-card:${currentLocation.panoId}`;
      await trainerDb.saveAttempt({
        id, gameId: 'study', roundNumber: 1, panoId: currentLocation.panoId,
        actualLat: currentLocation.lat, actualLng: currentLocation.lng, countryCode: currentLocation.countryCode,
        guessedLat: null, guessedLng: null, distanceKm: null, score: 0, timeSpentSeconds: 0,
        collectionId: selectedCollectionId, canMove: true, canPan: true, canZoom: true,
        showCompass: compassPreference, environment: studyEnvironment, urbanLevel: studyUrbanLevel,
        environmentRequested: studyEnvironment, samplingMode: studySampling,
        createdAt: now, source: 'study',
        locationId: currentLocation.panoId,
      });
      await trainerDb.queueForReview(currentLocation.panoId, true);
      setTrainerRefreshKey((key) => key + 1);
      setStudyReviewSaved(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      setIsRevealed(false);
      await fetchNextLocation();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save this location for Review.');
    } finally {
      setStudyReviewSaving(false);
      setStudyReviewSaved(false);
    }
  };

  const handleTrainCountries = (countryCodes: string[], name: string) => {
    if (!countryCodes.length) return;
    const collection = { id: `temporary-${Date.now()}`, name, countryCodes };
    setTemporaryCollection(collection);
    setSelectedCollectionId(collection.id);
    setAppMode('study');
    setShowHome(false);
    setTimeout(() => void fetchNextLocation(), 0);
  };

  const handleOpenCoverageLocation = (location: TrainerLocation) => {
    setCoveragePreview(location);
  };

  const handleBookmarkCoverageLocation = (location: TrainerLocation) => {
    const bookmark: BookmarkLocation = {
      id: `bm-${Date.now()}`,
      panoId: location.panoId,
      lat: location.lat,
      lng: location.lng,
      countryCode: location.countryCode,
      countryName: COUNTRIES[location.countryCode]?.name || location.countryCode,
      savedAt: Date.now(),
    };
    setBookmarks([bookmark, ...bookmarks.filter((item) => item.panoId !== bookmark.panoId)]);
    void trainerDb.saveBookmark(bookmark);
    setTrainerRefreshKey((key) => key + 1);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Active score sum in current game
  const currentTotalScore = gameRounds.reduce((acc, r) => acc + r.score, 0);
  const activeCompass = appMode === 'play' && isGameActive
    ? gameSettings?.showCompass ?? true
    : appMode === 'review' && reviewAttempt ? reviewCompass : compassPreference;

  const toggleCompass = () => {
    if (appMode === 'play' && isGameActive) return;
    const next = !(appMode === 'review' && reviewAttempt ? reviewCompass : compassPreference);
    setCompassPreference(next);
    localStorage.setItem(COMPASS_STORAGE_KEY, String(next));
    if (appMode === 'review' && reviewAttempt) {
      setReviewCompass(next);
      void trainerDb.setSetting('review.active', { attemptIds: reviewQueue.map((item) => item.id), source: reviewSource, initialTotal: reviewInitialTotal, compass: next });
    }
  };

  const clearReviewSession = () => {
    setReviewAttempt(null); setReviewResult(null); setReviewAttemptRecord(null); setReviewQueue([]); setReviewComplete(false);
    void trainerDb.setSetting('review.active', null);
  };

  // Panorama movement restrictions:
  const canMove =
    appMode === 'review' && reviewAttempt ? reviewAttempt.canMove :
    appMode === 'play' && isGameActive && gameSettings ? gameSettings.canMove : true;
  const canPan =
    appMode === 'review' && reviewAttempt ? reviewAttempt.canPan :
    appMode === 'play' && isGameActive && gameSettings ? gameSettings.canPan : true;
  const canZoom =
    appMode === 'review' && reviewAttempt ? reviewAttempt.canZoom :
    appMode === 'play' && isGameActive && gameSettings ? gameSettings.canZoom : true;

  return (
    <div className="geotrainer-shell flex flex-col w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 font-sans select-none">
      {/* Top Header Bar */}
      <header
        id="app-topbar"
        className="h-14 px-3 sm:px-5 bg-stone-900 border-b border-stone-800 flex items-center justify-between z-30 flex-shrink-0 gap-2"
      >
        {/* Left Section: Mode Switcher & Contextual Dropdowns */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => {
              if (isGameActive && !window.confirm('Leave the active game and return home?')) return;
              abortControllerRef.current?.abort();
              setIsGameActive(false);
              setTimeRemaining(null);
              setCurrentLocation(null);
              clearReviewSession();
              setShowHome(true);
            }}
            className="home-button"
            aria-label="GeoTrainer home"
            title="Home"
          ><House size={16} /></button>
          {/* Study / Play Mode Switcher */}
          <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800">
            <button
              onClick={() => {
                if (isGameActive) {
                  if (!window.confirm('Pause active game and switch to Study mode?')) return;
                  abortControllerRef.current?.abort();
                  setIsGameActive(false);
                  setTimeRemaining(null);
                  setCurrentLocation(null);
                }
                clearReviewSession();
                setShowHome(false);
                setAppMode('study');
                if (mapsReady && (isGameActive || !currentLocation)) setTimeout(() => void fetchNextLocation(), 0);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                appMode === 'study'
                  ? 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Study</span>
            </button>

            <button
              onClick={() => { clearReviewSession(); setShowHome(false); setAppMode('play'); }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                appMode === 'play'
                  ? 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Play</span>
              {isGameActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                if (isGameActive && !window.confirm('Leave the active game and open Review?')) return;
                abortControllerRef.current?.abort();
                setIsGameActive(false);
                setTimeRemaining(null);
                setCurrentLocation(null);
                clearReviewSession();
                setTrainerStartTab('progress');
                setShowHome(false);
                setAppMode('review');
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                appMode === 'review'
                  ? 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Review</span>
            </button>
            <button
              onClick={() => {
                if (isGameActive && !window.confirm('Leave the active game and open Statistics?')) return;
                abortControllerRef.current?.abort(); setIsGameActive(false); setTimeRemaining(null); setCurrentLocation(null);
                clearReviewSession(); setTrainerStartTab('statistics'); setShowHome(false); setAppMode('review');
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
            >
              <ChartNoAxesCombined className="w-3.5 h-3.5 text-amber-400" /><span>Statistics</span>
            </button>
          </div>

          {/* If in Study Mode: Collection Selector */}
          {!showHome && appMode === 'study' && (
            <div className="flex items-center space-x-1.5">
              <div className="relative flex items-center">
                <select
                  id="collection-select"
                  value={selectedCollectionId}
                  onChange={(e) => handleSelectCollection(e.target.value)}
                  className="appearance-none bg-stone-950 border border-stone-700 hover:border-stone-500 text-stone-100 text-xs font-medium py-1.5 pl-2.5 pr-7 rounded-lg cursor-pointer focus:outline-hidden max-w-[130px] sm:max-w-none truncate"
                >
                  {BUILT_IN_COLLECTION_GROUPS.map((group) => <optgroup label={group.label} key={group.label}>
                    {group.collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>)}

                  {customCollections.length > 0 && (
                    <optgroup label="Custom Collections">
                      {customCollections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.countryCodes.length})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <option value="__create_new__">+ Create Custom Collection...</option>
                </select>
                <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2 pointer-events-none" />
              </div>

              <select
                aria-label="Environment"
                value={studyEnvironment}
                onChange={(event) => {
                  const value = event.target.value as Environment;
                  setStudyEnvironment(value); studyEnvironmentRef.current = value; localStorage.setItem(ENVIRONMENT_STORAGE_KEY, value);
                  if (isMapsReadyRef.current) setTimeout(() => void fetchNextLocation(), 0);
                }}
                className="environment-select"
              >
                <option value="mixed">Mixed</option><option value="urban">Urban</option><option value="suburban">Suburban</option><option value="rural">Rural</option>
              </select>
              {(studyEnvironment === 'urban' || studyEnvironment === 'suburban') && (
                <select
                  aria-label="Urban level"
                  value={studyUrbanLevel}
                  onChange={(event) => {
                    const value = Number(event.target.value) as UrbanLevel;
                    setStudyUrbanLevel(value); studyUrbanLevelRef.current = value; localStorage.setItem(URBAN_LEVEL_STORAGE_KEY, String(value));
                    if (isMapsReadyRef.current) setTimeout(() => void fetchNextLocation(), 0);
                  }}
                  className="environment-select level-select"
                ><option value="1">Cities L1</option><option value="2">Cities L2</option><option value="3">Cities L3</option></select>
              )}
              <select aria-label="Sampling" value={studySampling} onChange={(event) => { const value = event.target.value as SamplingMode; setStudySampling(value); studySamplingRef.current = value; localStorage.setItem(SAMPLING_STORAGE_KEY, value); }} className="environment-select"><option value="natural">Natural</option><option value="balanced">Balanced</option></select>

              {activeCollection?.isCustom && (
                <button
                  onClick={() => {
                    setEditingCollection(activeCollection);
                    setIsModalOpen(true);
                  }}
                  title="Edit custom collection"
                  className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* If in Play Mode & Active Game: Round & Score HUD */}
          {!showHome && appMode === 'play' && isGameActive && gameSettings && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-mono font-bold">
                Round {currentRoundIndex + 1}/{gameSettings.roundCount}
              </span>
              <span className="environment-badge">{gameSettings.environment ?? 'mixed'}</span>
              <span className="hidden sm:inline-flex items-center gap-1 font-mono font-bold text-stone-200">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                {currentTotalScore.toLocaleString()} pts
              </span>
              {!gameSettings.canMove && (
                <span className="hidden md:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                  {!gameSettings.canPan && !gameSettings.canZoom ? 'NMPZ' : 'No Move'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Mode-specific actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Study Mode Controls */}
          {!showHome && appMode === 'study' && (
            <>
              {/* Reveal Exact Location Toggle */}
              <button
                id="reveal-location-btn"
                onClick={() => setIsRevealed((prev) => !prev)}
                disabled={!currentLocation || isLoading}
                title={isRevealed ? 'Hide exact location (R)' : 'Reveal exact location (R)'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  isRevealed
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRevealed && currentLocation ? (
                  <>
                    <img
                      src={getFlagCdnUrl(currentLocation.countryCode, 40)}
                      srcSet={`${getFlagCdnUrl(currentLocation.countryCode, 40)} 1x, ${getFlagCdnUrl(currentLocation.countryCode, 80)} 2x`}
                      alt=""
                      width="18"
                      height="13"
                      className="w-4.5 h-3 rounded-xs object-cover border border-stone-600/60 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span className="hidden sm:inline font-semibold text-white">
                      {COUNTRIES[currentLocation.countryCode]?.name || currentLocation.countryCode}
                    </span>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-stone-400" />
                    <span className="hidden sm:inline">Reveal</span>
                  </>
                )}
              </button>

              {/* Bookmark Toggle */}
              <button
                id="toggle-bookmark-btn"
                onClick={handleToggleBookmark}
                disabled={!currentLocation || isLoading}
                title={currentIsBookmarked ? 'Remove bookmark (B)' : 'Save bookmark (B)'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  currentIsBookmarked
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {currentIsBookmarked ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                )}
                <span className="hidden sm:inline">
                  {currentIsBookmarked ? 'Saved' : 'Save'}
                </span>
              </button>

              {/* Bookmarks Library */}
              <button
                id="open-bookmarks-modal-btn"
                onClick={() => setIsBookmarksModalOpen(true)}
                title="View saved bookmarks library"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-950 text-stone-300 border border-stone-800 hover:border-stone-700 hover:text-stone-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Bookmarks</span>
                <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded-full">
                  {bookmarks.length}
                </span>
              </button>

              {/* Next Location Button */}
              <button
                id="random-next-btn"
                onClick={fetchNextLocation}
                disabled={isLoading || studyReviewSaving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md ${
                  isLoading || studyReviewSaving
                    ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                    : 'bg-stone-100 hover:bg-white text-stone-950 active:scale-[0.98]'
                }`}
              >
                {isLoading || studyReviewSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{studyReviewSaving ? 'Saving...' : 'Finding...'}</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-3.5 h-3.5 text-stone-900" />
                    <span>Next</span>
                    <span className="hidden sm:inline-block text-[10px] text-stone-700 bg-stone-200 px-1.5 py-0.5 rounded font-mono">
                      Space
                    </span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Play Mode Controls */}
          {!showHome && appMode === 'play' && (
            <>
              {isGameActive ? (
                <>
                  {/* Timer Display if enabled */}
                  {timeRemaining !== null && (
                    <div
                      className={`flex items-center space-x-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        timeRemaining <= 10
                          ? 'bg-rose-950/80 border-rose-600 text-rose-400 animate-pulse'
                          : 'bg-stone-950 border-stone-800 text-amber-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(timeRemaining)}</span>
                    </div>
                  )}

                  {/* Abandon Game */}
                  <button
                    onClick={handleAbandonGame}
                    title="Abandon game"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-950 text-stone-400 hover:text-rose-400 border border-stone-800 hover:border-rose-900 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Abandon</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Past Games Collection */}
                  <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-950 text-stone-300 border border-stone-800 hover:border-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Past Games</span>
                    <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded-full">
                      {pastGames.length}
                    </span>
                  </button>

                  {/* New Game Setup Button */}
                  <button
                    onClick={() => setIsNewGameModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#171000] font-bold rounded-lg text-xs sm:text-sm transition-all shadow-md cursor-pointer active:scale-98"
                  >
                    <Play className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                    <span>New Game</span>
                  </button>
                </>
              )}
            </>
          )}

          {!showHome && appMode === 'review' && reviewAttempt && !reviewResult && (
            <>
              <span className="review-live-context">{reviewStats.length + 1} / {Math.max(reviewInitialTotal, reviewStats.length + reviewQueue.length)} · {reviewQueue.length} remaining</span>
              <span className="review-source">Source: {reviewSource}</span>
              <button className="icon-button" onClick={() => { clearReviewSession(); setCurrentLocation(null); }} aria-label="Exit review"><XCircle size={16} /></button>
            </>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              clearReviewSession();
              setTrainerStartTab('data');
              setShowHome(false);
              setAppMode('review');
            }}
            title="Settings and data"
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Viewport Stage */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-black">
        <StreetViewContainer
          currentLocation={currentLocation}
          isLoading={isLoading}
          onNextLocation={appMode === 'play' && isGameActive && gameSettings
            ? () => void fetchLocationForRound(gameSettings)
            : fetchNextLocation}
          statusMessage={statusMessage}
          errorMessage={errorMessage}
          onMapsLoaded={handleMapsLoaded}
          canMove={canMove}
          canPan={canPan}
          canZoom={canZoom}
          showCompass={!showHome && activeCompass}
          showSunTrainingHint={!showHome && appMode === 'study' && isRevealed && sunTrainingHints}
          onPanoramaChanged={!showHome && appMode === 'study' ? (location) => void handleStudyPanoramaChanged(location) : undefined}
        />

        {!showHome && currentLocation && appMode !== 'play' && <div className="map-training-toggles" aria-label="Map training aids">
          <button type="button" role="switch" aria-checked={activeCompass} onClick={toggleCompass} title={`Compass ${activeCompass ? 'on' : 'off'}`} className={activeCompass ? 'enabled' : ''}><Compass size={15} /></button>
          {appMode === 'study' && <button type="button" role="switch" aria-checked={sunTrainingHints} onClick={() => { const next = !sunTrainingHints; setSunTrainingHints(next); localStorage.setItem(SUN_HINTS_STORAGE_KEY, String(next)); }} title={`Sun hints ${sunTrainingHints ? 'on' : 'off'}`} className={sunTrainingHints ? 'enabled' : ''}><Sun size={15} /></button>}
        </div>}

        {showHome && (
          <MainMenu
            refreshKey={trainerRefreshKey}
            onStudy={() => {
              setShowHome(false);
              setAppMode('study');
              if (mapsReady && !currentLocation) setTimeout(() => void fetchNextLocation(), 0);
            }}
            onPlay={() => { setShowHome(false); setAppMode('play'); setIsNewGameModalOpen(true); }}
            onReview={() => { setShowHome(false); setTrainerStartTab('progress'); setAppMode('review'); }}
            onData={() => { setShowHome(false); setTrainerStartTab('data'); setAppMode('review'); }}
          />
        )}
        {!showHome && appMode === 'review' && !reviewAttempt && (
          <TrainerHub
            collections={allCollections}
            refreshKey={trainerRefreshKey}
            initialTab={trainerStartTab}
            onReview={(attempt) => void handleStartReview(attempt)}
            onOpen={handleOpenCoverageLocation}
            onTrainCountries={handleTrainCountries}
            onBookmark={handleBookmarkCoverageLocation}
            onDataChanged={() => {
              void Promise.all([trainerDb.collections(), trainerDb.bookmarks(), trainerDb.games()]).then(([collections, savedBookmarks, games]) => {
                setCustomCollections(collections);
                setBookmarks(savedBookmarks);
                setPastGames(games);
                setTrainerRefreshKey((key) => key + 1);
              });
            }}
          />
        )}

        {/* Study Mode: Revealed Location Spoiler Card */}
        {!showHome && appMode === 'study' && isRevealed && currentLocation && !isLoading && (
          <LocationCard
            location={currentLocation}
            isBookmarked={currentIsBookmarked}
            onToggleBookmark={handleToggleBookmark}
            onHide={() => setIsRevealed(false)}
            onMetadata={handleStudyMetadata}
            onSaveForReview={() => void handleSaveStudyForReview()}
            reviewSaving={studyReviewSaving}
            reviewSaved={studyReviewSaved}
          />
        )}

        {/* Play Mode: Lobby Overlay if no game active */}
        {!showHome && appMode === 'play' && !isGameActive && (
          <div id="play-lobby-overlay" className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 pointer-events-none">
            <div id="play-lobby-card" className="max-w-md w-full bg-stone-900/95 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center pointer-events-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-tight">GeoGuessr Pinpointing Game</h2>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Test your skills across batches of Street View rounds. Guess coordinates, score points, and review your games collection.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-stone-950/80 p-3 rounded-xl border border-stone-800/80 text-xs">
                <div>
                  <span className="text-stone-500 block text-[11px]">Games Saved</span>
                  <span className="font-mono font-bold text-stone-200">{pastGames.length} games</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Best Record</span>
                  <span className="font-mono font-bold text-amber-400">
                    {pastGames.length > 0
                      ? `${Math.max(...pastGames.map((g) => g.totalScore)).toLocaleString()} pts`
                      : 'None yet'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setIsNewGameModalOpen(true)}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-[#171000] font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98"
                >
                  <Play className="w-4 h-4 fill-stone-950" />
                  <span>Start New Game</span>
                </button>

                {pastGames.length > 0 && (
                  <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs border border-stone-700/60"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>Review Past Games Collection</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Play Mode: Pinpointing Guess Map Widget */}
        {!showHome && appMode === 'play' && isGameActive && currentLocation && !activeRoundResult && (
          <GuessMap
            onGuess={handleGuessSubmit}
            isSubmitting={isSubmittingGuess}
            timeRemaining={timeRemaining}
            elapsedTimeSeconds={playElapsed}
          />
        )}

        {!showHome && appMode === 'review' && reviewAttempt && currentLocation && !reviewResult && (
          <GuessMap
            onGuess={(guess) => void handleReviewGuess(guess)}
            isSubmitting={isSubmittingGuess}
            timeRemaining={null}
            elapsedTimeSeconds={reviewElapsed}
          />
        )}
      </main>

      {!showHome && currentLocation && (appMode !== 'play' || isGameActive) && (
        <AiCoach
          panoId={currentLocation.panoId}
          appMode={appMode}
          revealed={appMode === 'study' ? isRevealed : !!reviewResult}
          context={(appMode === 'study' ? isRevealed : reviewResult) ? {
            actualCountry: COUNTRIES[currentLocation.countryCode]?.name || currentLocation.countryCode,
            guessedCountry: reviewAttemptRecord?.guessedCountryCode ? COUNTRIES[reviewAttemptRecord.guessedCountryCode]?.name || reviewAttemptRecord.guessedCountryCode : undefined,
            score: reviewResult?.score,
            distanceKm: reviewResult?.distanceKm,
            previousAttempts: appMode === 'review' ? reviewHistory.slice(0, 5).map((item) => ({ guessedCountry: item.guessedCountryCode, score: item.score })) : undefined,
          } : undefined}
          onSave={handleSaveCoach}
          onSaveClue={handleSaveClue}
          onClueAnalyzed={() => { if (appMode === 'play') playAiAssistedRef.current = true; }}
        />
      )}

      {reviewResult && reviewAttempt && (
        <ReviewResultPanel
          round={reviewResult} sourceAttempt={reviewAttempt} history={reviewHistory}
          position={reviewStats.length + 1}
          total={Math.max(reviewInitialTotal, reviewStats.length + reviewQueue.length)} sourceLabel={reviewSource}
          advancing={reviewGradingRef.current} onNext={() => void handleReviewNext()}
        />
      )}

      {coveragePreview && <CoverageStudyModal location={coveragePreview} onClose={() => setCoveragePreview(null)} />}

      {reviewComplete && (() => {
        const improved = reviewStats.filter((item) => item.current > item.previous).length;
        const worse = reviewStats.filter((item) => item.current < item.previous).length;
        const average = (key: 'previous' | 'current') => reviewStats.length ? Math.round(reviewStats.reduce((sum, item) => sum + item[key], 0) / reviewStats.length).toLocaleString() : '0';
        return <div className="review-complete-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-complete-title"><section className="review-complete-panel">
          <h2 id="review-complete-title">Review Complete</h2>
          <p>{reviewStats.length} reviewed · {improved} improved · {reviewStats.length - improved - worse} similar · {worse} worse</p>
          <div className="review-complete-scores"><span>Avg previous score<strong>{average('previous')}</strong></span><span>Avg review score<strong>{average('current')}</strong></span></div>
          <p>{(['again', 'hard', 'good', 'easy'] as ReviewGrade[]).map((grade) => `${grade[0].toUpperCase()}${grade.slice(1)}: ${reviewStats.filter((item) => item.grade === grade).length}`).join(' · ')}</p>
          <div className="review-complete-actions"><button className="button primary" onClick={() => reviewOriginalQueue[0] && void handleStartReview(reviewOriginalQueue[0], reviewOriginalQueue, reviewSource)}>Review Again</button><button className="button secondary" onClick={() => { clearReviewSession(); setAppMode('study'); setCurrentLocation(null); void fetchNextLocation(); }}>Back to Study</button><button className="button secondary" onClick={() => { clearReviewSession(); setAppMode('play'); setIsNewGameModalOpen(true); }}>Play</button></div>
        </section></div>;
      })()}

      {/* Round Result Modal */}
      {activeRoundResult && gameSettings && (
        <RoundResultModal
          round={activeRoundResult}
          totalRounds={gameSettings.roundCount}
          onNextRound={handleNextRound}
          isLastRound={currentRoundIndex + 1 >= gameSettings.roundCount}
          rounds={gameRounds}
        />
      )}

      {/* Game Summary Review Modal */}
      {summaryGameRecord && (
        <GameSummaryModal
          game={summaryGameRecord}
          onPlayAgain={() => {
            setSummaryGameRecord(null);
            handleStartGame(summaryGameRecord.settings);
          }}
          onNewGame={() => {
            setSummaryGameRecord(null);
            setIsNewGameModalOpen(true);
          }}
          onViewHistory={() => {
            setSummaryGameRecord(null);
            setIsHistoryModalOpen(true);
          }}
          onClose={() => setSummaryGameRecord(null)}
          onGoToLocation={(location) => {
            setSummaryGameRecord(null);
            setIsGameActive(false);
            setCurrentLocation(location);
            setAppMode('study');
            setIsRevealed(true);
          }}
        />
      )}

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        collections={allCollections}
        onStartGame={handleStartGame}
        onOpenHistory={() => {
          setIsNewGameModalOpen(false);
          setIsHistoryModalOpen(true);
        }}
        pastGamesCount={pastGames.length}
        defaultShowCompass={compassPreference}
      />

      {/* Game History Collection Review Modal */}
      <GameHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        games={pastGames}
        onSelectGame={(game) => {
          setSummaryGameRecord(game);
        }}
        onDeleteGame={(id) => {
          const updated = dbReady ? pastGames.filter((game) => game.id !== id) : deleteGameRecord(id);
          setPastGames(updated);
          void trainerDb.deleteGame(id);
        }}
        onClearAll={() => {
          if (!dbReady) clearGameHistory();
          setPastGames([]);
          void trainerDb.clearGames();
        }}
      />

      {/* Custom Collection Modal */}
      <CustomCollectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCollection(null);
        }}
        onSave={handleSaveCollection}
        onDelete={handleDeleteCollection}
        initialCollection={editingCollection}
      />

      {/* Bookmarks Library Modal */}
      <BookmarksModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        bookmarks={bookmarks}
        onSelectBookmark={handleSelectBookmark}
        onDeleteBookmark={(id) => {
          const updated = dbReady ? bookmarks.filter((item) => item.id !== id && item.panoId !== id) : deleteBookmark(id);
          setBookmarks(updated);
          const panoId = bookmarks.find((item) => item.id === id || item.panoId === id)?.panoId || id;
          void trainerDb.deleteBookmark(panoId);
        }}
        activePanoId={currentLocation?.panoId}
      />
    </div>
  );
}
