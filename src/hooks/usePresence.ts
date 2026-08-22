import { useEffect, useState } from 'react'
import { SB_CONFIGURED, sbUpsert, sbRpc, whoAmI, myNick } from '../data/supabase'

// Heartbeats this client into gorb_presence and returns the live online count.
// Falls back to null (hidden) when Supabase is not configured or unreachable.
export function usePresence() {
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    if (!SB_CONFIGURED) return
    let alive = true

    const beat = async () => {
      try {
        await sbUpsert('gorb_presence', {
          who: whoAmI(),
          nick: myNick(),
          last_seen: new Date().toISOString(),
        })
        const n = await sbRpc<number>('gorb_online')
        if (alive) setOnline(typeof n === 'number' ? n : Number(n))
      } catch {
        if (alive) setOnline(null)
      }
    }

    beat()
    const id = setInterval(beat, 15000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return online
}
