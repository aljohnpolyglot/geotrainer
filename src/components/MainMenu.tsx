import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowRight, BookOpen, BookOpenText, ChevronRight, Cloud, Gamepad2, MapPinned, Target } from 'lucide-react';
import { effectiveReviewDueAt, nextScheduledReviewAt, trainerDb } from '../data/trainerDb';
import { cloudSync } from '../services/cloudSync';
import { CloudAccountDialog } from './CloudAccountDialog';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { translate } from '../services/language';
import { savedMetaLessonIds } from '../data/metaLessons';
import { savedClueCount } from './trainerHubUtils';
import type { LearnedMeta, NotebookNote } from '../types';
import { meaningfulSessions } from '../analytics/advanced';

interface MainMenuProps {
  refreshKey: number;
  onStudy: () => void;
  onPlay: () => void;
  onReview: () => void;
}

export function MainMenu({ refreshKey, onStudy, onPlay, onReview }: MainMenuProps) {
  const [status, setStatus] = useState({ locations: 0, attempts: 0, clues: 0, due: 0, nextDue: null as number | null, scheduled: false, timeZone: undefined as string | undefined, minutes: 0 });
  const sync = useSyncExternalStore(cloudSync.subscribe, cloudSync.getSnapshot);
  const [accountOpen, setAccountOpen] = useState(false);
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);

  useEffect(() => {
    void Promise.all([trainerDb.locations(), trainerDb.attempts(), trainerDb.reviews(), trainerDb.sessions(), trainerDb.studyVisits(), trainerDb.schedulerPreferences(), trainerDb.clues(), trainerDb.setting<LearnedMeta[]>('meta.learned'), trainerDb.setting<NotebookNote[]>('notebook.notes'), trainerDb.setting<boolean>('meta.savedOnlyMigrated')])
      .then(([locations, attempts, reviews, sessions, visits, scheduler, clues, metas = [], notes = [], savedOnlyMigrated]) => setStatus({
        locations: locations.length,
        attempts: attempts.length,
        clues: savedClueCount(clues, notes, savedOnlyMigrated ? metas : metas.filter((meta) => savedMetaLessonIds(attempts).has(meta.id))),
        due: reviews.filter((review) => effectiveReviewDueAt(review, scheduler) <= Date.now()).length,
        nextDue: nextScheduledReviewAt(reviews, Date.now(), scheduler) ?? null,
        scheduled: reviews.length > 0,
        timeZone: scheduler.reviewTimeZone,
        minutes: Math.round(meaningfulSessions(sessions, attempts, visits).reduce((sum, session) => sum + session.activeTimeSeconds, 0) / 60),
      }))
      .catch(() => {});
  }, [refreshKey]);

  return (
    <section className="main-menu">
      <div className="menu-mast">
        <div className="wordmark"><MapPinned size={24} /><span>GEOTRAINER</span><small>{t('personal street view practice')}</small></div>
        <div className="menu-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="menu-intro">
          <h1>{t('Build a world')}<br />{t('you can recognize.')}</h1>
          <p>{t('Learn unfamiliar roads, test your recall, then return to the places that fooled you.')}</p>
        </div>
        <button className="menu-primary" onClick={onStudy}><span><BookOpen size={18} /><strong>{t('Continue learning')}</strong><small>{t('Open a fresh panorama')}</small></span><ArrowRight size={20} /></button>
      </div>

      <div className="departure-board">
        <div className="board-heading"><span>{t('Choose a mode')}</span></div>
        <button onClick={onPlay}><span className="route-code">PLY</span><span><strong>{t('Start a game')}</strong><small>{t('1–100 scored rounds · Standard / No Move / NMPZ')}</small></span><Gamepad2 size={19} /></button>
        <button onClick={onReview}><span className="route-code">REV</span><span><strong>{t('Review weak places')}</strong><small>{status.due ? `${status.due} ${t('reviewsDueToday')}` : status.nextDue ? `${t('dailyReviewsComplete')} · ${t('tryAgainAt')}: ${new Date(status.nextDue).toLocaleString(ui, { dateStyle: 'medium', timeStyle: 'short', ...(status.timeZone ? { timeZone: status.timeZone } : {}) })}` : status.scheduled ? t('dailyReviewsComplete') : t('noReviewsScheduled')}</small></span><Target size={19} /></button>
        <button onClick={() => window.open(`${import.meta.env.BASE_URL}docs/`, '_blank', 'noopener,noreferrer')}><span className="route-code">DOC</span><span><strong>{t('Guide')}</strong><small>{t('Learn how GeoTrainer builds durable recall')}</small></span><BookOpenText size={19} /></button>
        <div className="menu-status">
          <span><strong>{status.locations.toLocaleString()}</strong> {t('places encountered')}</span>
          <span><strong>{status.attempts.toLocaleString()}</strong> {t('attempts retained')}</span>
          <span><strong>{status.minutes.toLocaleString()}</strong> {t('active minutes')}</span>
          <span><strong>{status.clues.toLocaleString()}</strong> {t('knownClues')}</span>
        </div>
        <button type="button" className="account-entry" onClick={() => setAccountOpen(true)}>
          <span className="account-entry-icon"><Cloud size={19} /></span>
          <span><strong>{sync.email ? t('Cloud account') : t('Protect your progress')}</strong><small>{sync.email || t('Sign in or create an account')}</small></span>
          <span className={`sync-state ${sync.phase}`}>{sync.phase === 'synced' ? t('Synced') : sync.phase.replace('-', ' ')}</span>
          <ChevronRight size={18} />
        </button>
      </div>
      <CloudAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </section>
  );
}
