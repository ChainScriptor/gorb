import { useWM } from '../wm'

export default function GameComingSoon({ winKey }: { winKey?: number }) {
  const wm = useWM()

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden', background: '#0a0a0a' }}>
      <style>{`
        @keyframes gorbLoadingBar {
          0%   { left: -35%; width: 35%; }
          50%  { left: 60%;  width: 45%; }
          100% { left: -35%; width: 35%; }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: -20,
          backgroundImage: 'url(/game-banner.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          transform: 'scale(1.05)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,.45)' }} />

      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          textAlign: 'center',
          padding: 24,
          color: '#fff',
        }}
      >
        <img src="/4444.png" alt="" style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: 1, textShadow: '0 2px 12px rgba(0,0,0,.6)' }}>
          GORB <span style={{ color: '#7b2ff7' }}>RESCUE</span>
        </h1>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, color: '#d8dce6', textTransform: 'uppercase' }}>
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
            background: 'rgba(123,47,247,.28)',
            border: '1px solid #7b2ff7',
            color: '#e3d2ff',
          }}
        >
          ⚒ UNDER DEVELOPMENT
        </span>

        <p style={{ maxWidth: 420, margin: 0, fontSize: 13, color: '#e7e9ee', lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,.6)' }}>
          Play as a tiny Gorb sneaking past giant human hands, dodging the drive-thru staff to pull your
          family out of their boxes before the case gets sealed. Still being built — check back soon.
        </p>

        <div style={{ position: 'relative', width: 280, height: 6, borderRadius: 999, background: 'rgba(38,38,43,.85)', overflow: 'hidden', marginTop: 4 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg,#7b2ff7,#25f4ee)',
              animation: 'gorbLoadingBar 2.2s ease-in-out infinite',
            }}
          />
        </div>

        <button
          className="xp-btn xp-btn--go"
          style={{ marginTop: 10 }}
          onClick={() => { if (winKey !== undefined) wm.close(winKey) }}
        >
          ⏻ Back to desktop
        </button>
      </div>
    </div>
  )
}
