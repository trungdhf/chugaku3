export type Q = { q: string; a: string; w: string[]; e?: string };
// [問題, 正解, "誤答1|誤答2|誤答3", 解説?]
export type Raw = [string, string, string, string?];
export type Unit = {
  id: string;
  title: string;
  tag?: string;
  lesson: string;
  qs?: Raw[];
  gens?: (() => Q)[];
  speak?: boolean;
};
export type Subject = { id: string; name: string; short: string; icon: string; color: string; units: Unit[] };

export const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const nz = (a: number, b: number) => {
  let v = 0;
  while (v === 0) v = ri(a, b);
  return v;
};

export function mkQ(q: string, a: string, wrongs: string[], e?: string, fallback?: () => string): Q {
  const w: string[] = [];
  for (const x of wrongs) if (x !== a && !w.includes(x) && w.length < 3) w.push(x);
  let guard = 0;
  while (w.length < 3 && fallback && guard++ < 60) {
    const x = fallback();
    if (x !== a && !w.includes(x)) w.push(x);
  }
  return { q, a, w, e };
}

export function fromRaw(r: Raw): Q {
  return { q: r[0], a: r[1], w: r[2].split('|'), e: r[3] };
}

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export function frac(n: number, d: number): string {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  if (d === 1) return String(n);
  return (n < 0 ? '-' : '') + Math.abs(n) + '/' + d;
}
