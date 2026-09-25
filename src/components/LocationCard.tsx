/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LocationResult } from "../types";
import { COUNTRIES } from "../data/countries";
import { reverseGeocodeLocation, getFlagCdnUrl, ReverseGeocodeResult } from "../services/geocoding";
import { MapPin, ExternalLink, Maximize2, Minimize2, Minus, Compass, Building } from "lucide-react";
import { ResultMap } from "./ResultMap";
import { translate } from "../services/language";
import { useLanguagePreferences } from "../services/useLanguagePreferences";
import { useDraggablePanel } from "../hooks/useDraggablePanel";

interface LocationCardProps {
  location: LocationResult;
  hidden?: boolean;
  onHide: () => void;
  onMetadata?: (details: { panoId: string; country?: string; countryCode?: string; exactAddress?: string; locality?: string; adminArea?: string }) => void;
  onSaveForReview?: () => void;
  reviewSaving?: boolean;
  reviewSaved?: boolean;
  onMapSelect?: (point: { lat: number; lng: number }) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, hidden = false, onHide, onMetadata, onSaveForReview, reviewSaving = false, reviewSaved = false, onMapSelect }) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [geocodeData, setGeocodeData] = useState<ReverseGeocodeResult | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(true);
  const [flagError, setFlagError] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { panelRef, dragHandleProps, dragStyle, dragging } = useDraggablePanel<HTMLDivElement>();
  useEffect(() => { if (hidden) setIsExpanded(false); }, [hidden]);

  const resolvedCountryCode = geocodeData?.countryCode || location.countryCode;
  const country = COUNTRIES[resolvedCountryCode];
  const countryName = geocodeData?.countryName || country?.name || location.countryCode;

  const latStr = `${Math.abs(location.lat).toFixed(4)}° ${location.lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(location.lng).toFixed(4)}° ${location.lng >= 0 ? "E" : "W"}`;
  const mapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&pano=${location.panoId}`;

  // Reverse geocode the exact coordinates when card is revealed
  useEffect(() => {
    let isCurrent = true;
    setIsGeocoding(true);
    setFlagError(false);
    setGeocodeData(null);

    reverseGeocodeLocation(location.lat, location.lng)
      .then((res) => {
        if (isCurrent) {
          setGeocodeData(res);
          if (res)
            onMetadata?.({
              panoId: location.panoId,
              country: res.countryName,
              countryCode: res.countryCode,
              exactAddress: res.formattedAddress,
              locality: res.locality,
              adminArea: res.adminArea,
            });
          setIsGeocoding(false);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsGeocoding(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [location.panoId, location.lat, location.lng, onMetadata]);

  // Flag CDN URLs
  const flag1x = getFlagCdnUrl(resolvedCountryCode, 40);
  const flag2x = getFlagCdnUrl(resolvedCountryCode, 80);

  // Derive human-friendly exact location headline
  const primaryArea = [geocodeData?.locality, geocodeData?.adminArea].filter(Boolean).join(", ");

  return (
    <div ref={panelRef} style={isExpanded ? undefined : dragStyle} hidden={hidden} id="revealed-location-card" className={`absolute bottom-6 left-6 z-20 max-w-md w-[calc(100vw-3rem)] sm:w-96 bg-stone-900/95 border border-stone-700/80 rounded-2xl shadow-2xl p-4 backdrop-blur-md text-stone-100 animate-in fade-in slide-in-from-bottom-3 duration-200 select-text${isExpanded ? ' expanded' : ''}`}>
      {/* Header: Country + Flag CDN + Close */}
      <div {...dragHandleProps} className={`location-card-drag-handle flex items-start justify-between gap-3 mb-3${dragging ? ' dragging' : ''}`}>
        <div className="flex items-center space-x-2.5">
          {/* Flag CDN badge */}
          {!flagError && flag1x ? (
            <img src={flag1x} srcSet={`${flag1x} 1x, ${flag2x} 2x`} alt={`${countryName} ${t('flag')}`} width="32" height="24" onError={() => setFlagError(true)} className="w-8 h-5.5 rounded-sm object-cover shadow-xs border border-stone-600/70 flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-5.5 rounded-sm bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 text-xs font-bold">{resolvedCountryCode}</div>
          )}

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 title={countryName} className="text-base font-bold text-white tracking-tight leading-none">{countryName}</h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <a href={mapsUrl} target="_blank" rel="noreferrer" aria-label={t('Open in Google Maps')} className="inline-flex items-center gap-1 p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors" title={t('Open in Google Maps')}><ExternalLink className="w-4 h-4" /></a>
          <button onClick={() => { setIsExpanded(false); onHide(); }} aria-label={t('Hide location spoilers (R)')} title={t('Hide location spoilers (R)')} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer flex-shrink-0"><Minus className="w-4 h-4" /></button>
          <button onClick={() => setIsExpanded((value) => !value)} aria-expanded={isExpanded} aria-label={t(isExpanded ? 'Restore location card' : 'Maximize location card')} title={t(isExpanded ? 'Restore location card' : 'Maximize location card')} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer flex-shrink-0">{isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
        </div>
      </div>

      {/* Exact Location & Address Details */}
      <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3 mb-3 space-y-2 text-xs">
        {isGeocoding ? (
          <div className="flex items-center space-x-2 text-stone-400 py-1">
            <Compass className="w-4 h-4 animate-spin text-amber-400" />
            <span className="text-xs">{t('resolvingLocation')}</span>
          </div>
        ) : (
          <>
            {primaryArea && (
              <div className="flex items-start space-x-2 text-stone-200">
                <Building className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="font-semibold text-stone-100">{primaryArea}</span>
              </div>
            )}

            {geocodeData?.route && (
              <div className="flex items-center space-x-2 text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <span className="font-medium text-stone-300">{geocodeData.route}</span>
              </div>
            )}

            {geocodeData?.formattedAddress && <div className="text-[11px] text-stone-400 leading-relaxed pt-0.5 border-t border-stone-900">{geocodeData.formattedAddress}</div>}

            {!geocodeData && <div className="text-stone-400 italic">{t('addressUnavailable')}</div>}
          </>
        )}

        {/* Formatted Coordinates */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pt-1">
          <span>
            {latStr}, {lngStr}
          </span>
          <span className="text-[10px] text-stone-500">Pano: {location.panoId.slice(0, 10)}...</span>
        </div>
      </div>

      <ResultMap actual={{ lat: location.lat, lng: location.lng }} guess={null} className={`study-result-map${onMapSelect ? ' selectable' : ''}`} fullscreenControl active={!hidden} resizeKey={isExpanded} onSelect={onMapSelect} />

      {onSaveForReview && !reviewSaved && (
        <div className="study-review-save">
          <button disabled={reviewSaving || reviewSaved} onClick={onSaveForReview}>
            {reviewSaved ? t('savedForReview') : reviewSaving ? t('saving') : t('saveForReview')}
          </button>
        </div>
      )}

    </div>
  );
};
