import { createContext, useContext, useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { APPS } from './data/apps'
import type { AppId } from './data/apps'

export interface WinInstance {
  key: number
  app: AppId
  x: number
  y: number
  w: number
  h: number
  z: number
  min: boolean
  payload?: unknown
}

interface WMApi {
  wins: WinInstance[]
  topZ: number
  launch: (app: AppId, payload?: unknown) => void
  close: (key: number) => void
  focus: (key: number) => void
  toggleMin: (key: number) => void
  move: (key: number, x: number, y: number) => void
}

const WMContext = createContext<WMApi | null>(null)
export const useWM = () => {
  const v = useContext(WMContext)
  if (!v) throw new Error('useWM outside provider')
  return v
}

// viewer is allowed to remount with fresh payload; everything else is single-instance
const REMOUNT: AppId[] = ['viewer']

export function WMProvider({ children }: { children: ReactNode }) {
  const [wins, setWins] = useState<WinInstance[]>([])
  const z = useRef(10)
  const seq = useRef(1)
  const [topZ, setTopZ] = useState(10)

  const focus = useCallback((key: number) => {
    z.current += 1
    setTopZ(z.current)
    setWins((w) => w.map((it) => (it.key === key ? { ...it, z: z.current, min: false } : it)))
  }, [])

  const launch = useCallback((app: AppId, payload?: unknown) => {
    setWins((w) => {
      if (!REMOUNT.includes(app)) {
        const existing = w.find((it) => it.app === app)
        if (existing) {
          z.current += 1
          setTopZ(z.current)
          return w.map((it) =>
            it.key === existing.key ? { ...it, z: z.current, min: false, payload } : it,
          )
        }
      }
      const def = APPS[app]
      const vw = window.innerWidth
      const vh = window.innerHeight - 40
      const wpx = Math.min(def.w, vw - 20)
      const hpx = Math.min(def.h, vh - 20)
      const offset = (w.length % 6) * 26
      const x = Math.max(8, Math.round((vw - wpx) / 2) + offset - 60)
      const y = Math.max(8, Math.round((vh - hpx) / 2) + offset - 60)
      z.current += 1
      setTopZ(z.current)
      const key = seq.current++
      // viewer: keep at most one
      const base = REMOUNT.includes(app) ? w.filter((it) => it.app !== app) : w
      return [...base, { key, app, x, y, w: wpx, h: hpx, z: z.current, min: false, payload }]
    })
  }, [])

  const close = useCallback((key: number) => {
    setWins((w) => w.filter((it) => it.key !== key))
  }, [])

  const toggleMin = useCallback((key: number) => {
    setWins((w) => w.map((it) => (it.key === key ? { ...it, min: !it.min } : it)))
    focus(key)
  }, [focus])

  const move = useCallback((key: number, x: number, y: number) => {
    setWins((w) => w.map((it) => (it.key === key ? { ...it, x, y } : it)))
  }, [])

  return (
    <WMContext.Provider value={{ wins, topZ, launch, close, focus, toggleMin, move }}>
      {children}
    </WMContext.Provider>
  )
}
