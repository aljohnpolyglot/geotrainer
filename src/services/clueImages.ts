import type { ClueRecord } from '../types';
import { supabase } from './supabase';

export const CLUE_IMAGE_BUCKET = 'clue-images';
export const clueImagePath = (userId: string, clueId: string) => `${userId}/${clueId}.jpg`;

const dataUrlBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('Could not prepare the saved clue image.');
  return response.blob();
};

const blobDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
});

export const hostedCluePaths = (clues: ClueRecord[]) => [...new Set(clues.flatMap((clue) => clue.imagePath && !clue.imageDataUrl ? [clue.imagePath] : []))];

export async function compressClueImage(dataUrl: string, maxDimension = 1024, quality = .76): Promise<string> {
  const image = new Image(); image.src = dataUrl; await image.decode();
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function uploadClueImage(userId: string, clue: ClueRecord): Promise<ClueRecord> {
  if (!supabase || clue.imagePath || !clue.imageDataUrl.startsWith('data:image/')) return clue;
  let imageDataUrl = await compressClueImage(clue.imageDataUrl);
  const imagePath = clueImagePath(userId, clue.id);
  let blob = await dataUrlBlob(imageDataUrl);
  if (blob.size > 800_000) { imageDataUrl = await compressClueImage(imageDataUrl, 800, .64); blob = await dataUrlBlob(imageDataUrl); }
  if (blob.size > 800_000) throw new Error('The saved clue image is still too large after compression.');
  const { error } = await supabase.storage.from(CLUE_IMAGE_BUCKET).upload(imagePath, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });
  if (error) throw error;
  return { ...clue, imageDataUrl, imagePath };
}

export async function cacheClueImages(clues: ClueRecord[]): Promise<ClueRecord[]> {
  if (!supabase) return clues;
  const paths = hostedCluePaths(clues);
  if (!paths.length) return clues;
  const { data, error } = await supabase.storage.from(CLUE_IMAGE_BUCKET).createSignedUrls(paths, 3600);
  if (error) return clues;
  const urls = new Map(data.map((item) => [item.path, item.signedUrl]));
  return Promise.all(clues.map(async (clue) => {
    const url = clue.imagePath && !clue.imageDataUrl ? urls.get(clue.imagePath) : undefined;
    if (!url) return clue;
    try { const response = await fetch(url); return response.ok ? { ...clue, imageDataUrl: await blobDataUrl(await response.blob()) } : clue; } catch { return clue; }
  }));
}

export async function resolveStoredClueImages(userId: string, clueIds: string[]) {
  if (!supabase || !clueIds.length) return new Map<string, { imagePath: string; imageDataUrl: string }>();
  const { data: objects, error: listError } = await supabase.storage.from(CLUE_IMAGE_BUCKET).list(userId, { limit: 1000 });
  if (listError) return new Map<string, { imagePath: string; imageDataUrl: string }>();
  const names = new Set(objects.map((item) => item.name));
  const existingIds = clueIds.filter((id) => names.has(`${id}.jpg`));
  const paths = existingIds.map((id) => clueImagePath(userId, id));
  if (!paths.length) return new Map<string, { imagePath: string; imageDataUrl: string }>();
  const { data, error } = await supabase.storage.from(CLUE_IMAGE_BUCKET).createSignedUrls(paths, 3600);
  if (error) return new Map<string, { imagePath: string; imageDataUrl: string }>();
  return new Map(data.flatMap((item, index) => item.signedUrl ? [[existingIds[index], { imagePath: paths[index], imageDataUrl: item.signedUrl }] as const] : []));
}
