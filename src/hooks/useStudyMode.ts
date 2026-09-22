import { useCallback, useEffect, useRef, useState } from 'react';
import { BookmarkLocation, Collection, Environment, LearnedMeta, LearnPriority, LocationPoolTarget, LocationResult, PanoramaSource, SamplingMode, StudyVisit, TrainerLocation, UrbanLevel } from '../types';
import { COUNTRIES } from '../data/countries';
import { getBookmarks, deleteBookmark, isLocationBookmarked, saveBookmark } from '../data/bookmarks';
import { trainerDb } from '../data/trainerDb';
import { defaultLocationGenerator } from '../services/locationGenerator';
import { reverseGeocodeLocation } from '../services/geocoding';
import { isCurrentPanorama, isLatestRequest } from '../services/requestIntegrity';
import { captureStreetViewImage, getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { getImportedMap, moveImportedHistory, pickImportedLocation, type ImportedMapHistory } from '../services/importedMap';
import { learningPriorityTarget, leastExposureCountryOrder, trainedWorldCountries } from '../services/learningPriority';
import { loadCityPools } from '../services/cityPools';

const LAST_COLLECTION_STORAGE_KEY = 'sv_last_selected_collection_id';
const COMPASS_STORAGE_KEY = 'sv_show_compass';
const ENVIRONMENT_STORAGE_KEY = 'sv_environment';
const URBAN_LEVEL_STORAGE_KEY = 'sv_urban_level';
const SAMPLING_STORAGE_KEY = 'sv_sampling_mode';

export const consumeRestoredStudyPano = (restored: { current: string | null }, panoId: string) => {
  if (restored.current !== panoId) return false;
  restored.current = null;
  return true;
};
export const latestStudyVisit = (visits: StudyVisit[], panoId: string) => visits.filter((visit) => visit.panoId === panoId).sort((a, b) => b.openedAt - a.openedAt)[0];

export function useStudyMode(ctx: any) {
  const uploadedHistoryRef = useRef<ImportedMapHistory>({ locations: [], index: -1 });
  const uploadedTotalRef = useRef(0);
  const skipUploadedSeedRef = useRef(false);
  const [canPreviousUploaded, setCanPreviousUploaded] = useState(false);
  const [uploadedProgress, setUploadedProgress] = useState<{ position: number; total: number }>();
  const { appMode, showHome, dbReady, currentLocation, setCurrentLocation, isLoading, setIsLoading, setErrorMessage,
    selectedCollectionId, setSelectedCollectionId, customCollections, setCustomCollections, bookmarks, setBookmarks,
    setTrainerRefreshKey, activeCollectionRef, studyEnvironment, setStudyEnvironment, studyUrbanLevel, setStudyUrbanLevel, studySampling, setStudySampling, studyPriority, setStudyPriority, studyPanoramaSource, setStudyPanoramaSource, studyAllowInteriors, setStudyAllowInteriors, setStudyLocationTargets, studyEnvironmentRef, studyUrbanLevelRef, studySamplingRef, studyPriorityRef, studyPanoramaSourceRef, studyAllowInteriorsRef, studyLocationTargetsRef, currentLocationRef,
    generationPendingRef, abortControllerRef, latestGenerationRequestRef, latestPanoramaSyncRef, recentStudyPanosRef,
    isMapsReadyRef, hasAutoFetchedRef, mapsReady, setMapsReady, currentVisitRef, activeStartedAtRef,
    setIsRevealed, setCoachNote, setEditingCollection, setIsModalOpen, temporaryCollection, setTemporaryCollection,
    compassPreference, setCompassPreference, reviewAttempt, reviewCompass, setReviewCompass, reviewQueue, reviewSource, reviewKind,
    reviewInitialTotal, setStudyReviewSaving, studyReviewSaving, setStudyReviewSaved,
    setAppMode, setShowHome, isGameActive, gameSettings, setCurrentLocationForReview, fetchNextLocationForReview, restoredStudyPanoRef, isStudySetupOpen, setIsStudySetupOpen } = ctx;
  const flushStudyActive = useCallback((resume = false) => {
    const startedAt = activeStartedAtRef.current; const visit = currentVisitRef.current;
    if (startedAt && visit) { const elapsed = Math.max(0, (Date.now() - startedAt) / 1000); visit.activeTimeSeconds += elapsed; void trainerDb.saveVisit({ ...visit }); }
    activeStartedAtRef.current = resume && document.visibilityState === 'visible' && !!visit ? Date.now() : null;
  }, [activeStartedAtRef, currentVisitRef]);
  const closeStudyVisit = useCallback(() => { flushStudyActive(false); if (currentVisitRef.current) { currentVisitRef.current.closedAt = Date.now(); void trainerDb.saveVisit({ ...currentVisitRef.current }); currentVisitRef.current = null; } }, [currentVisitRef, flushStudyActive]);
  useEffect(() => { if (!dbReady) return; closeStudyVisit(); if (showHome || appMode !== 'study' || !currentLocation || isLoading) return; let active = true; const openedAt = Date.now(); const created: StudyVisit = { id: `visit-${crypto.randomUUID()}`, panoId: currentLocation.panoId, lat: currentLocation.lat, lng: currentLocation.lng, countryCode: currentLocation.countryCode, collectionId: selectedCollectionId, environment: currentLocation.environment ?? studyEnvironment, environmentRequested: currentLocation.environmentRequested ?? studyEnvironment, urbanLevel: currentLocation.urbanLevel ?? studyUrbanLevel, samplingMode: studySampling, openedAt, activeTimeSeconds: 0, wasRevealed: false, bookmarked: bookmarks.some((item: BookmarkLocation) => item.panoId === currentLocation.panoId), learnSource: ctx.learnSource, ...(ctx.activeMetaLesson?.id ? { metaLessonId: ctx.activeMetaLesson.id } : {}) }; void Promise.resolve().then(async () => { if (!active) return; const restored = consumeRestoredStudyPano(restoredStudyPanoRef, currentLocation.panoId); const previous = restored ? latestStudyVisit(await trainerDb.studyVisits(), currentLocation.panoId) : undefined; if (!active) return; const visit = previous ? { ...previous, closedAt: undefined } : created; currentVisitRef.current = visit; activeStartedAtRef.current = document.visibilityState === 'visible' ? Date.now() : null; await trainerDb.saveVisit(visit); if (!restored) await trainerDb.encounter(currentLocation); setTrainerRefreshKey((key: number) => key + 1); }); return () => { active = false; }; }, [appMode, closeStudyVisit, currentLocation?.panoId, dbReady, isLoading, setTrainerRefreshKey, showHome, ctx.learnSource, ctx.activeMetaLesson?.id]);
  useEffect(() => { const onVisibility = () => flushStudyActive(document.visibilityState === 'visible'); const onBlur = () => flushStudyActive(false); const onFocus = () => flushStudyActive(true); document.addEventListener('visibilitychange', onVisibility); window.addEventListener('blur', onBlur); window.addEventListener('focus', onFocus); return () => { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); closeStudyVisit(); }; }, [closeStudyVisit, flushStudyActive]);
  useEffect(() => { if (ctx.learnSource === 'uploaded' && !currentLocation && !isStudySetupOpen && !uploadedHistoryRef.current.locations.length) setUploadedProgress(undefined); }, [currentLocation, ctx.learnSource, isStudySetupOpen]);
  useEffect(() => { if (!ctx.isRevealed || !currentVisitRef.current) return; currentVisitRef.current.wasRevealed = true; void trainerDb.saveVisit({ ...currentVisitRef.current }); }, [ctx.isRevealed, currentVisitRef]);

  const handleStudyMetadata = useCallback((details: any) => { if (!currentVisitRef.current || !isCurrentPanorama(details.panoId, currentVisitRef.current.panoId) || !isCurrentPanorama(details.panoId, currentLocationRef.current?.panoId)) return; Object.assign(currentVisitRef.current, details); void trainerDb.saveVisit({ ...currentVisitRef.current }); }, [currentLocationRef, currentVisitRef]);
  const handleStudyPanoramaChanged = useCallback(async (location: LocationResult) => { if (generationPendingRef.current || currentLocationRef.current?.panoId === location.panoId) return; setIsRevealed(false); const syncId = ++latestPanoramaSyncRef.current; const generationId = latestGenerationRequestRef.current; const resolved = await reverseGeocodeLocation(location.lat, location.lng); if (syncId !== latestPanoramaSyncRef.current || !isLatestRequest(generationId, latestGenerationRequestRef.current)) return; if (!resolved?.countryCode) { setCurrentLocation(null); setErrorMessage('The moved panorama could not be geographically verified. Generate another location.'); return; } setCurrentLocation({ ...location, countryCode: resolved.countryCode }); recentStudyPanosRef.current = [location.panoId, ...recentStudyPanosRef.current.filter((id: string) => id !== location.panoId)].slice(0, 15); }, [currentLocationRef, generationPendingRef, latestGenerationRequestRef, latestPanoramaSyncRef, recentStudyPanosRef, setCurrentLocation, setErrorMessage, setIsRevealed]);
  const openUploadedHistory = (history: ImportedMapHistory) => {
    ++latestGenerationRequestRef.current; ++latestPanoramaSyncRef.current;
    abortControllerRef.current?.abort(); generationPendingRef.current = false;
    uploadedHistoryRef.current = history; setCanPreviousUploaded(history.index > 0);
    setUploadedProgress(uploadedTotalRef.current ? { position: history.index + 1, total: uploadedTotalRef.current } : undefined);
    setCoachNote(null); setStudyReviewSaved(false); setIsRevealed(false); setErrorMessage(null); setIsLoading(false); ctx.setStatusMessage('');
    setCurrentLocation(history.locations[history.index]);
  };
  const handlePreviousUploaded = () => {
    if (ctx.learnSource !== 'uploaded' || isLoading || studyReviewSaving) return;
    const history = moveImportedHistory(uploadedHistoryRef.current, 'previous');
    if (history !== uploadedHistoryRef.current) openUploadedHistory(history);
  };
  const fetchNextLocation = useCallback(async () => {
    const importedMapId = ctx.studyImportedMapIdRef.current;
    if (importedMapId) {
      uploadedTotalRef.current = (await getImportedMap(importedMapId))?.points.length || 0;
      if (skipUploadedSeedRef.current) skipUploadedSeedRef.current = false;
      else if (!uploadedHistoryRef.current.locations.length && currentLocation) uploadedHistoryRef.current = moveImportedHistory(uploadedHistoryRef.current, 'next', currentLocation);
      const next = moveImportedHistory(uploadedHistoryRef.current, 'next');
      if (next !== uploadedHistoryRef.current) { openUploadedHistory(next); return; }
    }
    const collection = activeCollectionRef.current;
    if (!importedMapId && (!collection || !collection.countryCodes.length)) { setErrorMessage('Current collection has no countries selected.'); return; }
    const requestId = ++latestGenerationRequestRef.current; generationPendingRef.current = true; latestPanoramaSyncRef.current++;
    abortControllerRef.current?.abort(); const controller = new AbortController(); abortControllerRef.current = controller;
    setCurrentLocation(null); setCoachNote(null); setStudyReviewSaved(false); setIsLoading(true); setErrorMessage(null); setIsRevealed(false);
    ctx.setStatusMessage('Finding random Street View panorama...');
    try {
      let target: ReturnType<typeof learningPriorityTarget> = { countryCodes: collection.countryCodes };
      let preferredCountryCodes: string[] | undefined;
      const priorityCountryCodes = studyPriorityRef.current === 'least-exposure' && collection.id === 'world' ? trainedWorldCountries(collection.countryCodes) : collection.countryCodes;
      if (!importedMapId && !studyLocationTargetsRef.current.length && studyPriorityRef.current !== 'random') {
        const history = await trainerDb.locations();
        target = learningPriorityTarget(studyPriorityRef.current, priorityCountryCodes, history);
        if (studyPriorityRef.current === 'least-exposure' && target.countryCodes.length === 1) target = learningPriorityTarget(studyPriorityRef.current, target.countryCodes, history, Math.random, await loadCityPools(target.countryCodes[0]));
        if (target.countryCodes.length === 1 && priorityCountryCodes.length > 1) preferredCountryCodes = studyPriorityRef.current === 'least-exposure' ? leastExposureCountryOrder(priorityCountryCodes, history, target.countryCodes[0]) : [target.countryCodes[0], ...priorityCountryCodes.filter((code: string) => code !== target.countryCodes[0])];
      }
      const result = importedMapId
        ? await pickImportedLocation(importedMapId, new Set(uploadedHistoryRef.current.locations.map((item) => item.panoId)), controller.signal, false, ctx.studyImportedVariationRef.current)
        : await defaultLocationGenerator.findRandomLocation(preferredCountryCodes ? priorityCountryCodes : target.countryCodes, controller.signal, (message) => { if (isLatestRequest(requestId, latestGenerationRequestRef.current)) ctx.setStatusMessage(message); }, { environment: studyEnvironmentRef.current, urbanLevel: studyUrbanLevelRef.current, samplingMode: studySamplingRef.current, panoramaSource: studyPanoramaSourceRef.current, allowInteriors: studyAllowInteriorsRef.current }, { requestId, collectionId: collection.id, excludedPanoIds: new Set(recentStudyPanosRef.current), requireNavigation: true, preferredCandidate: target.preferredCandidate, preferredCountryCodes, locationTargets: studyLocationTargetsRef.current });
      if (!isLatestRequest(requestId, latestGenerationRequestRef.current)) return;
      recentStudyPanosRef.current = [result.panoId, ...recentStudyPanosRef.current.filter((id: string) => id !== result.panoId)].slice(0, 15);
      if (importedMapId) { uploadedHistoryRef.current = moveImportedHistory(uploadedHistoryRef.current, 'next', result); setCanPreviousUploaded(uploadedHistoryRef.current.index > 0); setUploadedProgress({ position: uploadedHistoryRef.current.index + 1, total: uploadedTotalRef.current }); }
      setCurrentLocation(result);
    } catch (error: unknown) {
      if (!isLatestRequest(requestId, latestGenerationRequestRef.current) || (error instanceof Error && error.name === 'AbortError')) return;
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate random location');
    } finally {
      if (isLatestRequest(requestId, latestGenerationRequestRef.current)) { generationPendingRef.current = false; setIsLoading(false); ctx.setStatusMessage(''); }
    }
  }, [abortControllerRef, activeCollectionRef, ctx, currentLocation, generationPendingRef, latestGenerationRequestRef, latestPanoramaSyncRef, recentStudyPanosRef, setCoachNote, setCurrentLocation, setErrorMessage, setIsLoading, setIsRevealed, setStudyReviewSaved, studyAllowInteriorsRef, studyEnvironmentRef, studyPanoramaSourceRef, studyPriorityRef, studySamplingRef, studyUrbanLevelRef]);
  const handleMapsLoaded = useCallback(() => { isMapsReadyRef.current = true; setMapsReady(true); if (!showHome && appMode === 'study' && (ctx.learnSource === 'custom' || ctx.learnSource === 'uploaded') && !isStudySetupOpen && !currentLocation && !hasAutoFetchedRef.current) { hasAutoFetchedRef.current = true; void fetchNextLocation(); } }, [appMode, currentLocation, fetchNextLocation, hasAutoFetchedRef, isMapsReadyRef, isStudySetupOpen, setMapsReady, showHome, ctx.learnSource]);
  const handleSelectCollection = (id: string) => { if (id === '__create_new__') { setEditingCollection(null); setIsModalOpen(true); return; } setSelectedCollectionId(id); void trainerDb.setSetting('selectedCollectionId', id); if (!dbReady) localStorage.setItem(LAST_COLLECTION_STORAGE_KEY, id); if (isMapsReadyRef.current && appMode === 'study') setTimeout(() => void fetchNextLocation(), 0); };
  const currentIsBookmarked = currentLocation ? isLocationBookmarked(currentLocation.panoId, bookmarks) : false;
  const handleToggleBookmark = useCallback((details?: any) => { if (!currentLocation) return; if (currentIsBookmarked) { const updated = dbReady ? bookmarks.filter((item: BookmarkLocation) => item.panoId !== currentLocation.panoId) : deleteBookmark(currentLocation.panoId); setBookmarks(updated); void trainerDb.deleteBookmark(currentLocation.panoId); if (currentVisitRef.current) currentVisitRef.current.bookmarked = false; } else { const newBookmark: BookmarkLocation = { id: `bm-${Date.now()}`, panoId: currentLocation.panoId, lat: currentLocation.lat, lng: currentLocation.lng, countryCode: currentLocation.countryCode, countryName: COUNTRIES[currentLocation.countryCode]?.name || currentLocation.countryCode, savedAt: Date.now(), exactAddress: details?.exactAddress, locality: details?.locality, adminArea: details?.adminArea }; const updated = dbReady ? [newBookmark, ...bookmarks.filter((item: BookmarkLocation) => item.panoId !== newBookmark.panoId)] : saveBookmark(newBookmark); setBookmarks(updated); void trainerDb.saveBookmark(newBookmark); void captureStreetViewImage(currentLocation.panoId).then((image) => image && trainerDb.saveLocationImage(currentLocation.panoId, image)); if (currentVisitRef.current) currentVisitRef.current.bookmarked = true; } if (currentVisitRef.current) void trainerDb.saveVisit({ ...currentVisitRef.current }); setTrainerRefreshKey((key: number) => key + 1); }, [bookmarks, currentIsBookmarked, currentLocation, currentVisitRef, dbReady, setBookmarks, setTrainerRefreshKey]);
  const handleSelectBookmark = (bookmark: BookmarkLocation) => { setCurrentLocation({ countryCode: bookmark.countryCode, lat: bookmark.lat, lng: bookmark.lng, panoId: bookmark.panoId }); setIsRevealed(true); };
  const handleSaveStudyForReview = async () => { if (!currentLocation || studyReviewSaving) return; setStudyReviewSaving(true); try { const now = Date.now(); const imageDataUrl = await captureStreetViewImage(currentLocation.panoId); await Promise.all([trainerDb.saveAttempt({ id: `study-card:${currentLocation.panoId}`, gameId: 'study', roundNumber: 1, panoId: currentLocation.panoId, actualLat: currentLocation.lat, actualLng: currentLocation.lng, countryCode: currentLocation.countryCode, guessedLat: null, guessedLng: null, distanceKm: null, score: 0, timeSpentSeconds: 0, collectionId: selectedCollectionId, canMove: true, canPan: true, canZoom: true, showCompass: compassPreference, environment: studyEnvironment, urbanLevel: studyUrbanLevel, environmentRequested: studyEnvironment, samplingMode: studySampling, createdAt: now, source: 'study', locationId: currentLocation.panoId, heading: getStreetViewSnapshot(currentLocation.panoId)?.heading, learnSource: ctx.learnSource, ...(ctx.activeMetaLesson?.id ? { metaLessonId: ctx.activeMetaLesson.id } : {}) }), trainerDb.queueForReview(currentLocation.panoId, false, currentLocation), imageDataUrl ? trainerDb.saveLocationImage(currentLocation.panoId, imageDataUrl) : Promise.resolve(), ctx.learnSource === 'meta' && ctx.activeMetaLesson?.id ? trainerDb.setting<LearnedMeta[]>('meta.learned').then((learned = []) => trainerDb.setSetting('meta.learned', [{ id: ctx.activeMetaLesson.id, countryCode: currentLocation.countryCode, learnedAt: now }, ...learned.filter((item) => item.id !== ctx.activeMetaLesson.id)])) : Promise.resolve()]); setTrainerRefreshKey((key: number) => key + 1); setStudyReviewSaved(true); } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Could not save this location for Review.'); } finally { setStudyReviewSaving(false); } };
  const handleTrainCountries = (countryCodes: string[], name: string) => { if (!countryCodes.length) return; const collection = { id: `temporary-${Date.now()}`, name, countryCodes }; setTemporaryCollection(collection); setSelectedCollectionId(collection.id); activeCollectionRef.current = collection; setAppMode('study'); setShowHome(false); setTimeout(() => void fetchNextLocation(), 0); };
  const handleStartStudy = (settings: { collectionId: string; countryCodes?: string[]; locationTargets?: LocationPoolTarget[]; importedMapVariation?: number; environment: Environment; urbanLevel: UrbanLevel; samplingMode: SamplingMode; priority: LearnPriority; panoramaSource: PanoramaSource; allowInteriors: boolean; showCompass: boolean }) => { uploadedHistoryRef.current = { locations: [], index: -1 }; setCanPreviousUploaded(false); skipUploadedSeedRef.current = !!ctx.studyImportedMapIdRef.current; ctx.studyImportedVariationRef.current = settings.importedMapVariation ?? 0; const focused = settings.countryCodes || []; const collection = focused.length ? { id: `focus:${focused.join(',')}`, name: focused.map((code) => COUNTRIES[code]?.name || code).join(' + '), countryCodes: focused } : ctx.allCollections.find((item: Collection) => item.id === settings.collectionId) || activeCollectionRef.current; setTemporaryCollection(focused.length ? collection : null); setSelectedCollectionId(collection.id); activeCollectionRef.current = collection; setStudyEnvironment(settings.environment); setStudyUrbanLevel(settings.urbanLevel); setStudySampling(settings.samplingMode); setStudyPriority(settings.priority); setStudyPanoramaSource(settings.panoramaSource); setStudyAllowInteriors(settings.allowInteriors); setStudyLocationTargets(settings.locationTargets || []); studyEnvironmentRef.current = settings.environment; studyUrbanLevelRef.current = settings.urbanLevel; studySamplingRef.current = settings.samplingMode; studyPriorityRef.current = settings.priority; studyPanoramaSourceRef.current = settings.panoramaSource; studyAllowInteriorsRef.current = settings.allowInteriors; studyLocationTargetsRef.current = settings.locationTargets || []; setCompassPreference(settings.showCompass); setStudyReviewSaved(false); setIsStudySetupOpen(false); setShowHome(false); setAppMode('study'); setCurrentLocation(null); void Promise.all([trainerDb.setSetting('selectedCollectionId', settings.collectionId), trainerDb.setSetting('preference.environment', settings.environment), trainerDb.setSetting('preference.urbanLevel', settings.urbanLevel), trainerDb.setSetting('preference.sampling', settings.samplingMode), trainerDb.setSetting('preference.learnPriority', settings.priority), trainerDb.setSetting('preference.panoramaSource', settings.panoramaSource), trainerDb.setSetting('preference.allowContributors', settings.panoramaSource !== 'official'), trainerDb.setSetting('preference.allowInteriors', settings.allowInteriors), trainerDb.setSetting('preference.compass', settings.showCompass)]); if (mapsReady) setTimeout(() => void fetchNextLocation(), 0); };
  const handleOpenCoverageLocation = (location: TrainerLocation) => ctx.setCoveragePreview(location);
  const toggleFullscreen = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); ctx.setIsFullscreen(true); } else { document.exitFullscreen?.().catch(() => {}); ctx.setIsFullscreen(false); } };
  const activeCompass = appMode === 'play' && isGameActive ? gameSettings?.showCompass ?? true : appMode === 'review' && reviewAttempt ? reviewCompass : compassPreference;
  const toggleCompass = () => { if (appMode === 'play' && isGameActive) return; const next = !(appMode === 'review' && reviewAttempt ? reviewCompass : compassPreference); setCompassPreference(next); localStorage.setItem(COMPASS_STORAGE_KEY, String(next)); void trainerDb.setSetting('preference.compass', next); if (appMode === 'review' && reviewAttempt) { setReviewCompass(next); void trainerDb.setSetting('review.active', { attemptIds: reviewQueue.map((item: any) => item.id), source: reviewSource, kind: reviewKind, initialTotal: reviewInitialTotal, compass: next }); } };
  return { flushStudyActive, closeStudyVisit, handleStudyMetadata, handleStudyPanoramaChanged, fetchNextLocation, handlePreviousUploaded, canPreviousUploaded, uploadedProgress, handleMapsLoaded, handleSelectCollection, currentIsBookmarked, handleToggleBookmark, handleSelectBookmark, handleSaveStudyForReview, handleTrainCountries, handleStartStudy, handleOpenCoverageLocation, toggleFullscreen, activeCompass, toggleCompass };
}
