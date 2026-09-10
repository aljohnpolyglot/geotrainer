/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LocationResult } from "../types";
import { COUNTRIES } from "../data/countries";
import { reverseGeocodeLocation, getFlagCdnUrl, ReverseGeocodeResult } from "../services/geocoding";
import { MapPin, ExternalLink, Copy, Check, EyeOff, Bookmark, BookmarkCheck, Compass, Building } from "lucide-react";
import { ResultMap } from "./ResultMap";

interface LocationCardProps {
  location: LocationResult;
  isBookmarked: boolean;
  onToggleBookmark: (details?: { exactAddress?: string; locality?: string; adminArea?: string }) => void;
  onHide: () => void;
  onMetadata?: (details: { panoId: string; country?: string; countryCode?: string; exactAddress?: string; locality?: string; adminArea?: string }) => void;
  onSaveForReview?: () => void;
  reviewSaving?: boolean;
  reviewSaved?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, isBookmarked, onToggleBookmark, onHide, onMetadata, onSaveForReview, reviewSaving = false, reviewSaved = false }) => {
  const [copied, setCopied] = useState(false);
  const [geocodeData, setGeocodeData] = useState<ReverseGeocodeResult | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(true);
  const [flagError, setFlagError] = useState<boolean>(false);

  const resolvedCountryCode = geocodeData?.countryCode || location.countryCode;
  const country = COUNTRIES[resolvedCountryCode];
  const countryName = geocodeData?.countryName || country?.name || location.countryCode;

  const latStr = `${Math.abs(location.lat).toFixed(4)}° ${location.lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(location.lng).toFixed(4)}° ${location.lng >= 0 ? "E" : "W"}`;
  const coordsFormatted = `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
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

  const copyCoordinates = () => {
    navigator.clipboard.writeText(coordsFormatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmarkClick = () => {
    onToggleBookmark({
      exactAddress: geocodeData?.formattedAddress,
      locality: geocodeData?.locality,
      adminArea: geocodeData?.adminArea,
    });
  };

  // Flag CDN URLs
  const flag1x = getFlagCdnUrl(resolvedCountryCode, 40);
  const flag2x = getFlagCdnUrl(resolvedCountryCode, 80);

  // Derive human-friendly exact location headline
  const primaryArea = [geocodeData?.locality, geocodeData?.adminArea].filter(Boolean).join(", ");

  return (
    <div id="revealed-location-card" className="absolute bottom-6 left-6 z-20 max-w-md w-[calc(100vw-3rem)] sm:w-96 bg-stone-900/95 border border-stone-700/80 rounded-2xl shadow-2xl p-4 backdrop-blur-md text-stone-100 animate-in fade-in slide-in-from-bottom-3 duration-200 select-text">
      {/* Header: Country + Flag CDN + Close */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2.5">
          {/* Flag CDN badge */}
          {!flagError && flag1x ? (
            <img src={flag1x} srcSet={`${flag1x} 1x, ${flag2x} 2x`} alt={`${countryName} flag`} width="32" height="24" onError={() => setFlagError(true)} className="w-8 h-5.5 rounded-sm object-cover shadow-xs border border-stone-600/70 flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-5.5 rounded-sm bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 text-xs font-bold">{resolvedCountryCode}</div>
          )}

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-base font-bold text-white tracking-tight leading-none">{countryName}</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">{resolvedCountryCode}</span>
            </div>
          </div>
        </div>

        <button onClick={onHide} title="Hide location spoilers (R)" className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer flex-shrink-0">
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Exact Location & Address Details */}
      <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3 mb-3 space-y-2 text-xs">
        {isGeocoding ? (
          <div className="flex items-center space-x-2 text-stone-400 py-1">
            <Compass className="w-4 h-4 animate-spin text-amber-400" />
            <span className="text-xs">Resolving exact location...</span>
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

            {!geocodeData && <div className="text-stone-400 italic">Exact address details not available for this rural road point.</div>}
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

      <ResultMap actual={{ lat: location.lat, lng: location.lng }} guess={null} className="study-result-map" />

      {onSaveForReview && (
        <div className="study-review-save">
          <button disabled={reviewSaving || reviewSaved} onClick={onSaveForReview}>
            {reviewSaved ? "Saved for Review ✓" : reviewSaving ? "Saving…" : "Save this location for Review"}
          </button>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={copyCoordinates} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs rounded-lg transition-colors cursor-pointer border border-stone-700/60" title="Copy exact coordinates">
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span>Copy coords</span>
            </>
          )}
        </button>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleBookmarkClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
              isBookmarked ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30" : "bg-stone-800 hover:bg-stone-750 text-stone-200 border-stone-700/60"
            }`}
            title="Bookmark this panorama"
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                <span>Bookmark</span>
              </>
            )}
          </button>

          <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors" title="Open in Google Maps">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
