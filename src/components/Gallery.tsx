import { useEffect, useState } from 'react'
import { sbGet, sbRpc, SB_CONFIGURED } from '../data/supabase'

interface GalRow { id: string; name: string; image: string; votes?: number; created_at?: string }

export default function Gallery() {
  const [rows, setRows] = useState<GalRow[]>([])
  const [state, setState] = useState('loading…')
  const [sel, setSel] = useState<GalRow | null>(null)
  const [voted, setVoted] = useState<Set<string>>(new Set())

  const load = () => {
    if (!SB_CONFIGURED) { setState('backend not configured (.env)'); return }
    setState('loading…')
    sbGet<GalRow[]>('gorb_gallery?select=id,name,image,created_at,votes,owner_who&order=created_at.desc&limit=60')
      .then((d) => { setRows(d); setState(d.length ? '' : 'The wall is empty — draw something in Gorb Paint.') })
      .catch(() => setState('offline — could not reach the pond.'))
  }
  useEffect(() => { load() }, [])

  const vote = async (r: GalRow) => {
    if (voted.has(r.id)) return
    setVoted((s) => new Set(s).add(r.id))
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, votes: (x.votes || 0) + 1 } : x)))
    try { await sbRpc('gorb_gallery_vote', { row_id: r.id }) } catch { /* optimistic only */ }
  }

  if (sel) {
    return (
      <div className="folder">
        <div className="folder__bar">
          <button className="ie__tb" onClick={() => setSel(null)}>◀ Back to the wall</button>
          <span className="folder__count">{sel.name}</span>
          <button className="ie__tb" onClick={() => vote(sel)} disabled={voted.has(sel.id)}>♥ {sel.votes || 0}</button>
        </div>
        <div className="viewer__stage" style={{ padding: 12 }}>
          <img src={sel.image} alt={sel.name} style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="folder">
      <div className="folder__bar">
        <button className="ie__tb" id="galReload" onClick={load}>↻ Refresh</button>
        <span className="folder__count" id="galCount">{rows.length ? `${rows.length} drawings` : state}</span>
      </div>
      <div className="folder__grid" id="galGrid">
        {rows.map((r) => (
          <button key={r.id} className="file" title={r.name} onClick={() => setSel(r)}>
            <img className="file__thumb" src={r.image} alt={r.name} loading="lazy" style={{ imageRendering: 'pixelated' }} />
            <span>{r.name}{r.votes ? ` · ♥${r.votes}` : ''}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
