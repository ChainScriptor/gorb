import { useEffect, useRef, useState } from 'react'
import { APPS, DESKTOP_ICONS, CONFIG } from '../data/apps'
import type { AppId } from '../data/apps'
import { useWM } from '../wm'
import Icon from './Icon'
import Window from './Window'
import Taskbar from './Taskbar'
import StartMenu from './StartMenu'

interface Props {
  scanlines: boolean
  onToggleScan: () => void
}

type Pos = { x: number; y: number }
const POS_KEY = 'gorb:iconpos'

// These shortcuts sit in a centered row along the top of the desktop by
// default (matched by app id or, for link icons, by their CONFIG key).
const FEATURED = ['nftmint', 'tiktok', 'chat', 'canal88', 'memes']
const keyOf = (item: (typeof DESKTOP_ICONS)[number]) => item.app ?? item.link ?? ''

// Default layout: featured icons in a top-centered row, the rest in the
// left column(s). Centering is computed from the viewport so it holds on
// any screen size.
function computeDefaults(): Record<number, Pos> {
  const rowH = 90
  const colW = 96
  const out: Record<number, Pos> = {}

  const featured = FEATURED
    .map((k) => DESKTOP_ICONS.findIndex((it) => keyOf(it) === k))
    .filter((i) => i >= 0)
  const featuredSet = new Set(featured)
  const others = DESKTOP_ICONS.map((_, i) => i).filter((i) => !featuredSet.has(i))

  // top-centered row
  const containerW = window.innerWidth - 20
  const startX = Math.max(0, Math.round((containerW - featured.length * colW) / 2))
  featured.forEach((idx, k) => { out[idx] = { x: startX + k * colW, y: 0 } })

  // remaining icons fill the left column(s)
  const perCol = Math.max(1, Math.floor((window.innerHeight - 60) / rowH))
  others.forEach((idx, k) => { out[idx] = { x: Math.floor(k / perCol) * colW, y: (k % perCol) * rowH } })

  return out
}

export default function Desktop({ scanlines, onToggleScan }: Props) {
  const wm = useWM()
  const [startOpen, setStartOpen] = useState(false)
  const [sel, setSel] = useState<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const iconsRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ i: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)

  const [positions, setPositions] = useState<Record<number, Pos>>(() => {
    const d = computeDefaults()
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) || '{}')
      return { ...d, ...saved }
    } catch {
      return d
    }
  })

  // persist whenever a drag finishes (positions change)
  useEffect(() => {
    try { localStorage.setItem(POS_KEY, JSON.stringify(positions)) } catch { /* ignore */ }
  }, [positions])

  const openItem = (item: (typeof DESKTOP_ICONS)[number]) => {
    if (item.app) {
      if (item.app === ('gorbrun' as AppId)) return
      wm.launch(item.app)
    } else if (item.link) {
      window.open(CONFIG[item.link], '_blank', 'noopener')
    }
  }

  const onDown = (e: React.PointerEvent, i: number) => {
    setSel(i)
    const pos = positions[i] ?? { x: 0, y: 0 }
    drag.current = { i, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent, i: number) => {
    const d = drag.current
    if (!d || d.i !== i) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved && Math.hypot(dx, dy) < 4) return // small movement is still a click
    d.moved = true
    if (dragging !== i) setDragging(i)
    const cont = iconsRef.current
    const maxX = (cont ? cont.clientWidth : window.innerWidth) - 92
    const maxY = (cont ? cont.clientHeight : window.innerHeight) - 84
    const nx = Math.max(0, Math.min(maxX, d.ox + dx))
    const ny = Math.max(0, Math.min(maxY, d.oy + dy))
    setPositions((p) => ({ ...p, [i]: { x: nx, y: ny } }))
  }
  const onUp = (e: React.PointerEvent) => {
    drag.current = null
    setDragging(null)
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
  }

  return (
    <main className="desktop is-on" id="desktop" aria-label="GorbOS desktop"
      onPointerDown={(e) => {
        const t = e.target as HTMLElement
        if (!t.closest('.icon')) setSel(null)
        if (!t.closest('#startMenu') && !t.closest('#startBtn')) setStartOpen(false)
      }}
    >
      <img className="wall wall--centre" src={'/windows.webp'} alt="" />

      <div className="icons" id="icons" ref={iconsRef}>
        {DESKTOP_ICONS.map((item, i) => {
          const iconId = item.app ? APPS[item.app]?.icon ?? item.icon : item.icon
          const pos = positions[i] ?? { x: 0, y: 0 }
          return (
            <button
              key={i}
              className={'icon' + (sel === i ? ' is-sel' : '') + (dragging === i ? ' is-dragging' : '')}
              style={{ left: pos.x, top: pos.y }}
              onPointerDown={(e) => onDown(e, i)}
              onPointerMove={(e) => onMove(e, i)}
              onPointerUp={onUp}
              onDoubleClick={() => openItem(item)}
            >
              <span className="icon__img"><Icon icon={iconId || 'ic-explorer'} /></span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="windows" id="windows">
        {wm.wins.map((win) => (
          <Window key={win.key} win={win} />
        ))}
      </div>

      <Taskbar
        startOpen={startOpen}
        onStart={() => setStartOpen((o) => !o)}
        onToggleScan={onToggleScan}
      />

      <StartMenu
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onToggleScan={onToggleScan}
      />

      <div className={'scanlines' + (scanlines ? ' is-on' : '')} id="scanlines" aria-hidden="true" />
    </main>
  )
}
