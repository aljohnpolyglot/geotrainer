import { useCallback, useState } from 'react';
import type { AppMode, LearnSource, LocationResult, MetaLesson } from '../types';
import { metaLessonById, nextMetaLesson, savedMetaLessonIds } from '../data/metaLessons';
import { trainerDb } from '../data/trainerDb';
import { reverseGeocodeLocation } from '../services/geocoding';
import { defaultLocationGenerator } from '../services/locationGenerator';

type LearnSourceContext = {
  setAppMode: (mode: AppMode) => void;
  setShowHome: (show: boolean) => void;
  setStudySetupOpen: (open: boolean) => void;
  setCurrentLocation: (location: LocationResult | null) => void;
  setIsLoading: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setIsRevealed: (revealed: boolean) => void;
};

export function useLearnSources(ctx: LearnSourceContext) {
  const { setAppMode, setShowHome, setStudySetupOpen, setCurrentLocation, setIsLoading, setErrorMessage, setIsRevealed } = ctx;
  const [learnSource, setLearnSource] = useState<LearnSource>('custom');
  const [activeMetaLesson, setActiveMetaLesson] = useState<MetaLesson>();
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [metaAdviceOpen, setMetaAdviceOpen] = useState(false);

  const prepare = useCallback((source: LearnSource) => {
    setLearnSource(source); setAppMode('study'); setShowHome(false); setStudySetupOpen(false);
    setCurrentLocation(null); setErrorMessage(null); setIsRevealed(false);
  }, [setAppMode, setCurrentLocation, setErrorMessage, setIsRevealed, setShowHome, setStudySetupOpen]);

  const openMetaLesson = useCallback(async (lesson: MetaLesson) => {
    prepare('meta'); setMapPickerOpen(false); setActiveMetaLesson(lesson); setIsLoading(true);
    try {
      const place = await reverseGeocodeLocation(lesson.lat, lesson.lng);
      if (!place?.countryCode) throw new Error('This Meta location could not be identified. Try another lesson.');
      const location = await defaultLocationGenerator.reopenLocation({ countryCode: place.countryCode, lat: lesson.lat, lng: lesson.lng, panoId: lesson.panoId, heading: lesson.heading });
      setCurrentLocation({ ...location, heading: lesson.heading });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not open this Meta lesson.');
    } finally { setIsLoading(false); }
  }, [prepare, setCurrentLocation, setErrorMessage, setIsLoading]);

  const startMeta = useCallback(async () => {
    const lesson = nextMetaLesson(undefined, Math.random, savedMetaLessonIds(await trainerDb.attempts()));
    if (!lesson) return setErrorMessage('No Meta lessons are available.');
    void trainerDb.setting<boolean>('preference.metaAdviceDismissed').then((dismissed) => setMetaAdviceOpen(dismissed !== true));
    await openMetaLesson(lesson);
  }, [openMetaLesson, setErrorMessage]);

  const nextMeta = useCallback(async () => {
    const lesson = nextMetaLesson(activeMetaLesson?.id, Math.random, savedMetaLessonIds(await trainerDb.attempts()));
    if (lesson) await openMetaLesson(lesson); else { setActiveMetaLesson(undefined); setCurrentLocation(null); setStudySetupOpen(true); }
  }, [activeMetaLesson?.id, openMetaLesson, setCurrentLocation, setStudySetupOpen]);

  const startMap = useCallback(() => {
    prepare('map'); setActiveMetaLesson(undefined); setMapPickerOpen(true);
  }, [prepare]);

  const startCustom = useCallback(() => { setLearnSource('custom'); setActiveMetaLesson(undefined); setMapPickerOpen(false); }, []);
  const startUploaded = useCallback(() => { setLearnSource('uploaded'); setActiveMetaLesson(undefined); setMapPickerOpen(false); }, []);

  const openMapLocation = useCallback(async (location: Omit<LocationResult, 'countryCode'>) => {
    setIsLoading(true); setErrorMessage(null);
    try {
      const place = await reverseGeocodeLocation(location.lat, location.lng);
      if (!place?.countryCode) throw new Error('This Street View location could not be identified. Choose another place.');
      setMapPickerOpen(false); setCurrentLocation({ ...location, countryCode: place.countryCode });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not open that Street View location.');
    } finally { setIsLoading(false); }
  }, [setCurrentLocation, setErrorMessage, setIsLoading]);

  const dismissMetaAdvice = useCallback((forever: boolean) => {
    setMetaAdviceOpen(false);
    if (forever) void trainerDb.setSetting('preference.metaAdviceDismissed', true);
  }, []);

  const restoreLearnSource = useCallback((source?: LearnSource, metaLessonId?: string) => {
    const restored = source === 'meta' || source === 'map' || source === 'uploaded' ? source : 'custom';
    setLearnSource(restored); setActiveMetaLesson(restored === 'meta' ? metaLessonById(metaLessonId) : undefined);
  }, []);

  return { learnSource, activeMetaLesson, mapPickerOpen, metaAdviceOpen, startCustom, startUploaded, startMeta, nextMeta, startMap,
    openMapLocation, setMapPickerOpen, dismissMetaAdvice, restoreLearnSource };
}
