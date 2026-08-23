import { useEffect, useRef } from 'react'
import { TEMPLATES } from '../data/templates'
import { CONFIG, HAS_TOKEN } from '../data/apps'
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

    /* There is no token yet. Rather than print an address the project cannot
       stand behind, every contract surface says so plainly and the buy/scan
       buttons are disabled until gorbos.json carries a real one. */
    root.querySelectorAll('#padCA, #dlgCA').forEach((el) => {
      el.textContent = HAS_TOKEN ? CONFIG.ca : 'Not launched yet — there is no $GORB contract.'
    })

    const disable = (el: HTMLAnchorElement | null, href: string) => {
      if (!el) return
      if (HAS_TOKEN) { el.href = href; return }
      el.removeAttribute('href')
      el.setAttribute('aria-disabled', 'true')
      el.style.pointerEvents = 'none'
      el.style.opacity = '0.45'
    }
    disable(root.querySelector<HTMLAnchorElement>('#dlgScan'), CONFIG.scan)
    disable(root.querySelector<HTMLAnchorElement>('#padBuy'), CONFIG.buy)

    if (!HAS_TOKEN) {
      root.querySelectorAll<HTMLButtonElement>('#padCopy, #dlgCopy').forEach((b) => {
        b.disabled = true
        b.style.opacity = '0.45'
      })
      root.querySelectorAll('.dlg__warn').forEach((el) => {
        el.textContent =
          'No contract exists yet. If anyone shows you a $GORB address right now, it is not ours.'
      })
    }

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
        if (!HAS_TOKEN) return
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
