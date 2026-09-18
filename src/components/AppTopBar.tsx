import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AppMode,
  GameSettings,
  LearnSource,
  LocationResult,
} from '../types';
import { COUNTRIES } from '../data/countries';
import { getFlagCdnUrl } from '../services/geocoding';
import {
  ArrowLeft,
  BookOpen,
  ChartNoAxesCombined,
  Clock,
  Eye,
  EyeOff,
  Gamepad2,
  History,
  House,
  Lightbulb,
  Maximize2,
  Menu,
  Minimize2,
  Play,
  RefreshCw,
  Settings2,
  Shuffle,
  Target,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { formatTime } from '../services/gameLogic';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { translate } from '../services/language';

export interface AppTopBarProps {
  appMode: AppMode;
  showHome: boolean;
  isGameActive: boolean;
  currentLocation: LocationResult | null;
  isLoading: boolean;
  isRevealed: boolean;
  gameSettings: GameSettings | null;
  currentRoundIndex: number;
  currentTotalScore: number;
  timeRemaining: number | null;
  pastGamesCount: number;
  reviewAttempt: { id: string } | null;
  reviewStatsLength: number;
  reviewInitialTotal: number;
  reviewQueueLength: number;
  reviewSource: string;
  isFullscreen: boolean;
  statisticsActive: boolean;
  cluesActive: boolean;
  studyReviewSaving: boolean;
  learnSource: LearnSource;
  onHome: () => void;
  onStudy: () => void;
  onPlay: () => void;
  onReview: () => void;
  onExitReview: () => void;
  onRestartLearn: () => void;
  onStatistics: () => void;
  onClues: () => void;
  onReveal: () => void;
  onNextLocation: () => void;
  onAbandonGame: () => void;
  onOpenHistory: () => void;
  onOpenNewGame: () => void;
  onOpenPreferences: () => void;
  onToggleFullscreen: () => void;
}

export function AppTopBar({
  appMode, showHome, isGameActive, currentLocation, isLoading, isRevealed,
  gameSettings, currentRoundIndex, currentTotalScore, timeRemaining,
  pastGamesCount, reviewAttempt, reviewStatsLength, reviewInitialTotal,
  reviewQueueLength, reviewSource, isFullscreen, statisticsActive, cluesActive, studyReviewSaving, learnSource,
  onHome, onStudy, onPlay, onReview, onExitReview, onRestartLearn, onStatistics, onClues,
  onReveal, onNextLocation, onAbandonGame,
  onOpenHistory, onOpenNewGame, onOpenPreferences, onToggleFullscreen,
}: AppTopBarProps) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = (action: () => void) => { setMobileMenuOpen(false); action(); };
  const studyActions = !showHome && appMode === 'study' && <div className="study-viewport-actions" role="group" aria-label={t('navLearn')}>
    <button id="reveal-location-btn" onClick={onReveal} disabled={!currentLocation || isLoading} title={isRevealed ? t('Hide exact location (R)') : t('Reveal exact location (R)')} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${isRevealed ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-stone-100'} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {isRevealed && currentLocation ? <><img src={getFlagCdnUrl(currentLocation.countryCode, 40)} srcSet={`${getFlagCdnUrl(currentLocation.countryCode, 40)} 1x, ${getFlagCdnUrl(currentLocation.countryCode, 80)} 2x`} alt="" width="18" height="13" className="w-4.5 h-3 rounded-xs object-cover border border-stone-600/60 flex-shrink-0" referrerPolicy="no-referrer" /><span className="study-reveal-label font-semibold text-white">{COUNTRIES[currentLocation.countryCode]?.name || currentLocation.countryCode}</span><EyeOff className="w-3.5 h-3.5 text-amber-400 ml-0.5" /></> : <><Eye className="w-3.5 h-3.5 text-stone-400" /><span>{t('Reveal')}</span></>}
    </button>
    {learnSource !== 'map' && <button id="random-next-btn" onClick={onNextLocation} disabled={isLoading || studyReviewSaving} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md ${isLoading || studyReviewSaving ? 'bg-stone-700 text-stone-400 cursor-not-allowed' : 'bg-stone-100 hover:bg-white text-stone-950 active:scale-[0.98]'}`}>{isLoading || studyReviewSaving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>{studyReviewSaving ? t('Saving...') : t('Finding...')}</span></> : <><Shuffle className="w-3.5 h-3.5 text-stone-900" /><span>{t(learnSource === 'meta' ? 'Next Meta' : 'Next')}</span><span className="hidden sm:inline-block text-[10px] text-stone-700 bg-stone-200 px-1.5 py-0.5 rounded font-mono">{t('Space')}</span></>}</button>}
  </div>;
  return <>
    <header id="app-topbar" className={`${mobileMenuOpen ? 'mobile-nav-open ' : ''}${isRevealed ? 'location-revealed ' : ''}mode-${appMode} h-14 px-3 sm:px-5 bg-stone-900 border-b border-stone-800 flex items-center justify-between z-30 flex-shrink-0 gap-2`}>
      <div className="header-primary flex items-center space-x-2 sm:space-x-3">
        <button onClick={() => navigate(onHome)} className="home-button" aria-label={t('open')} title={t('open')}><House size={16} /></button>
        {!showHome && appMode === 'study' && learnSource === 'map' && currentLocation && <button type="button" onClick={onNextLocation} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-stone-200 bg-stone-950 border border-stone-700"><ArrowLeft size={14} /><span className="hidden md:inline">{t('Back to world map')}</span></button>}
        {!showHome && appMode === 'study' && <button type="button" className="icon-button" onClick={onRestartLearn} aria-label={t('Start new Learn mode')} title={t('Start new Learn mode')}><XCircle size={16} /></button>}
        {!showHome && appMode === 'review' && reviewAttempt && <span className="mobile-review-context"><strong>{reviewStatsLength + 1}/{Math.max(reviewInitialTotal, reviewStatsLength + reviewQueueLength)} · {reviewQueueLength} {t('remaining')}</strong><small>{t('Progress saved')}</small></span>}
        <button type="button" className="mobile-menu-toggle" aria-expanded={mobileMenuOpen} aria-label={t('Navigation')} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <button type="button" className="mobile-menu-backdrop" aria-label={t('close')} onClick={() => setMobileMenuOpen(false)} />
        <div className="mobile-drawer">
        <div className="primary-route-nav flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800">
          <button onClick={() => navigate(onStudy)} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${appMode === 'study' ? 'bg-stone-800 text-stone-100 shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}><BookOpen className="w-3.5 h-3.5 text-amber-400" /><span>{t('navLearn')}</span></button>
          <button onClick={() => navigate(onPlay)} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${appMode === 'play' ? 'bg-stone-800 text-stone-100 shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}><Gamepad2 className="w-3.5 h-3.5 text-amber-400" /><span>{t('navPlay')}</span>{isGameActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}</button>
          <button onClick={() => navigate(onReview)} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${appMode === 'review' && !statisticsActive && !cluesActive ? 'bg-stone-800 text-stone-100 shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}><Target className="w-3.5 h-3.5 text-amber-400" /><span>{t('navReview')}</span></button>
          <button onClick={() => navigate(onClues)} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${cluesActive ? 'bg-stone-800 text-stone-100 shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}><Lightbulb className="w-3.5 h-3.5 text-amber-400" /><span>{t('navClues')}</span></button>
          <button onClick={() => navigate(onStatistics)} className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${statisticsActive ? 'bg-stone-800 text-stone-100 shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}><ChartNoAxesCombined className="w-3.5 h-3.5 text-amber-400" /><span>{t('navProgress')}</span></button>
        </div>

        {!showHome && appMode === 'play' && isGameActive && gameSettings && <div className="header-context flex items-center space-x-2 text-xs">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-mono font-bold">{t('Round')} {currentRoundIndex + 1}/{gameSettings.roundCount}</span>
          <span className="environment-badge">{t(({ mixed: 'Mixed', urban: 'Urban', suburban: 'Suburban', rural: 'Rural' } as const)[gameSettings.environment ?? 'mixed'])}</span>
          <span className="hidden sm:inline-flex items-center gap-1 font-mono font-bold text-stone-200"><Trophy className="w-3.5 h-3.5 text-amber-400" />{currentTotalScore.toLocaleString()} {t('pts')}</span>
          {!gameSettings.canMove && <span className="hidden md:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">{!gameSettings.canPan && !gameSettings.canZoom ? 'NMPZ' : t('No Move')}</span>}
        </div>}

      <div className="header-actions flex items-center space-x-1.5 sm:space-x-2">
        {!showHome && appMode === 'play' && <>{isGameActive ? <><>{timeRemaining !== null && <div className={`flex items-center space-x-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${timeRemaining <= 10 ? 'bg-rose-950/80 border-rose-600 text-rose-400 animate-pulse' : 'bg-stone-950 border-stone-800 text-amber-300'}`}><Clock className="w-3.5 h-3.5" /><span>{formatTime(timeRemaining)}</span></div>}</><button onClick={() => navigate(onAbandonGame)} title={t('Abandon game')} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-950 text-stone-400 hover:text-rose-400 border border-stone-800 hover:border-rose-900 rounded-lg text-xs font-medium transition-colors cursor-pointer"><XCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t('Abandon')}</span></button></> : <><button onClick={() => navigate(onOpenHistory)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-950 text-stone-300 border border-stone-800 hover:border-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"><History className="w-3.5 h-3.5 text-amber-400" /><span className="hidden sm:inline">{t('Past Games')}</span><span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded-full">{pastGamesCount}</span></button><button onClick={() => navigate(onOpenNewGame)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#171000] font-bold rounded-lg text-xs sm:text-sm transition-all shadow-md cursor-pointer active:scale-98"><Play className="w-3.5 h-3.5 fill-stone-950 text-stone-950" /><span>{t('New Game')}</span></button></>}</>}
        {!showHome && appMode === 'review' && reviewAttempt && <><span className="review-live-context">{reviewStatsLength + 1} {t('of')} {Math.max(reviewInitialTotal, reviewStatsLength + reviewQueueLength)} · {reviewQueueLength} {t('remaining')} · {t('Progress saved')}</span><span className="review-source">{t('Source')}: {reviewSource}</span><button className="icon-button" onClick={() => navigate(onExitReview)} aria-label={t('Exit review')}><XCircle size={16} /></button></>}
        <button onClick={() => navigate(onOpenPreferences)} title={t('Preferences')} aria-label={t('Preferences')} className="utility-action p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"><Settings2 className="w-4 h-4" /><span>{t('Preferences')}</span></button>
        <button onClick={() => navigate(onToggleFullscreen)} title={isFullscreen ? t('Exit Fullscreen') : t('Enter Fullscreen')} aria-label={isFullscreen ? t('Exit Fullscreen') : t('Enter Fullscreen')} className="utility-action p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer">{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}<span>{isFullscreen ? t('Exit Fullscreen') : t('Enter Fullscreen')}</span></button>
      </div>
        </div>
      </div>
    </header>
    {studyActions && createPortal(studyActions, document.body)}
  </>;
}
