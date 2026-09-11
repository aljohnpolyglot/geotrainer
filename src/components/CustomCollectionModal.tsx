/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Collection } from '../types';
import { COUNTRIES } from '../data/countries';
import { X, Search, Check, Trash2 } from 'lucide-react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';

interface CustomCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: Omit<Collection, 'isCustom'>) => void;
  onDelete?: (id: string) => void;
  initialCollection?: Collection | null;
}

export const CustomCollectionModal: React.FC<CustomCollectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialCollection,
}) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [name, setName] = useState<string>(initialCollection?.name || '');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(
    new Set(initialCollection?.countryCodes || [])
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const allCountries = useMemo(() => {
    return Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return allCountries;
    const q = searchQuery.toLowerCase();
    return allCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [allCountries, searchQuery]);

  if (!isOpen) return null;

  const toggleCountry = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedCodes);
    filteredCountries.forEach((c) => next.add(c.code));
    setSelectedCodes(next);
  };

  const deselectAllFiltered = () => {
    const next = new Set(selectedCodes);
    filteredCountries.forEach((c) => next.delete(c.code));
    setSelectedCodes(next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('Please provide a collection name'));
      return;
    }
    if (selectedCodes.size === 0) {
      setError(t('Please select at least one country'));
      return;
    }

    const id = initialCollection?.id || `custom-${Date.now()}`;
    onSave({
      id,
      name: name.trim(),
      countryCodes: Array.from(selectedCodes),
    });
    onClose();
  };

  return (
    <div
      id="custom-collection-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div
        id="custom-collection-dialog"
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-base font-semibold text-stone-100">
            {initialCollection ? t('Edit Custom Collection') : t('Create Custom Collection')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title={t('Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                {t('collectionName')}
              </label>
              <input
                id="custom-collection-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder={t('e.g., Central Europe Practice')}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3.5 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-stone-400"
                autoFocus
              />
            </div>

            {/* Country Selector Header & Search */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-300">
                  {t('selectCountries')} ({selectedCodes.size} {t('selected')})
                </label>
                <div className="space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-stone-400 hover:text-stone-200 underline cursor-pointer"
                  >
                    {t('selectVisible')}
                  </button>
                  <span className="text-stone-600">|</span>
                  <button
                    type="button"
                    onClick={deselectAllFiltered}
                    className="text-stone-400 hover:text-stone-200 underline cursor-pointer"
                  >
                    {t('clearVisible')}
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('filterCountries')}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-stone-500"
                />
              </div>

              {/* Scrollable Country List */}
              <div className="flex-1 overflow-y-auto border border-stone-800 rounded-lg bg-stone-950/50 p-2 space-y-1">
                {filteredCountries.map((country) => {
                  const isChecked = selectedCodes.has(country.code);
                  return (
                    <button
                      type="button"
                      key={country.code}
                      onClick={() => toggleCountry(country.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-stone-800 text-stone-100'
                          : 'hover:bg-stone-900 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-white border-white text-stone-950'
                              : 'border-stone-700 bg-stone-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <CountryFlag code={country.code} />
                        <span>{country.name}</span>
                      </div>
                    </button>
                  );
                })}

                {filteredCountries.length === 0 && (
                  <p className="text-center py-6 text-xs text-stone-500">
                    {t('No countries matching')} "{searchQuery}"
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium">{error}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-stone-950/70 border-t border-stone-800">
            {initialCollection && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialCollection.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('Delete')}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold rounded-lg shadow cursor-pointer transition-colors"
              >
                {t('saveCollection')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
