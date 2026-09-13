const PREFIX = '[GeoTrainer dev]';
const RELOAD_REASON = 'geotrainer.dev.reloadReason';
const diagnosticState = globalThis as typeof globalThis & { __geotrainerDevDiagnostics?: boolean };

export function installDevDiagnostics() {
  if (!import.meta.env.DEV || diagnosticState.__geotrainerDevDiagnostics) return;
  diagnosticState.__geotrainerDevDiagnostics = true;
  const log = (event: string, details?: unknown) => console.info(PREFIX, new Date().toISOString(), event, details ?? '');
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const previousReload = sessionStorage.getItem(RELOAD_REASON); sessionStorage.removeItem(RELOAD_REASON);
  log('page:boot', { navigation: navigation?.type || 'unknown', previousReload: previousReload || 'none' });
  import.meta.hot?.on('vite:beforeUpdate', ({ updates }) => log('vite:hmr-update', updates.map(({ type, path, acceptedPath }) => ({ type, path, acceptedPath }))));
  import.meta.hot?.on('vite:beforeFullReload', ({ path, triggeredBy }) => log('vite:full-reload', { path, triggeredBy }));
  import.meta.hot?.on('vite:invalidate', ({ path, message, firstInvalidatedBy }) => log('vite:invalidate', { path, message, firstInvalidatedBy }));
  import.meta.hot?.on('vite:error', ({ err }) => log('vite:error', { message: err.message, id: err.id, plugin: err.plugin }));
  import.meta.hot?.on('vite:ws:disconnect', () => log('vite:server-disconnected'));
  import.meta.hot?.on('vite:ws:connect', () => log('vite:server-connected'));
  window.addEventListener('pagehide', (event) => log('page:hide', { persisted: event.persisted }));
}

export function reloadPage(reason: string) {
  if (import.meta.env.DEV) { sessionStorage.setItem(RELOAD_REASON, reason); console.warn(PREFIX, 'app-requested-reload', { reason }); }
  window.location.reload();
}
