import { XCircle } from 'lucide-react';
import type { ReviewGrade } from '../types';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function ReviewCompleteOverlay({ stats, onClose }: { stats: Array<{ previous: number; current: number; grade: ReviewGrade }>; onClose: () => void }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const count = (predicate: (item: { previous: number; current: number }) => boolean) => stats.filter(predicate).length;
  const gradeLabels: Record<ReviewGrade, string> = { again: t('reviewAgain'), hard: t('reviewHard'), good: t('reviewGood'), easy: t('reviewEasy') };
  return <div className="review-complete-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-complete-title"><section className="review-complete-panel"><button className="icon-button review-complete-close" onClick={onClose} aria-label={t('close')}><XCircle size={18} /></button><h2 id="review-complete-title">{t('tabReview')}</h2><p>{stats.length} {t('reviewedCount')} · {count((item) => item.current > item.previous)} {t('Improved')} · {count((item) => item.current === item.previous)} {t('Same score')} · {count((item) => item.current < item.previous)} {t('Worse')}</p><div className="review-complete-scores"><span>{t('previous')} · {t('averageScore')}<strong>{stats.length ? Math.round(stats.reduce((sum, item) => sum + item.previous, 0) / stats.length).toLocaleString() : '0'}</strong></span><span>{t('today')} · {t('averageScore')}<strong>{stats.length ? Math.round(stats.reduce((sum, item) => sum + item.current, 0) / stats.length).toLocaleString() : '0'}</strong></span></div><p>{(['again', 'hard', 'good', 'easy'] as ReviewGrade[]).map((grade) => `${gradeLabels[grade]}: ${stats.filter((item) => item.grade === grade).length}`).join(' · ')}</p></section></div>;
}
