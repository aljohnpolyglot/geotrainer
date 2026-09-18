import { AlertTriangle, Building, Compass, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { COUNTRIES } from '../data/countries';
import { formatDistance, formatTime } from '../services/gameLogic';
import type { Attempt, GameRound } from '../types';
import { ResultMap } from './ResultMap';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';
import { reverseGeocodeLocation, type ReverseGeocodeResult } from '../services/geocoding';

export const reviewLocationDetails = (value: ReverseGeocodeResult | null, unavailable: string) => ({
  primaryArea: [value?.locality, value?.adminArea].filter(Boolean).join(', '),
  route: value?.route || '',
  address: value?.formattedAddress || (value ? '' : unavailable),
});

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
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const improvement = round.score - sourceAttempt.score;
  const previousGuess = sourceAttempt.guessedLat === null || sourceAttempt.guessedLng === null ? null : { lat: sourceAttempt.guessedLat, lng: sourceAttempt.guessedLng };
  const country = COUNTRIES[sourceAttempt.countryCode]?.name || sourceAttempt.countryCode;
  const [geocodeData, setGeocodeData] = useState<ReverseGeocodeResult | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(true);
  useEffect(() => {
    let active = true;
    setGeocodeData(null); setIsGeocoding(true);
    reverseGeocodeLocation(sourceAttempt.actualLat, sourceAttempt.actualLng)
      .then((result) => { if (active) { setGeocodeData(result); setIsGeocoding(false); } })
      .catch(() => { if (active) setIsGeocoding(false); });
    return () => { active = false; };
  }, [sourceAttempt.actualLat, sourceAttempt.actualLng]);
  const locationDetails = reviewLocationDetails(geocodeData, t('addressUnavailable'));

  return (
    <div className="review-result-backdrop" role="dialog" aria-labelledby="review-result-title">
      <section className="review-result-panel">
        <header className="review-result-header">
          <div>
            <span className="review-context">{position} / {total} · {sourceLabel}</span>
            <h2 id="review-result-title"><CountryFlag code={sourceAttempt.countryCode} />{country}</h2>
            <div className="review-location-details" aria-live="polite">
              {isGeocoding ? <span><Compass className="spin" size={13} />{t('resolvingLocation')}</span> : <>
                {locationDetails.primaryArea && <strong><Building size={13} />{locationDetails.primaryArea}</strong>}
                {locationDetails.route && <span><MapPin size={13} />{locationDetails.route}</span>}
                {locationDetails.address && <small>{locationDetails.address}</small>}
              </>}
            </div>
            <p className="review-coordinates">{sourceAttempt.actualLat.toFixed(5)}°, {sourceAttempt.actualLng.toFixed(5)}°</p>
          </div>
          <div className="review-comparison" aria-label={t('previousCurrentScores')}>
            <span>{t('previous')}<strong>{sourceAttempt.score.toLocaleString()} {t('pts')} · {sourceAttempt.distanceKm === null ? t('noGuess') : formatDistance(sourceAttempt.distanceKm)}</strong></span>
            <span>{t('today')}<strong>{round.score.toLocaleString()} {t('pts')} · {round.distanceKm === null ? t('revealed') : formatDistance(round.distanceKm)} · {formatTime(round.timeSpentSeconds)}</strong></span>
            <b className={improvement >= 0 ? 'improved' : 'worse'}>{improvement >= 0 ? '+' : ''}{improvement.toLocaleString()} {t('pts')}</b>
          </div>
        </header>

        {round.location.isFallback && <p className="review-fallback"><AlertTriangle size={14} /> {t('fallbackReview')}</p>}
        <ResultMap actual={{ lat: sourceAttempt.actualLat, lng: sourceAttempt.actualLng }} guess={round.guess} previousGuess={previousGuess} className="review-result-map" />

        <div className="review-next-action">
          <span>{t('schedulingFromScore')}</span>
          <button disabled={advancing} onClick={onNext}>{advancing ? t('saving') : t('nextReview')}</button>
        </div>

        <details className="review-history" data-no-shortcuts>
          <summary>{t('previousAttempts')} ({history.length})</summary>
          <div>{history.map((attempt) => <p key={attempt.id}><time>{new Date(attempt.createdAt).toLocaleDateString()}</time><span>{attempt.guessedCountryCode ? <><CountryFlag code={attempt.guessedCountryCode} />{COUNTRIES[attempt.guessedCountryCode]?.name || attempt.guessedCountryCode}</> : t('noCountry')}</span><strong>{attempt.score.toLocaleString()} {t('pts')}</strong></p>)}</div>
        </details>
      </section>
    </div>
  );
}
