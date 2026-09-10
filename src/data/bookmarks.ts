/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookmarkLocation } from '../types';

const BOOKMARKS_STORAGE_KEY = 'sv_saved_bookmarks_v1';

export function getBookmarks(): BookmarkLocation[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load bookmarks from localStorage:', err);
    return [];
  }
}

export function saveBookmark(bookmark: BookmarkLocation): BookmarkLocation[] {
  const current = getBookmarks();
  // Check if this panorama is already bookmarked
  const existsIndex = current.findIndex((b) => b.panoId === bookmark.panoId);
  let updated: BookmarkLocation[];
  if (existsIndex >= 0) {
    // Update existing
    updated = [...current];
    updated[existsIndex] = bookmark;
  } else {
    // Add to top of list
    updated = [bookmark, ...current];
  }
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save bookmark to localStorage:', err);
  }
  return updated;
}

export function deleteBookmark(id: string): BookmarkLocation[] {
  const current = getBookmarks();
  const updated = current.filter((b) => b.id !== id && b.panoId !== id);
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete bookmark from localStorage:', err);
  }
  return updated;
}

export function isLocationBookmarked(panoId: string, bookmarks: BookmarkLocation[]): boolean {
  return bookmarks.some((b) => b.panoId === panoId);
}
