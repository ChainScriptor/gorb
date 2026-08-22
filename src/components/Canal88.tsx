import { useState } from 'react'
import { CHANNELS } from '../data/apps'

// Original airs one shared tape worked out from the clock.
function currentIndex() {
  const total = CHANNELS.reduce((n, c) => n + c.sec, 0)
  const t = (Date.now() / 1000) % total
  let acc = 0
  for (let i = 0; i < CHANNELS.length; i++) {
    acc += CHANNELS[i].sec
    if (t < acc) return i
  }
  return 0
}

export default function Canal88() {
  const [i, setI] = useState(currentIndex)
  const ch = CHANNELS[i]
  const go = (d: number) => setI((n) => (n + d + CHANNELS.length) % CHANNELS.length)

  return (
    <div className="wmp">
      <div className="wmp__screen">
        <video
          src="/1.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
        />
        <div className="wmp__osd">
          <span className="rec"><i /><b id="tapeCh">CH {ch.ch}</b> — <em id="tapeName">{ch.name}</em></span>
          <span id="tapeTag">{ch.tag}</span>
        </div>
      </div>
      <div className="wmp__controls">
        <button className="wmp__btn" onClick={() => go(-1)}>◀ Prev</button>
        <button className="wmp__btn" onClick={() => go(1)}>Next ▶</button>
        <span className="wmp__ch">Channel {ch.ch} of {CHANNELS[CHANNELS.length - 1].ch}</span>
      </div>
    </div>
  )
}
