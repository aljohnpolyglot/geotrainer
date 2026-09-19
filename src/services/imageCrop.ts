export type ImageCrop = { x: number; y: number; width: number; height: number };
export type CropCorner = 'nw' | 'ne' | 'sw' | 'se';

export const DEFAULT_IMAGE_CROP: ImageCrop = { x: .08, y: .08, width: .84, height: .84 };
const MIN_CROP = .08;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const moveImageCrop = (crop: ImageCrop, dx: number, dy: number): ImageCrop => ({
  ...crop,
  x: clamp(crop.x + dx, 0, 1 - crop.width),
  y: clamp(crop.y + dy, 0, 1 - crop.height),
});

export function resizeImageCrop(crop: ImageCrop, corner: CropCorner, dx: number, dy: number): ImageCrop {
  let left = crop.x; let top = crop.y; let right = crop.x + crop.width; let bottom = crop.y + crop.height;
  if (corner.includes('w')) left = clamp(left + dx, 0, right - MIN_CROP);
  else right = clamp(right + dx, left + MIN_CROP, 1);
  if (corner.includes('n')) top = clamp(top + dy, 0, bottom - MIN_CROP);
  else bottom = clamp(bottom + dy, top + MIN_CROP, 1);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export async function cropImageDataUrl(dataUrl: string, crop: ImageCrop): Promise<string> {
  const image = new Image(); image.src = dataUrl; await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * crop.width));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * crop.height));
  canvas.getContext('2d')!.drawImage(image, image.naturalWidth * crop.x, image.naturalHeight * crop.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', .88);
}
