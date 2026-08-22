import { useMemo, useState } from 'react'
import { PRODUCTS } from '../data/apps'
import type { Product } from '../data/apps'
import { sbInsert, whoAmI, SB_CONFIGURED } from '../data/supabase'

interface Line { p: Product; qty: number }
type Stage = 'shop' | 'checkout' | 'done'

export default function Shop() {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [stage, setStage] = useState<Stage>('shop')
  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [zoom, setZoom] = useState<Product | null>(null)

  const lines: Line[] = useMemo(
    () => PRODUCTS.filter((p) => cart[p.id]).map((p) => ({ p, qty: cart[p.id] })),
    [cart],
  )
  const total = lines.reduce((n, l) => n + l.p.price * l.qty, 0)
  const count = lines.reduce((n, l) => n + l.qty, 0)

  const add = (id: string, d: number) =>
    setCart((c) => {
      const q = Math.max(0, (c[id] || 0) + d)
      const next = { ...c }
      if (q === 0) delete next[id]
      else next[id] = q
      return next
    })

  const euro = (n: number) => n.toFixed(2) + '€'

  const placeOrder = async () => {
    setErr('')
    if (!SB_CONFIGURED) { setErr('Backend not configured (.env).'); return }
    if (!form.name.trim() || !form.email.trim() || !form.address.trim()) {
      setErr('Please fill in name, email and address.'); return
    }
    setBusy(true)
    try {
      await sbInsert(
        'gorb_orders',
        {
          who: whoAmI(),
          name: form.name.trim().slice(0, 80),
          email: form.email.trim().slice(0, 120),
          address: form.address.trim().slice(0, 300),
          items: lines.map((l) => ({ id: l.p.id, title: l.p.title, price: l.p.price, qty: l.qty })),
          total: Number(total.toFixed(2)),
        },
        'minimal',
      )
      setStage('done')
      setCart({})
    } catch {
      setErr('Could not place the order. Is gorb_orders created (orders.sql)?')
    } finally {
      setBusy(false)
    }
  }

  // ── confirmation ──────────────────────────────────────────────
  if (stage === 'done') {
    return (
      <div className="shop" style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ marginTop: 8 }}>Order placed 🎉</h2>
        <p>Thanks {form.name || 'friend'}. Your Gorb plushies are on the way to the pond.</p>
        <button className="xp-btn xp-btn--go" onClick={() => { setStage('shop'); setForm({ name: '', email: '', address: '' }) }}>
          Back to the shop
        </button>
      </div>
    )
  }

  // ── checkout ──────────────────────────────────────────────────
  if (stage === 'checkout') {
    return (
      <div className="shop" style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        <div className="ie__crumb">Gorb Shop | Checkout</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', flex: 1, minHeight: 0 }}>
          <form style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 8 }}
                onSubmit={(e) => { e.preventDefault(); placeOrder() }}>
            <label>Full name<input className="ie__input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%' }} /></label>
            <label>Email<input className="ie__input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%' }} /></label>
            <label>Shipping address<textarea className="ie__input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} style={{ width: '100%', resize: 'vertical' }} /></label>
            {err && <p style={{ color: '#c62828', margin: 0 }}>{err}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" className="xp-btn" onClick={() => setStage('shop')}>◀ Back</button>
              <button type="submit" className="xp-btn xp-btn--go" disabled={busy}>{busy ? 'Placing…' : `Place order · ${euro(total)}`}</button>
            </div>
            <p style={{ fontSize: 12, color: '#607089', margin: 0 }}>No payment is taken here. Your order is recorded and we contact you by email.</p>
          </form>

          <div style={{ flex: '1 1 220px', overflow: 'auto' }}>
            <b>Your cart</b>
            {lines.map((l) => (
              <div key={l.p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e3e6ea' }}>
                <span>{l.qty}× {l.p.title}</span><span>{euro(l.p.price * l.qty)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700 }}>
              <span>Total</span><span>{euro(total)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── catalogue ─────────────────────────────────────────────────
  return (
    <div className="shop" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ie__brandbar">
        <img src="/4444.png" alt="" />
        <b><small>Official</small>Gorb Shop<span>McD</span></b>
        <em>Limited edition plushies ▸</em>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {PRODUCTS.map((p) => (
          <div key={p.id} style={{ border: '1px solid #c7d2e2', borderRadius: 12, background: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: '#f2f5fb', borderRadius: 8, aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }}
                 title="Click to enlarge"
                 onClick={() => setZoom(p)}>
              <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                   onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/4444.png' }} />
              <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 12, lineHeight: 1, padding: '4px 6px', borderRadius: 6 }}>⤢</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <b style={{ fontSize: 16 }}>{p.title}</b>
              <span style={{ fontWeight: 700, color: '#7b2ff7' }}>{euro(p.price)}</span>
            </div>
            {p.tag && <span style={{ alignSelf: 'flex-start', fontSize: 11, color: '#7b2ff7', border: '1px solid #cbb3f0', borderRadius: 999, padding: '1px 8px' }}>{p.tag}</span>}
            <p style={{ fontSize: 12, color: '#54607a', margin: 0, flex: 1 }}>{p.blurb}</p>
            {cart[p.id] ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="xp-btn" onClick={() => add(p.id, -1)}>−</button>
                <span style={{ minWidth: 20, textAlign: 'center' }}>{cart[p.id]}</span>
                <button className="xp-btn" onClick={() => add(p.id, 1)}>+</button>
              </div>
            ) : (
              <button className="xp-btn xp-btn--go" onClick={() => add(p.id, 1)}>Add to cart</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderTop: '1px solid #b6c4dd', background: '#ece9d8' }}>
        <span>🛒 {count} item{count === 1 ? '' : 's'}</span>
        <b style={{ marginLeft: 'auto' }}>{euro(total)}</b>
        <button className="xp-btn xp-btn--go" disabled={count === 0} onClick={() => setStage('checkout')}>Checkout ▶</button>
      </div>

      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 24 }}
        >
          <img
            src={zoom.img}
            alt={zoom.title}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 12px 48px rgba(0,0,0,.6)', cursor: 'default' }}
          />
          <div style={{ marginTop: 12, color: '#fff', fontWeight: 700 }}>{zoom.title} · {euro(zoom.price)}</div>
          <button
            onClick={() => setZoom(null)}
            aria-label="Close"
            style={{ position: 'absolute', top: 16, right: 20, width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 20, cursor: 'pointer' }}
          >✕</button>
        </div>
      )}
    </div>
  )
}
