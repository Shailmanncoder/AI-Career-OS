export type QueuedRequest<T> = T | null;

export type TransitionQueue<T> = {
  isRunning: () => boolean;
  begin: (request: T) => boolean;
  release: () => QueuedRequest<T>;
  peek: () => QueuedRequest<T>;
};

export function createTransitionQueue<T>(): TransitionQueue<T> {
  let running = false;
  let queued: QueuedRequest<T> = null;

  return {
    isRunning: () => running,
    begin(request) {
      if (running) {
        queued = request;
        return false;
      }
      running = true;
      return true;
    },
    release() {
      running = false;
      const next = queued;
      queued = null;
      return next;
    },
    peek: () => queued,
  };
}
