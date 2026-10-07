import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';

const sql = neon(process.env.DATABASE_URL!);
let ready: Promise<unknown> | null = null;
const init = () =>
  (ready ??= sql`create table if not exists chu3_progress (id text primary key, data jsonb not null, updated_at timestamptz not null default now())`);
const idOf = (pin: string) => createHash('sha256').update('chu3-hyotei:' + pin).digest('hex');

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { pin?: unknown; data?: unknown } | null;
  const pin = String(b?.pin ?? '');
  if (!/^\d{4,8}$/.test(pin)) return Response.json({ error: 'pin' }, { status: 400 });
  await init();
  const id = idOf(pin);
  if (b?.data !== undefined) {
    const s = JSON.stringify(b.data);
    if (s.length > 2_000_000) return Response.json({ error: 'too large' }, { status: 413 });
    await sql`insert into chu3_progress (id, data, updated_at) values (${id}, ${s}::jsonb, now())
      on conflict (id) do update set data = excluded.data, updated_at = now()`;
    return Response.json({ ok: true });
  }
  const rows = await sql`select data from chu3_progress where id = ${id}`;
  return Response.json({ data: rows[0]?.data ?? null });
}
