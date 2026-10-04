// undefined means navigation was superseded; null means no playable lesson remains.
export async function openAvailableMetaTip<T>(tips: T[], start: number, open: (tip: T) => Promise<boolean | undefined>, direction = 1): Promise<number | null | undefined> {
  for (let index = start; index >= 0 && index < tips.length; index += direction) {
    const opened = await open(tips[index]);
    if (opened === undefined) return;
    if (opened) return index;
  }
  return null;
}
