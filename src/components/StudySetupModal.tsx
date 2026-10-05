import { useEffect, useState } from 'react';
import { BookOpen, Download, FileJson, Lightbulb, Link, Map, Play, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import type { Collection, Environment, LearnPriority, LearnSource, LocationPoolTarget, PanoramaSource, SamplingMode, UrbanLevel } from '../types';
import { CountryMixPicker } from './CountryMixPicker';
import { CollectionOptions } from './CollectionOptions';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { trainerDb } from '../data/trainerDb';
import { META_LESSONS } from '../data/metaLessons';
import { loadMetaCountryCourse, META_COUNTRY_COURSES, type MetaCountryCourseTip } from '../data/metaCountryCourses';
import { readMetaSeen } from '../data/metaProgress';
import { MetaCourseSelector } from './MetaCourseSelector';
import { ImportedMapUpload } from './ImportedMapUpload';
import { downloadGeographicPool, getImportedMap, type ImportedMap } from '../services/importedMap';
import { LocationPoolPicker } from './LocationPoolPicker';
import { normalizeStudySetup } from '../services/studySetup';
import { DescribePool } from './DescribePool';
import { MetaLessonBrowser } from './MetaLessonBrowser';

export type StudySetup = { source: LearnSource; collectionId: string; countryCodes?: string[]; locationTargets?: LocationPoolTarget[]; importedMapId?: string; importedMapVariation?: number; metaLessonId?: string; metaCourseId?: string; environment: Environment; urbanLevel: UrbanLevel; samplingMode: SamplingMode; priority: LearnPriority; panoramaSource: PanoramaSource; allowInteriors: boolean; showCompass: boolean };
type SetupPanel = LearnSource | 'url' | 'describe';

export function StudySetupModal({ open, collections, initial, onClose, onStart }: { open: boolean; collections: Collection[]; initial: StudySetup; onClose: () => void; onStart: (settings: StudySetup) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [settings, setSettings] = useState(() => normalizeStudySetup(initial, collections));
  const [panel, setPanel] = useState<SetupPanel>(initial.source);
  const [metaAvailable, setMetaAvailable] = useState<boolean | null>(null);
  const [completedMetaIds, setCompletedMetaIds] = useState(new Set<string>());
  const [metaLessonsOpen, setMetaLessonsOpen] = useState(false);
  const [countryMetaLessons, setCountryMetaLessons] = useState<MetaCountryCourseTip[] | null>(null);
  const [importedMap, setImportedMap] = useState<ImportedMap>();
  const [loadedPoolName, setLoadedPoolName] = useState('');
  useEffect(() => { if (!open) return; let active = true; void trainerDb.setting<string>('local.currentMapId').then(async (id) => { const map = id && await getImportedMap(id); if (active) setImportedMap(map || undefined); }); return () => { active = false; }; }, [open]);
  useEffect(() => { if (!open) return; let active = true; setSettings(normalizeStudySetup(initial, collections)); setPanel(initial.source); setMetaAvailable(null); setMetaLessonsOpen(false); setCountryMetaLessons(null); void readMetaSeen().then((completed) => { if (active) { setCompletedMetaIds(completed); setMetaAvailable(true); } }); return () => { active = false; }; }, [open]);
  const selectedMetaCourse = settings.metaCourseId || 'beginner';
  useEffect(() => { if (!metaLessonsOpen || selectedMetaCourse === 'beginner') { setCountryMetaLessons(null); return; } let active = true; setCountryMetaLessons(null); void loadMetaCountryCourse(selectedMetaCourse, ui).then((lessons) => { if (active) setCountryMetaLessons(lessons); }).catch(() => { if (active) setCountryMetaLessons([]); }); return () => { active = false; }; }, [metaLessonsOpen, selectedMetaCourse, ui]);
  if (!open) return null;
  const collection = collections.find((item) => item.id === settings.collectionId);
  const completedByCourse = Object.fromEntries([['beginner', META_LESSONS.filter((lesson) => completedMetaIds.has(lesson.id)).length], ...META_COUNTRY_COURSES.map((course) => [course.code, [...completedMetaIds].filter((id) => id.startsWith(`${course.code}-`)).length])]);
  const choices: Array<{ source: SetupPanel; icon: typeof SlidersHorizontal; title: string; description: string }> = [
    { source: 'custom', icon: SlidersHorizontal, title: 'Custom', description: 'Choose countries and surroundings.' },
    { source: 'meta', icon: Lightbulb, title: 'Meta', description: 'Learn visual GeoGuessr clues.' },
    { source: 'map', icon: Map, title: 'Explore Map', description: 'Pick from worldwide Street View coverage.' },
    { source: 'uploaded', icon: FileJson, title: 'Upload JSON', description: 'Open a Map Maker map or geographic pool file.' },
    { source: 'url', icon: Link, title: 'JSON URL', description: 'Load a map or geographic pool from a URL.' },
    { source: 'describe', icon: Sparkles, title: 'Describe a pool', description: 'Let AI choose editable countries, regions, and cities.' },
  ];
  return <div className="setup-backdrop"><section className="setup-dialog" aria-labelledby="study-setup-title">
    <header><span><BookOpen size={18} /></span><div><h2 id="study-setup-title">{t('Learn')}</h2><p>{t('Choose how you want to learn.')}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={18} /></button></header>
    <div className="setup-body">
      <div className="learn-source-picker">{choices.map(({ source, icon: Icon, title, description }) => { const disabled = source === 'meta' && metaAvailable === null; return <button key={source} type="button" disabled={disabled} className={panel === source ? 'selected' : ''} aria-pressed={panel === source} onClick={() => setPanel(source)}><Icon size={18} /><span><strong>{t(title)}</strong><small>{t(description)}</small></span></button>; })}</div>
      {panel === 'meta' && <div className="meta-setup">
        <MetaCourseSelector selectedCourseId={selectedMetaCourse} onSelect={(metaCourseId) => { setSettings({ ...settings, metaCourseId, metaLessonId: undefined }); setCountryMetaLessons(null); }} completedByCourse={completedByCourse} beginnerTotal={META_LESSONS.length} />
      </div>}
      {panel === 'custom' && <div className="learn-custom-settings"><label>{t('Map Collection')}<select value={settings.collectionId} onChange={(event) => setSettings({ ...settings, collectionId: event.target.value, countryCodes: undefined, locationTargets: undefined })}><CollectionOptions collections={collections} customLabel={t('Custom collections')} /></select></label>
        <div className="setup-field"><label>{t('Country mix')}</label><CountryMixPicker value={settings.countryCodes || []} availableCodes={collection?.countryCodes || []} onChange={(countryCodes) => setSettings({ ...settings, countryCodes: countryCodes.length ? countryCodes : undefined, locationTargets: settings.locationTargets?.filter((target) => countryCodes.includes(target.countryCode)) })} /></div>
        {!!settings.countryCodes?.length && <div className="setup-field"><label>{t('Location pools')}</label>{loadedPoolName && <small className="imported-map-current"><strong>{loadedPoolName}</strong> · {t('Geographic pool')}</small>}<LocationPoolPicker countryCodes={settings.countryCodes} value={settings.locationTargets || []} onChange={(locationTargets) => setSettings({ ...settings, locationTargets: locationTargets.length ? locationTargets : undefined })} /></div>}
        <div className="setup-grid"><label>{t('Environment')}<select value={settings.environment} onChange={(event) => setSettings({ ...settings, environment: event.target.value as Environment })}><option value="mixed">{t('Mixed')}</option><option value="urban">{t('Urban')}</option><option value="suburban">{t('Suburban')}</option><option value="rural">{t('Rural')}</option></select></label>{(settings.environment === 'urban' || settings.environment === 'suburban') && <label>{t('Urban Level')}<select value={settings.urbanLevel} onChange={(event) => setSettings({ ...settings, urbanLevel: Number(event.target.value) as UrbanLevel })}><option value="1">1 — {t('Major Cities')}</option><option value="2">2 — {t('Major + Regional')}</option><option value="3">3 — {t('All Available Seeds')}</option></select></label>}<label>{t('Sampling')}<select value={settings.samplingMode} onChange={(event) => setSettings({ ...settings, samplingMode: event.target.value as SamplingMode })}><option value="natural">{t('Natural')}</option><option value="balanced">{t('Balanced')}</option></select></label><label>{t('Priority')}<select value={settings.priority} onChange={(event) => setSettings({ ...settings, priority: event.target.value as LearnPriority })}><option value="random">{t('Random')}</option><option value="familiar">{t('Familiar places')}</option><option value="least-exposure">{t('Least exposure')}</option></select></label></div>
        <label>{t('Street View imagery')}<select value={settings.panoramaSource} onChange={(event) => setSettings({ ...settings, panoramaSource: event.target.value as PanoramaSource })}><option value="official">{t('Official only')}</option><option value="mixed">{t('Official + contributor')}</option><option value="contributor">{t('Contributor only')}</option></select></label>
        <label>{t('Indoor coverage')}<select value={settings.allowInteriors ? 'mixed' : 'outdoor'} onChange={(event) => setSettings({ ...settings, allowInteriors: event.target.value === 'mixed' })}><option value="outdoor">{t('Outdoors only')}</option><option value="mixed">{t('Mixed indoors and outdoors')}</option></select></label>
      </div>}
      {(panel === 'uploaded' || panel === 'url') && <><ImportedMapUpload source={panel === 'url' ? 'url' : 'upload'} map={importedMap} onChange={(map) => { if (map.kind === 'pool') { setLoadedPoolName(map.name); setPanel('custom'); setSettings({ ...settings, source: 'custom', collectionId: 'world', countryCodes: map.countryCodes, locationTargets: map.locationTargets }); return; } setImportedMap(map); void trainerDb.setSetting('local.currentMapId', map.id); }} />{importedMap?.kind !== 'pool' && <div className="setup-field imported-map-variation"><label htmlFor="imported-map-variation">{t('Location variation')} <output htmlFor="imported-map-variation">{settings.importedMapVariation ?? 0}</output></label><input id="imported-map-variation" type="range" min="0" max="100" value={settings.importedMapVariation ?? 0} onChange={(event) => setSettings({ ...settings, importedMapVariation: Number(event.target.value) })} /><small>{t('0 uses uploaded locations; 100 explores up to 1 km nearby.')}</small></div>}</>}
      {panel === 'describe' && <DescribePool onChange={(name, countryCodes, locationTargets, suggested) => { setLoadedPoolName(name); setPanel('custom'); setSettings({ ...settings, ...Object.fromEntries(Object.entries(suggested).filter(([, value]) => value !== undefined)), source: 'custom', collectionId: 'world', countryCodes, locationTargets }); }} />}
    </div>
    <footer>{panel === 'meta' && <button type="button" className="button secondary" onClick={() => setMetaLessonsOpen(true)}>{t('Browse Meta lessons')}</button>}{panel === 'custom' && !!settings.countryCodes?.length && <button type="button" className="button secondary" onClick={() => downloadGeographicPool(settings.countryCodes!, settings.locationTargets || [], loadedPoolName)}><Download size={15} />{t('Save geographic pool')}</button>}<button className="button primary" disabled={(panel === 'meta' && metaAvailable !== true) || ((panel === 'uploaded' || panel === 'url') && !importedMap) || panel === 'describe'} onClick={() => onStart({ ...settings, source: panel === 'url' ? 'uploaded' : panel as LearnSource, importedMapId: importedMap?.id, showCompass: true })}><Play size={16} />{t(panel === 'meta' && settings.metaLessonId ? 'Start selected lesson' : panel === 'map' ? 'Open world map' : 'Start learning')}</button></footer>
    {metaLessonsOpen && <div className="meta-lessons-backdrop"><section className="meta-lessons-dialog" role="dialog" aria-modal="true" aria-labelledby="meta-lessons-title"><header><div><h2 id="meta-lessons-title">{t('Browse Meta lessons')}</h2><p>{selectedMetaCourse === 'beginner' ? t('Beginner course') : countryDisplayName(selectedMetaCourse, ui)}</p></div><button type="button" className="icon-button" onClick={() => setMetaLessonsOpen(false)} aria-label={t('close')}><X size={18} /></button></header><div className="meta-lessons-dialog-body">{selectedMetaCourse === 'beginner' ? <MetaLessonBrowser completed={completedMetaIds} selectedId={settings.metaLessonId} onSelect={(metaLessonId) => { setSettings({ ...settings, metaLessonId }); if (metaLessonId) setMetaLessonsOpen(false); }} /> : countryMetaLessons ? countryMetaLessons.length ? <MetaLessonBrowser lessons={countryMetaLessons.map((lesson) => ({ id: lesson.id, text: lesson.text, note: lesson.note, section: lesson.section, imageUrl: lesson.image }))} completed={completedMetaIds} selectedId={settings.metaLessonId} onSelect={(metaLessonId) => { setSettings({ ...settings, metaLessonId }); if (metaLessonId) setMetaLessonsOpen(false); }} /> : <p className="meta-course-loading" role="alert">{t('Could not load Meta course.')}</p> : <p className="meta-course-loading">{t('Loading…')}</p>}</div></section></div>}
  </section></div>;
}
