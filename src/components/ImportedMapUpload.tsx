import { useState } from 'react';
import { parseImportedMap, saveImportedMap, type ImportedMap } from '../services/importedMap';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function ImportedMapUpload({ map, onChange }: { map?: ImportedMap; onChange: (map: ImportedMap) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [error, setError] = useState('');
  return <div className="setup-field">
    <label>{t('Upload Map Maker JSON')}<input type="file" accept=".json,application/json" onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 10_000_000) throw new Error(t('Choose a JSON file under 10 MB.'));
        const imported = parseImportedMap(await file.text(), file.name);
        await saveImportedMap(imported);
        onChange(imported); setError('');
      } catch (cause) { setError(cause instanceof SyntaxError ? t('This file is not valid JSON.') : cause instanceof Error ? t(cause.message) : t('Could not import this map.')); }
      event.target.value = '';
    }} /></label>
    {map && <small>{map.name} · {map.points.length} {t('locations')}</small>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
