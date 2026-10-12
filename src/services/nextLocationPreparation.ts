export class NextLocationPreparation<T> {
  private pending?: { key: string; controller: AbortController; promise: Promise<T> };

  prepare(key: string, resolve: (signal: AbortSignal) => Promise<T>) {
    if (this.pending?.key === key) return;
    this.clear();
    const controller = new AbortController();
    const promise = resolve(controller.signal);
    this.pending = { key, controller, promise };
    void promise.catch(() => { if (this.pending?.promise === promise) this.pending = undefined; });
  }

  take(key: string, signal?: AbortSignal) {
    if (this.pending?.key !== key) { this.clear(); return undefined; }
    const { controller, promise } = this.pending;
    this.pending = undefined;
    if (!signal) return promise;
    if (signal.aborted) controller.abort();
    else {
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      void promise.then(() => signal.removeEventListener('abort', abort), () => signal.removeEventListener('abort', abort));
    }
    return promise;
  }

  clear() {
    this.pending?.controller.abort();
    this.pending = undefined;
  }
}
