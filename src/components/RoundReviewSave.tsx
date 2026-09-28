import React, { useEffect, useState } from 'react';
import { BookmarkPlus, LoaderCircle } from 'lucide-react';
import type { LocationResult } from '../types';
import { trainerDb } from '../data/trainerDb';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export const RoundReviewSave: React.FC<{ location: LocationResult; refreshKey: number; onSaved: () => void }> = ({ location, refreshKey, onSaved }) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [scheduled, setScheduled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void trainerDb.reviewState(location.panoId).then((review) => {
      if (active) setScheduled(!!review);
    }).catch(() => { if (active) { setScheduled(false); setFailed(true); } });
    return () => { active = false; };
  }, [location.panoId, refreshKey]);

  const save = async () => {
    if (saving) return;
    setSaving(true); setFailed(false);
    try {
      await trainerDb.queueForReview(location.panoId, false, location);
      setScheduled(true);
      onSaved();
    } catch { setFailed(true); }
    finally { setSaving(false); }
  };

  if (scheduled !== false) return null;
  return <div className="round-review-save">
    <button type="button" className="icon-button" disabled={saving} onClick={() => void save()} aria-label={t(saving ? 'saving' : 'saveForReview')} title={t(saving ? 'saving' : 'saveForReview')}>
      {saving ? <LoaderCircle size={18} className="spin" /> : <BookmarkPlus size={18} />}
    </button>
    {failed && <small role="alert">{t('reviewSaveFailed')}</small>}
  </div>;
}
