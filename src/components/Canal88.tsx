import { useEffect, useRef, useState } from 'react'
import { CHANNELS, TAPES } from '../data/apps'

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
  const [soundOn, setSoundOn] = useState(false)
  const vidRef = useRef<HTMLVideoElement>(null)

  const ch = CHANNELS[i]
  const go = (d: number) => setI((n) => (n + d + CHANNELS.length) % CHANNELS.length)

  // Fewer tapes than channels, so they alternate down the list. The key
  // forces a fresh <video> on change: swapping src alone leaves the old
  // tape playing until something calls load().
  const tape = TAPES[i % TAPES.length]

  /* The element starts muted in markup so autoplay is never blocked, then
     the real sound state is applied here. This also has to re-run on every
     channel change, because the key above hands us a brand new element that
     has reverted to muted. */
  useEffect(() => {
    const el = vidRef.current
    if (!el) return
    el.muted = !soundOn
    el.volume = 0.8
    if (el.paused) el.play().catch(() => {})
  }, [soundOn, tape])

  return (
    <div className="wmp">
      <div className="wmp__screen">
        <video
          key={tape}
          ref={vidRef}
          src={tape}
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
        <button
          className="wmp__btn"
          aria-pressed={soundOn}
          onClick={() => setSoundOn((s) => !s)}
        >
          {soundOn ? '🔊 Sound' : '🔇 Muted'}
        </button>
        <span className="wmp__ch">Channel {ch.ch} of {CHANNELS[CHANNELS.length - 1].ch}</span>
      </div>
    </div>
  )
}
