/**
 * KOL prototype — tiny localStorage-backed external store.
 *
 * Exists so the mock providers (`store.tsx`, `session.tsx`) can hydrate from
 * localStorage WITHOUT a setState-in-effect. React's `useSyncExternalStore`
 * renders `getServerSnapshot()` on the server AND during client hydration,
 * then immediately re-renders with `getSnapshot()` once hydration commits.
 * That gives us:
 *
 *   - no SSR/client markup mismatch (both sides render the defaults),
 *   - no cascading render from an effect (react-hooks/set-state-in-effect),
 *   - persisted state visible on the very first post-hydration paint.
 *
 * In the live build these stores are replaced by Supabase reads/writes; the
 * subscribe/getSnapshot shape is what a realtime channel would plug into.
 */

type Listener = () => void;

export interface PersistentStore<T extends object> {
  /** Current client state. Stable identity between mutations. */
  getSnapshot: () => T;
  /** Always the seed — used for SSR and for the hydration render. */
  getServerSnapshot: () => T;
  subscribe: (listener: Listener) => () => void;
  /** Immutable update. A returned-identical state is a no-op. */
  set: (updater: (prev: T) => T) => void;
  /** Back to seed defaults (and clear the persisted copy). */
  reset: () => void;
}

const isBrowser = typeof window !== "undefined";

function readPersisted<T extends object>(key: string, defaults: T): T {
  if (!isBrowser) return defaults;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    // First run, malformed JSON, or storage blocked (private mode / no-cookie
    // browsers). Seeds are always a valid fallback.
    return defaults;
  }
}

function writePersisted(key: string, value: unknown): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked — state still works in memory.
  }
}

export function createPersistentStore<T extends object>(
  key: string,
  defaults: T,
): PersistentStore<T> {
  // Read once at module init. On the server this is a no-op; on the client it
  // runs before the first `getSnapshot()`, so the snapshot identity is stable
  // (returning a fresh object per call would loop useSyncExternalStore).
  let state: T = readPersisted(key, defaults);
  const listeners = new Set<Listener>();

  function emit(): void {
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => defaults,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(updater) {
      const next = updater(state);
      if (next === state) return;
      state = next;
      writePersisted(key, state);
      emit();
    },
    reset() {
      state = defaults;
      writePersisted(key, state);
      emit();
    },
  };
}
