import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowRight, BookOpen, BookOpenText, ChevronRight, Cloud, Gamepad2, MapPinned, Target } from 'lucide-react';
import { nextScheduledReviewAt, trainerDb } from '../data/trainerDb';
import { cloudSync } from '../services/cloudSync';
import { CloudAccountDialog } from './CloudAccountDialog';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { translate } from '../services/language';
import { savedMetaLessonIds } from '../data/metaLessons';
import { savedClueCount } from './trainerHubUtils';
import type { CoachHistoryNote, LearnedMeta, NotebookNote } from '../types';
import { meaningfulSessions } from '../analytics/advanced';

interface MainMenuProps {
  refreshKey: number;
  dbReady: boolean;
  onStudy: () => void;
  onPlay: () => void;
  onReview: () => void;
}

export function MainMenu({ refreshKey, dbReady, onStudy, onPlay, onReview }: MainMenuProps) {
  const [status, setStatus] = useState({ locations: null as number | null, attempts: null as number | null, clues: null as number | null, due: 0, nextDue: null as number | null, scheduled: false, timeZone: undefined as string | undefined, minutes: null as number | null, pausedStudy: false, pausedPlay: null as null | { complete: number; total: number } });
  const sync = useSyncExternalStore(cloudSync.subscribe, cloudSync.getSnapshot);
  const [accountOpen, setAccountOpen] = useState(false);
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);

  useEffect(() => {
    if (!dbReady) return;
    let active = true;
    void trainerDb.count('locations').then((locations) => { if (active) setStatus((current) => ({ ...current, locations })); }).catch(() => {});
    void trainerDb.count('attempts').then((attempts) => { if (active) setStatus((current) => ({ ...current, attempts })); }).catch(() => {});
    const attemptsPromise = trainerDb.attempts();
    void Promise.all([trainerDb.sessions(), attemptsPromise, trainerDb.studyVisits()]).then(([sessions, attempts, visits]) => {
      if (active) setStatus((current) => ({ ...current, minutes: Math.round(meaningfulSessions(sessions, attempts, visits).reduce((sum, session) => sum + session.activeTimeSeconds, 0) / 60) }));
    }).catch(() => {});
    void Promise.all([trainerDb.reviews(), trainerDb.schedulerPreferences(), trainerDb.reviewQueue({ due: true })]).then(([reviews, scheduler, readyReviews]) => {
      if (active) setStatus((current) => ({ ...current,
        due: readyReviews.length,
        nextDue: nextScheduledReviewAt(reviews, Date.now(), scheduler) ?? null,
        scheduled: reviews.length > 0,
        timeZone: scheduler.reviewTimeZone,
      }));
    }).catch(() => {});
    void Promise.all([trainerDb.clueMetadata(), trainerDb.setting<LearnedMeta[]>('meta.learned'), trainerDb.setting<NotebookNote[]>('notebook.notes'), trainerDb.setting<CoachHistoryNote[]>('coach.notes'), trainerDb.setting<boolean>('meta.savedOnlyMigrated'), attemptsPromise]).then(([clues, metas = [], notes = [], coachNotes = [], savedOnlyMigrated, attempts]) => {
      if (active) setStatus((current) => ({ ...current, clues: savedClueCount(clues, notes, savedOnlyMigrated ? metas : metas.filter((meta) => savedMetaLessonIds(attempts).has(meta.id)), coachNotes.filter((note) => !note.deletedAt)) }));
    }).catch(() => {});
    void Promise.all([trainerDb.setting<{ mode?: string }>('workspace.paused.study'), trainerDb.setting<{ mode?: string; rounds?: unknown[]; settings?: { roundCount?: number } }>('workspace.paused.play')]).then(([pausedStudy, pausedPlay]) => {
      if (active) setStatus((current) => ({ ...current,
        pausedStudy: pausedStudy?.mode === 'study',
        pausedPlay: pausedPlay?.mode === 'play' ? { complete: pausedPlay.rounds?.length || 0, total: pausedPlay.settings?.roundCount || 0 } : null,
      }));
    }).catch(() => {});
    return () => { active = false; };
  }, [dbReady, refreshKey]);

  const next = status.pausedPlay
    ? { action: onPlay, icon: <Gamepad2 size={18} />, title: t('continueGame'), detail: `${status.pausedPlay.complete} / ${status.pausedPlay.total} ${t('rounds')}` }
    : status.pausedStudy
      ? { action: onStudy, icon: <BookOpen size={18} />, title: t('Continue Study'), detail: t('Resume where you stopped or start a new session.') }
      : status.due
        ? { action: onReview, icon: <Target size={18} />, title: t('Review weak places'), detail: `${status.due} ${t('reviewsDueToday')}` }
        : { action: onStudy, icon: <BookOpen size={18} />, title: t('Continue learning'), detail: t('Open a fresh panorama') };
  const activeDuration = status.minutes === null ? '…' : status.minutes < 60 ? `${status.minutes}m` : `${Math.floor(status.minutes / 60)}h ${status.minutes % 60}m`;

  return (
    <section className="main-menu">
      <div className="menu-mast">
        <div className="wordmark"><MapPinned size={24} /><span>GEOTRAINER</span><small>{t('personal street view practice')}</small></div>
        <div className="menu-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="menu-intro">
          <h1>{t('Every mistake should make you better next time.')}</h1>
          <p>{t('See a place. Understand it. Recognize it next time.')}</p>
        </div>
        <button className="menu-primary" onClick={next.action}><span>{next.icon}<strong>{next.title}</strong><small>{next.detail}</small></span><ArrowRight size={20} /></button>
      </div>

      <div className="departure-board">
        <div className="board-heading"><span>{t('Choose a mode')}</span></div>
        <button onClick={onPlay}><span className="route-code">PLY</span><span><strong>{t('Start a game')}</strong><small>{t('1–100 scored rounds · Standard / No Move / NMPZ')}</small></span><Gamepad2 size={19} /></button>
        <button onClick={onReview}><span className="route-code">REV</span><span><strong>{t('Review weak places')}</strong><small>{status.due ? `${status.due} ${t('reviewsDueToday')}` : status.nextDue ? `${t('dailyReviewsComplete')} · ${t('tryAgainAt')}: ${new Date(status.nextDue).toLocaleString(ui, { dateStyle: 'medium', timeStyle: 'short', ...(status.timeZone ? { timeZone: status.timeZone } : {}) })}` : status.scheduled ? t('dailyReviewsComplete') : t('noReviewsScheduled')}</small></span><Target size={19} /></button>
        <button onClick={() => window.open(`${import.meta.env.BASE_URL}docs/`, '_blank', 'noopener,noreferrer')}><span className="route-code">DOC</span><span><strong>{t('Guide')}</strong><small>{t('Learn how GeoTrainer builds durable recall')}</small></span><BookOpenText size={19} /></button>
        <div className="menu-status">
          <span><strong>{status.locations?.toLocaleString(ui) ?? '…'}</strong> {t('places encountered')}</span>
          <span><strong>{status.attempts?.toLocaleString(ui) ?? '…'}</strong> {t('attempts retained')}</span>
          <span><strong>{activeDuration}</strong> {t('active minutes')}</span>
          <span><strong>{status.clues?.toLocaleString(ui) ?? '…'}</strong> {t('knownClues')}</span>
        </div>
        <button type="button" className={`account-entry ${sync.email ? '' : 'signed-out'}`} onClick={() => setAccountOpen(true)}>
          <span className="account-entry-icon"><Cloud size={19} /></span>
          <span><strong>{t('Sync & backup')}</strong><small>{sync.email || t('Export, import, or sign in')}</small></span>
          {sync.email && <span className={`sync-state ${sync.phase}`}>{sync.phase === 'synced' ? t('Synced') : sync.phase === 'ready' ? t('Ready') : sync.phase === 'syncing' ? t('Syncing') : sync.phase.replace('-', ' ')}</span>}
          <ChevronRight size={18} />
        </button>
      </div>
      <CloudAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </section>
  );
}
