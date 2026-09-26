/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { GameRound } from "../types";
import { formatDistance } from "../services/gameLogic";
import { reverseGeocodeLocation, getFlagCdnUrl, ReverseGeocodeResult } from "../services/geocoding";
import { COUNTRIES } from "../data/countries";
import { ArrowLeft, ArrowRight, Trophy, MapPin, Building, Clock, Eye, Minus } from "lucide-react";
import { ResultMap } from "./ResultMap";
import { translate } from "../services/language";
import { useLanguagePreferences } from "../services/useLanguagePreferences";

interface RoundResultModalProps {
  round: GameRound;
  totalRounds: number;
  onNextRound: () => void;
  isLastRound: boolean;
  rounds: GameRound[];
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({ round, totalRounds, onNextRound, isLastRound, rounds }) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [viewIndex, setViewIndex] = useState(rounds.length - 1);
  const viewedRound = rounds[viewIndex] || round;
  const [geocodeData, setGeocodeData] = useState<ReverseGeocodeResult | null>(null);
  const [minimized, setMinimized] = useState(false);

  const country = COUNTRIES[viewedRound.location.countryCode];
  const countryName = geocodeData?.countryName || country?.name || viewedRound.location.countryCode;
  const flag1x = getFlagCdnUrl(viewedRound.location.countryCode, 40);
  const flag2x = getFlagCdnUrl(viewedRound.location.countryCode, 80);

  // Reverse geocode true location
  useEffect(() => {
    setGeocodeData(null);
    reverseGeocodeLocation(viewedRound.location.lat, viewedRound.location.lng).then((res) => {
      if (res) setGeocodeData(res);
    });
  }, [viewedRound.location.lat, viewedRound.location.lng]);

  useEffect(() => setViewIndex(rounds.length - 1), [round.roundNumber, rounds.length]);
  useEffect(() => setMinimized(false), [round.roundNumber]);

  // Keyboard shortcut: Space or Enter to continue
  useEffect(() => {
    if (minimized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onNextRound();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [minimized, onNextRound]);

  const placeHeadline = [geocodeData?.locality, geocodeData?.adminArea].filter(Boolean).join(", ");

  if (minimized) return <button type="button" className="review-result-resume" onClick={() => setMinimized(false)} aria-haspopup="dialog" autoFocus><Eye size={17} />{t('View review result')}</button>;

  return (
    <div id="round-result-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[720px] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 bg-stone-950/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {flag1x && <img src={flag1x} srcSet={`${flag1x} 1x, ${flag2x} 2x`} alt={`${countryName} ${t('flag')}`} width="36" height="24" className="w-9 h-6 rounded-xs object-cover border border-stone-700 shadow-sm" referrerPolicy="no-referrer" />}
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{countryName}</h2>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">{viewedRound.location.countryCode}</span>
              </div>
              {placeHeadline ? (
                <div className="flex items-center space-x-1.5 text-xs text-stone-300 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{placeHeadline}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-xs text-stone-400 font-mono mt-0.5">
                  <MapPin className="w-3 h-3 text-stone-500" />
                  <span>
                    {viewedRound.location.lat.toFixed(4)}°, {viewedRound.location.lng.toFixed(4)}°
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Score & Distance Metrics */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="text-right">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">
                <Clock className="w-3 h-3 inline" /> {t('time')}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-stone-200">{Math.round(viewedRound.timeSpentSeconds)}s</span>
            </div>
            {viewedRound.distanceKm !== null && (
              <div className="text-right">
                <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium">{t('distance')}</span>
                <span className="text-base sm:text-lg font-bold font-mono text-stone-200">{formatDistance(viewedRound.distanceKm)}</span>
              </div>
            )}

            <div className="text-right pl-3 border-l border-stone-800">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-medium flex items-center justify-end gap-1">
                <Trophy className="w-3 h-3 text-amber-400" /> {t('roundScore')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400">
                +{viewedRound.score.toLocaleString()} <span className="text-xs text-stone-500 font-normal font-sans">/ 5,000</span>
              </span>
            </div>
          </div>
          <button type="button" className="round-result-minimize" onClick={() => setMinimized(true)} aria-label={t('Minimize review result')} title={t('Minimize review result')} autoFocus><Minus size={18} /></button>
        </div>

        {/* Interactive Map Visualizer */}
        <ResultMap actual={viewedRound.location} guess={viewedRound.guess} className="flex-1 w-full h-full relative bg-stone-950" />

        {/* Footer Action Bar */}
        <div className="round-result-footer p-4 bg-stone-950 border-t border-stone-800">
          <div className="round-result-progress text-xs text-stone-400">
            {t('round')} <strong className="text-white">{viewedRound.roundNumber}</strong> {t('of')} <strong className="text-white">{totalRounds}</strong>
          </div>

          <div className="round-history-nav" aria-label={t('completedRoundHistory')}>
            <button disabled={viewIndex === 0} onClick={() => setViewIndex((value) => value - 1)}>
              <ArrowLeft size={15} /> {t('previous')}
            </button>
            <span>
              {viewIndex + 1} / {rounds.length} {t('played')}
            </span>
            <button disabled={viewIndex === rounds.length - 1} onClick={() => setViewIndex((value) => value + 1)}>
              {t('Next')} <ArrowRight size={15} />
            </button>
          </div>

          <button onClick={onNextRound} className="round-result-continue inline-flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-white text-stone-950 text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer active:scale-98">
            <span>{isLastRound ? t('viewGameSummary') : t('continueGame')}</span>
            <ArrowRight className="w-4 h-4 text-stone-900" />
          </button>
        </div>
      </div>
    </div>
  );
};
