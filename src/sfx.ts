/* Synthesised UI sounds. Everything here is generated with WebAudio at
   call time — no audio files to ship, which matters on a site that is
   already heavy on media. Each export is one "beat" of the mint
   sequence, but they are generic enough to reuse for window chrome. */

let ctx: AudioContext | null = null

/* Browsers hand back a suspended context until the page has been
   interacted with. Every mint path starts from a click, so by the time
   these run the resume() is a formality — but a suspended context
   would silently swallow the sound, so ask anyway. */
function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

function noiseBuffer(c: AudioContext, seconds: number, decay: number) {
  const len = Math.max(1, Math.floor(c.sampleRate * seconds))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay
  return buf
}

/** Deep impact — the window slamming into view. */
export function playImpact() {
  const c = ac()
  if (!c) return
  const now = c.currentTime

  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(120, now)
  o.frequency.exponentialRampToValueAtTime(34, now + 0.55)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.45, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
  o.connect(g); g.connect(c.destination)
  o.start(now); o.stop(now + 0.75)

  const air = c.createBufferSource()
  air.buffer = noiseBuffer(c, 0.35, 3)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 900
  const ng = c.createGain()
  ng.gain.setValueAtTime(0.16, now)
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
  air.connect(lp); lp.connect(ng); ng.connect(c.destination)
  air.start(now)
}

/** Rising dissonant sting — the threat line landing. */
export function playSting() {
  const c = ac()
  if (!c) return
  const now = c.currentTime

  // A minor second apart: deliberately unpleasant.
  for (const [i, f] of [82.4, 87.3].entries()) {
    const o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(f, now)
    o.frequency.linearRampToValueAtTime(f * 1.5, now + 1.1)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(280, now)
    lp.frequency.linearRampToValueAtTime(1700, now + 1.1)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.11, now + 0.5)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.3)
    o.connect(lp); lp.connect(g); g.connect(c.destination)
    o.start(now + i * 0.02); o.stop(now + 1.35)
  }
}

/** Glass smash — crash body plus scattered shard tinkles. */
export function playShatter() {
  const c = ac()
  if (!c) return
  const now = c.currentTime

  const crash = c.createBufferSource()
  crash.buffer = noiseBuffer(c, 0.7, 2.2)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1800
  const g = c.createGain()
  g.gain.setValueAtTime(0.32, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
  crash.connect(hp); hp.connect(g); g.connect(c.destination)
  crash.start(now)

  for (let i = 0; i < 14; i++) {
    const t = now + 0.03 + Math.random() * 0.45
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(2200 + Math.random() * 4200, t)
    const og = c.createGain()
    og.gain.setValueAtTime(0.0001, t)
    og.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.05, t + 0.004)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + Math.random() * 0.15)
    o.connect(og); og.connect(c.destination)
    o.start(t); o.stop(t + 0.35)
  }
}

/** Fire-and-forget one-shot clip. Nothing keeps a handle to it, so use
    this only for sounds that are always allowed to run to the end. */
export function playClip(src: string, volume = 0.9) {
  try {
    const a = new Audio(src)
    a.volume = volume
    a.play().catch(() => {})
  } catch {
    /* decorative */
  }
}

/* The gif's own voice track. Kept as a module-level handle so closing
   the window can cut it off instead of leaving it playing to the end. */
let voice: HTMLAudioElement | null = null

export function playVoice(src = '/voice.mp3', volume = 0.9) {
  try {
    stopVoice()
    voice = new Audio(src)
    voice.volume = volume
    // Blocked autoplay rejects here; nothing to recover, the track is
    // decorative and every other beat still fires.
    voice.play().catch(() => {})
  } catch {
    /* decorative */
  }
}

export function stopVoice() {
  if (!voice) return
  try {
    voice.pause()
    voice.currentTime = 0
  } catch {
    /* already torn down */
  }
  voice = null
}

/** Short descending blip — a window going away. */
export function playClose() {
  const c = ac()
  if (!c) return
  const now = c.currentTime
  const o = c.createOscillator()
  o.type = 'square'
  o.frequency.setValueAtTime(520, now)
  o.frequency.exponentialRampToValueAtTime(180, now + 0.14)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.07, now + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  o.connect(g); g.connect(c.destination)
  o.start(now); o.stop(now + 0.2)
}
