import { AlertTriangle } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import { formatDistance, formatTime } from '../services/gameLogic';
import type { Attempt, GameRound } from '../types';
import { ResultMap } from './ResultMap';

export function ReviewResultPanel({ round, sourceAttempt, history, position, total, sourceLabel, advancing, onNext }: {
  round: GameRound;
  sourceAttempt: Attempt;
  history: Attempt[];
  position: number;
  total: number;
  sourceLabel: string;
  advancing: boolean;
  onNext: () => void;
}) {
  const improvement = round.score - sourceAttempt.score;
  const previousGuess = sourceAttempt.guessedLat === null || sourceAttempt.guessedLng === null ? null : { lat: sourceAttempt.guessedLat, lng: sourceAttempt.guessedLng };
  const country = COUNTRIES[sourceAttempt.countryCode]?.name || sourceAttempt.countryCode;

  return (
    <div className="review-result-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-result-title">
      <section className="review-result-panel">
        <header className="review-result-header">
          <div>
            <span className="review-context">{position} / {total} · {sourceLabel}</span>
            <h2 id="review-result-title">{country}</h2>
            <p className="review-coordinates">{round.location.lat.toFixed(5)}°, {round.location.lng.toFixed(5)}°</p>
          </div>
          <div className="review-comparison" aria-label="Previous and current scores">
            <span>Previous<strong>{sourceAttempt.score.toLocaleString()} pts · {sourceAttempt.distanceKm === null ? 'No guess' : formatDistance(sourceAttempt.distanceKm)}</strong></span>
            <span>Today<strong>{round.score.toLocaleString()} pts · {round.distanceKm === null ? 'Revealed' : formatDistance(round.distanceKm)} · {formatTime(round.timeSpentSeconds)}</strong></span>
            <b className={improvement >= 0 ? 'improved' : 'worse'}>{improvement >= 0 ? '+' : ''}{improvement.toLocaleString()} pts</b>
          </div>
        </header>

        {round.location.isFallback && <p className="review-fallback"><AlertTriangle size={14} /> Original panorama unavailable. The review used nearby coverage.</p>}
        <ResultMap actual={{ lat: sourceAttempt.actualLat, lng: sourceAttempt.actualLng }} guess={round.guess} previousGuess={previousGuess} className="review-result-map" />

        <div className="review-next-action">
          <span>Scheduling is calculated from today’s pinpoint score.</span>
          <button disabled={advancing} onClick={onNext}>{advancing ? 'Saving…' : 'Next Review'}</button>
        </div>

        <details className="review-history" data-no-shortcuts>
          <summary>Previous Attempts ({history.length})</summary>
          <div>{history.map((attempt) => <p key={attempt.id}><time>{new Date(attempt.createdAt).toLocaleDateString()}</time><span>{attempt.guessedCountryCode ? COUNTRIES[attempt.guessedCountryCode]?.name || attempt.guessedCountryCode : 'No country'}</span><strong>{attempt.score.toLocaleString()} pts</strong></p>)}</div>
        </details>
      </section>
    </div>
  );
}
