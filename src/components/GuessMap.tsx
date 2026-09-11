/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, MapPin, Check, RotateCcw, Clock } from 'lucide-react';
import { formatTime } from '../services/gameLogic';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { useDraggablePanel } from '../hooks/useDraggablePanel';

interface GuessMapProps {
  onGuess: (guess: { lat: number; lng: number } | null) => void;
  isSubmitting: boolean;
  timeRemaining: number | null; // null if unlimited
  elapsedTimeSeconds?: number;
}

export const GuessMap: React.FC<GuessMapProps> = ({
  onGuess,
  isSubmitting,
  timeRemaining,
  elapsedTimeSeconds,
}) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { panelRef, dragHandleProps, dragStyle, dragging } = useDraggablePanel<HTMLDivElement>();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentGuess, setCurrentGuess] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    if (typeof google === 'undefined' || !google.maps || !google.maps.Map) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 1.5,
      minZoom: 1,
      maxZoom: 18,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          stylers: [{ visibility: 'off' }],
        },
      ],
      // Solution attribution per skill guidelines
      internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
    } as google.maps.MapOptions);

    // Click handler to drop or move the guess pin
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setCurrentGuess(coords);

      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position: coords,
          map,
          animation: google.maps.Animation.DROP,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        markerRef.current.addListener('dragend', (dragEvent: google.maps.MapMouseEvent) => {
          if (dragEvent.latLng) {
            setCurrentGuess({
              lat: dragEvent.latLng.lat(),
              lng: dragEvent.latLng.lng(),
            });
          }
        });
      } else {
        markerRef.current.setPosition(coords);
      }
    });

    mapInstanceRef.current = map;
    return () => {
      if (markerRef.current) {
        google.maps.event.clearInstanceListeners(markerRef.current);
        markerRef.current.setMap(null);
      }
      google.maps.event.clearInstanceListeners(map);
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  // Resize listener when expanding/collapsing map
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          google.maps.event.trigger(mapInstanceRef.current, 'resize');
          if (currentGuess) {
            mapInstanceRef.current.panTo(currentGuess);
          }
        }
      }, 200);
    }
  }, [isExpanded, currentGuess]);

  // Handle manual submit
  const handleSubmit = () => {
    if (isSubmitting || !currentGuess) return;
    onGuess(currentGuess);
  };

  // Reset pin
  const handleResetPin = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    setCurrentGuess(null);
  };

  const isUrgent = timeRemaining !== null && timeRemaining <= 10;
  const displayedTime = timeRemaining ?? elapsedTimeSeconds;

  useEffect(() => {
    const submitWithEnter = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== 'Enter' || event.repeat || !currentGuess || isSubmitting || target?.closest('input, select, textarea, [contenteditable="true"], [role="dialog"]')) return;
      event.preventDefault();
      onGuess(currentGuess);
    };
    window.addEventListener('keydown', submitWithEnter);
    return () => window.removeEventListener('keydown', submitWithEnter);
  }, [currentGuess, isSubmitting, onGuess]);

  return (<>
    {displayedTime !== undefined && (
      <div className={`round-timer guess-timer ${isUrgent ? 'urgent' : ''}`} role="timer" aria-live={isUrgent ? 'polite' : 'off'}>
        <Clock className="w-4 h-4" />
        <span>{formatTime(displayedTime)}</span>
      </div>
    )}
    <div
      ref={panelRef}
      id="guess-map-widget"
      style={dragStyle}
      className={`absolute bottom-5 right-5 z-20 ${dragging ? '' : 'transition-[width,height] duration-300 ease-out'} flex flex-col bg-stone-900/95 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md ${
        isExpanded
          ? 'w-[92vw] max-w-2xl h-[65vh] max-h-[560px]'
          : 'w-72 sm:w-88 h-56 sm:h-64 opacity-90 hover:opacity-100'
      }`}
    >
      {/* Top Header bar of Guess Map */}
      <div {...dragHandleProps} className={`flex items-center justify-between px-3.5 py-2 bg-stone-950/80 border-b border-stone-800 text-stone-200 touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="text-xs font-semibold tracking-tight">{t('pinpointLocation')}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Reset pin button */}
          {currentGuess && (
            <button
              onClick={handleResetPin}
              title={t('clearPin')}
              className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
          title={isExpanded ? t('Minimize map') : t('Enlarge map for precision')}
            className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full relative cursor-crosshair" />

      {/* Bottom Submit Action Bar */}
      <div className="p-2.5 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 text-[11px] text-stone-400 truncate pl-1">
          {currentGuess
            ? `${currentGuess.lat.toFixed(3)}°, ${currentGuess.lng.toFixed(3)}°`
            : t('clickToPlaceGuess')}
        </span>

        <button
          onClick={handleSubmit}
          disabled={!currentGuess || isSubmitting}
          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${
            currentGuess && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>{currentGuess ? t('confirmGuess') : t('placePin')}</span>
        </button>
      </div>
    </div>
  </>
  );
};
