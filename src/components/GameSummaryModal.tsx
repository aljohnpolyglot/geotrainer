/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { GameRecord, GameRound } from '../types';
import { formatDistance, getScoreRating } from '../services/gameLogic';
import { getFlagCdnUrl } from '../services/geocoding';
import { COUNTRIES } from '../data/countries';
import { Trophy, RotateCcw, History, X, ExternalLink, MapPin, Target } from 'lucide-react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { mapPresentationOptions, useMapPreferences } from '../services/mapPreferences';

interface GameSummaryModalProps {
  game: GameRecord;
  onPlayAgain: () => void;
  onViewHistory: () => void;
  onClose: () => void;
  onPracticeMistakes?: () => void;
  onOpenRound?: (round: GameRound) => void;
}

export const GameSummaryModal: React.FC<GameSummaryModalProps> = ({
  game,
  onPlayAgain,
  onViewHistory,
  onClose,
  onPracticeMistakes,
  onOpenRound,
}) => {
  const { ui } = useLanguagePreferences();
  const mapPreferences = useMapPreferences();
  const t = (key: string) => translate(ui, key);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const percentage = game.totalScore / (game.maxPossibleScore || 1);
  const rating = getScoreRating(percentage);

  // Keyboard shortcut: Escape to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Render Full Match Map with all rounds plotted
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof google === 'undefined' || !google.maps || !google.maps.Map) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark')),
      // Solution attribution per skill guidelines
      internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
    } as google.maps.MapOptions);

    const bounds = new google.maps.LatLngBounds();

    game.rounds.forEach((round) => {
      const actualPos = { lat: round.location.lat, lng: round.location.lng };
      bounds.extend(actualPos);
      const country = COUNTRIES[round.location.countryCode];
      const countryName = country?.name || round.location.countryCode;

      // Actual Location (Green marker)
      const actualMarker = new google.maps.Marker({
        position: actualPos,
        map,
        title: `Round ${round.roundNumber}: ${countryName} (Click to open in Street View)`,
        label: {
          text: round.roundNumber.toString(),
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '11px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      if (onOpenRound) {
        actualMarker.addListener('click', () => {
          onOpenRound(round);
        });
      }

      // Guess Location (Red marker)
      if (round.guess) {
        const guessPos = { lat: round.guess.lat, lng: round.guess.lng };
        bounds.extend(guessPos);

        new google.maps.Marker({
          position: guessPos,
          map,
          title: `Round ${round.roundNumber} Guess`,
          label: {
            text: round.roundNumber.toString(),
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        // Connecting Line
        new google.maps.Polyline({
          path: [guessPos, actualPos],
          geodesic: true,
          strokeColor: '#f59e0b',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map,
        });
      }
    });

    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [game, onOpenRound, mapPreferences]);

  return (
    <div
      id="game-summary-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 select-none animate-in fade-in duration-200"
    >
      <div className="w-full max-w-5xl h-[92vh] max-h-[780px] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Top Summary Banner */}
        <div className="p-4 sm:p-6 bg-stone-950/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{t('gameCompleted')}</h1>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 ${rating.color}`}>
                  {rating.title}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {t('Collection')}: <span className="text-stone-200 font-medium">{game.collectionName}</span> •{' '}
                {game.rounds.length} {t('rounds')} • {game.settings.canMove ? t('Move allowed') : t('No Move')}
                {game.settings.timeLimitSeconds > 0 && ` • ${game.settings.timeLimitSeconds}s timer`}
              </p>
            </div>
          </div>

          {/* Final Score Counter & Exit Button */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-xs text-stone-400 uppercase tracking-wider block font-semibold">
                {t('finalScore')}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {game.totalScore.toLocaleString()}{' '}
                <span className="text-sm text-stone-500 font-normal font-sans">
                  / {game.maxPossibleScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Top Exit Close Button */}
            <button
              id="game-summary-exit-btn-top"
              onClick={onClose}
              title={t('Exit modal (Esc)')}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer border border-stone-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: Map + Round breakdown columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map showing all rounds */}
          <div ref={mapContainerRef} className="flex-1 h-64 md:h-full relative bg-stone-950" />

          {/* Round-by-round breakdown sidebar */}
          <div className="w-full md:w-80 bg-stone-900/95 border-t md:border-t-0 md:border-l border-stone-800 flex flex-col overflow-y-auto">
            <div className="px-4 py-3 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
                  {t('roundBreakdown')}
                </span>
                <span className="text-[10px] text-stone-400">
                  {t('Click any round to open in Street View')}
                </span>
              </div>
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="divide-y divide-stone-800/70 overflow-y-auto flex-1">
              {game.rounds.map((r) => {
                const country = COUNTRIES[r.location.countryCode];
                const countryName = country?.name || r.location.countryCode;
                const flag1x = getFlagCdnUrl(r.location.countryCode, 40);

                return (
                  <button
                    key={r.roundNumber}
                    onClick={() => {
                      if (onOpenRound) {
                        onOpenRound(r);
                      }
                    }}
                    title={`${t('Open')} ${t('Round')} ${r.roundNumber} (${countryName})`}
                    className="w-full text-left p-3.5 hover:bg-stone-800/70 transition-all cursor-pointer group border-l-3 border-transparent hover:border-amber-400 relative"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-stone-800 group-hover:bg-blue-600 group-hover:text-white text-stone-300 text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0 transition-colors">
                          {r.roundNumber}
                        </span>
                        {flag1x && (
                          <img
                            src={flag1x}
                            alt=""
                            width="20"
                            height="14"
                            className="w-5 h-3.5 rounded-xs object-cover border border-stone-700 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span className="text-xs font-bold text-stone-100 group-hover:text-amber-300 truncate transition-colors">
                          {countryName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          +{r.score.toLocaleString()}
                        </span>
                        <ExternalLink className="w-3 h-3 text-stone-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pl-7">
                      <span>
                        {r.distanceKm !== null ? formatDistance(r.distanceKm) : t('noGuess')}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-stone-500 font-sans">{r.timeSpentSeconds}s</span>
                        <span className="text-[10px] text-amber-400/90 font-sans hidden group-hover:inline">
                          {t('View')} →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={onViewHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-medium rounded-lg border border-stone-800 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('Past Games Collection')}</span>
            </button>

          </div>

          <div className="flex items-center space-x-2.5">
            {onPracticeMistakes && <button
              onClick={onPracticeMistakes}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{t('practiceMistakes')}</span>
            </button>}
            <button
              onClick={onPlayAgain}
              className="inline-flex items-center gap-2 px-5 py-2 bg-stone-100 hover:bg-white text-stone-950 text-xs sm:text-sm font-bold rounded-lg shadow-md transition-all cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-900" />
              <span>{t('playAgain')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
