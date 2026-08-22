import { asset, START_LEFT, START_RIGHT } from '../data/apps'
import type { MenuItem } from '../data/apps'
import { useWM } from '../wm'
import Icon from './Icon'

interface Props {
  open: boolean
  onClose: () => void
  onToggleScan: () => void
}

export default function StartMenu({ open, onClose, onToggleScan }: Props) {
  const wm = useWM()
  if (!open) return null

  const run = (it: MenuItem) => {
    if (it.action === 'scanlines') onToggleScan()
    else if (it.app) wm.launch(it.app)
    else if (it.link) window.open(it.link, '_blank', 'noopener')
    onClose()
  }

  const col = (items: MenuItem[], id: string) => (
    <ul className={id === 'left' ? 'startmenu__left' : 'startmenu__right'} id={'start' + (id === 'left' ? 'Left' : 'Right')}>
      {items.map((it, i) =>
        it.icon === 'sep' ? (
          <li key={i} className="sep" />
        ) : (
          <li key={i} onClick={() => run(it)}>
            <Icon icon={it.icon} className="menu__ico" />
            <span><b>{it.label}</b>{it.sub ? <small>{it.sub}</small> : null}</span>
          </li>
        ),
      )}
    </ul>
  )

  return (
    <div className="startmenu" id="startMenu">
      <header className="startmenu__head">
        <img src={'/4444.png'} alt="" /><b>Guest</b>
      </header>
      <div className="startmenu__cols">
        {col(START_LEFT, 'left')}
        {col(START_RIGHT, 'right')}
      </div>
      <footer className="startmenu__foot">
        <button onClick={onClose}><i>🔒</i> Log Off</button>
        <button onClick={onClose}><i>⏻</i> Turn Off Computer</button>
      </footer>
    </div>
  )
}
