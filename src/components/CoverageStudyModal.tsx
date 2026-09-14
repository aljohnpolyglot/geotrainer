import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import type { CoachAnalysis, CoachHistoryNote, TrainerLocation } from '../types';
import { StreetViewContainer } from './StreetViewContainer';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';
import { AiCoach } from './AiCoach';
import { LearningAids, type MetaAid } from './LearningAids';
import { trainerDb } from '../data/trainerDb';
import { metaReviewAid } from '../data/metaLessons';
import { captureStreetViewImage } from '../services/streetViewSnapshot';

export function CoverageStudyModal({ location, onClose }: { location: TrainerLocation; onClose: () => void }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lesson, setLesson] = useState<MetaAid>();
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  useEffect(() => {
    void trainerDb.attempts().then((attempts) => setLesson(metaReviewAid(attempts.find((attempt) => attempt.panoId === location.panoId && attempt.metaLessonId)?.metaLessonId, true, ui)));
  }, [location.panoId, ui]);

  const ensureReviewSource = async () => {
    const attempts = await trainerDb.attempts();
    if (!attempts.some((attempt) => attempt.panoId === location.panoId)) {
      const now = Date.now();
      const imageDataUrl = await captureStreetViewImage(location.panoId);
      await Promise.all([
        trainerDb.saveAttempt({ id: `study-card:${location.panoId}`, gameId: 'study', roundNumber: 1, panoId: location.panoId, actualLat: location.lat, actualLng: location.lng, countryCode: location.countryCode, guessedLat: null, guessedLng: null, distanceKm: null, score: 0, timeSpentSeconds: 0, collectionId: 'world', canMove: true, canPan: true, canZoom: true, showCompass: true, environment: location.environment ?? 'mixed', environmentRequested: location.environmentRequested ?? location.environment ?? 'mixed', urbanLevel: location.urbanLevel ?? 3, samplingMode: 'natural', createdAt: now, source: 'study', locationId: location.panoId }),
        imageDataUrl ? trainerDb.saveLocationImage(location.panoId, imageDataUrl) : Promise.resolve(),
      ]);
    }
    await trainerDb.queueForReview(location.panoId, false, location);
  };
  const saveClue = async (clue: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis; origin?: 'personal' | 'coach' }) => {
    const id = `clue-${crypto.randomUUID()}`;
    await trainerDb.saveClue({ id, panoId: location.panoId, countryCode: location.countryCode, lat: location.lat, lng: location.lng, createdAt: clue.generatedAt, ...clue });
    await ensureReviewSource(); setRefreshKey((key) => key + 1); return id;
  };
  const saveCoach = (note: Omit<CoachHistoryNote, 'id' | 'panoId' | 'countryCode'>) => {
    void trainerDb.setting<CoachHistoryNote[]>('coach.notes').then((saved = []) => trainerDb.setSetting('coach.notes', [{ id: `coach-note-${crypto.randomUUID()}`, panoId: location.panoId, countryCode: location.countryCode, ...note }, ...saved])).then(ensureReviewSource).then(() => setRefreshKey((key) => key + 1));
  };
  const noteSaved = async () => { await ensureReviewSource(); setRefreshKey((key) => key + 1); };

  return <div className="coverage-study-backdrop" role="dialog" aria-modal="true" aria-labelledby="coverage-study-title">
    <section className="coverage-study-panel">
      <header>
        <div><span>{t('tabCoverage')}</span><h2 id="coverage-study-title"><CountryFlag code={location.countryCode} />{COUNTRIES[location.countryCode]?.name || location.countryCode}</h2><p>{location.encounterCount} {t('encounters')} · {t('lastSeen')} {new Date(location.lastSeenAt).toLocaleDateString()}</p></div>
        <button className="button secondary" onClick={onClose}><ArrowLeft size={15} /> {t('tabCoverage')}</button>
      </header>
      <div className="coverage-study-view">
        <StreetViewContainer currentLocation={location} isLoading={false} onNextLocation={() => {}} canMove canPan canZoom showCompass />
        <div className="panorama-tools coverage-study-tools" aria-label={t('Learning aids')}>
          <AiCoach panoId={location.panoId} appMode="study" revealed context={{ actualCountry: COUNTRIES[location.countryCode]?.name || location.countryCode }} onSave={saveCoach} onSaveClue={(clue) => { void saveClue({ ...clue, origin: 'coach' }); }} />
          <LearningAids lesson={lesson} panoId={location.panoId} lat={location.lat} lng={location.lng} countryCode={location.countryCode} adviceOpen={false} refreshKey={refreshKey} onAdviceClose={() => {}} onSaveClue={saveClue} onNoteSaved={noteSaved} />
        </div>
      </div>
    </section>
  </div>;
}
