/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Collection } from '../types';
import { COUNTRIES } from './countries';
import { geographyFor } from '../analytics/geography';

const legacyCollections: Collection[] = [
  {
    id: 'world',
    name: 'World',
    countryCodes: Object.keys(COUNTRIES),
  },
  {
    id: 'balkans',
    name: 'Balkans',
    countryCodes: ['AL', 'BA', 'BG', 'HR', 'GR', 'ME', 'MK', 'RO', 'RS', 'SI'],
  },
  {
    id: 'baltics',
    name: 'Baltics',
    countryCodes: ['EE', 'LV', 'LT'],
  },
  {
    id: 'nordics',
    name: 'Nordics',
    countryCodes: ['DK', 'FI', 'IS', 'NO', 'SE'],
  },
  {
    id: 'western-europe',
    name: 'Western Europe',
    countryCodes: ['AT', 'BE', 'FR', 'DE', 'IE', 'IT', 'LU', 'NL', 'PT', 'ES', 'CH', 'GB'],
  },
  {
    id: 'eastern-europe',
    name: 'Eastern Europe',
    countryCodes: ['CZ', 'HU', 'PL', 'SK', 'RO', 'BG', 'UA'],
  },
  {
    id: 'south-america',
    name: 'South America',
    countryCodes: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'PE', 'UY'],
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia',
    countryCodes: ['KH', 'ID', 'MY', 'PH', 'SG', 'TH'],
  },
];

const codes = Object.keys(COUNTRIES);
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const makeGroup = (kind: 'continent' | 'region', name: string): Collection => ({ id: `${kind}-${slug(name)}`, name, countryCodes: codes.filter((code) => geographyFor(code)?.[kind] === name) });
const continents = [...new Set(codes.map((code) => geographyFor(code)?.continent).filter((value): value is string => !!value))].sort();
const regions = [...new Set(codes.map((code) => geographyFor(code)?.region).filter((value): value is string => !!value))].sort();

export const BUILT_IN_COLLECTION_GROUPS = [
  { label: 'World', collections: [legacyCollections[0]] },
  { label: 'Continents', collections: continents.map((name) => makeGroup('continent', name)) },
  { label: 'Trainer drills', collections: legacyCollections.slice(1) },
  ...continents.map((continent) => ({
    label: `${continent} · Regions`,
    collections: regions.filter((region) => codes.some((code) => geographyFor(code)?.continent === continent && geographyFor(code)?.region === region)).map((name) => makeGroup('region', name)),
  })),
];

export const BUILT_IN_COLLECTIONS: Collection[] = [...new Map([...BUILT_IN_COLLECTION_GROUPS.flatMap((item) => item.collections), ...legacyCollections.slice(1)].map((item) => [item.id, item])).values()];

export const TRAINING_PRESETS = [
  { name: 'Rural Europe', collectionId: 'continent-europe', environment: 'rural', samplingMode: 'balanced' },
  { name: 'Urban Asia', collectionId: 'continent-asia', environment: 'urban', urbanLevel: 3, samplingMode: 'balanced' },
  { name: 'Balkan Rural', collectionId: 'balkans', environment: 'rural', samplingMode: 'balanced' },
  { name: 'Baltic Rural', collectionId: 'baltics', environment: 'rural', samplingMode: 'balanced' },
  { name: 'South America Urban', collectionId: 'south-america', environment: 'urban', urbanLevel: 3, samplingMode: 'balanced' },
  { name: 'World Mixed', collectionId: 'world', environment: 'mixed', samplingMode: 'natural' },
] as const;

const CUSTOM_COLLECTIONS_STORAGE_KEY = 'sv_custom_collections_v1';

export function getCustomCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(CUSTOM_COLLECTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({ ...item, isCustom: true }));
    }
    return [];
  } catch (e) {
    console.error('Failed to load custom collections from localStorage', e);
    return [];
  }
}

export function saveCustomCollection(collection: Omit<Collection, 'isCustom'>): Collection[] {
  const existing = getCustomCollections();
  const index = existing.findIndex((c) => c.id === collection.id);
  let updated: Collection[];

  if (index >= 0) {
    updated = existing.map((c) => (c.id === collection.id ? { ...collection, isCustom: true } : c));
  } else {
    updated = [...existing, { ...collection, isCustom: true }];
  }

  localStorage.setItem(CUSTOM_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteCustomCollection(id: string): Collection[] {
  const existing = getCustomCollections();
  const updated = existing.filter((c) => c.id !== id);
  localStorage.setItem(CUSTOM_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
