import { useEffect, useRef } from 'react'
import { TEMPLATES } from '../data/templates'
import { CONFIG } from '../data/apps'
import type { AppId } from '../data/apps'
import { useWM } from '../wm'

// Renders one of the original <template> blocks verbatim, then wires up the
// data-open / data-cfg links and the few dynamic text bits (contract address,
// copy buttons, external hrefs) that the original JS filled in at runtime.
export default function StaticApp({ app }: { app: AppId }) {
  const wm = useWM()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    // fill the contract address placeholders
    root.querySelectorAll('#padCA, #dlgCA').forEach((el) => { el.textContent = CONFIG.ca })

    // external link targets the original set from CONFIG
    const scan = root.querySelector<HTMLAnchorElement>('#dlgScan')
    if (scan) scan.href = CONFIG.scan
    const padBuy = root.querySelector<HTMLAnchorElement>('#padBuy')
    if (padBuy) padBuy.href = CONFIG.buy

    // leaderboard has no live backend here
    const lb = root.querySelector('#lbList')
    if (lb) lb.innerHTML = '<li class="lb__empty">No runs recorded yet — Gorb Run is in development.</li>'

    const onClick = (e: Event) => {
      const t = e.target as HTMLElement
      const open = t.closest<HTMLElement>('[data-open]')
      if (open) {
        e.preventDefault()
        wm.launch(open.dataset.open as AppId)
        return
      }
      const cfg = t.closest<HTMLElement>('[data-cfg]')
      if (cfg) {
        e.preventDefault()
        const key = cfg.dataset.cfg as keyof typeof CONFIG
        if (CONFIG[key]) window.open(CONFIG[key], '_blank', 'noopener')
        return
      }
      if (t.closest('#padCopy, #dlgCopy')) {
        e.preventDefault()
        navigator.clipboard?.writeText(CONFIG.ca).catch(() => {})
        const btn = t.closest('button')!
        const old = btn.textContent
        btn.textContent = 'Copied ✓'
        setTimeout(() => { btn.textContent = old }, 1200)
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [app, wm])

  return <div ref={ref} className="static-app" dangerouslySetInnerHTML={{ __html: TEMPLATES[app] }} />
}
