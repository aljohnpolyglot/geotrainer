import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { importedMapPointCount, importedMapSizeAllowed, parseImportedMap, saveImportedMap, type ImportedMap } from '../services/importedMap';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function ImportedMapUpload({ source, map, onChange }: { source: 'upload' | 'url'; map?: ImportedMap; onChange: (map: ImportedMap) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const operation = useRef(0);
  useEffect(() => { operation.current += 1; setError(''); setLoading(false); }, [source]);
  const importJson = async (json: string, name: string) => { const imported = parseImportedMap(json, name); if (imported.kind !== 'pool') await saveImportedMap(imported); onChange(imported); setError(''); };
  const loadUrl = async () => {
    const current = ++operation.current;
    try {
      setLoading(true); const endpoint = new URL(url); if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error(t('Enter an HTTP or HTTPS URL.'));
      const response = await fetch(endpoint); if (!response.ok) throw new Error(`${t('Could not load URL.')} (${response.status})`);
      const contentLength = Number(response.headers.get('content-length')); if (contentLength && !importedMapSizeAllowed(contentLength)) throw new Error(t('Choose a JSON file under 20 MB.'));
      const json = await response.text(); if (!importedMapSizeAllowed(new Blob([json]).size)) throw new Error(t('Choose a JSON file under 20 MB.'));
      if (current !== operation.current) return;
      await importJson(json, decodeURIComponent(endpoint.pathname.split('/').filter(Boolean).at(-1) || endpoint.hostname));
    } catch (cause) { if (current === operation.current) setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); } finally { if (current === operation.current) setLoading(false); }
  };
  return <div className="setup-field">
    {source === 'upload' ? <label>{t('Choose JSON')}<input type="file" accept=".json,application/json" disabled={loading} onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      const current = ++operation.current; setLoading(true); setError('');
      try {
        if (!importedMapSizeAllowed(file.size)) throw new Error(t('Choose a JSON file under 20 MB.'));
        const json = await file.text(); if (current === operation.current) await importJson(json, file.name);
      } catch (cause) { if (current === operation.current) setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); } finally { if (current === operation.current) setLoading(false); }
      event.target.value = '';
    }} /></label> : <div className="import-url"><input type="url" value={url} disabled={loading} onChange={(event) => { setUrl(event.target.value); setError(''); }} placeholder="https://example.com/map.json" aria-label={t('JSON URL')} /><button type="button" className="button secondary" disabled={!url.trim() || loading} aria-busy={loading} onClick={() => void loadUrl()}>{loading && <LoaderCircle className="spin" size={15} />}{t(loading ? 'Loading…' : 'Load URL')}</button></div>}
    {loading && source === 'upload' && <small className="imported-map-loading" role="status" aria-live="polite"><LoaderCircle className="spin" size={15} />{t('Loading…')}</small>}
    {map && <small className="imported-map-current"><strong>{map.name}</strong> · {map.kind === 'pool' ? `${map.countryCodes.length} ${t('countries')} · ${map.locationTargets.length} ${t('areas')}` : `${importedMapPointCount(map)} ${t('locations')}`}</small>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
