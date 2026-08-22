import { CONFIG } from '../data/apps'

export default function Chart() {
  const embed = CONFIG.chart + '?embed=1&theme=dark&info=0'
  return (
    <div className="chart" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chart__bar">
        <span className="chart__badge">LIVE</span>
        <span className="chart__url" id="chartUrl">dexscreener.com</span>
        <a className="xp-btn" id="chartOpen" href={CONFIG.chart} target="_blank" rel="noopener">Open in browser</a>
      </div>
      <iframe
        title="Dexscreener live chart"
        src={embed}
        style={{ flex: 1, width: '100%', border: 0, background: '#0d1622' }}
      />
    </div>
  )
}
