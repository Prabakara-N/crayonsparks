// Deterministic seeded RNG (mulberry32) so a given seed reproduces the same
// page — lets "regenerate" hand out a fresh seed and lets tests be stable.
export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (maxExclusive: number): number =>
    Math.floor(next() * maxExclusive);
  const pick = <T>(arr: T[]): T => {
    if (!arr.length) throw new Error("rng.pick called on an empty array");
    return arr[int(arr.length)];
  };
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return { next, int, pick, shuffle };
}

export function specSeed(seed: number | undefined, id: string): number {
  return typeof seed === "number" ? seed >>> 0 : hashSeed(id);
}
