import { useWM } from '../wm'

export default function GameComingSoon({ winKey }: { winKey?: number }) {
  const wm = useWM()

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
        padding: 24,
        background: '#0a0a0a',
        color: '#fff',
      }}
    >
      <img src="/4444.png" alt="" style={{ width: 56, height: 56, borderRadius: '50%' }} />
      <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 1 }}>
        GORB <span style={{ color: '#7b2ff7' }}>RESCUE</span>
      </h1>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, color: '#9aa5b8', textTransform: 'uppercase' }}>
        The Gorb Family · Rescue Mission
      </p>

      <span
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          padding: '4px 12px',
          borderRadius: 999,
          background: 'rgba(123,47,247,.18)',
          border: '1px solid #7b2ff7',
          color: '#c8a3ff',
        }}
      >
        ⚒ UNDER DEVELOPMENT
      </span>

      <p style={{ maxWidth: 380, margin: 0, fontSize: 13, color: '#c7cdd9', lineHeight: 1.5 }}>
        Play as a tiny Gorb sneaking past giant human hands, dodging the drive-thru staff to pull your
        family out of their boxes before the case gets sealed. Still being built — check back soon.
      </p>

      <div style={{ width: 260, height: 6, borderRadius: 999, background: '#26262b', overflow: 'hidden', marginTop: 4 }}>
        <div style={{ width: '35%', height: '100%', background: 'linear-gradient(90deg,#7b2ff7,#25f4ee)' }} />
      </div>

      <button
        className="xp-btn xp-btn--go"
        style={{ marginTop: 10 }}
        onClick={() => { if (winKey !== undefined) wm.close(winKey) }}
      >
        ⏻ Back to desktop
      </button>
    </div>
  )
}
