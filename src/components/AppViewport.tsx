import React from 'react';
import { AppMode, Collection, CompassStyle, GameRecord, GameRound, LocationResult, ReviewGrade, ReviewSessionKind, StreetViewState, TrainerLocation } from '../types';
import { StreetViewContainer } from './StreetViewContainer';
import { MainMenu } from './MainMenu';
import { TrainerHub, HubTab } from './TrainerHub';
import { LocationCard } from './LocationCard';
import { GuessMap } from './GuessMap';
import { Compass, Gamepad2, History, Play } from 'lucide-react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

interface AppViewportProps {
  appMode: AppMode; showHome: boolean; currentLocation: LocationResult | null; isLoading: boolean;
  statusMessage: string; errorMessage: string | null; mapsReady: boolean; activeCompass: boolean; compassStyle: CompassStyle;
  restoredStreetView?: StreetViewState;
  isRevealed: boolean;
  isGameActive: boolean; gameSettings: { roundCount: number } | null; activeRoundResult: GameRound | null;
  playElapsed: number; timeRemaining: number | null; isSubmittingGuess: boolean; reviewAttempt: { id: string } | null;
  reviewResult: GameRound | null; reviewElapsed: number; pastGames: GameRecord[];
  allCollections: Collection[]; trainerRefreshKey: number; trainerStartTab: HubTab; studyReviewSaving: boolean; studyReviewSaved: boolean;
  canMove: boolean; canPan: boolean; canZoom: boolean; coveragePreview?: TrainerLocation | null;
  onNextLocation: () => void; onMapsLoaded: () => void; onPanoramaChanged: (location: LocationResult) => void;
  onToggleCompass: () => void; onStudy: () => void; onPlay: () => void; onReview: () => void;
  onOpenNewGame: () => void; onOpenHistory: () => void;
  onOpenReview: (attempt: any, queue?: any[], source?: string, kind?: ReviewSessionKind) => void; onOpenCoverage: (location: TrainerLocation) => void;
  onTrainCountries: (codes: string[], name: string) => void; onDataChanged: () => void;
  onSelectGame: (game: GameRecord) => void;
  onHideReveal: () => void; onMetadata: (details: any) => void; onSaveForReview: () => void;
  onGuess: (guess: { lat: number; lng: number } | null) => void;
  onStreetViewChanged: (view: StreetViewState) => void;
}

export function AppViewport({
  appMode, showHome, currentLocation, isLoading, statusMessage, errorMessage, mapsReady, activeCompass, compassStyle, restoredStreetView,
  isRevealed, isGameActive, gameSettings, activeRoundResult,
  playElapsed, timeRemaining, isSubmittingGuess, reviewAttempt, reviewResult, reviewElapsed, pastGames,
  allCollections, trainerRefreshKey, trainerStartTab, studyReviewSaving, studyReviewSaved,
  canMove, canPan, canZoom, onNextLocation, onMapsLoaded, onPanoramaChanged, onToggleCompass,
  onStudy, onPlay, onReview, onOpenNewGame, onOpenHistory, onOpenReview, onOpenCoverage, onTrainCountries,
  onDataChanged, onSelectGame, onHideReveal, onMetadata, onSaveForReview, onGuess, onStreetViewChanged,
}: AppViewportProps) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  return <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-black">
    <StreetViewContainer currentLocation={currentLocation} isLoading={isLoading} onNextLocation={onNextLocation} statusMessage={statusMessage} errorMessage={errorMessage} onMapsLoaded={onMapsLoaded} canMove={canMove} canPan={canPan} canZoom={canZoom} showCompass={!showHome && activeCompass} compassStyle={compassStyle} restoredView={restoredStreetView} onViewChanged={onStreetViewChanged} onPanoramaChanged={!showHome && appMode === 'study' ? onPanoramaChanged : undefined} />
    {!showHome && currentLocation && appMode !== 'play' && <div className="map-training-toggles" aria-label={t('mapTrainingAids')}><button type="button" role="switch" aria-checked={activeCompass} onClick={onToggleCompass} title={`${t('compass')} ${activeCompass ? t('on') : t('off')}`} className={activeCompass ? 'enabled' : ''}><Compass size={15} /></button></div>}
    {showHome && <MainMenu refreshKey={trainerRefreshKey} onStudy={onStudy} onPlay={onPlay} onReview={onReview} />}
    {!showHome && appMode === 'review' && !reviewAttempt && <TrainerHub collections={allCollections} refreshKey={trainerRefreshKey} initialTab={trainerStartTab} onReview={(attempt, queue, source, kind) => onOpenReview(attempt, queue, source, kind)} onOpen={onOpenCoverage} onTrainCountries={onTrainCountries} onDataChanged={onDataChanged} onSelectGame={onSelectGame} />}
    {!showHome && appMode === 'study' && isRevealed && currentLocation && !isLoading && <LocationCard location={currentLocation} onHide={onHideReveal} onMetadata={onMetadata} onSaveForReview={onSaveForReview} reviewSaving={studyReviewSaving} reviewSaved={studyReviewSaved} />}
    {!showHome && appMode === 'play' && !isGameActive && <div id="play-lobby-overlay" className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 pointer-events-none"><div id="play-lobby-card" className="max-w-md w-full bg-stone-900/95 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center pointer-events-auto"><div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto"><Gamepad2 className="w-6 h-6" /></div><div className="space-y-1"><h2 className="text-lg font-bold text-white tracking-tight">{t('geoguessrGame')}</h2><p className="text-xs text-stone-400 max-w-xs mx-auto">{t('geoguessrDescription')}</p></div><div className="grid grid-cols-2 gap-2 text-left bg-stone-950/80 p-3 rounded-xl border border-stone-800/80 text-xs"><div><span className="text-stone-500 block text-[11px]">{t('gamesSaved')}</span><span className="font-mono font-bold text-stone-200">{pastGames.length} {t('games')}</span></div><div><span className="text-stone-500 block text-[11px]">{t('bestRecord')}</span><span className="font-mono font-bold text-amber-400">{pastGames.length > 0 ? `${Math.max(...pastGames.map((game) => game.totalScore)).toLocaleString()} ${t('pts')}` : t('noneYet')}</span></div></div><div className="space-y-2 pt-1"><button onClick={onOpenNewGame} className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-[#171000] font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98"><Play className="w-4 h-4 fill-stone-950" /><span>{t('startNewGame')}</span></button>{pastGames.length > 0 && <button onClick={onOpenHistory} className="w-full py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs border border-stone-700/60"><History className="w-3.5 h-3.5 text-amber-400" /><span>{t('reviewPastGames')}</span></button>}</div></div></div>}
    {!showHome && appMode === 'play' && isGameActive && currentLocation && !activeRoundResult && <GuessMap onGuess={onGuess} isSubmitting={isSubmittingGuess} timeRemaining={timeRemaining} elapsedTimeSeconds={playElapsed} />}
    {!showHome && appMode === 'review' && reviewAttempt && currentLocation && !reviewResult && <GuessMap onGuess={onGuess} isSubmitting={isSubmittingGuess} timeRemaining={null} elapsedTimeSeconds={reviewElapsed} />}
  </main>;
}
