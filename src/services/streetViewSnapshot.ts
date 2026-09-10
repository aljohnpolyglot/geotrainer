export type StreetViewSnapshot = {
  panoId: string;
  heading: number;
  pitch: number;
  zoom: number;
};

let current: StreetViewSnapshot | null = null;

export const setStreetViewSnapshot = (snapshot: StreetViewSnapshot) => { current = snapshot; };
export const getStreetViewSnapshot = (panoId: string) => current?.panoId === panoId ? current : null;

export function getCaptureCrop(video: { width: number; height: number }, viewport: { width: number; height: number }, target: { left: number; top: number; width: number; height: number }) {
  const scaleX = video.width / viewport.width;
  const scaleY = video.height / viewport.height;
  const sx = Math.max(0, target.left * scaleX);
  const sy = Math.max(0, target.top * scaleY);
  const sw = Math.min(video.width - sx, target.width * scaleX);
  const sh = Math.min(video.height - sy, target.height * scaleY);
  if (![sx, sy, sw, sh].every(Number.isFinite) || sw <= 0 || sh <= 0) throw new Error('Street View capture area is unavailable.');
  const width = Math.min(1280, Math.round(sw));
  return { sx, sy, sw, sh, width, height: Math.round(sh * width / sw) };
}

export async function captureStreetViewScreen() {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Screen capture is not supported by this browser.');
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: false });
  const coach = document.querySelector<HTMLElement>('.ai-coach');
  const visibility = coach?.style.visibility;
  try {
    const video = document.createElement('video'); video.srcObject = stream; video.muted = true;
    await video.play();
    if (!video.videoWidth) await new Promise<void>((resolve) => { video.onloadedmetadata = () => resolve(); });
    const surface = stream.getVideoTracks()[0]?.getSettings().displaySurface;
    if (surface && surface !== 'browser') throw new Error('Choose “This Tab” so only Street View is captured.');
    const viewport = document.getElementById('streetview-viewport');
    if (!viewport) throw new Error('Street View capture area is unavailable.');
    if (coach) coach.style.visibility = 'hidden';
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const crop = getCaptureCrop(
      { width: video.videoWidth, height: video.videoHeight },
      { width: window.innerWidth, height: window.innerHeight },
      viewport.getBoundingClientRect(),
    );
    const canvas = document.createElement('canvas'); canvas.width = crop.width; canvas.height = crop.height;
    canvas.getContext('2d')!.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.width, crop.height);
    return canvas.toDataURL('image/jpeg', .86);
  } finally {
    if (coach) coach.style.visibility = visibility || '';
    stream.getTracks().forEach((track) => track.stop());
  }
}
