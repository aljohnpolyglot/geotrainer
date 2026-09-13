export const CLOUD_IMPORT_EVENT = 'geotrainer-cloud-import';
export const announceCloudImport = (target: EventTarget = window) => target.dispatchEvent(new Event(CLOUD_IMPORT_EVENT));
