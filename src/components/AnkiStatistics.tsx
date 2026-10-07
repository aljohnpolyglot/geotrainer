import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarRange, X } from 'lucide-react';
import type { Attempt, ReviewGrade, ReviewRecord, StudyVisit, TrainerLocation } from '../types';
import { ankiStatistics, calendarLevel, dayLabel } from '../analytics/anki';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { planReviewRebalance } from '../data/reviewRebalance';
import { trainerDb } from '../data/trainerDb';

type Props = { attempts: Attempt[]; reviews: ReviewRecord[]; visits: StudyVisit[]; locations: TrainerLocation[]; readyDueCount: number; onRebalanced: () => Promise<void> };
const pct = (value: number, total: number) => total ? `${Math.round(value / total * 100)}%` : '0%';

function DueBars({ days, label }: { days: Array<{ day: number; count: number }>; label: string }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [selected, setSelected] = useState<{ day: number; count: number } | null>(null);
  const max = Math.max(1, ...days.map((item) => item.count));
  const date = (day: number) => new Date(day).toLocaleDateString(ui, { month: 'short', day: 'numeric' });
  return <div className="anki-bars" aria-label={label}>{selected && <output className="anki-bar-readout" aria-live="polite">{date(selected.day)}: {selected.count} {t('due')}</output>}{days.map((item, index) => <button type="button" className="anki-bar-column" key={item.day} title={`${date(item.day)}: ${item.count} ${t('due')}`} aria-label={`${date(item.day)}: ${item.count} ${t('due')}`} onMouseEnter={() => setSelected(item)} onFocus={() => setSelected(item)} onClick={() => setSelected(item)}><i style={{ height: `${item.count / max * 100}%` }} />{(index === 0 || index % 5 === 0) && <small>{date(item.day)}</small>}</button>)}</div>;
}

export function AnkiStatistics({ attempts, reviews, visits, locations, readyDueCount, onRebalanced }: Props) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!previewOpen || saving) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setPreviewOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [previewOpen, saving]);
  const now = useMemo(() => Date.now(), [reviews]);
  const stats = useMemo(() => ankiStatistics(attempts, reviews, visits, locations, Date.now(), readyDueCount), [attempts, reviews, visits, locations, readyDueCount]);
  const shifts = useMemo(() => planReviewRebalance(reviews, now), [reviews, now]);
  const preview = useMemo(() => {
    const changed = new Map<string, number>(shifts.map((shift) => [shift.id, shift.toDueAt]));
    return ankiStatistics(attempts, reviews.map((review) => changed.has(review.id) ? { ...review, dueAt: changed.get(review.id)! } : review), visits, locations, now, readyDueCount).futureDue;
  }, [attempts, reviews, visits, locations, now, readyDueCount, shifts]);
  const confirm = async () => {
    setSaving(true); setError(false);
    try { await trainerDb.rebalanceReviews(shifts); await onRebalanced(); setPreviewOpen(false); }
    catch { setError(true); }
    finally { setSaving(false); }
  };
  const activityMax = Math.max(1, ...stats.calendar.map((item) => item.count));
  const addedMax = Math.max(1, ...stats.added.map((item) => item.count));
  const gradeTotal = (Object.values(stats.grades) as number[]).reduce((sum, count) => sum + count, 0);
  const grades: ReviewGrade[] = ['again', 'hard', 'good', 'easy'];
  return <div className="anki-statistics" aria-label={t('Anki statistics')}>
    <div className="metric-strip anki-metrics">
      <div><span>{t('Today')}</span><strong>{stats.today}</strong><small>{t('reviews')}</small></div>
      <div><span>{t('Last 7 days')}</span><strong>{stats.last7}</strong><small>{t('reviews')}</small></div>
      <div><span>{t('All time')}</span><strong>{stats.all}</strong><small>{t('review answers')}</small></div>
      <div><span>{t('Due now')}</span><strong>{stats.due}</strong><small>{t('locations')}</small></div>
    </div>
    <div className="stats-ladders">
      <section className="stats-card anki-card"><h3>{t('Card counts')}</h3><div className="anki-count-row"><span className="anki-dot new" />{t('New')} <b>{stats.cards.new}</b></div><div className="anki-count-row"><span className="anki-dot learning" />{t('Learning')} <b>{stats.cards.learning}</b></div><div className="anki-count-row"><span className="anki-dot relearning" />{t('Relearning')} <b>{stats.cards.relearning}</b></div><div className="anki-count-row"><span className="anki-dot young" />{t('Young')} <b>{stats.cards.young}</b></div><div className="anki-count-row"><span className="anki-dot mature" />{t('Mature')} <b>{stats.cards.mature}</b></div><div className="anki-count-total">{t('Total tracked locations')} <b>{stats.cards.total}</b></div><div className="anki-mastery"><strong>{t(stats.mastery.name)}</strong><span>{stats.cards.mature.toLocaleString()} {t('mature locations')}</span>{stats.mastery.next && <><progress value={stats.mastery.progress} max="1" /><small>{(stats.mastery.next - stats.cards.mature).toLocaleString()} {t('until next rank')}</small></>}</div></section>
      <section className="stats-card anki-card"><h3>{t('Review outcomes')}</h3>{grades.map((grade) => { const count = stats.grades[grade] ?? 0; return <div className="anki-outcome" key={grade}><span>{t(grade)}</span><i><em style={{ width: `${pct(count, gradeTotal)}` }} /></i><b>{count}</b></div>; })}{!gradeTotal && <p className="empty">{t('Review grades will appear after your first review.')}</p>}</section>
    </div>
    <section className="stats-card anki-card"><div className="anki-due-heading"><h3>{t('Future due')}</h3><button type="button" className="anki-rebalance-button" disabled={!shifts.length} onClick={() => setPreviewOpen(true)} title={t('Balance review dates')}><CalendarRange size={15} />{t('Balance dates')}</button></div><p className="stats-note">{t('Cards scheduled from today through the next 30 days.')}</p><DueBars days={stats.futureDue} label={t('Future due review histogram')} /></section>
    <section className="stats-card anki-card"><h3>{t('Review activity · 12 weeks')}</h3><div className="anki-calendar" aria-label={t('Review activity calendar')}>{stats.calendar.map((item) => <i key={item.day} className={`level-${calendarLevel(item.count, activityMax)}`} title={`${dayLabel(item.day)}: ${item.count} ${t('reviews')}`} />)}</div><div className="anki-calendar-label"><span>{t('Less')}</span><span className="level-0" /><span className="level-1" /><span className="level-2" /><span className="level-3" /><span className="level-4" /><span>{t('More')}</span></div></section>
    <div className="stats-ladders"><section className="stats-card anki-card"><h3>{t('Review intervals')}</h3>{stats.intervals.map((item) => <div className="anki-interval" key={item.label}><span>{item.label}</span><b>{item.count}</b></div>)}<p className="stats-note">{t('Based on recorded review intervals.')}</p></section><section className="stats-card anki-card"><h3>{t('Added / encountered · 30 days')}</h3><div className="anki-spark-bars">{stats.added.map((item) => <i key={item.day} style={{ height: `${item.count / addedMax * 100}%` }} title={`${dayLabel(item.day)}: ${item.count}`} />)}</div><p className="stats-note">{t('New locations first seen each day.')}</p></section></div>
    {previewOpen && createPortal(<div className="anki-rebalance-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setPreviewOpen(false); }}>
      <section className="anki-rebalance-dialog" role="dialog" aria-modal="true" aria-labelledby="anki-rebalance-title">
        <header><h2 id="anki-rebalance-title">{t('Balance review dates?')}</h2><button type="button" className="icon-button" onClick={() => setPreviewOpen(false)} disabled={saving} aria-label={t('close')} title={t('close')}><X size={18} /></button></header>
        <p>{t('Spread future reviews across nearby days while keeping today and short learning steps unchanged.')}</p><strong>{shifts.length.toLocaleString(ui)} {t('cards would move')}</strong>
        <DueBars days={preview} label={t('Preview of balanced review dates')} />
        {error && <p role="alert">{t('Review dates changed. Reopen the preview and try again.')}</p>}
        <footer><button type="button" className="button secondary" onClick={() => setPreviewOpen(false)} disabled={saving} autoFocus>{t('cancel')}</button><button type="button" className="button primary" onClick={() => void confirm()} disabled={saving || !shifts.length}>{t('Confirm balance')}</button></footer>
      </section>
    </div>, document.body)}
  </div>;
}
