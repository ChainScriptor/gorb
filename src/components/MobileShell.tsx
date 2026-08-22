import { useEffect, useState } from 'react'
import { DESKTOP_ICONS, APPS, CONFIG } from '../data/apps'
import type { DeskItem } from '../data/apps'
import { useWM } from '../wm'
import Icon from './Icon'
import AppContent from './AppContent'

// Phone shell: an Android-style home screen (app grid) that opens apps
// full-screen, one at a time, with a bottom nav bar. Reuses the same
// AppContent + window manager as the desktop.
export default function MobileShell({ scanlines }: { scanlines: boolean; onToggleScan: () => void }) {
  const wm = useWM()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let h = d.getHours()
      const m = String(d.getMinutes()).padStart(2, '0')
      const ap = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setClock(`${h}:${m} ${ap}`)
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])

  // the app currently on screen = highest-z window that is not minimized
  const top = wm.wins.filter((w) => !w.min).sort((a, b) => a.z - b.z).pop() || null

  const open = (item: DeskItem) => {
    if (item.app) wm.launch(item.app)
    else if (item.link) window.open(CONFIG[item.link], '_blank', 'noopener')
  }
  const goHome = () => wm.wins.forEach((w) => wm.close(w.key))
  const goBack = () => { if (top) wm.close(top.key) }

  return (
    <div className="mob">
      <div className="mob__status">
        <span>{clock}</span>
        <span className="mob__sys">🛜 🔊 🔋</span>
      </div>

      {top ? (
        <div className="mob__app">
          <div className="mob__appbar">
            <Icon icon={APPS[top.app].icon} className="mob__appico" />
            <b>{APPS[top.app].title}</b>
          </div>
          <div className="mob__appbody">
            <AppContent app={top.app} payload={top.payload} winKey={top.key} />
          </div>
        </div>
      ) : (
        <div className="mob__home">
          <div className="mob__grid">
            {DESKTOP_ICONS.map((item, i) => (
              <button key={i} className="mob__icon" onClick={() => open(item)}>
                <span className="mob__iconimg">
                  <Icon icon={(item.app ? APPS[item.app]?.icon : item.icon) || 'ic-explorer'} />
                </span>
                <span className="mob__label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mob__nav">
        <button onClick={goBack} aria-label="Back">◁</button>
        <button onClick={goHome} aria-label="Home">◯</button>
        <button onClick={goHome} aria-label="Recents">▢</button>
      </div>

      <div className={'scanlines' + (scanlines ? ' is-on' : '')} aria-hidden="true" />
    </div>
  )
}
