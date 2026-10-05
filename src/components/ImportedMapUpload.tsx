import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Play, RefreshCw, X } from 'lucide-react';
import { getImportedMap, importedMapIdForSource, importedMapUrl, importedMapPointCount, importedMapSizeAllowed, parseImportedMap, resumeImportedMap, saveImportedMap, type ImportedMap } from '../services/importedMap';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { trainerDb } from '../data/trainerDb';

export function ImportedMapUpload({ source, map, onChange }: { source: 'upload' | 'url'; map?: ImportedMap; onChange: (map: ImportedMap) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [repeat, setRepeat] = useState<{ previous: ImportedMap; next: ImportedMap }>();
  const [repeatSaving, setRepeatSaving] = useState(false);
  const operation = useRef(0);
  useEffect(() => { operation.current += 1; setError(''); setLoading(false); setRepeat(undefined); setRepeatSaving(false); }, [source]);
  const importJson = async (json: string, name: string, sourceKey: string, current: number) => {
    const imported = parseImportedMap(json, name);
    if (imported.kind === 'pool') { onChange(imported); setError(''); return; }
    imported.id = await importedMapIdForSource(sourceKey);
    let previous = await getImportedMap(imported.id);
    if (!previous) {
      const legacyId = await trainerDb.setting<string>('local.currentMapId');
      const legacy = legacyId && await getImportedMap(legacyId);
      if (legacy && legacy.kind !== 'pool' && legacy.name === imported.name) {
        const workspace = await trainerDb.setting<{ mode?: string; importedMapId?: string; location?: typeof legacy.lastLocation }>('workspace.paused.study');
        previous = workspace?.mode === 'study' && workspace.importedMapId === legacy.id && workspace.location
          ? { ...legacy, lastLocation: workspace.location, completedPointIndexes: workspace.location.importedMapCompletedPointIndexes }
          : legacy;
      }
    }
    if (current !== operation.current) return;
    if (previous && previous.kind !== 'pool') setRepeat({ previous, next: imported });
    else { await saveImportedMap(imported); if (current === operation.current) { onChange(imported); setError(''); } }
  };
  const chooseRepeat = async (resume: boolean) => {
    if (!repeat || repeatSaving) return;
    setRepeatSaving(true); setError('');
    try { const next = resume ? resumeImportedMap(repeat.previous, repeat.next) : repeat.next; await saveImportedMap(next); onChange(next); setRepeat(undefined); }
    catch { setError(t('Could not import this map.')); }
    finally { setRepeatSaving(false); }
  };
  const loadUrl = async () => {
    const current = ++operation.current;
    try {
      setLoading(true); const endpoint = importedMapUrl(url); if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error(t('Enter an HTTP or HTTPS URL.'));
      const response = await fetch(endpoint); if (!response.ok) throw new Error(`${t('Could not load URL.')} (${response.status})`);
      const contentLength = Number(response.headers.get('content-length')); if (contentLength && !importedMapSizeAllowed(contentLength)) throw new Error(t('Choose a JSON file under 20 MB.'));
      const json = await response.text(); if (!importedMapSizeAllowed(new Blob([json]).size)) throw new Error(t('Choose a JSON file under 20 MB.'));
      if (current !== operation.current) return;
      await importJson(json, decodeURIComponent(endpoint.pathname.split('/').filter(Boolean).at(-1) || endpoint.hostname), `url:${endpoint.href}`, current);
    } catch (cause) { if (current === operation.current) setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); } finally { if (current === operation.current) setLoading(false); }
  };
  return <div className="setup-field">
    {source === 'upload' ? <label>{t('Choose JSON')}<input type="file" accept=".json,application/json" disabled={loading} onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      const current = ++operation.current; setLoading(true); setError('');
      try {
        if (!importedMapSizeAllowed(file.size)) throw new Error(t('Choose a JSON file under 20 MB.'));
        const json = await file.text(); if (current === operation.current) await importJson(json, file.name, `file:${file.name}`, current);
      } catch (cause) { if (current === operation.current) setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); } finally { if (current === operation.current) setLoading(false); }
      event.target.value = '';
    }} /></label> : <div className="import-url"><input type="url" value={url} disabled={loading} onChange={(event) => { setUrl(event.target.value); setError(''); }} placeholder="https://example.com/map.json" aria-label={t('JSON URL')} /><button type="button" className="button secondary" disabled={!url.trim() || loading} aria-busy={loading} onClick={() => void loadUrl()}>{loading && <LoaderCircle className="spin" size={15} />}{t(loading ? 'Loading…' : 'Load URL')}</button></div>}
    {loading && source === 'upload' && <small className="imported-map-loading" role="status" aria-live="polite"><LoaderCircle className="spin" size={15} />{t('Loading…')}</small>}
    {map && <small className="imported-map-current"><strong>{map.name}</strong> · {map.kind === 'pool' ? `${map.countryCodes.length} ${t('countries')} · ${map.locationTargets.length} ${t('areas')}` : `${importedMapPointCount(map)} ${t('locations')}`}</small>}
    {error && <p role="alert">{error}</p>}
    {repeat && <div className="setup-backdrop imported-repeat-backdrop"><section className="resume-session" role="dialog" aria-modal="true" aria-labelledby="imported-repeat-title"><button type="button" className="icon-button resume-session-close" onClick={() => setRepeat(undefined)} aria-label={t('Back')} title={t('Back')}><X size={16} /></button><h2 id="imported-repeat-title">{t('Continue saved map?')}</h2><p>{t('This JSON source was loaded before.')} {repeat.previous.kind !== 'pool' ? repeat.previous.completedPointIndexes?.length || repeat.previous.lastLocation?.importedMapCompletedPointIndexes?.length || 0 : 0}/{importedMapPointCount(repeat.previous)} {t('Source progress')}. {t('Choose whether to resume or start over.')}</p>{error && <p role="alert">{error}</p>}<div><button type="button" className="button primary" autoFocus disabled={repeatSaving} onClick={() => void chooseRepeat(true)}><Play size={16} />{t('Resume')}</button><button type="button" className="button secondary" disabled={repeatSaving} onClick={() => void chooseRepeat(false)}><RefreshCw size={16} />{t('Start new')}</button></div></section></div>}
  </div>;
}
