/**
 * Safe wrappers around localStorage. Storage can be unavailable (private browsing, blocked
 * cookies), so failures are swallowed and the app keeps working without persistence.
 */

/** Returns the stored value, or null when it is missing or storage is unavailable. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores a value; does nothing when storage is unavailable. */
export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* not persisted — the value still applies for this session */
  }
}
