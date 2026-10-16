import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, LoaderCircle, Pencil, Play, RefreshCw, X } from 'lucide-react';
import { getImportedMap, importedMapIdForSource, importedMapUrl, importedMapPointCount, importedMapSizeAllowed, matchSavedImportedPoints, parseImportedMap, pruneImportedMaps, resumeImportedMap, savedImportedMaps, saveImportedMap, type ImportedMap, type SavedImportedMap } from '../services/importedMap';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { trainerDb } from '../data/trainerDb';

export function ImportedMapUpload({ source, map, onChange, onResume }: { source: 'upload' | 'url'; map?: ImportedMap; onChange: (map: ImportedMap) => void; onResume?: (map: ImportedMap) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [repeat, setRepeat] = useState<{ previous: ImportedMap; next: ImportedMap }>();
  const [repeatSaving, setRepeatSaving] = useState(false);
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [history, setHistory] = useState<SavedImportedMap[]>([]);
  const [page, setPage] = useState(1);
  const [renamingId, setRenamingId] = useState<string>();
  const [renameDraft, setRenameDraft] = useState('');
  const operation = useRef(0);
  useEffect(() => { operation.current += 1; setError(''); setLoading(false); setRepeat(undefined); setRepeatSaving(false); setPage(1); setRenamingId(undefined); }, [source]);
  useEffect(() => { let active = true; if (tab === 'history') void pruneImportedMaps().then(savedImportedMaps).then((items) => { if (active) setHistory(items); }).catch(() => { if (active) setError(t('Could not load saved maps.')); }); return () => { active = false; }; }, [tab, source]);
  const refreshHistory = async () => setHistory(await savedImportedMaps());
  const importJson = async (json: string, name: string, sourceKey: string, current: number) => {
    const imported = parseImportedMap(json, name);
    if (imported.kind === 'pool') { onChange(imported); setError(''); return; }
    imported.id = await importedMapIdForSource(sourceKey);
    imported.sourceType = source; imported.sourceLabel = name.replace(/\\/g, '/').split('/').at(-1); imported.lastOpenedAt = Date.now();
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
    else { await saveImportedMap(imported); await pruneImportedMaps(); await matchSavedImportedPoints(imported); if (current === operation.current) { onChange(imported); setError(''); } }
  };
  const chooseRepeat = async (resume: boolean) => {
    if (!repeat || repeatSaving) return;
    setRepeatSaving(true); setError('');
    try { const next = resume ? resumeImportedMap(repeat.previous, repeat.next) : { ...repeat.next, name: repeat.previous.name }; await saveImportedMap(next); await pruneImportedMaps(); await matchSavedImportedPoints(next); onChange(next); setRepeat(undefined); }
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
  const selectSaved = async (saved: ImportedMap) => {
    try { setLoading(true); setError(''); const selected = { ...saved, lastOpenedAt: Date.now() }; await saveImportedMap(selected); onChange(selected); if (onResume) onResume(selected); else setTab('new'); }
    catch { setError(t('Could not open saved map.')); }
    finally { setLoading(false); }
  };
  const renameSaved = async (saved: ImportedMap) => {
    const name = renameDraft.trim().slice(0, 100);
    if (!name) { setError(t('Enter a map name.')); return; }
    try { const renamed = { ...saved, name }; await saveImportedMap(renamed); if (map?.id === renamed.id) onChange(renamed); await refreshHistory(); setRenamingId(undefined); setError(''); }
    catch { setError(t('Could not rename saved map.')); }
  };
  const pages = Math.max(1, Math.ceil(history.length / 10));
  return <div className="setup-field">
    <div className="imported-map-tabs" role="group" aria-label={t('Saved maps')}><button type="button" aria-pressed={tab === 'new'} onClick={() => setTab('new')}>{t(source === 'upload' ? 'Choose JSON' : 'JSON URL')}</button><button type="button" aria-pressed={tab === 'history'} onClick={() => setTab('history')}>{t('Saved maps')}</button></div>
    {tab === 'new' && (source === 'upload' ? <label>{t('Choose JSON')}<input type="file" accept=".json,application/json" disabled={loading} onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      const current = ++operation.current; setLoading(true); setError('');
      try {
        if (!importedMapSizeAllowed(file.size)) throw new Error(t('Choose a JSON file under 20 MB.'));
        const json = await file.text(); if (current === operation.current) await importJson(json, file.name, `file:${file.name}`, current);
      } catch (cause) { if (current === operation.current) setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); } finally { if (current === operation.current) setLoading(false); }
      event.target.value = '';
    }} /></label> : <div className="import-url"><input type="url" value={url} disabled={loading} onChange={(event) => { setUrl(event.target.value); setError(''); }} placeholder="https://example.com/map.json" aria-label={t('JSON URL')} /><button type="button" className="button secondary" disabled={!url.trim() || loading} aria-busy={loading} onClick={() => void loadUrl()}>{loading && <LoaderCircle className="spin" size={15} />}{t(loading ? 'Loading…' : 'Load URL')}</button></div>)}
    {tab === 'history' && <div className="imported-map-history"><small>{t('Keeps 30 recent maps; active and paused maps stay available.')}</small>{history.length ? history.slice((page - 1) * 10, page * 10).map(({ map: saved, updatedAt }) => <div className="imported-map-history-row" key={saved.id}><div className="imported-map-history-copy">{renamingId === saved.id ? <input autoFocus maxLength={100} value={renameDraft} aria-label={t('Map name')} onChange={(event) => setRenameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void renameSaved(saved); if (event.key === 'Escape') setRenamingId(undefined); }} /> : <strong title={saved.name}>{saved.name}</strong>}<small title={saved.sourceLabel || saved.name}>{t(saved.sourceType === 'url' ? 'JSON URL' : saved.sourceType === 'upload' ? 'Upload JSON' : 'Saved maps')} · {saved.sourceLabel || saved.name}</small><small>{saved.kind === 'pool' ? `${saved.countryCodes.length} ${t('countries')}` : `${saved.completedPointIndexes?.length || saved.lastLocation?.importedMapCompletedPointIndexes?.length || 0}/${saved.points.length} ${t('Source progress')}`} · {new Intl.DateTimeFormat(ui, { dateStyle: 'medium' }).format(updatedAt)}</small></div><div className="imported-map-history-actions">{renamingId === saved.id ? <button type="button" className="icon-button" disabled={loading} aria-label={t('Save name')} title={t('Save name')} onClick={() => void renameSaved(saved)}><Check size={16} /></button> : <button type="button" className="icon-button" disabled={loading} aria-label={t('Rename map')} title={t('Rename map')} onClick={() => { setRenamingId(saved.id); setRenameDraft(saved.name); }}><Pencil size={16} /></button>}<button type="button" className="button secondary" disabled={loading} onClick={() => void selectSaved(saved)}>{t(onResume ? 'Resume' : 'Use map')}</button></div></div>) : <p>{t('No saved maps yet.')}</p>}{pages > 1 && <div className="imported-map-history-pages"><button type="button" className="icon-button" disabled={page <= 1} aria-label={t('Previous')} onClick={() => setPage(page - 1)}><ChevronLeft size={17} /></button><span>{page} / {pages}</span><button type="button" className="icon-button" disabled={page >= pages} aria-label={t('Next')} onClick={() => setPage(page + 1)}><ChevronRight size={17} /></button></div>}</div>}
    {loading && source === 'upload' && <small className="imported-map-loading" role="status" aria-live="polite"><LoaderCircle className="spin" size={15} />{t('Loading…')}</small>}
    {map && <small className="imported-map-current"><strong>{map.name}</strong> · {map.kind === 'pool' ? `${map.countryCodes.length} ${t('countries')} · ${map.locationTargets.length} ${t('areas')}` : `${importedMapPointCount(map)} ${t('locations')}`}</small>}
    {error && <p role="alert">{error}</p>}
    {repeat && <div className="setup-backdrop imported-repeat-backdrop"><section className="resume-session" role="dialog" aria-modal="true" aria-labelledby="imported-repeat-title"><button type="button" className="icon-button resume-session-close" onClick={() => setRepeat(undefined)} aria-label={t('Back')} title={t('Back')}><X size={16} /></button><h2 id="imported-repeat-title">{t('Continue saved map?')}</h2><p>{t('This JSON source was loaded before.')} {repeat.previous.kind !== 'pool' ? repeat.previous.completedPointIndexes?.length || repeat.previous.lastLocation?.importedMapCompletedPointIndexes?.length || 0 : 0}/{importedMapPointCount(repeat.previous)} {t('Source progress')}. {t('Resume keeps the saved order. Start new creates a new shuffle.')}</p>{error && <p role="alert">{error}</p>}<div><button type="button" className="button primary" autoFocus disabled={repeatSaving} onClick={() => void chooseRepeat(true)}><Play size={16} />{t('Resume')}</button><button type="button" className="button secondary" disabled={repeatSaving} onClick={() => void chooseRepeat(false)}><RefreshCw size={16} />{t('Start new')}</button></div></section></div>}
  </div>;
}
