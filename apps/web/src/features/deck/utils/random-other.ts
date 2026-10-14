/** A random index that differs from `current` (when there is more than one card). */
export function randomOther(current: number, length: number): number {
  if (length < 2) return current;
  const n = Math.floor(Math.random() * (length - 1));
  return n >= current ? n + 1 : n;
}
