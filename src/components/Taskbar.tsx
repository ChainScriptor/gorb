import { useEffect, useState } from 'react'
import { asset, APPS } from '../data/apps'
import { useWM } from '../wm'
import Icon from './Icon'

interface Props {
  startOpen: boolean
  onStart: () => void
  onToggleScan: () => void
}

export default function Taskbar({ startOpen, onStart, onToggleScan }: Props) {
  const wm = useWM()
  const [clock, setClock] = useState('--:--')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let h = d.getHours()
      const m = d.getMinutes().toString().padStart(2, '0')
      const ap = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setClock(`${h}:${m} ${ap}`)
    }
    tick()
    const id = setInterval(tick, 1000 * 20)
    return () => clearInterval(id)
  }, [])

  const topKey = wm.wins.reduce<number | null>(
    (top, w) => (!w.min && (top === null || w.z > (wm.wins.find((x) => x.key === top)?.z ?? 0)) ? w.key : top),
    null,
  )

  return (
    <div className="taskbar" id="taskbar">
      <button
        className={'start' + (startOpen ? ' is-open' : '')}
        id="startBtn"
        aria-haspopup="true"
        aria-expanded={startOpen}
        onClick={onStart}
      >
        <img src={'/4444.png'} alt="" /><span>start</span>
      </button>

      <div className="tasks" id="tasks">
        {wm.wins.map((w) => (
          <button
            key={w.key}
            className={'task' + (topKey === w.key ? ' is-active' : '')}
            onClick={() => (topKey === w.key ? wm.toggleMin(w.key) : wm.focus(w.key))}
          >
            <Icon icon={APPS[w.app].icon} className="task__ico" />
            <span>{APPS[w.app].title}</span>
          </button>
        ))}
      </div>

      <div className="tray">
        <button className="tray__ico" id="trayTv" title="Canal 88" type="button">📺</button>
        <button className="tray__ico" id="trayNet" title="Network: connected to the pond" type="button">🛜</button>
        <button className="tray__ico" id="trayScan" title="Toggle scanlines" type="button" onClick={onToggleScan}>▚</button>
        <button className="tray__ico" id="trayVol" title="Volume" type="button">🔊</button>
        <span className="tray__clock" id="clock">{clock}</span>
      </div>
    </div>
  )
}
