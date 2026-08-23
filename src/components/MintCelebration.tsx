import { useEffect, useRef, useState } from 'react'
import BrokenByDesign from './ui/broken-by-design'
import { playImpact, playSting, playShatter, playClose, playVoice, stopVoice } from '../sfx'

/* Was a 66MB GIF. A GIF cannot be told to stop after one pass from markup,
   only by rewriting the file's own loop block, and a video does it properly:
   no `loop` attribute means one playthrough, then the element holds the last
   frame. Same footage at 1.7MB. Filename case matters on Cloudflare. */
const SIGNIKA = '/Signika.mp4'

/* The bought design's name, wherever it appears in this window. */
const NFT_NAME_COLOR = '#F8EE07'

const THREAT_LINE_AT = 3500
const SHATTER_AT = 7000

export interface MintCelebrationProps {
  productTitle: string
  nftImage: string
  mintAddress: string
  txSig: string
  free: boolean
  onClose: () => void
}

const CSS = `
@keyframes gorbfade { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes gorbpulse { 0%,100% { opacity: .82 } 50% { opacity: 1 } }
.gorbcel-in { animation: gorbfade .55s cubic-bezier(.16,1,.3,1) both }
.gorbcel-threat { animation: gorbfade .6s cubic-bezier(.16,1,.3,1) both, gorbpulse 1.6s ease-in-out 1s infinite }
.gorbcel-skip:hover { opacity: 1 !important; border-color: #A52AF4 !important }

/* The pane sits ON the gif, so its own backdrop has to go — otherwise
   the glass renders against its native near-black instead of the
   footage still playing underneath. Two classes beats the component's
   single-class rule, no !important needed. */
.bbd2.gorbcel-glass { background: transparent }
.bbd2.gorbcel-glass .bbd2-bg { display: none }

/* No lettering in the pane: kills both the word behind the glass and
   the per-shard slices that carry it inside each fragment. */
.bbd2.gorbcel-glass .bbd2-title,
.bbd2.gorbcel-glass .bbd2-slice { display: none }

/* The shard texture is near-black, so at full strength it just masks
   the footage. Dropping it to a third leaves the bevels and highlights
   readable while the gif plays through the panes. mix-blend-mode can't
   help here: .bbd2 sets perspective, which creates a stacking context
   that traps any blending inside the component. */
.bbd2.gorbcel-glass .bbd2-glassimg { opacity: .3 }

/* The stage is inset by default, which left the video uncovered around
   the edges. Overscanning past every side makes the pieces reach the
   full frame; .bbd2 already clips with overflow: hidden. */
.bbd2.gorbcel-glass .bbd2-stage { inset: -10% -5% }

/* Component chrome meant for a full-page hero: the mute toggle just
   sits on top of the gif here. The hover crack ticks it controls stay
   on, they are only reachable through this button. */
.bbd2.gorbcel-glass .bbd2-sound { display: none }
`

export default function MintCelebration({
  productTitle,
  nftImage,
  mintAddress,
  txSig,
  free,
  onClose,
}: MintCelebrationProps) {
  const [shattered, setShattered] = useState(false)
  const [showThreatLine, setShowThreatLine] = useState(false)

  /* StrictMode runs effects twice in dev, which would double every
     sound. Each beat is allowed to fire exactly once. */
  const played = useRef<Record<string, boolean>>({})
  const once = (key: string, fn: () => void) => {
    if (played.current[key]) return
    played.current[key] = true
    fn()
  }

  const close = () => {
    playClose()
    onClose()
  }

  // The window arriving is its own beat.
  useEffect(() => {
    once('open', playImpact)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* The voice runs behind the gif for as long as the window is open.
     Deliberately NOT behind the once() guard: StrictMode's dev remount
     would stop it on cleanup and then skip the replay, leaving silence.
     Letting it restart is harmless, playVoice stops any previous one. */
  useEffect(() => {
    playVoice()
    return () => stopVoice()
  }, [])

  // The GIF has no "ended" event to hang the sequence off, so the beats are
  // timed: line appears, then the glass comes down over the footage.
  useEffect(() => {
    const a = setTimeout(() => setShowThreatLine(true), THREAT_LINE_AT)
    const b = setTimeout(() => setShattered(true), SHATTER_AT)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])

  useEffect(() => {
    if (showThreatLine) once('sting', playSting)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showThreatLine])

  useEffect(() => {
    if (shattered) once('shatter', playShatter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shattered])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <style>{CSS}</style>
      <div style={overlay}>
        <div style={panel} className="gorbcel-in">
          <div style={panelBar}>
            <span style={{ fontWeight: 700, letterSpacing: '.04em' }}>GORB.EXE</span>
            <button style={barClose} onClick={close} aria-label="Close">×</button>
          </div>

            <div style={panelBody}>
              <div style={gifWrap}>
                {/* muted because voice.mp3 carries the audio for this beat */}
                <video
                  src={SIGNIKA}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  style={gifStyle}
                />
                {shattered && (
                  <div style={glassLayer}>
                    {/* Title is blanked as well as hidden in CSS, so nothing
                        is announced for a purely decorative pane. */}
                    <BrokenByDesign
                      title=""
                      height="100%"
                      className="gorbcel-glass"
                    />
                  </div>
                )}
              </div>

              <p style={dareLine}>
                How you dare to buy the &ldquo;
                <span style={{ color: NFT_NAME_COLOR }}>{productTitle}</span>
                &rdquo;
              </p>

              <div style={nftCard}>
                <img
                  src={nftImage}
                  alt={productTitle}
                  style={nftImg}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/4444.png' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <b style={{ fontSize: 15, color: NFT_NAME_COLOR }}>{productTitle}</b>
                  <span style={{ fontSize: 11, color: free ? '#7CE38B' : '#C9A6F5' }}>
                    {free ? 'Minted free' : 'Minted'} · {mintAddress.slice(0, 6)}…{mintAddress.slice(-4)}
                  </span>
                  <a
                    href={`https://solscan.io/tx/${txSig}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#A52AF4' }}
                  >
                    View transaction ↗
                  </a>
                </div>
              </div>

              {showThreatLine && (
                <p style={threatLine} className="gorbcel-threat">
                  ill find you and i ll gorb you
                </p>
              )}

              <button
                style={skipBtn}
                className="gorbcel-skip"
                onClick={() => (shattered ? close() : setShattered(true))}
              >
                {shattered ? 'close' : 'skip ▸'}
              </button>
            </div>
        </div>
      </div>
    </>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  background: 'rgba(3, 4, 7, .93)',
  display: 'grid',
  placeItems: 'center',
  backdropFilter: 'blur(3px)',
}

const panel: React.CSSProperties = {
  width: 'min(560px, 92vw)',
  maxHeight: '92vh',
  overflow: 'auto',
  borderRadius: 14,
  border: '1px solid #4a2a72',
  background: 'linear-gradient(180deg, #16091f, #0a0510)',
  boxShadow: '0 30px 90px rgba(0,0,0,.75), 0 0 40px rgba(165,42,244,.18)',
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
}

const panelBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid #3a2159',
  background: 'linear-gradient(180deg, #A52AF4, #5f199a)',
  color: '#fff',
  fontSize: 12,
}

const barClose: React.CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'rgba(0,0,0,.25)',
  color: '#fff',
  width: 22,
  height: 20,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 15,
  lineHeight: 1,
}

const panelBody: React.CSSProperties = {
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  alignItems: 'stretch',
}

const gifWrap: React.CSSProperties = {
  position: 'relative',
  borderRadius: 10,
  overflow: 'hidden',
}

const glassLayer: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 2,
}

const gifStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  display: 'block',
  background: '#000',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
}

const dareLine: React.CSSProperties = {
  margin: 0,
  textAlign: 'center',
  // Same Regular-only caveat as the threat line: leave weight at 400.
  fontFamily: "'Gagalin', 'Space Grotesk', system-ui, sans-serif",
  fontSize: 28,
  fontWeight: 400,
  color: '#fff',
  letterSpacing: '.01em',
  lineHeight: 1.2,
}

const nftCard: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  padding: 10,
  borderRadius: 10,
  border: '1px solid #3a2159',
  background: 'rgba(255,255,255,.03)',
}

const nftImg: React.CSSProperties = {
  width: 78,
  height: 78,
  borderRadius: 8,
  objectFit: 'cover',
  flexShrink: 0,
}

const threatLine: React.CSSProperties = {
  margin: 0,
  textAlign: 'center',
  // Gagalin ships Regular only, so keep weight at 400: asking for 700
  // would make the browser synthesise a smeared fake bold.
  fontFamily: "'Gagalin', 'Space Grotesk', system-ui, sans-serif",
  fontSize: 38,
  fontWeight: 400,
  color: '#ff1f1f',
  letterSpacing: '.01em',
  lineHeight: 1.15,
  textShadow: '0 0 26px rgba(255,31,31,.5)',
}

const skipBtn: React.CSSProperties = {
  alignSelf: 'center',
  appearance: 'none',
  background: 'transparent',
  border: '1px solid #3a2159',
  color: '#9b86b8',
  borderRadius: 999,
  padding: '5px 16px',
  fontSize: 11,
  cursor: 'pointer',
  opacity: .7,
  transition: 'opacity .2s, border-color .2s',
}
