/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Standard GeoGuessr scoring algorithm:
 * Max points = 5,000 per round.
 * Perfect score within 25 meters (0.025 km).
 * Score falls exponentially based on map diameter (~14,916 km for World map).
 */
export function calculateRoundScore(distanceKm: number, maxMapKm = 14916): number {
  if (distanceKm <= 0.025) {
    return 5000;
  }
  // Exponential scaling formula
  const score = Math.round(5000 * Math.exp((-10 * distanceKm) / maxMapKm));
  return Math.max(0, Math.min(5000, score));
}

/**
 * Formats distance cleanly for user display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(2)} km`;
  }
  if (distanceKm < 100) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm).toLocaleString()} km`;
}

/**
 * Formats seconds into MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function restoredRoundElapsed(savedElapsed: unknown, savedRemaining: unknown, timeLimitSeconds: number): number {
  if (Number.isFinite(savedElapsed)) return Math.max(0, Math.floor(Number(savedElapsed)));
  if (timeLimitSeconds > 0 && Number.isFinite(savedRemaining)) return Math.max(0, Math.min(timeLimitSeconds, timeLimitSeconds - Number(savedRemaining)));
  return 0;
}

export const resumeRoundStartedAt = (startedAt: number, pausedAt: number | null, now: number) => pausedAt === null ? startedAt : startedAt + Math.max(0, now - pausedAt);

export function compassDirection(heading: number): string {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((heading % 360) + 360) % 360) / 45) % 8];
}

/**
 * Provides a rating badge based on percentage of max score
 */
export function getScoreRating(percentage: number): { title: string; color: string } {
  if (percentage >= 0.95) return { title: 'Geographic Prodigy', color: 'text-amber-400' };
  if (percentage >= 0.85) return { title: 'Elite Navigator', color: 'text-emerald-400' };
  if (percentage >= 0.7) return { title: 'Master Scout', color: 'text-sky-400' };
  if (percentage >= 0.5) return { title: 'World Traveler', color: 'text-purple-400' };
  if (percentage >= 0.3) return { title: 'Curious Explorer', color: 'text-stone-300' };
  return { title: 'Apprentice Guesser', color: 'text-stone-400' };
}
