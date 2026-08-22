import { useState } from 'react'
import { MEMES } from '../data/apps'

export default function Viewer({ payload }: { payload?: unknown }) {
  const start = (payload as { index?: number })?.index ?? 0
  const [i, setI] = useState(start)
  const m = MEMES[i]
  const go = (d: number) => setI((n) => (n + d + MEMES.length) % MEMES.length)

  return (
    <div className="viewer">
      <div className="viewer__stage">
        <img id="viewerImg" src={m.img} alt={m.cap} />
      </div>
      <div className="viewer__bar">
        <button className="xp-btn" id="viewerPrev" onClick={() => go(-1)}>◀ Previous</button>
        <span id="viewerCap">{m.cap.replace(/_/g, ' ')} — {i + 1} / {MEMES.length}</span>
        <button className="xp-btn" id="viewerNext" onClick={() => go(1)}>Next ▶</button>
      </div>
    </div>
  )
}
