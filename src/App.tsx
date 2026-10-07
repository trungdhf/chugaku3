import { useEffect, useMemo, useRef, useState } from 'react';
import { PIN_KEY, cloudGet, cloudPut } from './cloud';
import { SUBJECTS, UNIT_MAP, mixQuestions, unitQuestions, type QI } from './data';
import type { Subject } from './data/types';
import { shuffle } from './data/types';
import { type Prog, load, save, record, mastery, streak, daysLeft, today, wkey, exportCode, importCode, blank, merge } from './progress';

type View =
  | { v: 'home' }
  | { v: 'subj'; id: string }
  | { v: 'lesson'; id: string }
  | { v: 'quiz'; qs: QI[]; title: string; mode: 'unit' | 'test' | 'daily' | 'review'; subj?: string; back: View }
  | { v: 'stats' }
  | { v: 'scope' }
  | { v: 'tips' };

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.9;
  speechSynthesis.speak(u);
};
const englishOnly = (q: string, a: string) => {
  const s = q.replace(/[（(]\s*[)）]/, a);
  return s.replace(/[「」（）]/g, ' ').replace(/[^\x20-\x7E’]+/g, ' ').replace(/\s+/g, ' ').trim();
};

function Inline({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}</>;
}
function Md({ src }: { src: string }) {
  const lines = src.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('## ')) out.push(<h3 key={out.length}>{l.slice(3)}</h3>);
    else if (l.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i++].slice(2));
      out.push(<ul key={out.length}>{items.map((t, j) => <li key={j}><Inline t={t} /></li>)}</ul>);
      continue;
    } else if (l.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++].split('|').slice(1, -1).map(c => c.trim()));
      out.push(
        <div className="tbl" key={out.length}><table><thead><tr>{rows[0].map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
          <tbody>{rows.slice(1).map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}><Inline t={c} /></td>)}</tr>)}</tbody></table></div>,
      );
      continue;
    } else if (l.startsWith('> ')) out.push(<div className="point" key={out.length}>💡 <Inline t={l.slice(2)} /></div>);
    else if (l.startsWith('! ')) out.push(<div className="warn" key={out.length}>⚠️ <Inline t={l.slice(2)} /></div>);
    else if (l.trim()) out.push(<p key={out.length}><Inline t={l} /></p>);
    i++;
  }
  return <div className="md">{out}</div>;
}

function Bar({ v, color }: { v: number; color?: string }) {
  return <div className="bar"><div style={{ width: `${v}%`, background: color || (v >= 80 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#ef4444') }} /></div>;
}

type CloudState = { s: 'off' | 'sync' | 'ok' | 'err'; at?: number };
type Cloud = { pin: string; cs: CloudState; login: (pin: string) => Promise<boolean>; logout: () => void; sync: () => void };

function CloudBox({ cloud }: { cloud: Cloud }) {
  const [v, setV] = useState('');
  const [msg, setMsg] = useState('');
  const { pin, cs } = cloud;
  const st = cs.s === 'sync' ? '同期中…' : cs.s === 'err' ? '⚠️ 通信できません（あとで自動で再同期）' : cs.at ? `✅ 保存済み（${new Date(cs.at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}）` : '';
  if (pin) return (
    <div className="cloud">
      <div className="cloud-h">☁️ クラウド保存：オン</div>
      <div className="muted">PIN ••••{pin.slice(-2)}・{st}</div>
      <p className="muted">答えるたびに自動で保存されます。ほかの端末でも同じPINを入れると続きから学習できます。</p>
      <div className="row2">
        <button className="big sm" onClick={cloud.sync}>🔄 今すぐ同期</button>
        <button className="big alt sm" onClick={() => { if (confirm('ログアウトしますか？（この端末の記録は残ります）')) cloud.logout(); }}>ログアウト</button>
      </div>
    </div>
  );
  return (
    <div className="cloud">
      <div className="cloud-h">☁️ クラウドに保存する</div>
      <p className="muted">数字の PIN（4〜8けた、6けたがおすすめ）を決めて入れてください。別の端末でも同じPINで続きができます。PINは忘れないようにメモしておこう。</p>
      <input inputMode="numeric" pattern="[0-9]*" maxLength={8} placeholder="PIN（数字）" value={v} onChange={e => setV(e.target.value.replace(/\D/g, ''))} />
      <button className="big sm" disabled={v.length < 4 || cs.s === 'sync'} onClick={async () => { setMsg(''); if (!(await cloud.login(v))) setMsg('⚠️ 接続できませんでした。もう一度ためしてください。'); }}>
        {cs.s === 'sync' ? '接続中…' : '☁️ このPINで保存・読みこみ'}
      </button>
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}

function subjMastery(p: Prog, s: Subject, scopeOnly: boolean) {
  const us = s.units.filter(u => !scopeOnly || p.exam.scope.includes(u.id));
  if (!us.length) return null;
  return Math.round(us.reduce((a, u) => a + mastery(p, u.id), 0) / us.length);
}

export default function App() {
  const [prog, setProg] = useState<Prog>(load);
  const [view, setView] = useState<View>({ v: 'home' });
  const [pin, setPin] = useState(() => localStorage.getItem(PIN_KEY) || '');
  const [cs, setCs] = useState<CloudState>({ s: pin ? 'sync' : 'off' });
  const ready = useRef(false);
  const progRef = useRef(prog);
  const setP = (f: (p: Prog) => Prog) => setProg(p => ({ ...f(p), updated: Date.now() }));

  const pull = async (pn: string) => {
    setCs({ s: 'sync' });
    try {
      const c = await cloudGet(pn);
      setProg(cur => (c ? merge(cur, { ...blank(), ...c }) : { ...cur }));
      ready.current = true;
      setCs({ s: 'ok', at: Date.now() });
      return true;
    } catch {
      setCs({ s: 'err' });
      return false;
    }
  };
  useEffect(() => {
    save(prog);
    progRef.current = prog;
    if (!pin || !ready.current) return;
    const t = setTimeout(() => {
      setCs({ s: 'sync' });
      cloudPut(pin, prog).then(() => setCs({ s: 'ok', at: Date.now() }), () => setCs({ s: 'err' }));
    }, 1500);
    return () => clearTimeout(t);
  }, [prog, pin]);
  useEffect(() => {
    if (!pin) return;
    if (!ready.current) pull(pin);
    const vis = () => { if (document.visibilityState === 'visible') pull(pin); };
    const hide = () => { if (ready.current) cloudPut(pin, progRef.current, true).catch(() => {}); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', hide);
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('pagehide', hide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);
  const cloud: Cloud = {
    pin, cs,
    login: async pn => {
      ready.current = false;
      const ok = await pull(pn);
      if (ok) { localStorage.setItem(PIN_KEY, pn); setPin(pn); }
      return ok;
    },
    logout: () => { localStorage.removeItem(PIN_KEY); ready.current = false; setPin(''); setCs({ s: 'off' }); },
    sync: () => { if (pin) pull(pin); },
  };
  useEffect(() => window.scrollTo(0, 0), [view]);

  const [nav_n, setNavN] = useState(0);
  const go = (v: View) => { setNavN(n => n + 1); setView(v); };
  const nav = (
    <nav className="nav">
      {([['home', '🏠', 'ホーム'], ['scope', '🎯', 'テスト範囲'], ['stats', '📊', '記録'], ['tips', '⭐', '評定アップ']] as const).map(([v, ic, label]) => (
        <button key={v} className={view.v === v ? 'on' : ''} onClick={() => go({ v } as View)}><span>{ic}</span>{label}</button>
      ))}
    </nav>
  );

  let body: React.ReactNode = null;
  if (view.v === 'home') body = <Home p={prog} go={go} cloudOn={!!pin} />;
  else if (view.v === 'subj') body = <SubjectView p={prog} setP={setP} id={view.id} go={go} />;
  else if (view.v === 'lesson') body = <Lesson p={prog} setP={setP} id={view.id} go={go} />;
  else if (view.v === 'quiz') body = <Quiz key={nav_n} view={view} p={prog} setP={setP} go={go} />;
  else if (view.v === 'stats') body = <Stats p={prog} setP={setP} cloud={cloud} />;
  else if (view.v === 'scope') body = <Scope p={prog} setP={setP} />;
  else if (view.v === 'tips') body = <Tips p={prog} setP={setP} />;

  return <div className="app">{body}{view.v !== 'quiz' && nav}</div>;
}

function Home({ p, go, cloudOn }: { p: Prog; go: (v: View) => void; cloudOn: boolean }) {
  const d = today();
  const done = p.days[d]?.n || 0;
  const left = daysLeft(p);
  const wrongN = Object.keys(p.wrong).length;
  const daily = () => {
    const ranked = shuffle(p.exam.scope).sort((a, b) => mastery(p, a) - mastery(p, b)).slice(0, 4);
    const ws = shuffle(Object.values(p.wrong)).slice(0, 3).map(w => w.q);
    const qs = [...ws, ...mixQuestions(ranked, 10 - ws.length)];
    go({ v: 'quiz', qs: shuffle(qs), title: '今日のおすすめ10問', mode: 'daily', back: { v: 'home' } });
  };
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <h1>中3 評定アップ</h1>
          <span className="streak">🔥 {streak(p)}日連続</span>
        </div>
        <div className="count">
          {left >= 0 ? <>期末テストまで <b>あと{left}日</b></> : <>期末テストおつかれさま！</>}
          <small>（{p.exam.date.replace(/-/g, '/')}{p.exam.set ? '' : '・仮'}）</small>
        </div>
        <div className="today">
          <span>今日の問題 {done} / {p.goal}問</span>
          <Bar v={Math.min(100, (done / p.goal) * 100)} color="#fff" />
        </div>
      </header>
      <button className="big" onClick={daily}>▶ 今日のおすすめ10問<small>テスト範囲の苦手から出題</small></button>
      {!cloudOn && <button className="cloud-tip" onClick={() => go({ v: 'stats' })}>☁️ PINを決めて、記録をクラウドに保存しよう ›</button>}
      {wrongN > 0 && (
        <button className="big alt" onClick={() => go({ v: 'quiz', qs: shuffle(Object.values(p.wrong).map(w => w.q)).slice(0, 10), title: '間違いノート復習', mode: 'review', back: { v: 'home' } })}>
          📕 間違いノート（{wrongN}問）<small>2回連続正解で卒業</small>
        </button>
      )}
      <h2>教科（評定2 → 3 を目指す）</h2>
      <div className="grid">
        {SUBJECTS.map(s => {
          const m = subjMastery(p, s, true);
          return (
            <button key={s.id} className="card" style={{ borderColor: s.color }} onClick={() => go({ v: 'subj', id: s.id })}>
              <div className="ic" style={{ background: s.color }}>{s.icon}</div>
              <div className="nm">{s.name}</div>
              <div className="sub">{m === null ? 'テスト範囲なし' : `範囲の達成度 ${m}%`}</div>
              {m !== null && <Bar v={m} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubjectView({ p, setP, id, go }: { p: Prog; setP: (f: (p: Prog) => Prog) => void; id: string; go: (v: View) => void }) {
  const s = SUBJECTS.find(x => x.id === id)!;
  const inScope = s.units.filter(u => p.exam.scope.includes(u.id));
  const toggle = (uid: string) => setP(pp => ({ ...pp, exam: { ...pp.exam, scope: pp.exam.scope.includes(uid) ? pp.exam.scope.filter(x => x !== uid) : [...pp.exam.scope, uid] } }));
  const test = (scoped: boolean) => {
    const ids = (scoped && inScope.length ? inScope : s.units).map(u => u.id);
    go({ v: 'quiz', qs: mixQuestions(ids, 20), title: `${s.name} 実力テスト${scoped && inScope.length ? '（テスト範囲）' : '（全範囲）'}`, mode: 'test', subj: s.id, back: { v: 'subj', id } });
  };
  const hist = p.tests.filter(t => t.subj === s.id).slice(-5);
  return (
    <div className="page">
      <div className="top"><button className="back" onClick={() => go({ v: 'home' })}>←</button><h1 style={{ color: s.color }}>{s.icon} {s.name}</h1></div>
      <div className="row2">
        <button className="big sm" style={{ background: s.color }} onClick={() => test(true)}>📝 実力テスト 20問<small>{inScope.length ? 'テスト範囲から' : '全範囲から'}・100点満点</small></button>
      </div>
      {hist.length > 0 && <p className="muted">最近のテスト：{hist.map(t => `${t.score}点`).join(' → ')}</p>}
      <div className="units">
        {s.units.map(u => {
          const m = mastery(p, u.id);
          const st = p.units[u.id];
          const sc = p.exam.scope.includes(u.id);
          return (
            <div key={u.id} className={'unit' + (sc ? ' scoped' : '')}>
              <div className="uh">
                <button className={'star' + (sc ? ' on' : '')} title="テスト範囲" onClick={() => toggle(u.id)}>{sc ? '★' : '☆'}</button>
                <div className="ut">
                  <div className="un">{u.title}</div>
                  <div className="meta">
                    {u.tag && <span className={'tag t-' + u.tag}>{u.tag}</span>}
                    {st?.read && <span className="tag t-read">まとめ済</span>}
                    {m >= 80 && <span className="tag t-ok">合格</span>}
                    <span className="muted">{st ? `${st.n}問・達成度${m}%` : '未学習'}</span>
                  </div>
                </div>
              </div>
              <Bar v={m} />
              <div className="ub">
                <button onClick={() => go({ v: 'lesson', id: u.id })}>📘 まとめ</button>
                <button className="pri" style={{ background: s.color }} onClick={() => go({ v: 'quiz', qs: unitQuestions(u, 10, q => (p.wrong[u.id + '|' + q.q] ? 1 : 0)), title: u.title, mode: 'unit', back: { v: 'subj', id } })}>✏️ 練習10問</button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="muted">★ = 期末テストの範囲（タップで切りかえ）</p>
    </div>
  );
}

function Lesson({ p, setP, id, go }: { p: Prog; setP: (f: (p: Prog) => Prog) => void; id: string; go: (v: View) => void }) {
  const { unit, subj } = UNIT_MAP[id];
  useEffect(() => {
    setP(pp => ({ ...pp, units: { ...pp.units, [id]: { ...(pp.units[id] || { hist: [], n: 0, ok: 0 }), read: true } } }));
  }, [id, setP]);
  return (
    <div className="page">
      <div className="top"><button className="back" onClick={() => go({ v: 'subj', id: subj.id })}>←</button><h1 style={{ color: subj.color }}>{unit.title}</h1></div>
      <div className="lesson"><Md src={unit.lesson} /></div>
      <button className="big" style={{ background: subj.color }} onClick={() => go({ v: 'quiz', qs: unitQuestions(unit, 10, q => (p.wrong[id + '|' + q.q] ? 1 : 0)), title: unit.title, mode: 'unit', back: { v: 'lesson', id } })}>
        ✏️ この単元を練習する（10問）
      </button>
    </div>
  );
}

function Quiz({ view, p, setP, go }: { view: Extract<View, { v: 'quiz' }>; p: Prog; setP: (f: (p: Prog) => Prog) => void; go: (v: View) => void }) {
  const { qs, title, mode } = view;
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [res, setRes] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const q = qs[i];
  const choices = useMemo(() => (q ? shuffle([q.a, ...q.w]) : []), [q]);
  if (!qs.length) return <div className="page"><p>問題がありません。テスト範囲を設定してください。</p><button className="big" onClick={() => go(view.back)}>もどる</button></div>;

  const answer = (c: string) => {
    if (sel) return;
    setSel(c);
    const ok = c === q.a;
    setRes(r => [...r, ok]);
    setP(pp => record(pp, q, ok, mode === 'review'));
    if (UNIT_MAP[q.unit]?.unit.speak && ok) speak(englishOnly(q.q, q.a));
  };
  const next = () => {
    if (i + 1 >= qs.length) {
      setDone(true);
      if (mode === 'test' && view.subj) {
        const score = Math.round((res.filter(Boolean).length / qs.length) * 100);
        setP(pp => ({ ...pp, tests: [...pp.tests, { subj: view.subj!, score, date: today() }] }));
      }
      return;
    }
    setI(i + 1);
    setSel(null);
  };

  if (done) {
    const ok = res.filter(Boolean).length;
    const pct = Math.round((ok / qs.length) * 100);
    return (
      <div className="page">
        <div className="result">
          <div className="big-score">{mode === 'test' ? `${pct}点` : `${ok} / ${qs.length}`}</div>
          <div className="msg">{pct >= 90 ? 'すばらしい！🎉' : pct >= 70 ? 'いい調子！あと少し 💪' : pct >= 50 ? 'まとめを見直してもう一度！' : 'まとめを読んでから再チャレンジ 📘'}</div>
        </div>
        {res.some(r => !r) && <h2>間違えた問題（間違いノートに保存しました）</h2>}
        {qs.map((qq, k) => !res[k] && (
          <div key={k} className="rev">
            <div className="rq">{qq.q}</div>
            <div className="ra">正解：<b>{qq.a}</b></div>
            {qq.e && <div className="re">{qq.e}</div>}
          </div>
        ))}
        <div className="row2">
          <button className="big alt" onClick={() => go(view.back)}>もどる</button>
          {mode === 'unit' && <button className="big" onClick={() => { const u = UNIT_MAP[qs[0].unit].unit; go({ ...view, qs: unitQuestions(u, 10, x => (p.wrong[u.id + '|' + x.q] ? 1 : 0)) }); }}>もう一度</button>}
        </div>
      </div>
    );
  }

  const subj = UNIT_MAP[q.unit]?.subj;
  const isSpeak = UNIT_MAP[q.unit]?.unit.speak;
  return (
    <div className="page quiz">
      <div className="top">
        <button className="back" onClick={() => (confirm('やめますか？（ここまでの記録は保存されます）') ? go(view.back) : null)}>✕</button>
        <div className="qt">{title}</div>
        <div className="qn">{i + 1}/{qs.length}</div>
      </div>
      <div className="prog"><div style={{ width: `${(i / qs.length) * 100}%`, background: subj?.color }} /></div>
      <div className="qmeta">{subj?.icon} {UNIT_MAP[q.unit]?.unit.title}{p.wrong[wkey(q)] && !sel ? '　📕前回まちがえた問題' : ''}</div>
      <div className="question">{q.q}</div>
      <div className="choices">
        {choices.map(c => {
          let cls = 'ch';
          if (sel) cls += c === q.a ? ' right' : c === sel ? ' wrong' : ' dim';
          return <button key={c} className={cls} onClick={() => answer(c)}>{c}</button>;
        })}
      </div>
      {sel && (
        <div className={'fb ' + (sel === q.a ? 'ok' : 'ng')}>
          <div className="fbh">{sel === q.a ? '⭕ 正解！' : '❌ ざんねん'}{sel !== q.a && <span>　正解：<b>{q.a}</b></span>}</div>
          {q.e && <div className="fbe">💡 {q.e}</div>}
          {isSpeak && <button className="spk" onClick={() => speak(englishOnly(q.q, q.a))}>🔊 英文を聞く</button>}
          <button className="big" onClick={next}>{i + 1 >= qs.length ? '結果を見る' : '次へ ▶'}</button>
        </div>
      )}
    </div>
  );
}

function Stats({ p, setP, cloud }: { p: Prog; setP: (f: (p: Prog) => Prog) => void; cloud: Cloud }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const cells = [];
  const start = new Date();
  start.setDate(start.getDate() - 55);
  for (let k = 0; k < 56; k++) {
    const x = new Date(start);
    x.setDate(start.getDate() + k);
    const n = p.days[today(x)]?.n || 0;
    cells.push(<div key={k} title={`${today(x)}：${n}問`} className={'cell l' + (n === 0 ? 0 : n < 10 ? 1 : n < 20 ? 2 : 3)} />);
  }
  const total = Object.values(p.days).reduce((a, b) => a + b.n, 0);
  const totalOk = Object.values(p.days).reduce((a, b) => a + b.ok, 0);
  return (
    <div className="page">
      <h1>📊 学習の記録</h1>
      <div className="kpis">
        <div><b>{total}</b>解いた問題</div>
        <div><b>{total ? Math.round((totalOk / total) * 100) : 0}%</b>正答率</div>
        <div><b>{streak(p)}</b>連続日数</div>
        <div><b>{Object.keys(p.days).length}</b>学習した日</div>
      </div>
      <h2>最近8週間</h2>
      <div className="heat">{cells}</div>
      <p className="muted">濃いほどたくさん解いた日（10問以上で「連続」にカウント）</p>
      <h2>教科別の達成度</h2>
      {SUBJECTS.map(s => {
        const all = subjMastery(p, s, false) || 0;
        const sc = subjMastery(p, s, true);
        const tests = p.tests.filter(t => t.subj === s.id);
        return (
          <div key={s.id} className="srow">
            <div className="sn">{s.icon} {s.name}</div>
            <div className="sb">
              <div className="muted">テスト範囲 {sc ?? '-'}%・全体 {all}%{tests.length ? `・テスト最高 ${Math.max(...tests.map(t => t.score))}点` : ''}</div>
              <Bar v={sc ?? all} color={s.color} />
            </div>
          </div>
        );
      })}
      <h2>クラウド保存</h2>
      <CloudBox cloud={cloud} />
      <h2>データの引っこし（バックアップ）</h2>
      <p className="muted">記録はこの端末のブラウザに保存されます。別の端末に移すときは、コードをコピーして相手の端末に貼りつけてください。</p>
      <div className="row2">
        <button className="big alt sm" onClick={() => { navigator.clipboard?.writeText(exportCode(p)); setMsg('コードをコピーしました'); }}>📋 コードをコピー</button>
      </div>
      <textarea value={code} onChange={e => setCode(e.target.value)} placeholder="ここにコードを貼りつけ" rows={3} />
      <div className="row2">
        <button className="big sm" onClick={() => { const np = importCode(code); if (np) { setP(() => np); setMsg('読みこみました！'); } else setMsg('コードが正しくありません'); }}>📥 読みこむ</button>
        <button className="big alt sm" onClick={() => { if (confirm('すべての記録を消しますか？')) setP(() => blank()); }}>🗑 リセット</button>
      </div>
      {msg && <p className="ok-msg">{msg}</p>}
    </div>
  );
}

function Scope({ p, setP }: { p: Prog; setP: (f: (p: Prog) => Prog) => void }) {
  const toggle = (uid: string) => setP(pp => ({ ...pp, exam: { ...pp.exam, scope: pp.exam.scope.includes(uid) ? pp.exam.scope.filter(x => x !== uid) : [...pp.exam.scope, uid] } }));
  const left = daysLeft(p);
  const remain = p.exam.scope.filter(id => mastery(p, id) < 80).length;
  return (
    <div className="page">
      <h1>🎯 期末テスト対策</h1>
      <label className="field">テストの日
        <input type="date" value={p.exam.date} onChange={e => setP(pp => ({ ...pp, exam: { ...pp.exam, date: e.target.value, set: true } }))} />
      </label>
      <label className="field">1日の目標問題数
        <select value={p.goal} onChange={e => setP(pp => ({ ...pp, goal: Number(e.target.value) }))}>
          {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}問</option>)}
        </select>
      </label>
      <div className="plan">
        {left > 0 ? <>あと <b>{left}日</b>・まだ合格していない範囲の単元 <b>{remain}個</b><br />→ 1日 <b>{Math.max(1, Math.ceil(remain / Math.max(1, left - 3)))}単元</b> ずつ「まとめ → 練習」で合格（80%）を目指そう。最後の3日は実力テストと間違いノート！</> : 'テストの日を設定してください'}
      </div>
      <p className="muted">学校の「テスト範囲表」を見て、範囲の単元に ★ をつけよう（初期設定は中3・2学期の一般的な範囲）。</p>
      {SUBJECTS.map(s => (
        <div key={s.id} className="scope-s">
          <h2 style={{ color: s.color }}>{s.icon} {s.name}</h2>
          {s.units.map(u => {
            const on = p.exam.scope.includes(u.id);
            return (
              <button key={u.id} className={'scope-u' + (on ? ' on' : '')} onClick={() => toggle(u.id)}>
                <span>{on ? '★' : '☆'}</span>{u.title}<em>{mastery(p, u.id)}%</em>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Tips({ p, setP }: { p: Prog; setP: (f: (p: Prog) => Prog) => void }) {
  const [t, setT] = useState('');
  return (
    <div className="page">
      <h1>⭐ 評定を 2 → 3 にするコツ</h1>
      <div className="lesson">
        <Md src={`## 評定は「テストの点」だけでは決まらない
- 観点は3つ：**知識・技能**／**思考・判断・表現**／**主体的に学習に取り組む態度**
- 通知表で C が多いと 2 になりやすい。**B にそろえれば 3** が見えてくる
> テストで平均点に近づける ＋ 提出物を完ぺきにする = いちばん確実な近道
## 主体的に学習に取り組む態度（すぐ上げられる！）
- 提出物（ワーク・プリント・ノート）は**期限を守って、全部うめて**出す
- ワークは答えを写すだけにしない。まちがえた所は赤で直して、解説を書きこむ
- 授業中に1回は発言・質問する。わからない所を先生に聞きに行くのもプラス
- 振り返りシートは「わかったこと＋次にがんばること」を具体的に書く
## テスト勉強の進め方（この app の使い方）
- ① テスト範囲表が出たら「テスト範囲」で ★ をつける
- ② 毎日「今日のおすすめ10問」＋ 苦手な単元の「まとめ → 練習」
- ③ 練習で 80% 以上 →「合格」。全部の単元を合格に！
- ④ テスト1週間前からは「実力テスト」と「間違いノート」をくり返す
- ⑤ 学校のワークを2回以上解く（テストはワークから多く出る）
## 教科別ワンポイント
- 数学：計算問題（大問1）で確実に点をとる。途中式を書く
- 英語：教科書本文を音読。不規則動詞と重要単語はこの app で毎日
- 理科・社会：用語は「説明できる」まで。図・グラフ・地図を見る
- 国語：漢字・文法・古文は暗記で点がとれる。教科書の古文は音読
- 技術・家庭：プリントと教科書の太字。実習のレポートもしっかり提出`} />
      </div>
      <h2>📋 提出物チェックリスト</h2>
      {p.todo.map((x, k) => (
        <div key={k} className={'todo' + (x.done ? ' done' : '')}>
          <button onClick={() => setP(pp => ({ ...pp, todo: pp.todo.map((y, j) => (j === k ? { ...y, done: !y.done } : y)) }))}>{x.done ? '✅' : '⬜'}</button>
          <span>{x.text}</span>
          <button className="del" onClick={() => setP(pp => ({ ...pp, todo: pp.todo.filter((_, j) => j !== k) }))}>✕</button>
        </div>
      ))}
      <div className="row2">
        <input value={t} onChange={e => setT(e.target.value)} placeholder="例：理科ワーク p.20〜35（11/20まで）" />
        <button className="big sm" onClick={() => { if (t.trim()) { setP(pp => ({ ...pp, todo: [...pp.todo, { text: t.trim(), done: false }] })); setT(''); } }}>追加</button>
      </div>
    </div>
  );
}
