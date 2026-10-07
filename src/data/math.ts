import { type Q, type Subject, ri, pick, nz, mkQ, frac, shuffle } from './types';

const sg = (n: number) => (n < 0 ? '-' + Math.abs(n) : String(n));
const par = (n: number) => (n < 0 ? '(' + n + ')' : String(n));
function poly(cs: number[], v = 'x'): string {
  const deg = cs.length - 1;
  let s = '';
  cs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const vv = p === 0 ? '' : p === 1 ? v : v + '²';
    const ab = Math.abs(c);
    const body = ab === 1 && vv ? vv : ab + vv;
    if (!s) s = (c < 0 ? '-' : '') + body;
    else s += (c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}
const fx = (a: number, v = 'x') => (a === 0 ? v : `(${v} ${a < 0 ? '-' : '+'} ${Math.abs(a)})`);
function sqf(n: number): [number, number] {
  let k = 1, m = n;
  for (let i = 2; i * i <= m; i++) while (m % (i * i) === 0) { m /= i * i; k *= i; }
  return [k, m];
}
function rad(k: number, m: number): string {
  if (m === 1) return String(k);
  if (k === 1) return '√' + m;
  if (k === -1) return '-√' + m;
  return k + '√' + m;
}
const sq = (n: number) => { const [k, m] = sqf(n); return rad(k, m); };
const roots = (r: number[]) => 'x = ' + [...new Set(r)].sort((a, b) => a - b).join(', ');
const randRad = () => rad(ri(1, 6), pick([2, 3, 5, 6, 7]));

function quadAns(b: number, D: number, half = true): string {
  const [k, m] = sqf(D);
  if (m === 1) return roots([(-b + k) / 2, (-b - k) / 2].filter(Number.isInteger));
  if (half && b % 2 === 0 && k % 2 === 0) {
    const h = -b / 2, r = rad(k / 2, m);
    return h === 0 ? `x = ±${r}` : `x = ${h} ± ${r}`;
  }
  if (!half) return `x = ${sg(-b)} ± ${rad(k, m)}`;
  return `x = (${sg(-b)} ± ${rad(k, m)})/2`;
}
function fmtA(a: number): string {
  if (Number.isInteger(a)) return a === 1 ? '' : a === -1 ? '-' : String(a);
  const d = a === 0.5 || a === -0.5 ? 2 : 3;
  const n = Math.round(a * d);
  return (n < 0 ? '-' : '') + Math.abs(n) + '/' + d;
}
const yax = (a: number) => `y = ${fmtA(a)}x²`;

// ---------- 中3 ----------
const genExpand = (): Q => {
  const t = ri(0, 3);
  const a = nz(-9, 9), b = nz(-9, 9);
  if (t === 0) {
    const ans = poly([1, a + b, a * b]);
    return mkQ(`${fx(a)}${fx(b)} を展開しなさい。`, ans,
      [poly([1, a * b, a + b]), poly([1, a - b, a * b]), poly([1, a + b, -a * b])],
      `(x+a)(x+b) = x² + (a+b)x + ab　→ 和は ${a + b}、積は ${a * b}`, () => poly([1, nz(-12, 12), nz(-30, 30)]));
  }
  if (t === 1) {
    const ans = poly([1, 2 * a, a * a]);
    return mkQ(`${fx(a)}² を展開しなさい。`, ans,
      [poly([1, 0, a * a]), poly([1, a, a * a]), poly([1, 2 * a, 2 * a])],
      `(x+a)² = x² + 2ax + a²　真ん中の 2ax を忘れないこと！`, () => poly([1, nz(-18, 18), ri(1, 81)]));
  }
  if (t === 2) {
    const c = Math.abs(a);
    return mkQ(`(x + ${c})(x - ${c}) を展開しなさい。`, poly([1, 0, -c * c]),
      [poly([1, 0, c * c]), poly([1, -2 * c, -c * c]), poly([1, 0, -2 * c])],
      `(x+a)(x-a) = x² - a²（和と差の積）`, () => poly([1, nz(-9, 9), -ri(1, 81)]));
  }
  const k = ri(2, 5), c = nz(-6, 6);
  const ans = poly([k, k * c]);
  return mkQ(`${k}x${fx(c)} を展開しなさい。`, ans,
    [poly([k, c]), poly([1, k * c]), poly([k, -k * c])], `分配法則：${k}x × x と ${k}x × ${par(c)} をたす`, () => poly([k, nz(-30, 30)]));
};
const genFactor = (): Q => {
  const t = ri(0, 2);
  if (t === 0) {
    const a = nz(-8, 8); let b = nz(-8, 8);
    if (a + b === 0) b = b + 1 || 2;
    const ans = fx(Math.min(a, b)) + fx(Math.max(a, b));
    return mkQ(`${poly([1, a + b, a * b])} を因数分解しなさい。`, ans,
      [fx(-Math.max(a, b)) + fx(-Math.min(a, b)), fx(Math.min(a, -b)) + fx(Math.max(a, -b)), fx(Math.min(-a, b)) + fx(Math.max(-a, b))],
      `かけて ${a * b}、たして ${a + b} になる2つの数は ${a} と ${b}`, () => fx(nz(-9, 9)) + fx(nz(-9, 9)));
  }
  if (t === 1) {
    const c = ri(1, 9);
    return mkQ(`x² - ${c * c} を因数分解しなさい。`, `(x + ${c})(x - ${c})`,
      [`(x - ${c})²`, `(x + ${c})²`, `(x - ${c * c})(x + 1)`], `x² - a² = (x+a)(x-a)　${c * c} = ${c}²`);
  }
  const c = nz(-7, 7);
  return mkQ(`${poly([1, 2 * c, c * c])} を因数分解しなさい。`, `${fx(c)}²`,
    [`${fx(-c)}²`, `${fx(c)}${fx(-c)}`, `${fx(2 * c)}²`], `x² + 2ax + a² = (x+a)²　${c * c} = ${Math.abs(c)}²、${2 * c} = 2×${c}`);
};
const genSqrt = (): Q => {
  const t = ri(0, 4);
  if (t === 0) {
    const k = ri(2, 5), m = pick([2, 3, 5, 6, 7]);
    return mkQ(`√${k * k * m} を a√b の形にしなさい。`, rad(k, m), [rad(m, k), rad(k + 1, m), rad(k * k, m)],
      `${k * k * m} = ${k}² × ${m} なので √${k * k * m} = ${rad(k, m)}`, randRad);
  }
  if (t === 1) {
    const p = pick([2, 3, 5, 6, 7, 8, 10, 12]), q = pick([2, 3, 6, 8, 12, 15, 18]);
    return mkQ(`√${p} × √${q} を計算しなさい。`, sq(p * q), [sq(p + q), rad(p, q), rad(q, p)],
      `√a × √b = √ab = √${p * q} → ${sq(p * q)}`, randRad);
  }
  if (t === 2) {
    const m = pick([2, 3, 5]), k1 = ri(1, 4), k2 = ri(2, 5);
    return mkQ(`√${k1 * k1 * m} + √${k2 * k2 * m} を計算しなさい。`, rad(k1 + k2, m),
      [sq((k1 * k1 + k2 * k2) * m), rad(k1 + k2, 2 * m), rad(k1 * k2, m)],
      `√${k1 * k1 * m} = ${rad(k1, m)}、√${k2 * k2 * m} = ${rad(k2, m)} → 同じ√${m}どうしをたす`, randRad);
  }
  if (t === 3) {
    const m = pick([2, 3, 5, 6, 7]), k = ri(1, 4);
    return mkQ(`${k * m}/√${m} の分母を有理化しなさい。`, rad(k, m), [rad(k * m, m), String(k), rad(1, m) + `/${k}`],
      `分母・分子に √${m} をかける：${k * m}√${m}/${m} = ${rad(k, m)}`, randRad);
  }
  const n = ri(2, 15);
  return mkQ(`${n * n} の平方根を答えなさい。`, `±${n}`, [String(n), String(-n), `±${n * n}`],
    `平方根は正と負の2つある！（√${n * n} なら ${n} だけ）`);
};
const genQuad = (): Q => {
  const t = ri(0, 3);
  if (t <= 1) {
    const a = nz(-8, 8), b = nz(-8, 8);
    const ans = roots([-a, -b]);
    const qs = t === 0 ? `${fx(a)}${fx(b)} = 0` : `${poly([1, a + b, a * b])} = 0`;
    return mkQ(`二次方程式 ${qs} を解きなさい。`, ans, [roots([a, b]), roots([-a, b]), roots([a, -b])],
      `${fx(a)}${fx(b)} = 0 → x ${a < 0 ? '-' : '+'} ${Math.abs(a)} = 0 または x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = 0`,
      () => roots([nz(-9, 9), nz(-9, 9)]));
  }
  if (t === 2) {
    const n = pick([2, 3, 5, 7, 8, 12, 18, 20, 9, 16, 25, 27]);
    const r = sq(n);
    return mkQ(`二次方程式 x² = ${n} を解きなさい。`, `x = ±${r}`, [`x = ${r}`, `x = ±${n / 2}`, `x = ±${sq(n * 2)}`],
      `x² = k → x = ±√k（プラスとマイナスの2つ）`, () => `x = ±${randRad()}`);
  }
  let b = 0, c = 0, D = 0;
  for (;;) {
    b = nz(-7, 7); c = ri(-6, 6); D = b * b - 4 * c;
    if (D > 0 && Math.sqrt(D) % 1 !== 0) break;
  }
  const D2 = b * b + 4 * c > 0 && Math.sqrt(b * b + 4 * c) % 1 !== 0 ? b * b + 4 * c : D + 4;
  return mkQ(`二次方程式 ${poly([1, b, c])} = 0 を解きなさい。（解の公式）`, quadAns(b, D),
    [quadAns(-b, D), quadAns(b, D2), quadAns(b, D, false)],
    `x = {-b ± √(b² - 4ac)} / 2a　a=1, b=${b}, c=${c} → √(${b * b} ${-4 * c < 0 ? '-' : '+'} ${Math.abs(4 * c)}) = √${D}`,
    () => quadAns(nz(-7, 7), pick([5, 13, 17, 21, 28, 29])));
};
const genFunc = (): Q => {
  const t = ri(0, 3);
  const a = pick([1, 2, 3, -1, -2, -3, 0.5, -0.5]);
  if (t === 0) {
    const p = pick([2, 4, -2, -4, 6]);
    const Y = a * p * p;
    return mkQ(`y は x の2乗に比例し、x = ${p} のとき y = ${Y} です。式を求めなさい。`, yax(a),
      [yax(Y / p), yax(-a), yax(Y)], `y = ax² に x=${p}, y=${Y} を代入：${Y} = a × ${p * p} → a = ${a === 1 ? 1 : a === -1 ? -1 : fmtA(a)}`,
      () => yax(pick([4, -4, 5, 1 / 3, 6])));
  }
  if (t === 1) {
    const A = nz(-3, 3);
    const x1 = ri(-3, 3); const x2 = x1 + ri(1, 4);
    const r = A * (x1 + x2);
    return mkQ(`関数 ${yax(A)} で、x が ${x1} から ${x2} まで増加するときの変化の割合を求めなさい。`, String(r),
      [String(A * (x2 - x1)), String(A * x2 * x2 - A * x1 * x1), String(-r)],
      `変化の割合 = yの増加量 ÷ xの増加量 = (${A * x2 * x2} - ${par(A * x1 * x1)}) ÷ (${x2} - ${par(x1)}) = ${r}`, () => String(nz(-20, 20)));
  }
  if (t === 2) {
    const A = pick([1, 2, 3, -1, -2]);
    const m = -ri(1, 4), n = ri(1, 4);
    const top = A * Math.max(m * m, n * n);
    const ans = A > 0 ? `0 ≤ y ≤ ${top}` : `${top} ≤ y ≤ 0`;
    const lo = A * m * m, hi = A * n * n;
    return mkQ(`関数 ${yax(A)} で、x の変域が ${m} ≤ x ≤ ${n} のとき、y の変域を求めなさい。`, ans,
      [`${Math.min(lo, hi)} ≤ y ≤ ${Math.max(lo, hi)}`, A > 0 ? `0 ≤ y ≤ ${A * Math.min(m * m, n * n)}` : `${A * Math.min(m * m, n * n)} ≤ y ≤ 0`, `${A * m} ≤ y ≤ ${A * n}`],
      `x の変域に 0 がふくまれるので、y の${A > 0 ? '最小値' : '最大値'}は 0！ グラフをかいて確かめよう`,
      () => `0 ≤ y ≤ ${ri(1, 40)}`);
  }
  const p = nz(-4, 4); const A = nz(-3, 3);
  return mkQ(`関数 ${yax(A)} で、x = ${p} のときの y の値は？`, String(A * p * p),
    [String(A * p * 2), String(A * A * p * p), String(-A * p * p)], `${A} × ${par(p)}² = ${A} × ${p * p}`, () => String(nz(-50, 50)));
};
const genSim = (): Q => {
  const t = ri(0, 3);
  const pairs = [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 3], [4, 5]];
  const [m, n] = pick(pairs);
  if (t === 0) return mkQ(`相似比が ${m}:${n} の2つの図形の面積比は？`, `${m * m}:${n * n}`, [`${m}:${n}`, `${m ** 3}:${n ** 3}`, `${2 * m}:${2 * n}`], `面積比 = 相似比の2乗`);
  if (t === 1) return mkQ(`相似比が ${m}:${n} の2つの立体の体積比は？`, `${m ** 3}:${n ** 3}`, [`${m * m}:${n * n}`, `${m}:${n}`, `${3 * m}:${3 * n}`], `体積比 = 相似比の3乗（表面積比は2乗）`);
  if (t === 2) {
    const s = m * m * ri(1, 4);
    const big = (s / (m * m)) * n * n;
    return mkQ(`相似比 ${m}:${n} の図形があり、小さいほうの面積が ${s}cm² です。大きいほうの面積は？`, `${big}cm²`,
      [`${(s / m) * n}cm²`, `${(s / m ** 3) * n ** 3}cm²`.replace(/\.\d+/, ''), `${s * n}cm²`], `${s} × (${n}/${m})² = ${big}`, () => `${ri(10, 120)}cm²`);
  }
  const a = ri(2, 6), b = ri(1, 5), k = ri(1, 3);
  const BC = (a + b) * k, DE = a * k;
  return mkQ(`△ABC で、辺AB上に点D、辺AC上に点Eがあり、DE // BC です。AD = ${a}cm、DB = ${b}cm、BC = ${BC}cm のとき、DE の長さは？`,
    `${DE}cm`, [`${frac(BC * a, b).includes('/') ? BC + a : (BC * a) / b}cm`, `${b * k}cm`, `${BC - b}cm`],
    `AD:AB = DE:BC → ${a}:${a + b} = DE:${BC}（AB = AD + DB に注意！）`, () => `${ri(2, 20)}cm`);
};
const genCircle = (): Q => {
  const t = ri(0, 2);
  if (t === 0) {
    const c = 2 * ri(20, 85);
    return mkQ(`円Oで、弧ABに対する中心角∠AOB = ${c}° のとき、弧ABに対する円周角∠APBは？`, `${c / 2}°`, [`${c}°`, `${180 - c / 2}°`, `${c * 2}°`].filter(x => x !== '360°'), `円周角 = 中心角の半分`, () => `${ri(20, 140)}°`);
  }
  if (t === 1) {
    const p = ri(20, 80);
    return mkQ(`円周角∠APB = ${p}° のとき、同じ弧ABに対する中心角∠AOBは？`, `${2 * p}°`, [`${p}°`, `${180 - p}°`, `${p / 2}°`], `中心角 = 円周角の2倍`, () => `${ri(20, 160)}°`);
  }
  const x = ri(20, 70);
  return mkQ(`ABが円Oの直径で、点Cは円周上の点です。∠CAB = ${x}° のとき、∠ABCは？`, `${90 - x}°`, [`${x}°`, `${180 - x}°`, `${180 - 2 * x}°`], `直径に対する円周角は 90°（∠ACB = 90°）→ 180 - 90 - ${x}`, () => `${ri(10, 80)}°`);
};
const genPy = (): Q => {
  const t = ri(0, 3);
  if (t === 0) {
    const [a, b] = pick([[3, 4], [5, 12], [6, 8], [8, 15], [1, 2], [2, 3], [1, 3], [2, 4], [3, 6], [4, 4], [2, 2]]);
    return mkQ(`直角三角形で、直角をはさむ2辺が ${a}cm と ${b}cm のとき、斜辺の長さは？`, sq(a * a + b * b) + 'cm',
      [a + b + 'cm', sq(Math.abs(b * b - a * a) || 2) + 'cm', sq(a * a + b * b + 1) + 'cm'], `斜辺² = ${a}² + ${b}² = ${a * a + b * b}`, () => randRad() + 'cm');
  }
  if (t === 1) {
    const [c, a] = pick([[5, 3], [13, 5], [10, 6], [17, 8], [3, 1], [4, 2], [6, 3], [7, 3]]);
    return mkQ(`直角三角形で、斜辺が ${c}cm、他の1辺が ${a}cm のとき、残りの辺の長さは？`, sq(c * c - a * a) + 'cm',
      [sq(c * c + a * a) + 'cm', c - a + 'cm', sq(c * c - a * a + 2) + 'cm'], `残りの辺² = ${c}² - ${a}² = ${c * c - a * a}`, () => randRad() + 'cm');
  }
  if (t === 2) {
    const k = ri(2, 8);
    return pick([
      mkQ(`直角二等辺三角形で、等しい2辺が ${k}cm のとき、斜辺は？`, rad(k, 2) + 'cm', [rad(k, 3) + 'cm', 2 * k + 'cm', k + 'cm'], `辺の比 1 : 1 : √2`),
      mkQ(`30°・60°・90°の直角三角形で、斜辺が ${2 * k}cm のとき、いちばん短い辺は？`, k + 'cm', [rad(k, 3) + 'cm', rad(k, 2) + 'cm', 2 * k + 'cm'], `辺の比 1 : 2 : √3（斜辺が2）`),
      mkQ(`30°・60°・90°の直角三角形で、いちばん短い辺が ${k}cm のとき、残りの直角をはさむ辺は？`, rad(k, 3) + 'cm', [2 * k + 'cm', rad(k, 2) + 'cm', rad(2 * k, 3) + 'cm'], `辺の比 1 : 2 : √3`),
    ]);
  }
  const x1 = ri(-3, 3), y1 = ri(-3, 3), dx = nz(-5, 5), dy = nz(-5, 5);
  return mkQ(`2点 A(${x1}, ${y1})、B(${x1 + dx}, ${y1 + dy}) の間の距離は？`, sq(dx * dx + dy * dy),
    [String(Math.abs(dx) + Math.abs(dy)), sq(Math.abs(dx * dx - dy * dy) || 3), sq(dx * dx + dy * dy + 2)], `横 ${Math.abs(dx)}、縦 ${Math.abs(dy)} の直角三角形の斜辺：√(${dx * dx} + ${dy * dy})`, randRad);
};
const genSample = (): Q => {
  const mark = pick([30, 40, 50, 60, 100]), cap = pick([40, 50, 60, 80]), got = pick([4, 5, 8, 10]);
  const N = (mark * cap) / got;
  return mkQ(`池の魚 ${mark} 匹に印をつけて池にもどしました。数日後 ${cap} 匹をつかまえたところ、印のついた魚が ${got} 匹いました。池の魚はおよそ何匹？`,
    `およそ${Math.round(N)}匹`, [`およそ${Math.round(N * 2)}匹`, `およそ${Math.round((mark * got) / cap)}匹`, `およそ${Math.round(N / 2)}匹`],
    `印の割合は等しい： ${got}/${cap} = ${mark}/x → x = ${mark}×${cap}÷${got}`);
};
// ---------- 復習（中1・中2） ----------
const genSign = (): Q => {
  const t = ri(0, 2);
  const a = nz(-9, 9), b = nz(-9, 9), c = nz(-6, 6);
  if (t === 0) {
    const r = a + b * c;
    return mkQ(`${a} + ${par(b)} × ${par(c)} を計算しなさい。`, String(r), [String((a + b) * c), String(a - b * c), String(-r)], `かけ算を先に：${par(b)} × ${par(c)} = ${b * c}`, () => String(nz(-60, 60)));
  }
  if (t === 1) {
    const n = ri(3, 6);
    return pick([
      mkQ(`-${n}² を計算しなさい。`, String(-n * n), [String(n * n), String(-2 * n), String(2 * n)], `-${n}² = -(${n}×${n})　（-${n}）² とのちがいに注意`),
      mkQ(`(-${n})² を計算しなさい。`, String(n * n), [String(-n * n), String(-2 * n), String(2 * n)], `(-${n}) × (-${n}) = ${n * n}`),
    ]);
  }
  const r = a - b;
  return mkQ(`${a} - ${par(b)} を計算しなさい。`, String(r), [String(a + b), String(-r), String(-a - b)], `ひく数の符号を変えてたす：${a} + ${par(-b)}`, () => String(nz(-18, 18)));
};
const genLinear = (): Q => {
  const x0 = nz(-6, 6); let a = nz(-5, 6), c = nz(-4, 4);
  if (a === c) a = c + 2;
  const b = ri(-9, 9), d = a * x0 + b - c * x0;
  const L = poly([a, b]), R = poly([c, d]);
  return mkQ(`方程式 ${L} = ${R} を解きなさい。`, `x = ${x0}`, [`x = ${-x0}`, `x = ${x0 + 1}`, `x = ${x0 - 2}`],
    `xの項を左、数を右に移項：${a - c}x = ${d - b}`, () => `x = ${nz(-9, 9)}`);
};
const genSimul = (): Q => {
  const x = nz(-5, 5), y = nz(-5, 5);
  let a1 = 0, b1 = 0, a2 = 0, b2 = 0;
  do { a1 = nz(-4, 4); b1 = nz(-4, 4); a2 = nz(-4, 4); b2 = nz(-4, 4); } while (a1 * b2 - a2 * b1 === 0);
  const e1 = `${poly([a1, 0]).replace('x', 'x')} ${b1 < 0 ? '-' : '+'} ${Math.abs(b1) === 1 ? '' : Math.abs(b1)}y = ${a1 * x + b1 * y}`;
  const e2 = `${poly([a2, 0])} ${b2 < 0 ? '-' : '+'} ${Math.abs(b2) === 1 ? '' : Math.abs(b2)}y = ${a2 * x + b2 * y}`;
  const f = (p: number, q: number) => `x = ${p}, y = ${q}`;
  return mkQ(`連立方程式 { ${e1}　,　${e2} } を解きなさい。`, f(x, y), [f(y, x), f(-x, y), f(x, -y)],
    `加減法か代入法で1つの文字を消去する。答えを両方の式に代入して確かめよう`, () => f(nz(-6, 6), nz(-6, 6)));
};
const genLinFunc = (): Q => {
  const m = nz(-3, 3), k = ri(-5, 5);
  const x1 = ri(-3, 2), x2 = x1 + ri(1, 3);
  const y1 = m * x1 + k, y2 = m * x2 + k;
  const L = (s: number, i: number) => 'y = ' + poly([s, i]);
  return mkQ(`2点 (${x1}, ${y1})、(${x2}, ${y2}) を通る直線の式は？`, L(m, k), [L(-m, k), L(m, -k), L(m, y1)],
    `傾き = (${y2} - ${par(y1)}) ÷ (${x2} - ${par(x1)}) = ${m}。y = ${m}x + b に1点を代入して b = ${k}`, () => L(nz(-4, 4), ri(-6, 6)));
};
const genProb = (): Q => {
  const s = ri(3, 11);
  let cnt = 0;
  for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === s) cnt++;
  return mkQ(`大小2つのさいころを投げるとき、出る目の和が ${s} になる確率は？`, frac(cnt, 36),
    shuffle([frac(cnt, 18), frac(1, 6) === frac(cnt, 36) ? frac(1, 12) : frac(1, 6), frac(cnt + 1, 36), frac(cnt, 11)]),
    `全部で 6×6 = 36 通り。和が ${s} になるのは ${cnt} 通り → ${cnt}/36`);
};

export const math: Subject = {
  id: 'math', name: '数学', short: '数', icon: '📐', color: '#3b82f6',
  units: [
    {
      id: 'm-expand', title: '式の展開と因数分解', tag: '中3',
      lesson: `## 乗法公式（展開）
- (x + a)(x + b) = x² + (a + b)x + ab
- (x + a)² = x² + 2ax + a²
- (x - a)² = x² - 2ax + a²
- (x + a)(x - a) = x² - a²
> (x+3)² を x² + 9 にしてしまうミスが多い！ 真ん中の 2ax（6x）を忘れない。
## 因数分解 = 展開の逆
- まず共通因数をくくり出す：3x² + 6x = 3x(x + 2)
- x² + 5x + 6 → 「かけて 6、たして 5」の2数は 2 と 3 → (x + 2)(x + 3)
- x² - 9 = (x + 3)(x - 3)
- x² + 10x + 25 = (x + 5)²
> 答えを展開してもとの式にもどるか必ず確かめよう。`,
      gens: [genExpand, genFactor],
      qs: [
        ['2x² - 8 を因数分解しなさい。', '2(x + 2)(x - 2)', '(2x + 4)(x - 2)|2(x - 2)²|2(x² - 4)', 'まず共通因数 2 をくくる → 2(x² - 4) → さらに因数分解'],
        ['展開した式を因数分解すると、もとの式にもどる。この関係は？', '展開と因数分解は逆の計算', '展開と因数分解は同じ計算|因数分解は割り算のこと|関係はない'],
        ['99² を工夫して計算すると？', '9801', '9811|9701|9891', '(100 - 1)² = 10000 - 200 + 1'],
      ],
    },
    {
      id: 'm-sqrt', title: '平方根', tag: '中3',
      lesson: `## 平方根とは
- 2乗すると a になる数を a の平方根という。正と負の2つある。
- 9 の平方根は ±3、√9 = 3（√は正のほうだけ）
## √ の計算
- √a × √b = √ab　/　√a ÷ √b = √(a/b)
- a√b の形にする：√12 = √(4×3) = 2√3
- たし算・ひき算は同じ√どうし：2√3 + 5√3 = 7√3
! √2 + √3 = √5 は まちがい！
## 分母の有理化
- 6/√3 = 6√3/3 = 2√3（分母と分子に √3 をかける）
> 大小比較：√をはずして2乗で比べる。3 = √9 なので √10 > 3`,
      gens: [genSqrt],
      qs: [
        ['次のうち無理数はどれ？', '√5', '√16|0.25|2/3', '√16 = 4 は整数（有理数）'],
        ['3, √10, √8 を小さい順に並べると？', '√8, 3, √10', '3, √8, √10|√10, 3, √8|√8, √10, 3', '3 = √9 なので √8 < √9 < √10'],
        ['√7 の値に最も近い整数は？', '3', '2|4|7', '√4 = 2、√9 = 3、7 は 9 に近い'],
        ['√2 = 1.414 として、√200 の値は？', '14.14', '1.414|141.4|4.14', '√200 = 10√2'],
      ],
    },
    {
      id: 'm-quad', title: '二次方程式', tag: '2学期',
      lesson: `## 解き方は3つ
- ① 平方根の考え：x² = 7 → x = ±√7　/　(x+2)² = 9 → x+2 = ±3 → x = 1, -5
- ② 因数分解：x² - 5x + 6 = 0 → (x-2)(x-3) = 0 → x = 2, 3
- ③ 解の公式：ax² + bx + c = 0 のとき
> x = { -b ± √(b² - 4ac) } / 2a
## 手順
- まず「右辺 = 0」に整理する
- 因数分解できるか考える → できなければ解の公式
! x² = 3x を両辺 x でわるのはダメ（x = 0 の解が消える）→ x² - 3x = 0 → x(x - 3) = 0 → x = 0, 3
## 文章題
- 求めた解が問題に合うか（長さは正、人数は自然数など）を必ず確かめる`,
      gens: [genQuad],
      qs: [
        ['2x² + 3x - 1 = 0 を解きなさい。', 'x = (-3 ± √17)/4', 'x = (-3 ± √17)/2|x = (3 ± √17)/4|x = (-3 ± √1)/4', 'a=2, b=3, c=-1 → √(9 + 8) = √17、分母は 2a = 4'],
        ['x² = 5x を解きなさい。', 'x = 0, 5', 'x = 5|x = ±√5|x = -5, 0', 'x² - 5x = 0 → x(x - 5) = 0'],
        ['x² + ax - 12 = 0 の解の1つが 3 のとき、a の値は？', 'a = 1', 'a = -1|a = 4|a = -4', '9 + 3a - 12 = 0 → a = 1'],
        ['連続する2つの自然数の積が 56 のとき、2つの数は？', '7 と 8', '6 と 7|8 と 9|-8 と -7', 'x(x+1) = 56 → x = 7, -8。自然数なので 7'],
        ['周りの長さ 20cm、面積 24cm² の長方形の縦の長さ（横より短い）は？', '4cm', '6cm|5cm|3cm', '縦 x、横 10 - x：x(10 - x) = 24 → x = 4, 6'],
      ],
    },
    {
      id: 'm-func', title: '関数 y = ax²', tag: '2学期',
      lesson: `## y は x の2乗に比例する
- 式：y = ax²（a は比例定数）
- グラフ：原点を通る放物線。y軸について対称
- a > 0 → 上に開く、a < 0 → 下に開く。|a| が大きいほど細い
## 変化の割合
> 変化の割合 = yの増加量 ÷ xの増加量
- y = ax² では一定ではない。x が p から q のとき a(p + q) になる
## 変域
! x の変域に 0 をふくむとき、y の最小値（a < 0 なら最大値）は 0！
- 例：y = x²、-2 ≤ x ≤ 3 → 0 ≤ y ≤ 9（4 ≤ y ≤ 9 はまちがい）
## 平均の速さ
- 落下の距離 y = 5x² で、1秒後から3秒後の平均の速さ = 5(1+3) = 20 m/秒`,
      gens: [genFunc],
      qs: [
        ['y = 2x² のグラフについて正しいのは？', '上に開いた放物線', '下に開いた放物線|原点を通る直線|y軸と交わらない', 'a = 2 > 0 なので上に開く'],
        ['y = x² と y = 3x² のグラフで、開き方が小さい（細い）のは？', 'y = 3x²', 'y = x²|同じ|比べられない', '|a| が大きいほど細い'],
        ['y = -x² のグラフと x 軸について対称なグラフは？', 'y = x²', 'y = -2x²|y = x|y = -x²', 'a の符号が逆になる'],
        ['ボールが転がる距離 y = 2x²（x 秒後, m）で、2秒後から4秒後の平均の速さは？', '12 m/秒', '6 m/秒|24 m/秒|8 m/秒', '2 × (2 + 4) = 12'],
      ],
    },
    {
      id: 'm-sim', title: '相似な図形', tag: '2学期',
      lesson: `## 相似
- 形が同じで大きさがちがう図形。記号 ∽
- 対応する辺の比はすべて等しい（相似比）、対応する角は等しい
## 三角形の相似条件
- ① 3組の辺の比がすべて等しい
- ② 2組の辺の比とその間の角がそれぞれ等しい
- ③ 2組の角がそれぞれ等しい（いちばんよく使う！）
## 平行線と線分の比
- DE // BC のとき AD:AB = AE:AC = DE:BC
- AD:DB = AE:EC
! DE:BC は AD:DB ではなく AD:AB！
## 中点連結定理
- 2辺の中点を結ぶ線分は残りの辺に平行で、長さはその半分
## 面積比・体積比
> 相似比 m:n → 面積比 m²:n²、体積比 m³:n³`,
      gens: [genSim],
      qs: [
        ['三角形の相似条件として正しくないものは？', '1組の辺の比と1組の角が等しい', '2組の角がそれぞれ等しい|3組の辺の比がすべて等しい|2組の辺の比とその間の角が等しい'],
        ['△ABC で辺AB、ACの中点をM、Nとする。BC = 10cm のとき MN は？', '5cm', '10cm|20cm|2.5cm', '中点連結定理：MN = BC/2'],
        ['相似比 2:3 の円柱A, Bがある。Aの体積が 16cm³ のとき Bの体積は？', '54cm³', '24cm³|36cm³|48cm³', '体積比 8:27 → 16 × 27/8 = 54'],
        ['地図の縮尺 1:25000 で 4cm の距離は実際は？', '1km', '100m|10km|4km', '4 × 25000 = 100000cm = 1km'],
      ],
    },
    {
      id: 'm-circle', title: '円周角の定理', tag: '中3',
      lesson: `## 円周角の定理
- 1つの弧に対する円周角は、中心角の半分
- 同じ弧に対する円周角はすべて等しい
- 半円の弧（直径）に対する円周角は 90°
> 等しい弧に対する円周角は等しい
## 解くコツ
- 中心角がかくれていないか探す、直径があれば 90° を書きこむ
- 三角形の内角の和 180°、二等辺三角形（半径どうし）も使う`,
      gens: [genCircle],
      qs: [
        ['円周を6等分した点で、1つの弧（1/6周）に対する円周角は？', '30°', '60°|45°|120°', '中心角 360÷6 = 60° → 円周角 30°'],
        ['4点 A, B, C, D が1つの円周上にあるといえる条件は？', '∠BAC = ∠BDC（同じ側）', '∠BAC + ∠BDC = 90°|AB = CD|AC ⊥ BD', '円周角の定理の逆'],
      ],
    },
    {
      id: 'm-py', title: '三平方の定理', tag: '中3',
      lesson: `## 三平方の定理
> 直角三角形で、斜辺を c とすると a² + b² = c²
- 3:4:5、5:12:13 は覚えておくと速い
## 特別な直角三角形
- 直角二等辺三角形（45°）：1 : 1 : √2
- 30°・60°・90°：1 : 2 : √3（2 が斜辺）
## 利用
- 2点間の距離：横の差と縦の差で直角三角形を作る
- 長方形の対角線 = √(縦² + 横²)
- 直方体の対角線 = √(a² + b² + c²)
- 円すいの高さ = √(母線² - 半径²)`,
      gens: [genPy],
      qs: [
        ['1辺 6cm の正三角形の高さは？', '3√3cm', '3cm|6√3cm|3√2cm', '半分に切ると 30°60°90° の三角形。3 : 6 : 3√3'],
        ['縦 2cm、横 3cm、高さ 6cm の直方体の対角線は？', '7cm', '11cm|√13cm|√41cm', '√(4 + 9 + 36) = √49'],
        ['3辺が 5cm, 12cm, 13cm の三角形は？', '直角三角形', '正三角形|二等辺三角形|鈍角三角形', '5² + 12² = 169 = 13²'],
      ],
    },
    {
      id: 'm-sample', title: '標本調査', tag: '中3',
      lesson: `## 全数調査と標本調査
- 全数調査：全部調べる（国勢調査、学校の健康診断）
- 標本調査：一部を調べて全体を推定（テレビの視聴率、世論調査、品質検査）
- 母集団 = 調べたい全体、標本 = 取り出した一部
> 標本はかたよりなく無作為に抽出する
## 推定の計算
- 印をつけた魚の割合が池全体と標本で等しいと考える`,
      gens: [genSample],
      qs: [
        ['標本調査が適しているのは？', '缶詰の品質検査', '国勢調査|学校の健康診断|入学試験', '全部調べると商品がなくなる'],
        ['標本を選ぶ方法として適切なのは？', '乱数を使って無作為に選ぶ', '仲のよい友達を選ぶ|1組だけ調べる|先着順に選ぶ'],
        ['袋の中の白玉と赤玉。40個取り出すと赤玉は 8 個。袋に全部で 500 個あるとき赤玉はおよそ？', '100個', '80個|160個|400個', '500 × 8/40'],
      ],
    },
    { id: 'm-r-sign', title: '【復習】正負の数', tag: '復習', lesson: `## 計算のルール
- かけ算・わり算：負の数が偶数個 → +、奇数個 → -
- ひき算はひく数の符号を変えてたす：5 - (-3) = 5 + 3
- 順番：( ) → 累乗 → ×÷ → +-
! -3² = -9、(-3)² = 9`, gens: [genSign] },
    { id: 'm-r-eq', title: '【復習】一次方程式・連立方程式', tag: '復習', lesson: `## 一次方程式
- 移項すると符号が変わる：3x + 5 = x - 7 → 3x - x = -7 - 5 → x = -6
## 連立方程式
- 加減法：式を何倍かしてたす・ひくで文字を消す
- 代入法：y = 〜 の式を他の式に代入
> 答えは両方の式に代入して確かめる`, gens: [genLinear, genSimul] },
    { id: 'm-r-lin', title: '【復習】一次関数', tag: '復習', lesson: `## y = ax + b
- a：傾き（変化の割合、一定）、b：切片（y軸との交点）
- 2点を通る直線：傾き = yの増加量 ÷ xの増加量 → 1点を代入して b を求める
- 平行な直線は傾きが等しい`, gens: [genLinFunc] },
    { id: 'm-r-prob', title: '【復習】確率', tag: '復習', lesson: `## 確率
> 確率 = あることがらの起こる場合の数 ÷ すべての場合の数
- さいころ2つ：6 × 6 = 36 通り。表をかくとミスがない
- 「少なくとも1回」は 1 - (1回も起こらない確率)`, gens: [genProb],
      qs: [['硬貨を2枚投げるとき、少なくとも1枚表が出る確率は？', '3/4', '1/2|1/4|2/3', '1 - (2枚とも裏 1/4)'], ['1から10のカードから1枚引くとき、3の倍数の確率は？', '3/10', '1/3|1/10|3/5', '3, 6, 9 の3枚']] },
  ],
};
