import React from 'react';
import { AppMode, Attempt, CoachAnalysis, CompassStyle, GameRecord, GameRound, LanguagePreferences, LearnSource, LocationResult, MetaLesson, ReviewGrade, TrainerLocation } from '../types';
import { COUNTRIES } from '../data/countries';
import { AiCoach } from './AiCoach';
import { ReviewResultPanel } from './ReviewResultPanel';
import { CoverageStudyModal } from './CoverageStudyModal';
import { LanguageSettings } from './LanguageSettings';
import { RoundResultModal } from './RoundResultModal';
import { GameSummaryModal } from './GameSummaryModal';
import { NewGameModal } from './NewGameModal';
import { GameHistoryModal } from './GameHistoryModal';
import { CustomCollectionModal } from './CustomCollectionModal';
import { Compass, XCircle } from 'lucide-react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { ReviewCompleteOverlay } from './ReviewCompleteOverlay';
import { StudySetupModal, type StudySetup } from './StudySetupModal';
import { LearningAids } from './LearningAids';
import { StreetViewExplorer } from './StreetViewExplorer';
import { localizeMetaLesson, metaReviewAid } from '../data/metaLessons';

interface AppOverlaysProps {
  appMode: AppMode; showHome: boolean; currentLocation: LocationResult | null; isRevealed: boolean;
  reviewResult: GameRound | null; reviewAttempt: Attempt | null; reviewAttemptRecord: Attempt | null;
  reviewHistory: Attempt[]; reviewStats: Array<{ previous: number; current: number; grade: ReviewGrade }>;
  reviewInitialTotal: number; reviewQueueLength: number; reviewSource: string; reviewComplete: boolean;
  activeRoundResult: GameRound | null; gameSettings: any; currentRoundIndex: number; gameRounds: GameRound[];
  summaryGameRecord: GameRecord | null; isNewGameModalOpen: boolean; isHistoryModalOpen: boolean; isStudySetupOpen: boolean; studySetup: StudySetup;
  isModalOpen: boolean; editingCollection: any;
  pastGames: GameRecord[]; allCollections: any[]; coveragePreview: TrainerLocation | null;
  compassPreference: boolean; activeCompass: boolean; preferencesOpen: boolean; trainerRefreshKey: number;
  reviewGrading: boolean;
  learnSource: LearnSource; activeMetaLesson?: MetaLesson; mapPickerOpen: boolean; metaAdviceOpen: boolean; mapsReady: boolean;
  onSaveCoach: (note: any) => Promise<void> | void; onSaveClue: (clue: any) => Promise<string | void> | string | void; onClueAnalyzed: () => void;
  onNextReview: () => void; onCloseCoverage: () => void; onClosePreferences: () => void; onLanguageChange: (value: LanguagePreferences, compassStyle: CompassStyle, darkMode: boolean) => void;
  onCloseReviewComplete: () => void; onPracticeMistakes?: () => void; onPlayAgain: () => void;
  onNextRound: () => void;
  onViewHistory: () => void; onCloseSummary: () => void; onGoToLocation: (location: LocationResult) => void; onCloseHistory: () => void;
  onStartGame: (settings: any) => void; onCloseNewGame: () => void; onOpenHistory: () => void; onStartStudy: (settings: StudySetup) => void; onCloseStudySetup: () => void;
  onSelectGame: (game: GameRecord) => void; onDeleteGame: (id: string) => void; onClearGames: () => void;
  onSaveCollection: (collection: any) => void; onDeleteCollection: (id: string) => void; onCloseCollection: () => void;
  onOpenMapLocation: (location: Omit<LocationResult, 'countryCode'>) => void; onCloseMapPicker: () => void; onDismissMetaAdvice: (forever: boolean) => void;
  onNoteSaved: () => Promise<void> | void;
  onToggleCompass: () => void;
}

export function AppOverlays(props: AppOverlaysProps) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const { appMode, showHome, currentLocation, isRevealed, reviewResult, reviewAttempt, reviewAttemptRecord, reviewHistory,
    reviewStats, reviewInitialTotal, reviewQueueLength, reviewSource, reviewComplete, activeRoundResult, gameSettings,
    currentRoundIndex, gameRounds, summaryGameRecord, isNewGameModalOpen, isHistoryModalOpen, isStudySetupOpen, studySetup, isModalOpen,
    editingCollection, pastGames, allCollections, coveragePreview, compassPreference, activeCompass,
    preferencesOpen, trainerRefreshKey, reviewGrading, learnSource, activeMetaLesson, mapPickerOpen, metaAdviceOpen, mapsReady } = props;
  const reviewMeta = metaReviewAid(reviewAttempt?.metaLessonId, !!reviewResult, ui);
  const studyMeta = activeMetaLesson ? localizeMetaLesson(activeMetaLesson, ui) : undefined;
  return <>
    {!showHome && currentLocation && <div className={`panorama-tools${appMode === 'review' && reviewResult ? ' review-result-tools' : ''}`} aria-label={t('Learning aids')}>
    {appMode !== 'play' && <button className={`map-training-toggle${activeCompass ? ' enabled' : ''}`} type="button" role="switch" aria-checked={activeCompass} onClick={props.onToggleCompass} title={`${t('compass')} ${activeCompass ? t('on') : t('off')}`}><Compass size={17} /></button>}
    {(appMode !== 'play' || gameSettings?.aiCoachEnabled !== false) && <AiCoach panoId={currentLocation.panoId} appMode={appMode} revealed={appMode === 'study' ? isRevealed : !!reviewResult} context={(appMode === 'study' ? isRevealed : reviewResult) ? { actualCountry: COUNTRIES[currentLocation.countryCode]?.name || currentLocation.countryCode, guessedCountry: reviewAttemptRecord?.guessedCountryCode ? COUNTRIES[reviewAttemptRecord.guessedCountryCode]?.name || reviewAttemptRecord.guessedCountryCode : undefined, score: reviewResult?.score, distanceKm: reviewResult?.distanceKm, previousAttempts: appMode === 'review' ? reviewHistory.slice(0, 5).map((item) => ({ guessedCountry: item.guessedCountryCode, score: item.score })) : undefined } : undefined} onSave={props.onSaveCoach} onSaveClue={(clue) => props.onSaveClue({ ...clue, origin: 'coach' })} onClueAnalyzed={props.onClueAnalyzed} />}
    <LearningAids lesson={appMode === 'study' && learnSource === 'meta' ? studyMeta : reviewMeta}
      panoId={reviewAttempt?.panoId || currentLocation.panoId} lat={currentLocation.lat} lng={currentLocation.lng} countryCode={currentLocation.countryCode} adviceOpen={appMode === 'study' && learnSource === 'meta' && metaAdviceOpen} refreshKey={trainerRefreshKey} onAdviceClose={props.onDismissMetaAdvice} onSaveClue={props.onSaveClue} onNoteSaved={props.onNoteSaved} />
    </div>}
    <StreetViewExplorer open={mapPickerOpen} mapsReady={mapsReady} onClose={props.onCloseMapPicker} onSelect={props.onOpenMapLocation} />
    {reviewResult && reviewAttempt && <ReviewResultPanel round={reviewResult} sourceAttempt={reviewAttempt} history={reviewHistory} position={reviewStats.length + 1} total={Math.max(reviewInitialTotal, reviewStats.length + reviewQueueLength)} sourceLabel={reviewSource} advancing={reviewGrading} onNext={props.onNextReview} />}
    {coveragePreview && <CoverageStudyModal location={coveragePreview} onClose={props.onCloseCoverage} />}
    <LanguageSettings open={preferencesOpen} onClose={props.onClosePreferences} onChange={props.onLanguageChange} />
    {reviewComplete && <ReviewCompleteOverlay stats={reviewStats} onClose={props.onCloseReviewComplete} />}
    {activeRoundResult && gameSettings && <RoundResultModal round={activeRoundResult} totalRounds={gameSettings.roundCount} onNextRound={props.onNextRound} isLastRound={currentRoundIndex + 1 >= gameSettings.roundCount} rounds={gameRounds} />}
    {summaryGameRecord && <GameSummaryModal game={summaryGameRecord} onPracticeMistakes={props.onPracticeMistakes} onPlayAgain={props.onPlayAgain} onViewHistory={props.onViewHistory} onClose={props.onCloseSummary} onGoToLocation={props.onGoToLocation} />}
    <NewGameModal isOpen={isNewGameModalOpen} onClose={props.onCloseNewGame} collections={allCollections} onStartGame={props.onStartGame} onOpenHistory={props.onOpenHistory} pastGamesCount={pastGames.length} defaultShowCompass={compassPreference} />
    <StudySetupModal open={isStudySetupOpen} onClose={props.onCloseStudySetup} collections={allCollections} initial={studySetup} onStart={props.onStartStudy} />
    <GameHistoryModal isOpen={isHistoryModalOpen} onClose={props.onCloseHistory} games={pastGames} onSelectGame={props.onSelectGame} onDeleteGame={props.onDeleteGame} onClearAll={props.onClearGames} />
    <CustomCollectionModal isOpen={isModalOpen} onClose={props.onCloseCollection} onSave={props.onSaveCollection} onDelete={props.onDeleteCollection} initialCollection={editingCollection} />
  </>;
}
