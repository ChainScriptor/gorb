import { useEffect, useRef, useState } from 'react'
import { sbGet, sbInsert, whoAmI, myNick, setNick, SB_CONFIGURED } from '../data/supabase'
import { usePresence } from '../hooks/usePresence'

interface Msg { id: number; nick: string; body: string; who?: string; image?: string; is_bot?: boolean; created_at?: string }

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [who, setWho] = useState('connecting…')
  const [nick, setNickState] = useState(myNick())
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const online = usePresence()

  const load = () => {
    if (!SB_CONFIGURED) { setWho('backend not configured (.env)'); return }
    sbGet<Msg[]>('gorb_chat?select=id,created_at,nick,body,who,image,is_bot&order=id.asc&limit=80')
      .then((d) => { setMsgs(d); setWho('The Pond') })
      .catch(() => setWho('offline — could not reach the pond'))
  }
  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => { endRef.current?.scrollIntoView() }, [msgs])

  const send = async () => {
    const body = text.trim()
    if (!body || sending || !SB_CONFIGURED) return
    const finalNick = (nick || 'anon').slice(0, 24)
    setNick(finalNick)
    setSending(true)
    try {
      await sbInsert('gorb_chat', { nick: finalNick, body, who: whoAmI() })
      setText('')
      load()
    } catch {
      setWho('could not send — is the schema applied?')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="msn" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="msn__head">
        <div className="msn__pic"><img src={'/4444.png'} alt="" /></div>
        <div className="msn__who">
          <b>The Pond</b>
          <span id="chWho">{who}{online != null ? ` · ${online} online` : ''}</span>
        </div>
      </div>

      <div className="msn__log" style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {msgs.map((m) => (
          <div key={m.id} className={'msn__msg' + (m.is_bot ? ' msn__msg--bot' : '')} style={{ marginBottom: 8 }}>
            <b style={{ color: m.is_bot ? '#2c5a14' : '#7b2ff7' }}>{m.nick || 'anon'}:</b>{' '}
            {m.image ? <img src={m.image} alt="" style={{ maxWidth: 160, display: 'block', imageRendering: 'pixelated' }} /> : null}
            <span>{m.body}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="msn__compose" style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid #b6c4dd' }}>
        <input
          className="ie__input"
          value={nick}
          onChange={(e) => setNickState(e.target.value)}
          placeholder="nick"
          style={{ width: 90, flex: '0 0 auto' }}
          disabled={!SB_CONFIGURED}
        />
        <input
          className="ie__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder={SB_CONFIGURED ? 'Say something to the pond…' : 'Backend not configured (.env)'}
          style={{ flex: 1 }}
          disabled={!SB_CONFIGURED}
        />
        <button className="xp-btn xp-btn--go" onClick={send} disabled={sending || !SB_CONFIGURED}>Send</button>
      </div>
    </div>
  )
}
