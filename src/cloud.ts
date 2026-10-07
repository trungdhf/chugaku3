import type { Prog } from './progress';

export const PIN_KEY = 'chu3-pin';
const call = async (body: object, keepalive = false) => {
  const r = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};
export const cloudGet = async (pin: string): Promise<Prog | null> => (await call({ pin })).data;
export const cloudPut = (pin: string, data: Prog, keepalive = false) => call({ pin, data }, keepalive);
