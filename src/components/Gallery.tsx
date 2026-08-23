import { useEffect, useState } from 'react'
import { sbGet, sbRpc, SB_CONFIGURED } from '../data/supabase'
import { GALLERY } from '../data/apps'

interface GalRow { id: string; name: string; image: string; votes?: number; created_at?: string }

type View = 'posters' | 'drawings'

export default function Gallery() {
  const [view, setView] = useState<View>('posters')
  const [rows, setRows] = useState<GalRow[]>([])
  const [state, setState] = useState('loading…')
  const [sel, setSel] = useState<GalRow | null>(null)
  const [poster, setPoster] = useState<string | null>(null)
  const [voted, setVoted] = useState<Set<string>>(new Set())

  const load = () => {
    if (!SB_CONFIGURED) { setState('backend not configured (.env)'); return }
    setState('loading…')
    sbGet<GalRow[]>('gorb_gallery?select=id,name,image,created_at,votes,owner_who&order=created_at.desc&limit=60')
      .then((d) => { setRows(d); setState(d.length ? '' : 'The wall is empty — draw something in Gorb Paint.') })
      .catch(() => setState('offline — could not reach the pond.'))
  }

  // Only hit the backend once the drawings tab is actually opened.
  useEffect(() => { if (view === 'drawings' && !rows.length) load() }, [view])

  const vote = async (r: GalRow) => {
    if (voted.has(r.id)) return
    setVoted((s) => new Set(s).add(r.id))
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, votes: (x.votes || 0) + 1 } : x)))
    try { await sbRpc('gorb_gallery_vote', { row_id: r.id }) } catch { /* optimistic only */ }
  }

  /* ---------- single poster ---------- */
  if (poster) {
    const i = GALLERY.indexOf(poster)
    // Read the index inside the updater: two clicks landing in the same render
    // would otherwise both compute from the same stale position.
    const go = (d: number) =>
      setPoster((p) => {
        const at = GALLERY.indexOf(p as string)
        return GALLERY[(at + d + GALLERY.length) % GALLERY.length]
      })
    return (
      <div className="folder">
        <div className="folder__bar">
          <button className="ie__tb" onClick={() => setPoster(null)}>◀ Back to the wall</button>
          <span className="folder__count">{i + 1} of {GALLERY.length}</span>
          <button className="ie__tb" onClick={() => go(-1)}>◀</button>
          <button className="ie__tb" onClick={() => go(1)}>▶</button>
        </div>
        <div className="viewer__stage" style={{ padding: 12, display: 'grid', placeItems: 'center', overflow: 'auto' }}>
          <img src={poster} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      </div>
    )
  }

  /* ---------- single drawing ---------- */
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

  /* ---------- the wall ---------- */
  return (
    <div className="folder">
      <div className="folder__bar">
        <button
          className="ie__tb"
          aria-pressed={view === 'posters'}
          style={view === 'posters' ? activeTab : undefined}
          onClick={() => setView('posters')}
        >
          Posters
        </button>
        <button
          className="ie__tb"
          aria-pressed={view === 'drawings'}
          style={view === 'drawings' ? activeTab : undefined}
          onClick={() => setView('drawings')}
        >
          Drawings
        </button>

        {view === 'drawings' && <button className="ie__tb" onClick={load}>↻ Refresh</button>}

        <span className="folder__count">
          {view === 'posters'
            ? `${GALLERY.length} posters`
            : rows.length ? `${rows.length} drawings` : state}
        </span>
      </div>

      {view === 'posters' ? (
        <div className="folder__grid">
          {GALLERY.map((src, i) => (
            <button key={src} className="file" onClick={() => setPoster(src)} title={`Poster ${i + 1}`}>
              <img className="file__thumb" src={src} alt="" loading="lazy" />
              <span>{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="folder__grid">
          {rows.map((r) => (
            <button key={r.id} className="file" title={r.name} onClick={() => setSel(r)}>
              <img className="file__thumb" src={r.image} alt={r.name} loading="lazy" style={{ imageRendering: 'pixelated' }} />
              <span>{r.name}{r.votes ? ` · ♥${r.votes}` : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const activeTab: React.CSSProperties = {
  background: 'linear-gradient(#fff, #cfe0f5)',
  borderColor: '#5a7cb0',
  fontWeight: 700,
}
