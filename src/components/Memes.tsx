import { MEMES } from '../data/apps'
import { useWM } from '../wm'

export default function Memes() {
  const wm = useWM()
  return (
    <div className="folder">
      <div className="folder__bar">
        <span className="folder__count">{MEMES.length} objects</span>
      </div>
      <div className="folder__grid" id="memeGrid">
        {MEMES.map((m, idx) => (
          <button
            key={m.img}
            className="file"
            title={m.cap.replace(/_/g, ' ')}
            onClick={() => wm.launch('viewer', { index: idx })}
          >
            <img className="file__thumb" src={m.img} alt="" loading="lazy" />
            <span>{m.cap}.png</span>
          </button>
        ))}
      </div>
    </div>
  )
}
