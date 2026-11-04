// Refresh live data only while the screen is in use. Failed reads back off;
// reconnecting or returning to the tab refreshes immediately. Writes stay manual.
export function startPolling(load, {
  isBusy = () => false,
  onError = () => {},
  interval = 5000,
  maxInterval = 30000,
} = {}, environment = globalThis) {
  let stopped = false, running = false, failures = 0, timer;
  const visibleAndOnline = () =>
    !environment.document.hidden && environment.navigator?.onLine !== false;
  function schedule(delay) {
    environment.clearTimeout(timer);
    if (!stopped) timer = environment.setTimeout(tick, delay);
  }
  async function tick() {
    if (stopped || running) return;
    if (!visibleAndOnline() || isBusy()) {
      schedule(interval);
      return;
    }
    running = true;
    try {
      await load();
      failures = 0;
    } catch (error) {
      failures += 1;
      if (!stopped) onError(error);
    } finally {
      running = false;
      schedule(Math.min(maxInterval, interval * 2 ** Math.min(failures, 3)));
    }
  }
  function resume() {
    if (!visibleAndOnline() || running || stopped) return;
    environment.clearTimeout(timer);
    void tick();
  }
  environment.document.addEventListener('visibilitychange', resume);
  environment.addEventListener('online', resume);
  void tick();
  return () => {
    stopped = true;
    environment.clearTimeout(timer);
    environment.document.removeEventListener('visibilitychange', resume);
    environment.removeEventListener('online', resume);
  };
}
