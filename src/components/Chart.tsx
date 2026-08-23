import { CONFIG, HAS_TOKEN } from '../data/apps'

export default function Chart() {
  /* Without a contract there is nothing to chart. Embedding Dexscreener with a
     placeholder would show somebody else's token as if it were this one. */
  if (!HAS_TOKEN) {
    return (
      <div className="chart" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="chart__bar">
          <span className="chart__badge" style={{ background: '#6b7280' }}>OFFLINE</span>
          <span className="chart__url">no pair yet</span>
        </div>
        <div style={empty}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>There is no chart yet.</p>
          <p style={{ margin: 0, maxWidth: '46ch', lineHeight: 1.6 }}>
            $GORB has not launched. When there is a real contract this window will stream the
            live pair from Dexscreener.
          </p>
          <p style={{ margin: 0, fontSize: 12, opacity: .75, maxWidth: '46ch', lineHeight: 1.6 }}>
            If you find a token calling itself $GORB before then, it is not ours.
          </p>
        </div>
      </div>
    )
  }

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

const empty: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 24,
  textAlign: 'center',
  background: '#0d1622',
  color: '#cfe0ff',
}
