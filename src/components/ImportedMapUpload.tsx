import { useState } from 'react';
import { importedMapPointCount, parseImportedMap, saveImportedMap, type ImportedMap } from '../services/importedMap';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function ImportedMapUpload({ source, map, onChange }: { source: 'upload' | 'url'; map?: ImportedMap; onChange: (map: ImportedMap) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const importJson = async (json: string, name: string) => { const imported = parseImportedMap(json, name); if (imported.kind !== 'pool') await saveImportedMap(imported); onChange(imported); setError(''); };
  const loadUrl = async () => {
    try {
      setLoading(true); const endpoint = new URL(url); if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error(t('Enter an HTTP or HTTPS URL.'));
      const response = await fetch(endpoint); if (!response.ok) throw new Error(`${t('Could not load URL.')} (${response.status})`);
      if (Number(response.headers.get('content-length')) > 10_000_000) throw new Error(t('Choose a JSON file under 10 MB.'));
      const json = await response.text(); if (json.length > 10_000_000) throw new Error(t('Choose a JSON file under 10 MB.'));
      await importJson(json, decodeURIComponent(endpoint.pathname.split('/').filter(Boolean).at(-1) || endpoint.hostname));
    } catch (cause) { setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); } finally { setLoading(false); }
  };
  return <div className="setup-field">
    {source === 'upload' ? <label>{t('Choose JSON')}<input type="file" accept=".json,application/json" onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 10_000_000) throw new Error(t('Choose a JSON file under 10 MB.'));
        await importJson(await file.text(), file.name);
      } catch (cause) { setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); }
      event.target.value = '';
    }} /></label> : <div className="import-url"><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/map.json" aria-label={t('JSON URL')} /><button type="button" className="button secondary" disabled={!url.trim() || loading} onClick={() => void loadUrl()}>{t(loading ? 'Loading…' : 'Load URL')}</button></div>}
    {map && <small className="imported-map-current"><strong>{map.name}</strong> · {map.kind === 'pool' ? `${map.countryCodes.length} ${t('countries')} · ${map.locationTargets.length} ${t('areas')}` : `${importedMapPointCount(map)} ${t('locations')}`}</small>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
