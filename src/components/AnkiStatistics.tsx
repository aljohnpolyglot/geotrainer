import { useMemo } from 'react';
import type { Attempt, ReviewGrade, ReviewRecord, StudyVisit, TrainerLocation } from '../types';
import { ankiStatistics, calendarLevel, dayLabel } from '../analytics/anki';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

type Props = { attempts: Attempt[]; reviews: ReviewRecord[]; visits: StudyVisit[]; locations: TrainerLocation[] };
const pct = (value: number, total: number) => total ? `${Math.round(value / total * 100)}%` : '0%';

export function AnkiStatistics({ attempts, reviews, visits, locations }: Props) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const stats = useMemo(() => ankiStatistics(attempts, reviews, visits, locations), [attempts, reviews, visits, locations]);
  const futureMax = Math.max(1, ...stats.futureDue.map((item) => item.count));
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
    <section className="stats-card anki-card"><h3>{t('Future due')}</h3><p className="stats-note">{t('Cards scheduled from today through the next 30 days.')}</p><div className="anki-bars" aria-label={t('Future due review histogram')}>{stats.futureDue.map((item, index) => <div className="anki-bar-column" key={item.day} title={`${dayLabel(item.day)}: ${item.count} ${t('due')}`}><i style={{ height: `${item.count / futureMax * 100}%` }} />{(index === 0 || index % 5 === 0) && <small>{dayLabel(item.day)}</small>}</div>)}</div></section>
    <section className="stats-card anki-card"><h3>{t('Review activity · 12 weeks')}</h3><div className="anki-calendar" aria-label={t('Review activity calendar')}>{stats.calendar.map((item) => <i key={item.day} className={`level-${calendarLevel(item.count, activityMax)}`} title={`${dayLabel(item.day)}: ${item.count} ${t('reviews')}`} />)}</div><div className="anki-calendar-label"><span>{t('Less')}</span><span className="level-0" /><span className="level-1" /><span className="level-2" /><span className="level-3" /><span className="level-4" /><span>{t('More')}</span></div></section>
    <div className="stats-ladders"><section className="stats-card anki-card"><h3>{t('Review intervals')}</h3>{stats.intervals.map((item) => <div className="anki-interval" key={item.label}><span>{item.label}</span><b>{item.count}</b></div>)}<p className="stats-note">{t('Based on recorded review intervals.')}</p></section><section className="stats-card anki-card"><h3>{t('Added / encountered · 30 days')}</h3><div className="anki-spark-bars">{stats.added.map((item) => <i key={item.day} style={{ height: `${item.count / addedMax * 100}%` }} title={`${dayLabel(item.day)}: ${item.count}`} />)}</div><p className="stats-note">{t('New locations first seen each day.')}</p></section></div>
  </div>;
}
