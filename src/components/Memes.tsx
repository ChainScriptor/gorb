import { useState } from 'react'
import { MEMES, MEME_FOLDERS } from '../data/apps'
import { useWM } from '../wm'

export default function Memes() {
  const wm = useWM()
  const [folderId, setFolderId] = useState<string | null>(null)
  const folder = MEME_FOLDERS.find((f) => f.id === folderId) ?? null
  const items = folder ? folder.items : MEMES

  return (
    <div className="folder">
      <div className="folder__bar">
        {folder ? (
          <button className="xp-btn" onClick={() => setFolderId(null)}>◀ Evidence</button>
        ) : null}
        <span className="folder__count">{items.length} objects</span>
      </div>
      <div className="folder__grid" id="memeGrid">
        {!folder &&
          MEME_FOLDERS.map((f) => (
            <button key={f.id} className="file" title={f.label} onClick={() => setFolderId(f.id)}>
              <svg className="file__thumb" viewBox="0 0 48 48"><use href="#ic-folder" /></svg>
              <span>{f.label}</span>
            </button>
          ))}
        {items.map((m, idx) => (
          <button
            key={m.img}
            className="file"
            title={m.cap.replace(/_/g, ' ')}
            onClick={() => wm.launch('viewer', { items, index: idx })}
          >
            <img className="file__thumb" src={m.img} alt="" loading="lazy" />
            <span>{m.cap}.png</span>
          </button>
        ))}
      </div>
    </div>
  )
}
