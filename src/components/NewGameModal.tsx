/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Collection, Environment, GameSettings, SamplingMode, UrbanLevel } from '../types';
import { BUILT_IN_COLLECTION_GROUPS, TRAINING_PRESETS } from '../data/collections';
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
} from 'lucide-react';

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
  const [roundCount, setRoundCount] = useState<number>(5);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('world');
  const [canMove, setCanMove] = useState<boolean>(true);
  const [canPan, setCanPan] = useState<boolean>(true);
  const [canZoom, setCanZoom] = useState<boolean>(true);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(0); // 0 = unlimited
  const [showCompass, setShowCompass] = useState(defaultShowCompass);
  const [environment, setEnvironment] = useState<Environment>('mixed');
  const [urbanLevel, setUrbanLevel] = useState<UrbanLevel>(3);
  const [samplingMode, setSamplingMode] = useState<SamplingMode>('natural');

  useEffect(() => { if (isOpen) setShowCompass(defaultShowCompass); }, [isOpen, defaultShowCompass]);

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
    onStartGame({
      roundCount,
      collectionId: selectedCollectionId,
      canMove,
      canPan,
      canZoom,
      showCompass,
      environment,
      urbanLevel,
      samplingMode,
      timeLimitSeconds,
    });
  };

  const isNmpz = !canMove && !canPan && !canZoom;
  const isNoMove = !canMove && canPan && canZoom;
  const isStandard = canMove && canPan && canZoom;

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
              <h2 className="text-base font-bold text-white tracking-tight">New Game Setup</h2>
              <p className="text-[11px] text-stone-400">Configure rounds, rules, and timers</p>
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
          {/* 1. Collection Selector */}
          <div className="space-y-1.5">
            <label className="text-stone-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Map Collection</span>
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl px-3.5 py-2.5 text-stone-100 text-xs font-medium focus:outline-hidden focus:border-amber-500 transition-colors cursor-pointer"
            >
              {BUILT_IN_COLLECTION_GROUPS.map((group) => <optgroup label={group.label} key={group.label}>{group.collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.countryCodes.length} countries)
                </option>
              ))}</optgroup>)}
              {collections.some((item) => item.isCustom) && <optgroup label="Custom collections">{collections.filter((item) => item.isCustom).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.countryCodes.length} countries)</option>)}</optgroup>}
            </select>
          </div>

          <div className="environment-game-settings">
            <label>Environment
              <select value={environment} onChange={(event) => setEnvironment(event.target.value as Environment)}>
                <option value="mixed">Mixed</option><option value="urban">Urban</option><option value="suburban">Suburban</option><option value="rural">Rural</option>
              </select>
            </label>
            {(environment === 'urban' || environment === 'suburban') && <label>Urban Level
              <select value={urbanLevel} onChange={(event) => setUrbanLevel(Number(event.target.value) as UrbanLevel)}>
                <option value="1">1 — Major Cities</option><option value="2">2 — Major + Regional</option><option value="3">3 — All Available Seeds</option>
              </select>
            </label>}
            <label>Sampling<select value={samplingMode} onChange={(event) => setSamplingMode(event.target.value as SamplingMode)}><option value="natural">Natural</option><option value="balanced">Balanced</option></select></label>
          </div>
          <div className="preset-list" aria-label="Training presets">{TRAINING_PRESETS.map((preset) => <button key={preset.name} type="button" onClick={() => { setSelectedCollectionId(preset.collectionId); setEnvironment(preset.environment); setUrbanLevel('urbanLevel' in preset ? preset.urbanLevel : 3); setSamplingMode(preset.samplingMode); }}>{preset.name}</button>)}</div>

          {/* 2. Number of Rounds / Batch Size */}
          <div className="space-y-1.5">
            <label className="text-stone-300 font-semibold uppercase tracking-wider block">
              Round Count (Batch Size)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setRoundCount(count)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                    roundCount === count
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  {count} Rounds
                </button>
              ))}
            </div>
          </div>

          {/* 3. Movement & Camera Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-stone-300 font-semibold uppercase tracking-wider block">
                Movement & Camera Rules
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
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('no-move')}
                  className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                    isNoMove ? 'bg-blue-600 text-white font-bold' : 'bg-stone-800 text-white/70'
                  }`}
                >
                  No Move
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
                <span className="font-semibold text-[11px]">Walk / Move</span>
                <span className="text-[10px] text-stone-400">{canMove ? 'Allowed' : 'Disabled'}</span>
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
                <span className="font-semibold text-[11px]">Pan / Rotate</span>
                <span className="text-[10px] text-stone-400">{canPan ? 'Allowed' : 'Locked'}</span>
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
                <span className="font-semibold text-[11px]">Zoom In/Out</span>
                <span className="text-[10px] text-stone-400">{canZoom ? 'Allowed' : 'Locked'}</span>
              </button>
            </div>
          </div>

          {/* 4. Timer Option */}
          <button
            type="button"
            role="switch"
            aria-checked={showCompass}
            onClick={() => setShowCompass((value) => !value)}
            className={`game-compass-setting ${showCompass ? 'enabled' : ''}`}
          >
            <span>Compass</span><strong>{showCompass ? 'Enabled' : 'Disabled'}</strong>
          </button>

          {/* 5. Timer Option */}
          <div className="space-y-1.5">
            <label className="text-stone-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Time Limit Per Round</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: 'Unlimited', seconds: 0 },
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
            <span>Past Games ({pastGamesCount})</span>
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer active:scale-98 text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>START GAME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
