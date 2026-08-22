import { useState } from 'react'
import { MEMES } from '../data/apps'
import type { Meme } from '../data/apps'

export default function Viewer({ payload }: { payload?: unknown }) {
  const p = payload as { items?: Meme[]; index?: number } | undefined
  const items = p?.items ?? MEMES
  const [i, setI] = useState(p?.index ?? 0)
  const m = items[i]
  const go = (d: number) => setI((n) => (n + d + items.length) % items.length)

  return (
    <div className="viewer">
      <div className="viewer__stage">
        <img id="viewerImg" src={m.img} alt={m.cap} />
      </div>
      <div className="viewer__bar">
        <button className="xp-btn" id="viewerPrev" onClick={() => go(-1)}>◀ Previous</button>
        <span id="viewerCap">{m.cap.replace(/_/g, ' ')} — {i + 1} / {items.length}</span>
        <button className="xp-btn" id="viewerNext" onClick={() => go(1)}>Next ▶</button>
      </div>
    </div>
  )
}
