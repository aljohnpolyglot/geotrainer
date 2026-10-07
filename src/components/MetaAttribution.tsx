import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function MetaAttribution({ countryCourse, compact = false }: { countryCourse: boolean; compact?: boolean }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  return <small className="meta-attribution">{t('Source')}: {countryCourse
    ? <a href="https://www.plonkit.net/guide" target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Plonk It</a>
    : <a href="https://geometas.com/" target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>GeoMetas</a>}{!compact && <>. {t('GeoTrainer is independent; check the original guide for updates.')}</>}</small>;
}
