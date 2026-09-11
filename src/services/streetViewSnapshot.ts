export type StreetViewSnapshot = {
  panoId: string;
  heading: number;
  pitch: number;
  zoom: number;
};

let current: StreetViewSnapshot | null = null;

export const setStreetViewSnapshot = (snapshot: StreetViewSnapshot) => { current = snapshot; };
export const getStreetViewSnapshot = (panoId: string) => current?.panoId === panoId ? current : null;
