// Supabase (PostgREST) access for the Gorb backend.
// Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file (see
// .env.example). The anon/publishable key is meant to live in the client.

const RAW_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SB_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  ''

// normalise to ".../rest/v1/"
export const SB_REST = RAW_URL ? RAW_URL.replace(/\/+$/, '') + '/rest/v1/' : ''
export const SB_CONFIGURED = Boolean(RAW_URL && SB_KEY)

const HEAD: Record<string, string> = {
  apikey: SB_KEY,
  Authorization: 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json',
}

function ensure() {
  if (!SB_CONFIGURED) throw new Error('Supabase not configured (.env)')
}

/** GET rows. `path` is table + query, e.g. "gorb_chat?select=*&limit=80". */
export async function sbGet<T = unknown>(path: string): Promise<T> {
  ensure()
  const r = await fetch(SB_REST + path, { headers: HEAD })
  if (!r.ok) throw new Error('supabase GET ' + r.status)
  return r.json()
}

/** INSERT one row. `returning='minimal'` for tables with no public SELECT. */
export async function sbInsert<T = unknown>(
  table: string,
  row: unknown,
  returning: 'representation' | 'minimal' = 'representation',
): Promise<T | void> {
  ensure()
  const r = await fetch(SB_REST + table, {
    method: 'POST',
    headers: { ...HEAD, Prefer: 'return=' + returning },
    body: JSON.stringify(row),
  })
  if (!r.ok) throw new Error('supabase INSERT ' + r.status)
  if (returning === 'minimal') return
  return r.json()
}

/** UPSERT one row (on primary-key conflict, merge). */
export async function sbUpsert(table: string, row: unknown): Promise<void> {
  ensure()
  const r = await fetch(SB_REST + table, {
    method: 'POST',
    headers: { ...HEAD, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  })
  if (!r.ok) throw new Error('supabase UPSERT ' + r.status)
}

/** Call a Postgres function (RPC). */
export async function sbRpc<T = unknown>(fn: string, args: unknown = {}): Promise<T> {
  ensure()
  const r = await fetch(SB_REST + 'rpc/' + fn, {
    method: 'POST',
    headers: HEAD,
    body: JSON.stringify(args),
  })
  if (!r.ok) throw new Error('supabase RPC ' + r.status)
  return r.json()
}

// ── anonymous client identity, persisted in localStorage ──────────────
export function whoAmI(): string {
  let id = localStorage.getItem('gorb:who')
  if (!id) {
    id = 'g_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('gorb:who', id)
  }
  return id
}

export function myNick(): string {
  return localStorage.getItem('gorb:nick') || 'anon'
}
export function setNick(n: string) {
  localStorage.setItem('gorb:nick', n.slice(0, 24))
}
