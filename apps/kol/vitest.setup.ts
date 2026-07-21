/**
 * jsdom leaves HTMLMediaElement.play/pause unimplemented (they log a
 * "not implemented" error and return undefined — `.play().catch()` would
 * throw). Real promise-returning stubs let FilmFrame's persistent playback
 * path run; the hero-persistence tests spy on these to assert the
 * never-pause invariant. No-op under the node environment.
 */
if (typeof window !== "undefined") {
  Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: function play(): Promise<void> {
      return Promise.resolve();
    },
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: function pause(): void {},
  });
}
