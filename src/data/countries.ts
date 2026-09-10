import type { CountrySeed } from '../types';
import catalog from './countryCatalog.json';

export const COUNTRIES = catalog as Record<string, CountrySeed>;
