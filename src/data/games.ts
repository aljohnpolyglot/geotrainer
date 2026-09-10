/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameRecord } from '../types';

const GAMES_STORAGE_KEY = 'sv_game_history_v1';

export function getGameHistory(): GameRecord[] {
  try {
    const raw = localStorage.getItem(GAMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load game history from localStorage:', err);
    return [];
  }
}

export function saveGameRecord(game: GameRecord): GameRecord[] {
  const current = getGameHistory();
  const updated = [game, ...current];
  try {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save game record to localStorage:', err);
  }
  return updated;
}

export function deleteGameRecord(id: string): GameRecord[] {
  const current = getGameHistory();
  const updated = current.filter((g) => g.id !== id);
  try {
    localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete game record from localStorage:', err);
  }
  return updated;
}

export function clearGameHistory(): void {
  try {
    localStorage.removeItem(GAMES_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear game history from localStorage:', err);
  }
}
