import { useEffect, useRef, useState } from 'react'
import { sbInsert, whoAmI, myNick, setNick, SB_CONFIGURED } from '../data/supabase'
import { useWM } from '../wm'

const COLORS = ['#0a0a0a', '#7b2ff7', '#e0342a', '#f5c518', '#2f7ddb', '#74c13b', '#ffffff', '#8d99a8']

export default function Paint() {
  const wm = useWM()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState('#7b2ff7')
  const [size, setSize] = useState(4)
  const [status, setStatus] = useState('')
  const drawing = useRef(false)

  useEffect(() => {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
  }, [])

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  const start = (e: React.PointerEvent) => {
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.beginPath(); ctx.moveTo(x, y)
  }
  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = color; ctx.lineWidth = size
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.stroke()
  }
  const clear = () => {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  }

  const save = async () => {
    if (!SB_CONFIGURED) { setStatus('backend not configured (.env)'); return }
    const suggested = myNick() === 'anon' ? '' : myNick()
    const name = (window.prompt('Sign your drawing (nick):', suggested) || 'anon').slice(0, 40)
    if (name && name !== 'anon') setNick(name)
    const image = canvasRef.current!.toDataURL('image/png')
    setStatus('saving…')
    try {
      await sbInsert('gorb_gallery', { name, image, owner_who: whoAmI() })
      setStatus('saved to the Gallery ✓')
      wm.launch('gallery')
    } catch {
      setStatus('could not save — is the schema applied?')
    }
  }

  return (
    <div className="paint" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="paint__bar" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 6, flexWrap: 'wrap' }}>
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} title={c}
            style={{ width: 22, height: 22, background: c, border: color === c ? '2px solid #245edb' : '1px solid #888', borderRadius: 4 }} />
        ))}
        <label style={{ fontSize: 12 }}>Size
          <input type="range" min={1} max={30} value={size} onChange={(e) => setSize(+e.target.value)} />
        </label>
        <button className="xp-btn" onClick={clear}>Clear</button>
        <button className="xp-btn xp-btn--go" onClick={save}>Save to Gallery</button>
        <span style={{ fontSize: 12, color: '#35507d' }}>{status}</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: '#808080', padding: 8 }}>
        <canvas
          ref={canvasRef}
          width={760}
          height={480}
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
          style={{ background: '#fff', cursor: 'crosshair', touchAction: 'none', border: '1px solid #333', maxWidth: '100%' }}
        />
      </div>
    </div>
  )
}
