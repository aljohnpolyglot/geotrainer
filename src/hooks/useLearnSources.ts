import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppMode, LearnSource, LocationResult, MetaLesson } from '../types';
import { META_LESSONS, beginnerHistoryFromVisits, metaLessonById, selectMetaLesson } from '../data/metaLessons';
import { loadMetaCountryCourse, type MetaCountryCourseTip } from '../data/metaCountryCourses';
import { loadMetaCountryViews, viewFromGoogleMapsUrl } from '../data/metaCountryViews';
import { markMetaSeen, readMetaSeen } from '../data/metaProgress';
import { trainerDb } from '../data/trainerDb';
import { reverseGeocodeLocation } from '../services/geocoding';
import { defaultLocationGenerator } from '../services/locationGenerator';
import { findExplorePanorama } from '../services/exploreMap';
import type { PanoramaSource } from '../types';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CLOUD_IMPORT_EVENT } from '../services/cloudSyncEvent';
import { translate } from '../services/language';
import { openAvailableMetaTip } from '../services/metaNavigation';

type LearnSourceContext = {
  appMode: AppMode;
  showHome: boolean;
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
  const { ui } = useLanguagePreferences();
  const t = useCallback((key: string) => translate(ui, key), [ui]);
  const [learnSource, setLearnSource] = useState<LearnSource>('custom');
  const [activeMetaLesson, setActiveMetaLesson] = useState<MetaLesson>();
  const [activeCountryTip, setActiveCountryTip] = useState<MetaCountryCourseTip>();
  const [metaCourseId, setMetaCourseId] = useState('beginner');
  const [countryTips, setCountryTips] = useState<MetaCountryCourseTip[]>([]);
  const [metaIndex, setMetaIndex] = useState(0);
  const [beginnerHistory, setBeginnerHistory] = useState<string[]>([]);
  const [metaSeen, setMetaSeen] = useState(new Set<string>());
  const requestRef = useRef(0);
  const nextPendingRef = useRef(false);
  useEffect(() => { if (ctx.showHome || ctx.appMode !== 'study') requestRef.current++; }, [ctx.appMode, ctx.showHome]);
  useEffect(() => { const refresh = () => { void readMetaSeen().then(setMetaSeen); }; window.addEventListener(CLOUD_IMPORT_EVENT, refresh); return () => window.removeEventListener(CLOUD_IMPORT_EVENT, refresh); }, []);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [metaAdviceOpen, setMetaAdviceOpen] = useState(false);

  const prepare = useCallback((source: LearnSource) => {
    setLearnSource(source); setAppMode('study'); setShowHome(false); setStudySetupOpen(false);
    setCurrentLocation(null); setErrorMessage(null); setIsRevealed(false);
  }, [setAppMode, setCurrentLocation, setErrorMessage, setIsRevealed, setShowHome, setStudySetupOpen]);

  const openMetaLesson = useCallback(async (lesson: MetaLesson, countryCode?: string, requestId?: number) => {
    const request = requestId ?? ++requestRef.current;
    prepare('meta'); setMapPickerOpen(false); setActiveMetaLesson(lesson); setIsLoading(true);
    try {
      await (globalThis as typeof globalThis & { __geotrainerMapsLoad?: Promise<unknown[]> }).__geotrainerMapsLoad;
      const code = countryCode || (await reverseGeocodeLocation(lesson.lat, lesson.lng))?.countryCode;
      if (!code) throw new Error(t('Could not open this Meta lesson.'));
      const location = await defaultLocationGenerator.reopenLocation({ countryCode: code, lat: lesson.lat, lng: lesson.lng, panoId: lesson.panoId, heading: lesson.heading, pitch: lesson.pitch ?? 0 }, { fallbackRadiusM: 50, maxOriginalDistanceKm: .05 });
      if (request !== requestRef.current) return;
      setActiveMetaLesson({ ...lesson, panoId: location.panoId, lat: location.lat, lng: location.lng });
      setCurrentLocation({ ...location, heading: lesson.heading, pitch: lesson.pitch ?? 0 });
      return true;
    } catch (error) {
      if (request !== requestRef.current) return;
      setErrorMessage(error instanceof Error && error.message === t('Clue panorama unavailable') ? error.message : t('Could not open this Meta lesson.'));
      return false;
    } finally { if (request === requestRef.current) setIsLoading(false); }
  }, [prepare, setCurrentLocation, setErrorMessage, setIsLoading, t]);

  const openCountryTip = useCallback(async (tip: MetaCountryCourseTip, code: string) => {
    const request = ++requestRef.current;
    prepare('meta'); setActiveCountryTip(tip); setActiveMetaLesson(undefined); setIsLoading(true);
    try {
      const view = viewFromGoogleMapsUrl(tip.mapUrl) || (await loadMetaCountryViews(code)).get(tip.id);
      if (request !== requestRef.current) return;
      if (view) return await openMetaLesson({ id: tip.id, panoId: view.panoId, lat: view.lat, lng: view.lng, heading: view.heading, pitch: view.pitch, imageUrl: tip.image || '', text: tip.text, note: tip.note, section: tip.section, mapUrl: tip.mapUrl }, code, request);
      setIsLoading(false);
      return false;
    } catch { if (request === requestRef.current) { setErrorMessage(t('Could not open this Meta lesson.')); setIsLoading(false); return false; } }
  }, [openMetaLesson, prepare, setErrorMessage, setIsLoading, t]);

  const openAvailableCountryTip = useCallback(async (tips: MetaCountryCourseTip[], start: number, code: string, direction = 1) => {
    const index = await openAvailableMetaTip(tips, start, (tip) => openCountryTip(tip, code), direction);
    if (index === undefined) return;
    if (index !== null) { setMetaIndex(index); return; }
    setActiveCountryTip(undefined); setActiveMetaLesson(undefined); setCurrentLocation(null);
    setIsLoading(false); setErrorMessage(t('No lessons are available for this course.')); setStudySetupOpen(true);
  }, [openCountryTip, setCurrentLocation, setErrorMessage, setIsLoading, setStudySetupOpen, t]);

  const startMeta = useCallback(async (courseId = 'beginner', lessonId?: string) => {
    const request = ++requestRef.current;
    setIsLoading(true); setErrorMessage(null);
    try {
      const [seen, visits] = await Promise.all([readMetaSeen(), trainerDb.studyVisits()]);
      if (request !== requestRef.current) return;
      setMetaSeen(seen); setMetaCourseId(courseId);
      void trainerDb.setting<boolean>('preference.metaAdviceDismissed').then((dismissed) => setMetaAdviceOpen(dismissed !== true));
      if (courseId === 'beginner') {
        const excluded = new Set(seen);
        let lesson = selectMetaLesson(lessonId, excluded);
        setCountryTips([]); setActiveCountryTip(undefined); setMetaIndex(0);
        while (lesson) {
          const opened = await openMetaLesson(lesson);
          if (opened === undefined) return;
          if (opened) { const history = beginnerHistoryFromVisits(visits, lesson.id); setBeginnerHistory(history); setMetaIndex(history.length - 1); return; }
          excluded.add(lesson.id);
          lesson = selectMetaLesson(undefined, excluded);
        }
        setActiveMetaLesson(undefined); setCurrentLocation(null); setStudySetupOpen(true);
      } else {
        const tips = await loadMetaCountryCourse(courseId, ui);
        if (request !== requestRef.current) return;
        if (!tips.length) throw new Error(t('No lessons are available for this course.'));
        const index = lessonId ? tips.findIndex((tip) => tip.id === lessonId) : tips.findIndex((tip) => !seen.has(tip.id));
        const position = Math.max(0, index);
        setCountryTips(tips); setBeginnerHistory([]); setMetaIndex(position);
        await openAvailableCountryTip(tips, position, courseId);
      }
    } catch { if (request === requestRef.current) { setErrorMessage(t('Could not load Meta course.')); setStudySetupOpen(true); } }
    finally { if (request === requestRef.current) setIsLoading(false); }
  }, [openAvailableCountryTip, openMetaLesson, setCurrentLocation, setErrorMessage, setIsLoading, setStudySetupOpen, t, ui]);

  const nextMeta = useCallback(async () => {
    if (nextPendingRef.current) return;
    const id = metaCourseId === 'beginner' ? activeMetaLesson?.id : activeCountryTip?.id;
    if (!id) return;
    const request = requestRef.current;
    nextPendingRef.current = true;
    setIsLoading(true);
    try {
      await markMetaSeen(metaCourseId, id);
      if (request !== requestRef.current) return;
      const seen = new Set<string>(metaSeen).add(id); setMetaSeen(seen);
      if (metaCourseId !== 'beginner') {
        const next = metaIndex + 1;
        if (next < countryTips.length) { await openAvailableCountryTip(countryTips, next, metaCourseId); }
        else { setActiveCountryTip(undefined); setActiveMetaLesson(undefined); setCurrentLocation(null); setStudySetupOpen(true); }
        return;
      }
      const historyNext = beginnerHistory[metaIndex + 1];
      if (historyNext) {
        const lesson = metaLessonById(historyNext);
        if (lesson && await openMetaLesson(lesson)) { setMetaIndex(metaIndex + 1); return; }
      }
      const excluded = new Set(seen);
      let lesson = selectMetaLesson(undefined, excluded);
      while (lesson) {
        const opened = await openMetaLesson(lesson);
        if (opened === undefined) return;
        if (opened) { setBeginnerHistory([...beginnerHistory.slice(0, metaIndex + 1), lesson.id]); setMetaIndex(metaIndex + 1); return; }
        excluded.add(lesson.id);
        lesson = selectMetaLesson(undefined, excluded);
      }
      setActiveMetaLesson(undefined); setCurrentLocation(null); setStudySetupOpen(true);
    } catch { if (request === requestRef.current) setErrorMessage(t('Could not save Meta progress.')); }
    finally { if (request === requestRef.current) setIsLoading(false); nextPendingRef.current = false; }
  }, [activeCountryTip?.id, activeMetaLesson?.id, beginnerHistory, countryTips, metaCourseId, metaIndex, metaSeen, openAvailableCountryTip, openMetaLesson, setCurrentLocation, setErrorMessage, setIsLoading, setStudySetupOpen, t]);

  const previousMeta = useCallback(async () => {
    if (metaIndex <= 0) return;
    if (metaCourseId !== 'beginner') { await openAvailableCountryTip(countryTips, metaIndex - 1, metaCourseId, -1); return; }
    const previous = await openAvailableMetaTip<string>(beginnerHistory, metaIndex - 1, async (id) => {
      const lesson = metaLessonById(id);
      return lesson ? openMetaLesson(lesson) : false;
    }, -1);
    if (previous === undefined) return;
    if (previous !== null) { setMetaIndex(previous); return; }
    setActiveMetaLesson(undefined); setCurrentLocation(null); setStudySetupOpen(true);
  }, [beginnerHistory, countryTips, metaCourseId, metaIndex, openAvailableCountryTip, openMetaLesson, setCurrentLocation, setStudySetupOpen]);

  useEffect(() => {
    if (metaCourseId === 'beginner' || !activeCountryTip) return;
    let active = true;
    void loadMetaCountryCourse(metaCourseId, ui).then((tips) => {
      if (!active) return;
      setCountryTips(tips);
      const updated = tips.find((tip) => tip.id === activeCountryTip.id);
      if (updated) { setActiveCountryTip(updated); setActiveMetaLesson((lesson) => lesson?.id === updated.id ? { ...lesson, text: updated.text, note: updated.note, section: updated.section } : lesson); }
    }).catch(() => setErrorMessage(t('Could not load Meta course.')));
    return () => { active = false; };
  }, [ui, metaCourseId, activeCountryTip?.id, setErrorMessage, t]);

  const startMap = useCallback(() => {
    requestRef.current++;
    prepare('map'); setActiveMetaLesson(undefined); setActiveCountryTip(undefined); setMapPickerOpen(true);
  }, [prepare]);

  const startCustom = useCallback(() => { requestRef.current++; setLearnSource('custom'); setActiveMetaLesson(undefined); setActiveCountryTip(undefined); setMapPickerOpen(false); }, []);
  const startUploaded = useCallback(() => { requestRef.current++; setLearnSource('uploaded'); setActiveMetaLesson(undefined); setActiveCountryTip(undefined); setMapPickerOpen(false); }, []);

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

  const openMapPoint = useCallback(async (point: { lat: number; lng: number }, panoramaSource: PanoramaSource, allowInteriors: boolean) => {
    setIsLoading(true); setErrorMessage(null);
    try { await openMapLocation(await findExplorePanorama(point, { panoramaSource, allowInteriors })); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Could not open that Street View location.'); setIsLoading(false); }
  }, [openMapLocation, setErrorMessage, setIsLoading]);

  const dismissMetaAdvice = useCallback((forever: boolean) => {
    setMetaAdviceOpen(false);
    if (forever) void trainerDb.setSetting('preference.metaAdviceDismissed', true);
  }, []);

  const restoreLearnSource = useCallback((source?: LearnSource, metaLessonId?: string, courseId = 'beginner', location?: LocationResult) => {
    const request = ++requestRef.current;
    const restored = source === 'meta' || source === 'map' || source === 'uploaded' ? source : 'custom';
    setLearnSource(restored); setMetaCourseId(courseId);
    setActiveMetaLesson(restored === 'meta' ? metaLessonById(metaLessonId) : undefined);
    setActiveCountryTip(undefined);
    setBeginnerHistory([]);
    setMetaIndex(0);
    if (restored === 'meta' && courseId === 'beginner' && metaLessonId) void trainerDb.studyVisits().then((visits) => { if (request !== requestRef.current) return; const history = beginnerHistoryFromVisits(visits, metaLessonId); setBeginnerHistory(history); setMetaIndex(history.length - 1); });
    if (restored === 'meta' && courseId !== 'beginner' && metaLessonId) void loadMetaCountryCourse(courseId, ui).then((tips) => { if (request !== requestRef.current) return; const position = tips.findIndex((tip) => tip.id === metaLessonId); if (position >= 0) { const tip = tips[position]; setCountryTips(tips); setActiveCountryTip(tip); setMetaIndex(position); if (location) setActiveMetaLesson({ id: tip.id, panoId: location.panoId, lat: location.lat, lng: location.lng, heading: location.heading ?? 0, pitch: location.pitch ?? 0, text: tip.text, note: tip.note, imageUrl: tip.image || '', section: tip.section, mapUrl: tip.mapUrl }); } }).catch(() => { if (request === requestRef.current) setErrorMessage(t('Could not load Meta course.')); });
    void readMetaSeen().then(setMetaSeen);
  }, [setErrorMessage, t, ui]);

  const metaTotal = metaCourseId === 'beginner' ? META_LESSONS.length : countryTips.length;
  const metaCompleted = metaCourseId === 'beginner' ? META_LESSONS.filter((lesson) => metaSeen.has(lesson.id)).length : countryTips.filter((tip) => metaSeen.has(tip.id)).length;
  const metaPosition = metaCourseId === 'beginner' ? Math.min(metaTotal, metaCompleted + (activeMetaLesson && !metaSeen.has(activeMetaLesson.id) ? 1 : 0)) : metaIndex + 1;

  return { learnSource, activeMetaLesson, activeCountryTip, metaCourseId, metaProgress: { position: metaPosition, total: metaTotal, completed: metaCompleted }, canPreviousMeta: metaIndex > 0,
    mapPickerOpen, metaAdviceOpen, startCustom, startUploaded, startMeta, nextMeta, previousMeta, startMap,
    openMapLocation, openMapPoint, setMapPickerOpen, dismissMetaAdvice, restoreLearnSource };
}
