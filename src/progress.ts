import { DEFAULT_SCOPE, type QI } from './data';

export type UnitStat = { hist: number[]; n: number; ok: number; read?: boolean };
export type Wrong = { q: QI; streak: number; t: number; miss: number };
export type Prog = {
  units: Record<string, UnitStat>;
  wrong: Record<string, Wrong>;
  days: Record<string, { n: number; ok: number }>;
  tests: { subj: string; score: number; date: string }[];
  exam: { date: string; set: boolean; scope: string[] };
  todo: { text: string; done: boolean }[];
  goal: number;
  updated?: number;
};
const KEY = 'chu3-prog-v1';
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const EXAM_DATE = '2026-11-06';
const fixExam = (p: Prog): Prog => (p.exam.set || p.exam.date === EXAM_DATE ? p : { ...p, exam: { ...p.exam, date: EXAM_DATE } });

export function blank(): Prog {
  return {
    units: {}, wrong: {}, days: {}, tests: [],
    exam: { date: EXAM_DATE, set: false, scope: DEFAULT_SCOPE },
    todo: [
      { text: '数学のワーク（テスト範囲）を全部やる', done: false },
      { text: '英語の教科書本文を音読・ノートに写す', done: false },
      { text: '理科のプリントをファイルにまとめる', done: false },
      { text: '社会のノートを提出日までに見直す', done: false },
    ],
    goal: 20,
  };
}
export function load(): Prog {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return fixExam({ ...blank(), ...JSON.parse(s) });
  } catch { /* ignore */ }
  return blank();
}
export function save(p: Prog) {
  localStorage.setItem(KEY, JSON.stringify(p));
}
export const wkey = (q: QI) => q.unit + '|' + q.q;

export function record(p: Prog, q: QI, ok: boolean, review = false): Prog {
  const u = p.units[q.unit] || { hist: [], n: 0, ok: 0 };
  const hist = [...u.hist, ok ? 1 : 0].slice(-20);
  const d = today();
  const day = p.days[d] || { n: 0, ok: 0 };
  const wrong = { ...p.wrong };
  const k = wkey(q);
  if (!ok) wrong[k] = { q, streak: 0, t: Date.now(), miss: (wrong[k]?.miss || 0) + 1 };
  else if (wrong[k]) {
    const st = wrong[k].streak + 1;
    if (review && st >= 2) delete wrong[k];
    else wrong[k] = { ...wrong[k], streak: st };
  }
  return {
    ...p,
    units: { ...p.units, [q.unit]: { ...u, hist, n: u.n + 1, ok: u.ok + (ok ? 1 : 0) } },
    days: { ...p.days, [d]: { n: day.n + 1, ok: day.ok + (ok ? 1 : 0) } },
    wrong,
  };
}
export function mastery(p: Prog, unitId: string): number {
  const h = p.units[unitId]?.hist || [];
  if (!h.length) return 0;
  const acc = h.reduce((a, b) => a + b, 0) / h.length;
  return Math.round(acc * Math.min(1, h.length / 10) * 100);
}
export function streak(p: Prog): number {
  let s = 0;
  const d = new Date();
  if (!(p.days[today(d)]?.n >= 10)) d.setDate(d.getDate() - 1);
  while (p.days[today(d)]?.n >= 10) { s++; d.setDate(d.getDate() - 1); }
  return s;
}
export function daysLeft(p: Prog): number {
  const t = new Date(p.exam.date + 'T00:00:00');
  const n = new Date(today() + 'T00:00:00');
  return Math.round((t.getTime() - n.getTime()) / 86400000);
}
export function exportCode(p: Prog): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(p))));
}
export function importCode(s: string): Prog | null {
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(s.trim()))));
    if (o && o.units && o.days) return { ...blank(), ...o };
  } catch { /* ignore */ }
  return null;
}

export function merge(a: Prog, b: Prog): Prog {
  const units = { ...a.units };
  for (const [k, u] of Object.entries(b.units)) {
    const x = units[k];
    units[k] = !x || u.n > x.n ? { ...u, read: u.read || x?.read } : { ...x, read: x.read || u.read };
  }
  const days = { ...a.days };
  for (const [k, d] of Object.entries(b.days)) if (!days[k] || d.n > days[k].n) days[k] = d;
  const seen = new Set<string>();
  const tests = [...a.tests, ...b.tests].filter(t => {
    const k = `${t.subj}|${t.date}|${t.score}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const newer = (a.updated || 0) >= (b.updated || 0) ? a : b;
  return fixExam({ ...newer, units, days, tests, updated: Math.max(a.updated || 0, b.updated || 0) });
}
