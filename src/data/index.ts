import { math } from './math';
import { english } from './english';
import { science } from './science';
import { social } from './social';
import { japanese } from './japanese';
import { gika } from './gika';
import { type Q, type Unit, type Subject, fromRaw, shuffle, pick } from './types';

export const SUBJECTS: Subject[] = [math, english, science, social, japanese, gika];
export const UNIT_MAP: Record<string, { unit: Unit; subj: Subject }> = {};
for (const s of SUBJECTS) for (const u of s.units) UNIT_MAP[u.id] = { unit: u, subj: s };
export const DEFAULT_SCOPE = SUBJECTS.flatMap(s => s.units.filter(u => u.tag === '2学期').map(u => u.id));

export type QI = Q & { unit: string };

export function unitQuestions(u: Unit, n: number, prefer?: (q: Q) => number): QI[] {
  const raw = (u.qs || []).map(fromRaw);
  const out: Q[] = [];
  const nRaw = u.gens?.length ? Math.min(raw.length, Math.floor(n / 2)) : Math.min(raw.length, n);
  const sorted = prefer ? shuffle(raw).sort((a, b) => prefer(b) - prefer(a)) : shuffle(raw);
  out.push(...sorted.slice(0, nRaw));
  if (u.gens?.length) {
    const seen = new Set(out.map(q => q.q));
    let guard = 0;
    while (out.length < n && guard++ < n * 20) {
      const q = pick(u.gens)();
      if (!seen.has(q.q) && q.w.length >= 2) { seen.add(q.q); out.push(q); }
    }
  }
  return shuffle(out).map(q => ({ ...q, unit: u.id }));
}

export function mixQuestions(unitIds: string[], n: number, prefer?: (q: Q) => number): QI[] {
  const ids = unitIds.filter(id => UNIT_MAP[id]);
  if (!ids.length) return [];
  const per = Math.max(1, Math.ceil(n / ids.length));
  const all: QI[] = [];
  for (const id of shuffle(ids)) all.push(...unitQuestions(UNIT_MAP[id].unit, per, prefer));
  return shuffle(all).slice(0, n);
}
