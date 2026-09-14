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
  CoachHistoryNote,
  CoachMode,
  SchedulerPreferences,
  CompassStyle,
  StreetViewState,
  LearnSource,
  PanoramaSource,
} from './types';
import {
  BUILT_IN_COLLECTIONS,
  BUILT_IN_COLLECTION_GROUPS,
  getCustomCollections,
  saveCustomCollection,
  deleteCustomCollection,
} from './data/collections';
import { COUNTRIES } from './data/countries';
import { hasStudyReviewSource } from './data/reviewIdentity';
import { saveCoachHistoryNote } from './services/coachHistory';
import { CLOUD_IMPORT_EVENT } from './services/cloudSyncEvent';
import {
  getBookmarks,
  saveBookmark,
  isLocationBookmarked,
} from './data/bookmarks';
import {
  getGameHistory,
  saveGameRecord,
  deleteGameRecord,
  clearGameHistory,
} from './data/games';
import { gameMistakes, initTrainerDb, trainerDb } from './data/trainerDb';
import type { HubTab } from './components/TrainerHub';
import { AppTopBar } from './components/AppTopBar';
import { AppViewport } from './components/AppViewport';
import { AppOverlays } from './components/AppOverlays';
import { useReviewMode } from './hooks/useReviewMode';
import { usePlayMode } from './hooks/usePlayMode';
import { useStudyMode } from './hooks/useStudyMode';
import { useLearnSources } from './hooks/useLearnSources';
import { useActiveSession } from './hooks/useActiveSession';
import { ResumeSessionDialog } from './components/ResumeSessionDialog';
import { installAudio, setAudioPreferences } from './services/audio';

const LAST_COLLECTION_STORAGE_KEY = 'sv_last_selected_collection_id';
const COMPASS_STORAGE_KEY = 'sv_show_compass';
const ENVIRONMENT_STORAGE_KEY = 'sv_environment';
const URBAN_LEVEL_STORAGE_KEY = 'sv_urban_level';
const SAMPLING_STORAGE_KEY = 'sv_sampling_mode';

type ActiveWorkspace =
  | { mode: 'home' }
  | { mode: 'review'; surface?: 'review' | 'statistics' | 'clues' }
  | { mode: 'study'; location: LocationResult; learnSource?: LearnSource; metaLessonId?: string }
  | { mode: 'play'; gameId: string; settings: GameSettings; rounds: GameRound[]; currentRoundIndex: number; currentLocation: LocationResult | null; activeRoundResult: GameRound | null; timeRemaining: number | null; roundStartedAt: number };

const isLocation = (value: unknown): value is LocationResult => {
  if (!value || typeof value !== 'object') return false;
  const location = value as Partial<LocationResult>;
  return typeof location.panoId === 'string' && typeof location.countryCode === 'string' && Number.isFinite(location.lat) && Number.isFinite(location.lng);
};

const locationForWorkspace = (location: LocationResult): LocationResult => ({
  countryCode: location.countryCode, lat: location.lat, lng: location.lng, panoId: location.panoId,
  ...(location.exactAddress ? { exactAddress: location.exactAddress } : {}),
  ...(location.locality ? { locality: location.locality } : {}),
  ...(location.adminArea ? { adminArea: location.adminArea } : {}),
  ...(location.environment ? { environment: location.environment } : {}),
  ...(location.environmentRequested ? { environmentRequested: location.environmentRequested } : {}),
  ...(location.urbanLevel ? { urbanLevel: location.urbanLevel } : {}),
  ...(location.isFallback ? { isFallback: true } : {}),
  ...(location.originalPanoId ? { originalPanoId: location.originalPanoId } : {}),
  ...(location.heading !== undefined ? { heading: location.heading } : {}),
});

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
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [schedulerStrictness, setSchedulerStrictness] = useState<SchedulerPreferences['strictness']>('balanced');
  const [summaryMistakes, setSummaryMistakes] = useState<{ gameId: string; attempts: Attempt[] } | null>(null);

  // Exact location reveal & bookmarks state (Study mode)
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BookmarkLocation[]>([]);
  const [compassPreference, setCompassPreference] = useState(() => localStorage.getItem(COMPASS_STORAGE_KEY) !== 'false');
  const [compassStyle, setCompassStyle] = useState<CompassStyle>('bar');
  const [darkMode, setDarkMode] = useState(false);
  const [restoredStreetView, setRestoredStreetView] = useState<StreetViewState>();
  const [reviewCompass, setReviewCompass] = useState(true);
  const [studyEnvironment, setStudyEnvironment] = useState<Environment>(() => (localStorage.getItem(ENVIRONMENT_STORAGE_KEY) as Environment) || 'mixed');
  const [studyUrbanLevel, setStudyUrbanLevel] = useState<UrbanLevel>(() => Number(localStorage.getItem(URBAN_LEVEL_STORAGE_KEY) || 3) as UrbanLevel);
  const [studySampling, setStudySampling] = useState<SamplingMode>(() => (localStorage.getItem(SAMPLING_STORAGE_KEY) as SamplingMode) || 'natural');
  const [studyPanoramaSource, setStudyPanoramaSource] = useState<PanoramaSource>('official');

  // Play Mode State
  const [pastGames, setPastGames] = useState<GameRecord[]>([]);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState<boolean>(false);
  const [isStudySetupOpen, setIsStudySetupOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);
  const roundStartTimeRef = useRef<number>(Date.now());
  const playAiAssistedRef = useRef(false);

  const [dbReady, setDbReady] = useState(false);
  const [trainerRefreshKey, setTrainerRefreshKey] = useState(0);
  const [trainerStartTab, setTrainerStartTab] = useState<HubTab>('review');
  const [coveragePreview, setCoveragePreview] = useState<TrainerLocation | null>(null);
  const [showHome, setShowHome] = useState(true);
  const [resumePrompt, setResumePrompt] = useState<'study' | 'play' | null>(null);
  const [pausedWorkspaces, setPausedWorkspaces] = useState<Partial<Record<'study' | 'play', ActiveWorkspace>>>({});
  const [mapsReady, setMapsReady] = useState(false);
  const [temporaryCollection, setTemporaryCollection] = useState<Collection | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<Attempt | null>(null);
  const [studyReviewSaving, setStudyReviewSaving] = useState(false);
  const [studyReviewSaved, setStudyReviewSaved] = useState(false);
  const [coachNote, setCoachNote] = useState<{ mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis } | null>(null);
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
  const studyPanoramaSourceRef = useRef(studyPanoramaSource);
  const workspaceRestoreAttemptedRef = useRef(false);
  const restoredPlayPanoRef = useRef<string | null>(null);
  const restoredStudyPanoRef = useRef<string | null>(null);
  studyEnvironmentRef.current = studyEnvironment;
  studyUrbanLevelRef.current = studyUrbanLevel;
  studySamplingRef.current = studySampling;
  studyPanoramaSourceRef.current = studyPanoramaSource;
  currentLocationRef.current = currentLocation;

  useEffect(() => installAudio(), []);

  const allCollections = [...BUILT_IN_COLLECTIONS, ...customCollections, ...(temporaryCollection ? [temporaryCollection] : [])];
  const activeCollection = allCollections.find((collection) => collection.id === selectedCollectionId) || BUILT_IN_COLLECTIONS[0];
  const activeCollectionRef = useRef(activeCollection);
  activeCollectionRef.current = activeCollection;

  const play = usePlayMode({
    allCollections, currentLocation, setCurrentLocation, setIsLoading, setErrorMessage, setIsRevealed,
    abortControllerRef, latestGenerationRequestRef, generationPendingRef, setTrainerRefreshKey, coachNote,
    playAiAssistedRef, roundStartTimeRef, setIsSubmittingGuess, dbReady, pastGames, setPastGames, setShowHome,
    setAppMode, mapsReady, isLoading, setStatusMessage, setIsNewGameModalOpen, saveGameRecord, restoredPlayPanoRef,
  });
  const { isGameActive, setIsGameActive, gameSettings, setGameSettings, gameRounds, setGameRounds, currentRoundIndex, setCurrentRoundIndex,
    timeRemaining, setTimeRemaining, playElapsed, setPlayElapsed, activeRoundResult, setActiveRoundResult, summaryGameRecord,
    setSummaryGameRecord, fetchLocationForRound, handleStartGame, handleGuessSubmit, handleNextRound,
    handleAbandonGame, gameIdRef, roundSubmittedRef } = play;

  const review = useReviewMode({
    dbReady, mapsReady, reviewAttempt, setReviewAttempt, currentLocation, setCurrentLocation, setIsLoading,
    setErrorMessage, compassPreference, setTrainerRefreshKey, roundStartTimeRef, setIsSubmittingGuess,
    isSubmittingGuess, coachNote, reviewCompass, setReviewCompass, setCoachNote, setAppMode, setShowHome,
  });
  const { reviewResult, setReviewResult, reviewAttemptRecord, setReviewAttemptRecord, reviewQueue,
    reviewOriginalQueue, reviewSource, reviewKind, reviewHistory, reviewIntervals, reviewElapsed, reviewInitialTotal,
    reviewStats, reviewComplete, reviewGradingRef, handleStartReview, handleReviewGuess, handleReviewNext,
    clearReviewSession } = review;

  const learn = useLearnSources({ setAppMode, setShowHome, setStudySetupOpen: setIsStudySetupOpen,
    setCurrentLocation, setIsLoading, setErrorMessage, setIsRevealed });
  const { learnSource, activeMetaLesson, mapPickerOpen, metaAdviceOpen, startCustom, startMeta,
    nextMeta, startMap, openMapLocation, setMapPickerOpen, dismissMetaAdvice, restoreLearnSource } = learn;

  const study = useStudyMode({
    appMode, showHome, dbReady, currentLocation, setCurrentLocation, isLoading, setIsLoading, setErrorMessage,
    selectedCollectionId, setSelectedCollectionId, customCollections, setCustomCollections, bookmarks, setBookmarks,
    setTrainerRefreshKey, activeCollectionRef, studyEnvironment, setStudyEnvironment, studyUrbanLevel, setStudyUrbanLevel, studySampling, setStudySampling, studyPanoramaSource, setStudyPanoramaSource, studyEnvironmentRef, studyUrbanLevelRef, studySamplingRef, studyPanoramaSourceRef, currentLocationRef,
    generationPendingRef, abortControllerRef, latestGenerationRequestRef, latestPanoramaSyncRef, recentStudyPanosRef,
    isMapsReadyRef, hasAutoFetchedRef, mapsReady, setMapsReady, currentVisitRef, activeStartedAtRef,
    setIsRevealed, setCoachNote, setEditingCollection, setIsModalOpen, temporaryCollection, setTemporaryCollection,
    compassPreference, setCompassPreference, reviewAttempt, reviewCompass, setReviewCompass, reviewQueue, reviewSource, reviewKind,
    reviewInitialTotal, setStudyReviewSaving, studyReviewSaving, setStudyReviewSaved,
    setAppMode, setShowHome, isGameActive, gameSettings, setCoveragePreview, setIsFullscreen, setStatusMessage,
    isRevealed, restoredStudyPanoRef, isStudySetupOpen, setIsStudySetupOpen, allCollections,
    learnSource, activeMetaLesson, nextMeta, openMap: () => setMapPickerOpen(true),
  });
  const { handleStudyMetadata, handleStudyPanoramaChanged, fetchNextLocation, handleMapsLoaded,
    handleSaveStudyForReview, handleTrainCountries, handleStartStudy,
    handleOpenCoverageLocation, toggleFullscreen, activeCompass, toggleCompass } = study;
  const refreshTrainer = useCallback(() => setTrainerRefreshKey((key) => key + 1), []);
  useActiveSession(dbReady && !showHome && (appMode === 'study' ? !!currentLocation && !isLoading : appMode === 'play' ? isGameActive : appMode === 'review' ? !!reviewAttempt : false), sessionRef, refreshTrainer);
  useEffect(() => { const panoId = currentLocation?.panoId; let active = true; if (!dbReady || !panoId) { setStudyReviewSaved(false); return; } void trainerDb.attempts().then((attempts) => { if (active) setStudyReviewSaved(hasStudyReviewSource(attempts, panoId)); }); return () => { active = false; }; }, [currentLocation?.panoId, dbReady, trainerRefreshKey]);
  const handleNextLearn = useCallback(() => { if (learnSource === 'meta') nextMeta(); else if (learnSource === 'map') setMapPickerOpen(true); else void fetchNextLocation(); }, [fetchNextLocation, learnSource, nextMeta, setMapPickerOpen]);
  const requestMode = (mode: 'study' | 'play') => {
    if (!showHome && appMode === mode && (mode === 'study' ? !!currentLocation : isGameActive)) return;
    if (pausedWorkspaces[mode]) setResumePrompt(mode);
    else if (mode === 'study') { setShowHome(false); setAppMode('study'); setIsStudySetupOpen(true); }
    else { setShowHome(false); setAppMode('play'); setIsNewGameModalOpen(true); }
  };
  const startFreshMode = (mode: 'study' | 'play') => {
    setResumePrompt(null); setPausedWorkspaces((saved) => ({ ...saved, [mode]: undefined })); void trainerDb.setSetting(`workspace.paused.${mode}`, null);
    setCurrentLocation(null); setIsGameActive(false); setGameRounds([]); setActiveRoundResult(null); setGameSettings(null);
    if (mode === 'study') { setShowHome(false); setAppMode('study'); setIsStudySetupOpen(true); }
    else { setShowHome(false); setAppMode('play'); setIsNewGameModalOpen(true); }
  };
  const resumePausedMode = () => {
    const workspace = resumePrompt && pausedWorkspaces[resumePrompt]; if (!workspace) return setResumePrompt(null);
    setResumePrompt(null); setShowHome(false);
    if (workspace.mode === 'study') { restoredStudyPanoRef.current = workspace.location.panoId; restoreLearnSource(workspace.learnSource, workspace.metaLessonId); setAppMode('study'); setCurrentLocation(workspace.location); setIsRevealed(false); setIsStudySetupOpen(false); return; }
    if (workspace.mode === 'play') { setAppMode('play'); setIsGameActive(true); setGameSettings(workspace.settings); setGameRounds(workspace.rounds || []); setCurrentRoundIndex(workspace.currentRoundIndex || 0); setActiveRoundResult(workspace.activeRoundResult || null); gameIdRef.current = workspace.gameId; roundSubmittedRef.current = !!workspace.activeRoundResult; setCurrentLocation(workspace.currentLocation); restoredPlayPanoRef.current = workspace.currentLocation?.panoId || null; roundStartTimeRef.current = workspace.roundStartedAt || Date.now(); const elapsed = Math.max(0, Math.floor((Date.now() - roundStartTimeRef.current) / 1000)); setPlayElapsed(elapsed); setTimeRemaining(workspace.settings.timeLimitSeconds > 0 ? Math.max(0, workspace.settings.timeLimitSeconds - elapsed) : null); }
  };

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
        const [dbCollections, dbBookmarks, dbGames, dbSelected, scheduler, savedCompass, savedEnvironment, savedUrbanLevel, savedSampling, savedPanoramaSource, savedContributors, workspace, savedReview, savedCompassStyle, savedStreetView, savedDarkMode, savedAudio, pausedStudy, pausedPlay] = await Promise.all([
          trainerDb.collections(), trainerDb.bookmarks(), trainerDb.games(), trainerDb.setting<string>('selectedCollectionId'), trainerDb.schedulerPreferences(),
          trainerDb.setting<boolean>('preference.compass'),
          trainerDb.setting<Environment>('preference.environment'), trainerDb.setting<UrbanLevel>('preference.urbanLevel'), trainerDb.setting<SamplingMode>('preference.sampling'),
          trainerDb.setting<PanoramaSource>('preference.panoramaSource'),
          trainerDb.setting<boolean>('preference.allowContributors'),
          trainerDb.setting<ActiveWorkspace>('workspace.active'), trainerDb.setting<{ attemptIds?: string[] }>('review.active'), trainerDb.setting<CompassStyle>('preference.compassStyle'), trainerDb.setting<StreetViewState>('workspace.streetView'), trainerDb.setting<boolean>('preference.darkMode'), trainerDb.setting('preference.audio'), trainerDb.setting<ActiveWorkspace>('workspace.paused.study'), trainerDb.setting<ActiveWorkspace>('workspace.paused.play'),
        ]);
        setPausedWorkspaces({ ...(pausedStudy?.mode === 'study' ? { study: pausedStudy } : {}), ...(pausedPlay?.mode === 'play' ? { play: pausedPlay } : {}) });
        setCustomCollections(dbCollections);
        setBookmarks(dbBookmarks);
        setPastGames(dbGames);
        setSchedulerStrictness(scheduler.strictness);
        if (typeof savedCompass === 'boolean') setCompassPreference(savedCompass);
        if (savedEnvironment === 'mixed' || savedEnvironment === 'urban' || savedEnvironment === 'suburban' || savedEnvironment === 'rural') setStudyEnvironment(savedEnvironment);
        if (savedUrbanLevel === 1 || savedUrbanLevel === 2 || savedUrbanLevel === 3) setStudyUrbanLevel(savedUrbanLevel);
        if (savedSampling === 'natural' || savedSampling === 'balanced') setStudySampling(savedSampling);
        if (savedPanoramaSource === 'mixed' || savedPanoramaSource === 'official' || savedPanoramaSource === 'contributor') setStudyPanoramaSource(savedPanoramaSource);
        else if (savedContributors === true) setStudyPanoramaSource('mixed');
        if (savedCompassStyle === 'bar' || savedCompassStyle === 'dial') setCompassStyle(savedCompassStyle);
        setDarkMode(savedDarkMode === true);
        setAudioPreferences(savedAudio);
        if (savedStreetView?.panoId && Number.isFinite(savedStreetView.heading)) setRestoredStreetView(savedStreetView);
        await Promise.all([
          savedCompass === undefined && localStorage.getItem(COMPASS_STORAGE_KEY) !== null && trainerDb.setSetting('preference.compass', compassPreference),
          savedEnvironment === undefined && localStorage.getItem(ENVIRONMENT_STORAGE_KEY) !== null && trainerDb.setSetting('preference.environment', studyEnvironment),
          savedUrbanLevel === undefined && localStorage.getItem(URBAN_LEVEL_STORAGE_KEY) !== null && trainerDb.setSetting('preference.urbanLevel', studyUrbanLevel),
          savedSampling === undefined && localStorage.getItem(SAMPLING_STORAGE_KEY) !== null && trainerDb.setSetting('preference.sampling', studySampling),
        ]);
        if (dbSelected) setSelectedCollectionId(dbSelected);
        const savedMode = savedReview?.attemptIds?.length ? 'review' : workspace?.mode;
        if (savedMode === 'review') { setTrainerStartTab(savedReview?.attemptIds?.length ? 'review' : workspace?.mode === 'review' && (workspace.surface === 'statistics' || workspace.surface === 'clues') ? workspace.surface : 'review'); setAppMode('review'); setShowHome(false); }
        else if (workspace?.mode === 'play' && workspace.gameId && workspace.settings) {
          setAppMode('play'); setShowHome(false); setIsGameActive(true); setGameSettings(workspace.settings);
          setGameRounds(Array.isArray(workspace.rounds) ? workspace.rounds : []); setCurrentRoundIndex(Number.isInteger(workspace.currentRoundIndex) ? workspace.currentRoundIndex : 0);
          setActiveRoundResult(workspace.activeRoundResult || null);
          gameIdRef.current = workspace.gameId; roundSubmittedRef.current = !!workspace.activeRoundResult;
          const restoredLocation = workspace.currentLocation && isLocation(workspace.currentLocation) ? workspace.currentLocation : null;
          setCurrentLocation(restoredLocation); restoredPlayPanoRef.current = restoredLocation?.panoId || null;
          roundStartTimeRef.current = Number.isFinite(workspace.roundStartedAt) ? workspace.roundStartedAt : Date.now();
          const restoredElapsed = Math.max(0, Math.floor((Date.now() - roundStartTimeRef.current) / 1000)); setPlayElapsed(restoredElapsed); setTimeRemaining(workspace.settings.timeLimitSeconds > 0 ? Math.max(0, workspace.settings.timeLimitSeconds - restoredElapsed) : null);
        } else if (workspace?.mode === 'study' && isLocation(workspace.location)) {
          restoredStudyPanoRef.current = workspace.location.panoId; restoreLearnSource(workspace.learnSource, workspace.metaLessonId); setAppMode('study'); setShowHome(false); setCurrentLocation(workspace.location); setIsRevealed(false);
        }
        workspaceRestoreAttemptedRef.current = true;
        setDbReady(true);
        setTrainerRefreshKey((key) => key + 1);
      })
      .catch((error) => {
        console.error('Trainer database failed to initialize; legacy data remains available.', error);
        setErrorMessage('Training database could not be opened. Existing legacy progress is still available.');
      });
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  useEffect(() => { const refresh = () => setTrainerRefreshKey((key) => key + 1); window.addEventListener(CLOUD_IMPORT_EVENT, refresh); return () => window.removeEventListener(CLOUD_IMPORT_EVENT, refresh); }, []);

  useEffect(() => {
    if (!summaryGameRecord) return;
    setPausedWorkspaces((saved) => ({ ...saved, play: undefined }));
    void trainerDb.setSetting('workspace.paused.play', null);
  }, [summaryGameRecord]);
  useEffect(() => { let active = true; setSummaryMistakes(null); if (summaryGameRecord) void trainerDb.attempts().then((attempts) => { if (active) setSummaryMistakes({ gameId: summaryGameRecord.id, attempts: gameMistakes(attempts, summaryGameRecord.id, schedulerStrictness) }); }); return () => { active = false; }; }, [schedulerStrictness, summaryGameRecord, trainerRefreshKey]);

  useEffect(() => {
    if (!dbReady || !workspaceRestoreAttemptedRef.current) return;
    const value: ActiveWorkspace = showHome
      ? { mode: 'home' }
      : appMode === 'review'
        ? { mode: 'review', surface: trainerStartTab === 'statistics' || trainerStartTab === 'clues' ? trainerStartTab : 'review' }
        : appMode === 'play' && isGameActive && gameSettings
          ? { mode: 'play', gameId: gameIdRef.current, settings: gameSettings, rounds: gameRounds, currentRoundIndex, currentLocation: currentLocation ? locationForWorkspace(currentLocation) : null, activeRoundResult, timeRemaining, roundStartedAt: roundStartTimeRef.current }
          : appMode === 'study' && currentLocation
            ? { mode: 'study', location: locationForWorkspace(currentLocation), learnSource, ...(activeMetaLesson?.id ? { metaLessonId: activeMetaLesson.id } : {}) }
            : { mode: 'home' };
    void trainerDb.setSetting('workspace.active', value);
    if (value.mode === 'study' || value.mode === 'play') { setPausedWorkspaces((saved) => ({ ...saved, [value.mode]: value })); void trainerDb.setSetting(`workspace.paused.${value.mode}`, value); }
  }, [activeMetaLesson?.id, appMode, currentLocation, currentRoundIndex, dbReady, gameRounds, gameSettings, isGameActive, activeRoundResult, learnSource, showHome, timeRemaining, trainerStartTab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (studyReviewSaving || isModalOpen || isNewGameModalOpen || isHistoryModalOpen || activeRoundResult || summaryGameRecord || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (appMode === 'study') {
        if (learnSource !== 'map' && (event.code === 'Space' || event.key.toLowerCase() === 'n')) { event.preventDefault(); handleNextLearn(); }
        else if (event.key.toLowerCase() === 'r') { event.preventDefault(); setIsRevealed((previous) => !previous); }
      }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRoundResult, appMode, handleNextLearn, isHistoryModalOpen, isModalOpen, isNewGameModalOpen, learnSource, studyReviewSaving, summaryGameRecord]);

  // Handle saving custom collection
  const handleSaveCollection = (collection: Omit<Collection, 'isCustom'>) => {
    const saved = { ...collection, isCustom: true };
    const updated = dbReady
      ? [...customCollections.filter((item) => item.id !== collection.id), saved]
      : saveCustomCollection(collection);
    void trainerDb.saveCollection({ ...collection, isCustom: true });
    setCustomCollections(updated);
    setSelectedCollectionId(collection.id);
    void trainerDb.setSetting('selectedCollectionId', collection.id);
    if (!dbReady) localStorage.setItem(LAST_COLLECTION_STORAGE_KEY, collection.id);
  };

  // Handle deleting custom collection
  const handleDeleteCollection = (id: string) => {
    const updated = dbReady ? customCollections.filter((item) => item.id !== id) : deleteCustomCollection(id);
    void trainerDb.deleteCollection(id);
    setCustomCollections(updated);
    if (selectedCollectionId === id) {
      setSelectedCollectionId('world');
      void trainerDb.setSetting('selectedCollectionId', 'world');
      if (!dbReady) localStorage.setItem(LAST_COLLECTION_STORAGE_KEY, 'world');
    }
  };

  const currentTotalScore = gameRounds.reduce((total, round) => total + round.score, 0);
  const canMove = appMode === 'review' && reviewAttempt ? reviewAttempt.canMove : appMode === 'play' && isGameActive && gameSettings ? gameSettings.canMove : true;
  const canPan = appMode === 'review' && reviewAttempt ? reviewAttempt.canPan : appMode === 'play' && isGameActive && gameSettings ? gameSettings.canPan : true;
  const canZoom = appMode === 'review' && reviewAttempt ? reviewAttempt.canZoom : appMode === 'play' && isGameActive && gameSettings ? gameSettings.canZoom : true;

  const handleSaveCoach = useCallback(async (note: { mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis }) => {
    setCoachNote(note);
    const location = currentLocationRef.current;
    if (location) { await saveCoachHistoryNote({ id: `coach-note-${crypto.randomUUID()}`, panoId: location.panoId, countryCode: location.countryCode, ...note }); setTrainerRefreshKey((key) => key + 1); }
    if (appMode === 'study' && currentVisitRef.current && currentVisitRef.current.panoId === currentLocationRef.current?.panoId) {
      Object.assign(currentVisitRef.current, { coachUsed: true, coachMode: note.mode, coachModel: note.model, coachGeneratedAt: note.generatedAt, coachAnalysis: note.analysis });
      await trainerDb.saveVisit({ ...currentVisitRef.current });
      await handleSaveStudyForReview(false);
    } else if (appMode === 'review') {
      setReviewAttemptRecord((attempt) => attempt ? { ...attempt, coachUsed: true, coachMode: note.mode, coachModel: note.model, coachGeneratedAt: note.generatedAt, coachAnalysis: note.analysis } : attempt);
    }
  }, [appMode, handleSaveStudyForReview]);

  const handleSaveClue = useCallback(async (clue: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis; origin?: 'personal' | 'coach' }) => {
    const location = currentLocationRef.current;
    if (!location) return;
    const id = `clue-${crypto.randomUUID()}`;
    await trainerDb.saveClue({ id, countryCode: location.countryCode, panoId: location.panoId, lat: location.lat, lng: location.lng, createdAt: clue.generatedAt, ...clue });
    if (appMode === 'play') playAiAssistedRef.current = true;
    if (appMode === 'study') await handleSaveStudyForReview(false);
    setTrainerRefreshKey((key) => key + 1);
    return id;
  }, [appMode, handleSaveStudyForReview]);

  return (
    <div className="geotrainer-shell flex flex-col w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 font-sans select-none">
      <AppTopBar
        appMode={appMode} showHome={showHome} isGameActive={isGameActive}
        currentLocation={currentLocation} isLoading={isLoading} isRevealed={isRevealed}
        gameSettings={gameSettings} currentRoundIndex={currentRoundIndex}
        currentTotalScore={currentTotalScore} timeRemaining={timeRemaining}
        pastGamesCount={pastGames.length} reviewAttempt={reviewAttempt}
        reviewStatsLength={reviewStats.length} reviewInitialTotal={reviewInitialTotal}
        reviewQueueLength={reviewQueue.length} reviewSource={reviewSource}
        isFullscreen={isFullscreen} statisticsActive={!showHome && appMode === 'review' && !reviewAttempt && trainerStartTab === 'statistics'} cluesActive={!showHome && appMode === 'review' && !reviewAttempt && trainerStartTab === 'clues'} studyReviewSaving={studyReviewSaving} learnSource={learnSource}
        onHome={() => { if (isGameActive && !window.confirm('Leave the active game and return home?')) return; abortControllerRef.current?.abort(); setIsGameActive(false); setTimeRemaining(null); setCurrentLocation(null); clearReviewSession(); setShowHome(true); }}
        onStudy={() => { if (isGameActive && !window.confirm('Pause active game and switch to Study mode?')) return; if (isGameActive) { abortControllerRef.current?.abort(); setIsGameActive(false); setTimeRemaining(null); setCurrentLocation(null); } clearReviewSession(); requestMode('study'); }}
        onPlay={() => { clearReviewSession(); requestMode('play'); }}
        onReview={() => { if (isGameActive && !window.confirm('Leave the active game and open Review?')) return; abortControllerRef.current?.abort(); setIsGameActive(false); setTimeRemaining(null); setCurrentLocation(null); clearReviewSession(); setTrainerStartTab('review'); setShowHome(false); setAppMode('review'); }}

        onExitReview={() => { clearReviewSession(); setCurrentLocation(null); }}
        onStatistics={() => { if (isGameActive && !window.confirm('Leave the active game and open Statistics?')) return; abortControllerRef.current?.abort(); setIsGameActive(false); setTimeRemaining(null); setCurrentLocation(null); clearReviewSession(); setTrainerStartTab('statistics'); setShowHome(false); setAppMode('review'); }}
        onClues={() => { if (isGameActive && !window.confirm('Leave the active game and open Clues?')) return; abortControllerRef.current?.abort(); setIsGameActive(false); setTimeRemaining(null); setCurrentLocation(null); clearReviewSession(); setTrainerStartTab('clues'); setShowHome(false); setAppMode('review'); }}
        onReveal={() => setIsRevealed((previous) => !previous)} onNextLocation={handleNextLearn}
        onAbandonGame={handleAbandonGame} onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenNewGame={() => setIsNewGameModalOpen(true)} onOpenPreferences={() => setPreferencesOpen(true)}
        onToggleFullscreen={toggleFullscreen}
      />
      <AppViewport
        appMode={appMode} showHome={showHome} currentLocation={currentLocation} isLoading={isLoading}
        statusMessage={statusMessage} errorMessage={errorMessage} mapsReady={mapsReady} activeCompass={activeCompass} compassStyle={compassStyle} restoredStreetView={restoredStreetView}
        isRevealed={isRevealed}
        isGameActive={isGameActive} gameSettings={gameSettings} activeRoundResult={activeRoundResult}
        playElapsed={playElapsed} timeRemaining={timeRemaining} isSubmittingGuess={isSubmittingGuess}
        reviewAttempt={reviewAttempt} reviewResult={reviewResult} reviewElapsed={reviewElapsed}
        pastGames={pastGames} allCollections={allCollections}
        trainerRefreshKey={trainerRefreshKey} trainerStartTab={trainerStartTab}
        studyReviewSaving={studyReviewSaving} studyReviewSaved={studyReviewSaved}
        canMove={canMove} canPan={canPan} canZoom={canZoom}
        onNextLocation={appMode === 'play' && isGameActive && gameSettings ? () => void fetchLocationForRound(gameSettings) : handleNextLearn}
        onMapsLoaded={handleMapsLoaded}
        onPanoramaChanged={(location) => void handleStudyPanoramaChanged(location)}
        onStudy={() => requestMode('study')}
        onPlay={() => requestMode('play')}
        onReview={() => { setShowHome(false); setTrainerStartTab('review'); setAppMode('review'); }}
        onOpenNewGame={() => setIsNewGameModalOpen(true)} onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenReview={(attempt, queue, source, kind) => void handleStartReview(attempt, queue, source, kind)}
        onOpenCoverage={handleOpenCoverageLocation}
        onTrainCountries={handleTrainCountries}
        onDataChanged={() => { void Promise.all([trainerDb.collections(), trainerDb.bookmarks(), trainerDb.games()]).then(([collections, savedBookmarks, games]) => { setCustomCollections(collections); setBookmarks(savedBookmarks); setPastGames(games); setTrainerRefreshKey((key) => key + 1); }); }}
        onSelectGame={(game) => setSummaryGameRecord(game)}
        onHideReveal={() => setIsRevealed(false)} onMetadata={handleStudyMetadata}
        onSaveForReview={() => void handleSaveStudyForReview(learnSource === 'custom')}
        onGuess={(guess) => { if (appMode === 'play') void handleGuessSubmit(guess); else void handleReviewGuess(guess); }}
        onStreetViewChanged={(view) => { void trainerDb.setSetting('workspace.streetView', view); }}
      />
      <AppOverlays
        appMode={appMode} showHome={showHome} currentLocation={currentLocation} isRevealed={isRevealed}
        reviewResult={reviewResult} reviewAttempt={reviewAttempt} reviewAttemptRecord={reviewAttemptRecord}
        reviewHistory={reviewHistory} reviewStats={reviewStats} reviewInitialTotal={reviewInitialTotal}
        reviewQueueLength={reviewQueue.length} reviewSource={reviewSource} reviewComplete={reviewComplete}
        activeRoundResult={activeRoundResult} gameSettings={gameSettings} currentRoundIndex={currentRoundIndex}
        gameRounds={gameRounds} summaryGameRecord={summaryGameRecord} isNewGameModalOpen={isNewGameModalOpen} isStudySetupOpen={isStudySetupOpen} studySetup={{ source: learnSource, collectionId: selectedCollectionId, environment: studyEnvironment, urbanLevel: studyUrbanLevel, samplingMode: studySampling, panoramaSource: studyPanoramaSource, showCompass: compassPreference }}
        isHistoryModalOpen={isHistoryModalOpen} isModalOpen={isModalOpen} editingCollection={editingCollection}
        pastGames={pastGames}
        allCollections={allCollections} coveragePreview={coveragePreview} compassPreference={compassPreference} activeCompass={activeCompass}
        preferencesOpen={preferencesOpen} trainerRefreshKey={trainerRefreshKey} reviewGrading={reviewGradingRef.current} learnSource={learnSource} activeMetaLesson={activeMetaLesson} mapPickerOpen={mapPickerOpen} metaAdviceOpen={metaAdviceOpen} mapsReady={mapsReady}
        onSaveCoach={handleSaveCoach} onSaveClue={handleSaveClue}
        onToggleCompass={toggleCompass}
        onClueAnalyzed={() => { if (appMode === 'play') playAiAssistedRef.current = true; }}
        onNextReview={() => void handleReviewNext()} onCloseCoverage={() => setCoveragePreview(null)}
        onClosePreferences={() => setPreferencesOpen(false)} onLanguageChange={(_, style, dark) => { setCompassStyle(style); setDarkMode(dark); void trainerDb.schedulerPreferences().then((scheduler) => setSchedulerStrictness(scheduler.strictness)); setTrainerRefreshKey((key) => key + 1); }}
        onCloseReviewComplete={() => { clearReviewSession(); setCurrentLocation(null); setTrainerStartTab('review'); }}
        onNextRound={handleNextRound}
        onPracticeMistakes={summaryMistakes?.attempts.length && summaryMistakes.gameId === summaryGameRecord?.id ? () => { setSummaryGameRecord(null); void handleStartReview(summaryMistakes.attempts[0], summaryMistakes.attempts, 'Game mistakes', 'correction'); } : undefined}
        onPlayAgain={() => { if (summaryGameRecord) { setSummaryGameRecord(null); handleStartGame(summaryGameRecord.settings); } }}
        onViewHistory={() => { setSummaryGameRecord(null); setIsHistoryModalOpen(true); }}
        onCloseSummary={() => setSummaryGameRecord(null)}
        onGoToLocation={(location) => { setSummaryGameRecord(null); setIsGameActive(false); setCurrentLocation(location); setAppMode('study'); setIsRevealed(true); }}
        onStartGame={(settings) => { setPausedWorkspaces((saved) => ({ ...saved, play: undefined })); void trainerDb.setSetting('workspace.paused.play', null); handleStartGame(settings); }} onCloseNewGame={() => setIsNewGameModalOpen(false)} onOpenHistory={() => { setIsNewGameModalOpen(false); setIsHistoryModalOpen(true); }} onCloseHistory={() => setIsHistoryModalOpen(false)} onStartStudy={(settings) => { if (settings.source === 'meta') startMeta(); else if (settings.source === 'map') startMap(); else { startCustom(); handleStartStudy(settings); } }} onCloseStudySetup={() => { setIsStudySetupOpen(false); if (!currentLocation) setShowHome(true); }}
        onOpenMapLocation={(location) => void openMapLocation(location)} onCloseMapPicker={() => { setMapPickerOpen(false); if (!currentLocation) setIsStudySetupOpen(true); }} onDismissMetaAdvice={dismissMetaAdvice} onNoteSaved={() => appMode === 'study' ? handleSaveStudyForReview(false) : undefined}
        onSelectGame={(game) => setSummaryGameRecord(game)}
        onDeleteGame={(id) => { const updated = dbReady ? pastGames.filter((game) => game.id !== id) : deleteGameRecord(id); setPastGames(updated); void trainerDb.deleteGame(id); }}
        onClearGames={() => { if (!dbReady) clearGameHistory(); setPastGames([]); void trainerDb.clearGames(); }}
        onSaveCollection={handleSaveCollection} onDeleteCollection={handleDeleteCollection}
        onCloseCollection={() => { setIsModalOpen(false); setEditingCollection(null); }}
      />
      <ResumeSessionDialog mode={resumePrompt} onResume={resumePausedMode} onNew={() => resumePrompt && startFreshMode(resumePrompt)} onBack={() => setResumePrompt(null)} />
    </div>
  );
}
