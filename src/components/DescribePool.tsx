import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { LocationPoolTarget } from '../types';
import { translate } from '../services/language';
import { suggestLocationPool } from '../services/poolSuggestion';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function DescribePool({ onChange }: { onChange: (name: string, countryCodes: string[], locationTargets: LocationPoolTarget[]) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [description, setDescription] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const create = async () => { try { setLoading(true); setError(''); const pool = await suggestLocationPool(description.trim(), ui); onChange(description.trim().slice(0, 100), pool.countryCodes, pool.locationTargets); } catch (cause) { setError(cause instanceof Error ? t(cause.message) : t('Could not create a geographic pool.')); } finally { setLoading(false); } };
  return <div className="setup-field describe-pool"><label>{t('What do you want to learn?')}<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('For example: Spanish-speaking Latin America, the Caribbean, or the Mediterranean.')} /></label><button type="button" className="button primary" disabled={description.trim().length < 3 || loading} onClick={() => void create()}><Sparkles size={15} />{t(loading ? 'Building pool…' : 'Build pool')}</button>{error && <p role="alert">{error}</p>}</div>;
}
