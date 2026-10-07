import { acquireMap } from '../services/mapResources';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Maximize2, Minimize2, MapPin, Check, RotateCcw, Clock } from 'lucide-react';
import { formatTime } from '../services/gameLogic';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { movePanelRect, resizePanelRect, useDraggablePanel, type PanelRect, type PanelResizeDirection } from '../hooks/useDraggablePanel';
import { playUiSound } from '../services/audio';
import { mapPresentationOptions, useMapPreferences } from '../services/mapPreferences';

interface GuessMapProps {
  onGuess: (guess: { lat: number; lng: number } | null) => void;
  isSubmitting: boolean;
  mapsReady: boolean;
  timeRemaining: number | null; // null if unlimited
  elapsedTimeSeconds?: number;
}

const visibleBounds = () => {
  const viewport = window.visualViewport;
  const left = viewport?.offsetLeft || 0; const top = viewport?.offsetTop || 0;
  return { left, top, right: left + (viewport?.width || window.innerWidth), bottom: top + (viewport?.height || window.innerHeight) };
};

export const GuessMap: React.FC<GuessMapProps> = ({
  onGuess,
  isSubmitting,
  mapsReady,
  timeRemaining,
  elapsedTimeSeconds,
}) => {
  const { ui } = useLanguagePreferences();
  const mapPreferences = useMapPreferences();
  const t = (key: string) => translate(ui, key);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { panelRef, dragHandleProps, dragStyle, dragging } = useDraggablePanel<HTMLDivElement>();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedRect, setExpandedRect] = useState<PanelRect>();
  const interaction = useRef<{ pointerId: number; startX: number; startY: number; rect: PanelRect; direction: 'move' | PanelResizeDirection }>();
  const [currentGuess, setCurrentGuess] = useState<{ lat: number; lng: number } | null>(null);

  const toggleExpanded = () => {
    if (isExpanded) { setIsExpanded(false); setExpandedRect(undefined); return; }
    const bounds = visibleBounds();
    setExpandedRect({ left: bounds.left, top: bounds.top, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top });
    setIsExpanded(true);
  };
  const startInteraction = (event: ReactPointerEvent<HTMLElement>, direction: 'move' | PanelResizeDirection) => {
    if (!isExpanded || event.button !== 0 || direction === 'move' && (event.target as HTMLElement).closest('button')) return;
    const bounds = panelRef.current?.getBoundingClientRect(); if (!bounds) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    interaction.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, rect: { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }, direction };
  };
  const moveInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const active = interaction.current; if (!active || active.pointerId !== event.pointerId) return;
    const delta = { x: event.clientX - active.startX, y: event.clientY - active.startY };
    const limits = visibleBounds();
    setExpandedRect(active.direction === 'move' ? movePanelRect(active.rect, delta, limits) : resizePanelRect(active.rect, delta, active.direction, limits, { width: Math.min(320, limits.right - limits.left), height: Math.min(240, limits.bottom - limits.top) }));
  };
  const finishInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if (interaction.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId); interaction.current = undefined;
  };
  const expandedDragProps = { onPointerDown: (event: ReactPointerEvent<HTMLElement>) => startInteraction(event, 'move'), onPointerMove: moveInteraction, onPointerUp: finishInteraction, onPointerCancel: finishInteraction };
  const resizeProps = (direction: PanelResizeDirection) => ({ onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => startInteraction(event, direction), onPointerMove: moveInteraction, onPointerUp: finishInteraction, onPointerCancel: finishInteraction });
  const expandedStyle: CSSProperties | undefined = expandedRect ? { left: expandedRect.left, top: expandedRect.top, right: 'auto', bottom: 'auto', width: expandedRect.width, height: expandedRect.height } : undefined;
  useEffect(() => {
    if (!isExpanded) return;
    const fit = () => setExpandedRect((rect) => {
      if (!rect) return rect;
      const bounds = visibleBounds(); const width = Math.min(rect.width, bounds.right - bounds.left); const height = Math.min(rect.height, bounds.bottom - bounds.top);
      return { left: Math.max(bounds.left, Math.min(rect.left, bounds.right - width)), top: Math.max(bounds.top, Math.min(rect.top, bounds.bottom - height)), width, height };
    });
    window.addEventListener('resize', fit); window.visualViewport?.addEventListener('resize', fit);
    return () => { window.removeEventListener('resize', fit); window.visualViewport?.removeEventListener('resize', fit); };
  }, [isExpanded]);

  // Initialize Map
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || mapInstanceRef.current) return;
    if (typeof google === 'undefined' || !google.maps || !google.maps.Map) return;

    const resource = acquireMap('guess', mapContainerRef.current, {
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
      ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark')),
      // Solution attribution per skill guidelines
      internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
    } as google.maps.MapOptions);
    const map = resource.map;

    // Click handler to drop or move the guess pin
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setCurrentGuess(coords);
      playUiSound('pin');

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
            playUiSound('pin');
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
      resource.release();
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [mapsReady]);

  useEffect(() => { mapInstanceRef.current?.setOptions(mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark'))); }, [mapPreferences]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) google.maps.event.trigger(mapInstanceRef.current, 'resize');
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      if (event.key !== 'Enter' || event.repeat || !currentGuess || isSubmitting || target?.closest('button, input, select, textarea, [contenteditable="true"], [role="dialog"]')) return;
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
      style={isExpanded ? expandedStyle : dragStyle}
      className={`absolute bottom-5 right-5 z-20 ${isExpanded ? 'expanded' : 'collapsed'} ${dragging || interaction.current ? '' : 'transition-[width,height] duration-300 ease-out'} flex flex-col bg-stone-900/95 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md ${
        isExpanded
          ? ''
          : 'w-72 sm:w-88 h-56 sm:h-64 opacity-90 hover:opacity-100'
      }`}
    >
      {/* Top Header bar of Guess Map */}
      <div {...(isExpanded ? expandedDragProps : dragHandleProps)} className={`flex items-center justify-between px-3.5 py-2 bg-stone-950/80 border-b border-stone-800 text-stone-200 touch-none ${dragging || interaction.current ? 'cursor-grabbing' : 'cursor-grab'}`}>
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
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? t('Exit Fullscreen') : t('Enter Fullscreen')}
            title={isExpanded ? t('Exit Fullscreen') : t('Enter Fullscreen')}
            className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="flex-1 min-h-0 w-full relative cursor-crosshair" />

      {isExpanded && (['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as PanelResizeDirection[]).map((direction) => <div key={direction} aria-hidden="true" className={`location-card-resize-handle ${direction}`} {...resizeProps(direction)} />)}

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
