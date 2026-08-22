import { useRef, useState } from 'react'
import { APPS } from '../data/apps'
import { useWM } from '../wm'
import type { WinInstance } from '../wm'
import Icon from './Icon'
import AppContent from './AppContent'

export default function Window({ win }: { win: WinInstance }) {
  const wm = useWM()
  const def = APPS[win.app]
  const [max, setMax] = useState(false)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  const onBarDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.win__btn')) return
    if (max) return
    wm.focus(win.key)
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onBarMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const nx = Math.max(-win.w + 80, Math.min(window.innerWidth - 40, e.clientX - drag.current.dx))
    const ny = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - drag.current.dy))
    wm.move(win.key, nx, ny)
  }
  const onBarUp = (e: React.PointerEvent) => {
    drag.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const style: React.CSSProperties = max
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 0px)', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }

  return (
    <section
      className="win"
      data-app={win.app}
      role="dialog"
      aria-label={def.title}
      style={{ ...style, display: win.min ? 'none' : undefined, position: 'absolute' }}
      onPointerDown={() => wm.focus(win.key)}
    >
      <header
        className="win__bar"
        onPointerDown={onBarDown}
        onPointerMove={onBarMove}
        onPointerUp={onBarUp}
        onDoubleClick={() => setMax((m) => !m)}
      >
        <Icon icon={def.icon} className="win__ico" />
        <span className="win__title">{def.title}</span>
        <span className="win__btns">
          <button className="win__btn win__btn--min" aria-label="Minimize" onClick={() => wm.toggleMin(win.key)}>_</button>
          <button className="win__btn win__btn--max" aria-label="Maximize" onClick={() => setMax((m) => !m)}>▢</button>
          <button className="win__btn win__btn--x" aria-label="Close" onClick={() => wm.close(win.key)}>✕</button>
        </span>
      </header>

      <div className="win__body">
        <AppContent app={win.app} payload={win.payload} winKey={win.key} />
      </div>

      {!def.dialog && (
        <footer className="win__status"><span className="win__st">{def.status}</span></footer>
      )}
      <span className="win__grip" />
    </section>
  )
}
