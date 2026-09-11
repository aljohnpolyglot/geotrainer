/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BookmarkLocation } from '../types';
import { getFlagCdnUrl } from '../services/geocoding';
import {
  X,
  Search,
  Trash2,
  ExternalLink,
  BookmarkCheck,
  Navigation,
  Clock,
  MapPin,
} from 'lucide-react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkLocation[];
  onSelectBookmark: (bookmark: BookmarkLocation) => void;
  onDeleteBookmark: (id: string) => void;
  activePanoId?: string;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onSelectBookmark,
  onDeleteBookmark,
  activePanoId,
}) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    const q = searchQuery.toLowerCase();
    return bookmarks.filter(
      (b) =>
        b.countryName.toLowerCase().includes(q) ||
        b.countryCode.toLowerCase().includes(q) ||
        (b.locality && b.locality.toLowerCase().includes(q)) ||
        (b.adminArea && b.adminArea.toLowerCase().includes(q)) ||
        (b.exactAddress && b.exactAddress.toLowerCase().includes(q)) ||
        (b.note && b.note.toLowerCase().includes(q))
    );
  }, [bookmarks, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      id="bookmarks-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
    >
      <div
        id="bookmarks-dialog"
        className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <BookmarkCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-stone-100">{t('savedBookmarks')}</h2>
            <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
              {bookmarks.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            title={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        {bookmarks.length > 2 && (
          <div className="px-6 pt-3 pb-1">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchBookmarks')}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-stone-500"
              />
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto text-stone-500">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-stone-300">{t('noBookmarks')}</p>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Click the bookmark button on any Street View panorama to collect and revisit it anytime.
                </p>
              </div>
            </div>
          ) : (
            filteredBookmarks.map((b) => {
              const isActive = b.panoId === activePanoId;
              const dateStr = new Date(b.savedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const flag1x = getFlagCdnUrl(b.countryCode, 40);
              const flag2x = getFlagCdnUrl(b.countryCode, 80);
              const placeHeadline = [b.locality, b.adminArea].filter(Boolean).join(', ');

              return (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      {flag1x && (
                        <img
                          src={flag1x}
                          srcSet={`${flag1x} 1x, ${flag2x} 2x`}
                          alt={`${b.countryName} flag`}
                          width="24"
                          height="16"
                          className="w-6 h-4 rounded-xs object-cover border border-stone-700 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span className="text-sm font-semibold text-stone-100 truncate">
                        {b.countryName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                        {b.countryCode}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                          {t('activeView')}
                        </span>
                      )}
                    </div>

                    {/* Exact Location & Address details if recorded */}
                    {placeHeadline && (
                      <div className="flex items-center space-x-1.5 text-xs text-stone-200">
                        <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="font-medium truncate">{placeHeadline}</span>
                      </div>
                    )}

                    {b.exactAddress && b.exactAddress !== placeHeadline && (
                      <p className="text-[11px] text-stone-400 truncate max-w-sm">
                        {b.exactAddress}
                      </p>
                    )}

                    <div className="flex items-center space-x-3 text-xs text-stone-400 font-mono">
                      <span>
                        {b.lat.toFixed(4)}°, {b.lng.toFixed(4)}°
                      </span>
                      <span className="text-stone-600">•</span>
                      <span className="flex items-center gap-1 text-[11px] text-stone-500 font-sans">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => {
                        onSelectBookmark(b);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3 h-3 text-stone-900" />
                      <span>{t('reopen')}</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&pano=${b.panoId}`}
                      target="_blank"
                      rel="noreferrer"
                      title={t('Open in Google Maps')}
                      className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => onDeleteBookmark(b.id)}
                      title={t('Delete bookmark')}
                      className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-950/70 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-300 hover:text-white cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
