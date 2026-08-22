import { useEffect, useState } from 'react'
import { CONFIG } from '../data/apps'

interface Stats {
  price?: string
  mcap?: string
  liq?: string
  vol?: string
  pair?: string
  change?: string
}

const money = (n?: number) =>
  n === undefined ? '—' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M'
  : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + n.toFixed(2)

export default function Terminal() {
  const [live, setLive] = useState('connecting…')
  const [s, setS] = useState<Stats>({})

  const load = () => {
    setLive('connecting…')
    fetch('https://api.dexscreener.com/latest/dex/tokens/' + CONFIG.ca)
      .then((r) => r.json())
      .then((d) => {
        const p = (d.pairs || []).sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
        if (!p) { setLive('no pair found yet'); return }
        setLive('live from Dexscreener')
        setS({
          price: p.priceUsd ? '$' + Number(p.priceUsd).toPrecision(4) : '—',
          mcap: money(p.marketCap || p.fdv),
          liq: money(p.liquidity?.usd),
          vol: money(p.volume?.h24),
          pair: p.dexId + ' · ' + p.baseToken?.symbol + '/' + p.quoteToken?.symbol,
          change: p.priceChange?.h24 !== undefined ? p.priceChange.h24 + '%' : '—',
        })
      })
      .catch(() => setLive('offline — could not reach Dexscreener'))
  }

  useEffect(() => { load() }, [])

  const cell = (k: string, v?: string) => (
    <div className="term__cell"><b>{v ?? '—'}</b><small>{k}</small></div>
  )

  return (
    <div className="term" id="tmBody">
      <div className="term__bar">
        <span className="term__live" id="tmLive">{live}</span>
        <button className="ie__tb" id="tmReload" type="button" onClick={load}>↻ Refresh</button>
      </div>
      <section className="term__own">
        <h3>$GORB</h3>
        <div className="term__grid" id="tmStats"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
          {cell('Price', s.price)}
          {cell('Market cap', s.mcap)}
          {cell('Liquidity', s.liq)}
          {cell('24h volume', s.vol)}
          {cell('24h change', s.change)}
        </div>
        <p className="term__pair" id="tmPair">{s.pair || ''}</p>
      </section>
      <section className="term__hold">
        <h3>Contract</h3>
        <p className="term__pair" style={{ wordBreak: 'break-all' }}>{CONFIG.ca}</p>
      </section>
    </div>
  )
}
