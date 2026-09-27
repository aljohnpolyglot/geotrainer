import { useState } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import type { Environment, LearnPriority, LocationPoolTarget, PanoramaSource, SamplingMode, UrbanLevel } from '../types';
import { translate } from '../services/language';
import { suggestLocationPool, type PoolSuggestionStage } from '../services/poolSuggestion';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

type SuggestedSettings = { environment?: Environment; urbanLevel?: UrbanLevel; samplingMode?: SamplingMode; priority?: LearnPriority; panoramaSource?: PanoramaSource; allowInteriors?: boolean };

export function DescribePool({ onChange }: { onChange: (name: string, countryCodes: string[], locationTargets: LocationPoolTarget[], settings: SuggestedSettings) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [description, setDescription] = useState(''); const [stage, setStage] = useState<PoolSuggestionStage>(); const [error, setError] = useState('');
  const stages: PoolSuggestionStage[] = ['countries', 'regions', 'cities']; const stageIndex = stage ? stages.indexOf(stage) : -1;
  const stageLabel = stage === 'countries' ? 'Finding countries…' : stage === 'regions' ? 'Loading regions…' : 'Selecting cities…';
  const create = async () => { try { setStage('countries'); setError(''); const pool = await suggestLocationPool(description.trim(), ui, setStage); onChange(description.trim().slice(0, 100), pool.countryCodes, pool.locationTargets, pool.settings); } catch (cause) { setError(cause instanceof Error ? t(cause.message) : t('Could not create a geographic pool.')); } finally { setStage(undefined); } };
  return <div className="setup-field describe-pool"><label>{t('What do you want to learn?')}<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('For example: Spanish-speaking Latin America, the Caribbean, or the Mediterranean.')} /></label><button type="button" className="button primary" disabled={description.trim().length < 3 || !!stage} onClick={() => void create()}>{stage ? <LoaderCircle className="animate-spin" size={15} /> : <Sparkles size={15} />}{t(stage ? stageLabel : 'Build pool')}</button>{stage && <div className="pool-progress" role="status" aria-live="polite">{stages.map((item, index) => <span key={item} className={index < stageIndex ? 'done' : index === stageIndex ? 'current' : ''}>{t(item === 'countries' ? 'Countries' : item === 'regions' ? 'Regions' : 'Cities')}</span>)}</div>}{error && <p role="alert">{error}</p>}</div>;
}
