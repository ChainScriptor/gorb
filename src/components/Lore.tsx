import { useIsMobile } from '../hooks/useIsMobile'

const PDF = '/gorb-lore.pdf'

/* Mobile browsers mostly refuse to render a PDF inside an iframe, so phones
   get a card that hands the file off to the system viewer instead. */
export default function Lore() {
  const isMobile = useIsMobile()

  return (
    <div style={wrap}>
      <div style={bar}>
        <span style={{ fontSize: 12, color: '#35507d' }}>
          <b>The Grove to the Drive-Thru</b> — the Gorb family origin file, 24 pages
        </span>
        <a
          className="xp-btn"
          href={PDF}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none', fontSize: 12, padding: '4px 12px', marginLeft: 'auto' }}
        >
          Open ↗
        </a>
        <a
          className="xp-btn"
          href={PDF}
          download="The Grove to the Drive-Thru.pdf"
          style={{ textDecoration: 'none', fontSize: 12, padding: '4px 12px' }}
        >
          Download
        </a>
      </div>

      {isMobile ? (
        <div style={card}>
          <img src="/game-banner.png" alt="" style={cover} />
          <p style={{ margin: 0, fontSize: 14, color: '#cfc2dd', lineHeight: 1.6 }}>
            Ten chapters, from the valley where they grew to the window where they were
            handed away with a burger.
          </p>
          <a
            className="xp-btn xp-btn--go"
            href={PDF}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none', padding: '8px 20px' }}
          >
            Read the file ↗
          </a>
        </div>
      ) : (
        <iframe
          src={PDF}
          title="The Grove to the Drive-Thru"
          style={{ flex: 1, width: '100%', border: 0, background: '#0b0710' }}
        />
      )}
    </div>
  )
}

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: '#0b0710',
}

const bar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#ece9d8',
  borderBottom: '1px solid #b6c4dd',
  flexWrap: 'wrap',
}

const card: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: 20,
  textAlign: 'center',
}

const cover: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  borderRadius: 10,
  display: 'block',
}
