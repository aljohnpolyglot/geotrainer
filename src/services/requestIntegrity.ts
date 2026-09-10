export const isLatestRequest = (requestId: number, latestRequestId: number) => requestId === latestRequestId;
export const isCurrentPanorama = (panoId: string, currentPanoId?: string) => panoId === currentPanoId;
