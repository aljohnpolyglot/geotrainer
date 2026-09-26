/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Collection, Environment, GameSettings, LocationPoolTarget, PanoramaSource, SamplingMode, UrbanLevel } from '../types';
import { TRAINING_PRESETS } from '../data/collections';
import { normalizeGamePreferences, trainerDb } from '../data/trainerDb';
import {
  Gamepad2,
  X,
  Play,
  Clock,
  Navigation,
  RotateCw,
  ZoomIn,
  History,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { translate } from '../services/language';
import { CountryMixPicker } from './CountryMixPicker';
import { CollectionOptions } from './CollectionOptions';
import { ImportedMapUpload } from './ImportedMapUpload';
import { downloadGeographicPool, getImportedMap, importedMapPointCount, type ImportedMap } from '../services/importedMap';
import { LocationPoolPicker } from './LocationPoolPicker';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onStartGame: (settings: GameSettings) => void;
  onOpenHistory: () => void;
  pastGamesCount: number;
  defaultShowCompass: boolean;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  collections,
  onStartGame,
  onOpenHistory,
  pastGamesCount,
  defaultShowCompass,
}) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [roundCount, setRoundCount] = useState<number>(5);
  const [customRounds, setCustomRounds] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('world');
  const [countryCodes, setCountryCodes] = useState<string[]>([]);
  const [locationTargets, setLocationTargets] = useState<LocationPoolTarget[]>([]);
  const [canMove, setCanMove] = useState<boolean>(true);
  const [canPan, setCanPan] = useState<boolean>(true);
  const [canZoom, setCanZoom] = useState<boolean>(true);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(0); // 0 = unlimited
  const [showCompass, setShowCompass] = useState(defaultShowCompass);
  const [aiCoachEnabled, setAiCoachEnabled] = useState(true);
  const [environment, setEnvironment] = useState<Environment>('mixed');
  const [urbanLevel, setUrbanLevel] = useState<UrbanLevel>(3);
  const [samplingMode, setSamplingMode] = useState<SamplingMode>('natural');
  const [panoramaSource, setPanoramaSource] = useState<PanoramaSource>('official');
  const [allowInteriors, setAllowInteriors] = useState(false);
  const [locationSource, setLocationSource] = useState<'generated' | 'uploaded'>('generated');
  const [importedMap, setImportedMap] = useState<ImportedMap>();
  const [loadedPoolName, setLoadedPoolName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void trainerDb.setting<GameSettings>('gamePreferences').then((stored) => {
      if (!active) return;
      const value = normalizeGamePreferences(stored, defaultShowCompass);
      setRoundCount(value.roundCount); setCustomRounds(![3, 5, 10, 15].includes(value.roundCount)); setSelectedCollectionId(collections.some((item) => item.id === value.collectionId) ? value.collectionId : 'world');
      setCountryCodes([]); setLocationTargets([]);
      setCanMove(value.canMove); setCanPan(value.canPan); setCanZoom(value.canZoom); setShowCompass(value.showCompass ?? defaultShowCompass); setAiCoachEnabled(value.aiCoachEnabled ?? true);
      setEnvironment(value.environment ?? 'mixed'); setUrbanLevel(value.urbanLevel ?? 3); setSamplingMode(value.samplingMode ?? 'natural'); setPanoramaSource(value.panoramaSource ?? 'official'); setAllowInteriors(value.allowInteriors === true); setTimeLimitSeconds(value.timeLimitSeconds);
      setLocationSource(value.importedMapId ? 'uploaded' : 'generated');
      void (value.importedMapId ? getImportedMap(value.importedMapId) : trainerDb.setting<string>('local.currentMapId').then((id) => id && getImportedMap(id))).then((map) => { if (active) setImportedMap(map || undefined); });
    });
    return () => { active = false; };
  }, [isOpen, defaultShowCompass, collections]);

  if (!isOpen) return null;

  // Presets
  const applyPreset = (preset: 'standard' | 'no-move' | 'nmpz') => {
    if (preset === 'standard') {
      setCanMove(true);
      setCanPan(true);
      setCanZoom(true);
    } else if (preset === 'no-move') {
      setCanMove(false);
      setCanPan(true);
      setCanZoom(true);
    } else if (preset === 'nmpz') {
      setCanMove(false);
      setCanPan(false);
      setCanZoom(false);
    }
  };

  const handleStart = () => {
    const settings = {
      roundCount: locationSource === 'uploaded' && importedMap && importedMapPointCount(importedMap) ? Math.min(roundCount, importedMapPointCount(importedMap)!) : roundCount,
      collectionId: selectedCollectionId,
      ...(locationSource === 'uploaded' && importedMap ? { importedMapId: importedMap.id, importedMapName: importedMap.name } : {}),
      ...(countryCodes.length ? { countryCodes } : {}),
      ...(locationTargets.length ? { locationTargets } : {}),
      canMove,
      canPan,
      canZoom,
      showCompass,
      aiCoachEnabled,
      environment,
      urbanLevel,
      samplingMode,
      panoramaSource,
      allowContributors: panoramaSource !== 'official',
      allowInteriors,
      timeLimitSeconds,
    };
    if (locationSource === 'uploaded' && !importedMap) return;
    void trainerDb.setSetting('gamePreferences', settings);
    onStartGame(settings);
  };

  const isNmpz = !canMove && !canPan && !canZoom;
  const isNoMove = !canMove && canPan && canZoom;
  const isStandard = canMove && canPan && canZoom;
  const selectedCollection = collections.find((item) => item.id === selectedCollectionId);

  return (
    <div
      id="new-game-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
    >
      <div
        id="new-game-dialog"
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{t('New Game Setup')}</h2>
              <p className="text-[11px] text-stone-400">{t('Configure rounds, rules, and timers')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          <label className="game-country-choice">{t('Location source')}<select value={locationSource} onChange={(event) => setLocationSource(event.target.value as 'generated' | 'uploaded')}><option value="generated">{t('Generated locations')}</option><option value="uploaded">{t('Uploaded map')}</option></select></label>
          {locationSource === 'uploaded' && <ImportedMapUpload source="upload" map={importedMap} onChange={(map) => { if (map.kind === 'pool') { setLoadedPoolName(map.name); setLocationSource('generated'); setSelectedCollectionId('world'); setCountryCodes(map.countryCodes); setLocationTargets(map.locationTargets); return; } setImportedMap(map); const points = importedMapPointCount(map); if (points) setRoundCount((count) => Math.min(count, points)); void trainerDb.setSetting('local.currentMapId', map.id); }} />}
          {locationSource === 'generated' && <>
          {/* 1. Collection Selector */}
          <div className="space-y-1.5">
            <label className="text-stone-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('Map Collection')}</span>
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => { setSelectedCollectionId(e.target.value); setCountryCodes([]); setLocationTargets([]); }}
              className="w-full bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl px-3.5 py-2.5 text-stone-100 text-xs font-medium focus:outline-hidden focus:border-amber-500 transition-colors cursor-pointer"
            >
              <CollectionOptions collections={collections} customLabel={t('Custom collections')} />
            </select>
          </div>

          <div className="game-country-choice">
            <label>{t('Country mix')}</label>
            <CountryMixPicker value={countryCodes} availableCodes={selectedCollection?.countryCodes || []} onChange={(codes) => { setCountryCodes(codes); setLocationTargets((targets) => targets.filter((target) => codes.includes(target.countryCode))); }} />
          </div>
          {!!countryCodes.length && <div className="game-country-choice"><label>{t('Location pools')}</label>{loadedPoolName && <small className="imported-map-current"><strong>{loadedPoolName}</strong> · {t('Geographic pool')}</small>}<LocationPoolPicker countryCodes={countryCodes} value={locationTargets} onChange={setLocationTargets} /><button type="button" className="button secondary save-location-pool" onClick={() => downloadGeographicPool(countryCodes, locationTargets)}><Download size={15} />{t('Save geographic pool')}</button></div>}

          <div className="environment-game-settings">
            <label>{t('Environment')}
              <select value={environment} onChange={(event) => setEnvironment(event.target.value as Environment)}>
                <option value="mixed">{t('Any environment')}</option><option value="urban">{t('Urban')}</option><option value="suburban">{t('Suburban')}</option><option value="rural">{t('Rural')}</option>
              </select>
            </label>
            {(environment === 'urban' || environment === 'suburban') && <label>{t('Urban Level')}
              <select value={urbanLevel} onChange={(event) => setUrbanLevel(Number(event.target.value) as UrbanLevel)}>
                <option value="1">1 — {t('Major Cities')}</option><option value="2">2 — {t('Major + Regional')}</option><option value="3">3 — {t('All Available Seeds')}</option>
              </select>
            </label>}
            <label>{t('Sampling')}<select value={samplingMode} onChange={(event) => setSamplingMode(event.target.value as SamplingMode)}><option value="natural">{t('Natural')}</option><option value="balanced">{t('Balanced')}</option></select></label>
          </div>
          <div className="preset-list" aria-label={t('Training presets')}>{TRAINING_PRESETS.map((preset) => <button key={preset.name} type="button" onClick={() => { setSelectedCollectionId(preset.collectionId); setCountryCodes([]); setLocationTargets([]); setEnvironment(preset.environment); setUrbanLevel('urbanLevel' in preset ? preset.urbanLevel : 3); setSamplingMode(preset.samplingMode); }}>{preset.name}</button>)}</div>
          </>}

          {/* 2. Number of Rounds / Batch Size */}
          <div className="space-y-1.5">
              <label className="text-stone-300 font-semibold uppercase tracking-wider block">
              {t('Round Count (Batch Size)')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => { setRoundCount(count); setCustomRounds(false); }}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                    roundCount === count
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  {count} {t('Rounds')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomRounds(true)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${customRounds ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'}`}
              >
                {t('Custom')}
              </button>
            </div>
            {customRounds && <input aria-label={t('Round Count (Batch Size)')} type="number" min="1" max="100" value={roundCount} onChange={(event) => setRoundCount(Math.min(100, Math.max(1, Math.trunc(Number(event.target.value) || 1))))} className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-stone-900 text-base font-mono" />}
          </div>

          {/* 3. Movement & Camera Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-stone-300 font-semibold uppercase tracking-wider block">
                {t('Movement & Camera Rules')}
              </label>

              {/* Quick Presets */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => applyPreset('standard')}
                  className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                    isStandard ? 'bg-blue-600 text-white font-bold' : 'bg-stone-800 text-white/70'
                  }`}
                >
                  {t('Standard')}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('no-move')}
                  className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                    isNoMove ? 'bg-blue-600 text-white font-bold' : 'bg-stone-800 text-white/70'
                  }`}
                >
                  {t('No Move')}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('nmpz')}
                  className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                    isNmpz ? 'bg-blue-600 text-white font-bold' : 'bg-stone-800 text-white/70'
                  }`}
                >
                  NMPZ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Walking / Move */}
              <button
                type="button"
                onClick={() => setCanMove(!canMove)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                  canMove
                    ? 'bg-stone-800/80 border-stone-600 text-stone-100'
                    : 'bg-stone-950 border-stone-850 text-stone-500 opacity-60'
                }`}
              >
                <Navigation className={`w-4 h-4 ${canMove ? 'text-amber-400' : 'text-stone-600'}`} />
                <span className="font-semibold text-[11px]">{t('Walk / Move')}</span>
                <span className="text-[10px] text-stone-400">{canMove ? t('Allowed') : t('Disabled')}</span>
              </button>

              {/* Pan / 360 Rotation */}
              <button
                type="button"
                onClick={() => setCanPan(!canPan)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                  canPan
                    ? 'bg-stone-800/80 border-stone-600 text-stone-100'
                    : 'bg-stone-950 border-stone-850 text-stone-500 opacity-60'
                }`}
              >
                <RotateCw className={`w-4 h-4 ${canPan ? 'text-amber-400' : 'text-stone-600'}`} />
                <span className="font-semibold text-[11px]">{t('Pan / Rotate')}</span>
                <span className="text-[10px] text-stone-400">{canPan ? t('Allowed') : t('Locked')}</span>
              </button>

              {/* Zoom */}
              <button
                type="button"
                onClick={() => setCanZoom(!canZoom)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                  canZoom
                    ? 'bg-stone-800/80 border-stone-600 text-stone-100'
                    : 'bg-stone-950 border-stone-850 text-stone-500 opacity-60'
                }`}
              >
                <ZoomIn className={`w-4 h-4 ${canZoom ? 'text-amber-400' : 'text-stone-600'}`} />
                <span className="font-semibold text-[11px]">{t('Zoom In/Out')}</span>
                <span className="text-[10px] text-stone-400">{canZoom ? t('Allowed') : t('Locked')}</span>
              </button>
            </div>
          </div>

          {/* 4. Timer Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={showCompass}
              onClick={() => setShowCompass((value) => !value)}
              className={`game-compass-setting ${showCompass ? 'enabled' : ''}`}
            >
              <span>{t('Compass')}</span><strong>{showCompass ? t('Enabled') : t('Disabled')}</strong>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={aiCoachEnabled}
              onClick={() => setAiCoachEnabled((value) => !value)}
              className={`game-compass-setting ${aiCoachEnabled ? 'enabled' : ''}`}
            >
              <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />{t('AI Coach')}</span><strong>{aiCoachEnabled ? t('Enabled') : t('Disabled')}</strong>
            </button>
          </div>
          <label className="panorama-source-setting">{t('Street View imagery')}<select value={panoramaSource} onChange={(event) => setPanoramaSource(event.target.value as PanoramaSource)}><option value="official">{t('Official only')}</option><option value="mixed">{t('Official + contributor')}</option><option value="contributor">{t('Contributor only')}</option></select></label>
          <label className="panorama-source-setting">{t('Indoor coverage')}<select value={allowInteriors ? 'mixed' : 'outdoor'} onChange={(event) => setAllowInteriors(event.target.value === 'mixed')}><option value="outdoor">{t('Outdoors only')}</option><option value="mixed">{t('Mixed indoors and outdoors')}</option></select></label>

          {/* 5. Timer Option */}
          <div className="space-y-1.5">
            <label className="text-stone-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('Time Limit Per Round')}</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: t('Unlimited'), seconds: 0 },
                { label: '30s', seconds: 30 },
                { label: '60s', seconds: 60 },
                { label: '90s', seconds: 90 },
                { label: '2 min', seconds: 120 },
              ].map((opt) => (
                <button
                  key={opt.seconds}
                  type="button"
                  onClick={() => setTimeLimitSeconds(opt.seconds)}
                  className={`py-2 px-1 rounded-xl text-center font-medium transition-all cursor-pointer border text-[11px] ${
                    timeLimitSeconds === opt.seconds
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer px-2 py-1.5 rounded-lg hover:bg-stone-800"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('Past Games')} ({pastGamesCount})</span>
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={locationSource === 'uploaded' && !importedMap}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer active:scale-98 text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>{t('START GAME')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
