import { useEffect, useRef, useState } from 'react'
import { CONFIG, HAS_TOKEN, PRODUCTS, type AppId } from '../data/apps'
import { useWM } from '../wm'

/* Desk assistant that lives in the bottom-right corner. Canned answers only,
   no model behind it: every reply below is written, so it can never invent a
   contract address or promise anything about price. */

const AVATAR = '/4444.webp'

interface Topic {
  id: string
  chip: string
  /** lowercase words that should route a typed question here */
  match: string[]
  answer: string
  /** optional app to open alongside the answer */
  opens?: AppId
  /** optional external link offered as a button */
  link?: { label: string; href: string }
  /** optional copyable string */
  copy?: string
}

const TOPICS: Topic[] = [
  {
    id: 'contract',
    chip: 'contract',
    match: ['contract', 'ca', 'address', 'token', 'συμβολαιο'],
    answer: HAS_TOKEN
      ? 'The contract address is below. Copy it from here, not from a reply under someone else\'s post. That is how people get robbed.'
      : 'There is no contract. $GORB has not launched, so there is nothing to buy and nothing to copy. If somebody shows you an address today it is not ours, and you should assume they are trying to take your money.',
    copy: HAS_TOKEN ? CONFIG.ca : undefined,
    link: HAS_TOKEN ? { label: 'Solscan ↗', href: CONFIG.scan } : undefined,
  },
  {
    id: 'buy',
    chip: 'how do i buy',
    match: ['buy', 'buying', 'purchase', 'pump', 'jupiter', 'jup', 'swap', 'how do i get', 'αγορα'],
    answer: HAS_TOKEN
      ? 'Take the contract address above into pump.fun or any Solana swap app you already trust. Check the address character by character before you sign anything.'
      : 'You cannot yet. It has not launched. When it does, the address will show up here and on the official X account first, and anywhere else is somebody guessing or lying.',
  },
  {
    id: 'nft',
    chip: 'the nfts',
    match: ['nft', 'mint', 'minting', 'collectible', 'devnet'],
    answer:
      `There are ${PRODUCTS.length} of my family and every one of them can be minted. It runs on Solana devnet for now, which means it is a test network and costs no real money. Set Phantom to devnet first. Keep whatever you mint: those are the ones you will be able to play as in Gorb Rescue.`,
    opens: 'nftmint',
  },
  {
    id: 'story',
    chip: 'the story',
    match: ['story', 'lore', 'history', 'what happened', 'family', 'ιστορια'],
    answer:
      'Ten chapters, from the valley where we grew to the window where they handed us away with a burger. It is all in the file. Read it properly.',
    opens: 'lore',
  },
  {
    id: 'gallery',
    chip: 'the gallery',
    match: ['gallery', 'art', 'poster', 'posters', 'images', 'pictures'],
    answer: 'Posters on the wall, and whatever anyone has drawn in Gorb Paint. Both are in there.',
    opens: 'gallery',
  },
  {
    id: 'canal',
    chip: 'canal 88',
    match: ['canal', '88', 'tv', 'video', 'tape', 'tapes'],
    answer: 'The old tapes. Use Prev and Next to change channel, and the third button turns the sound on.',
    opens: 'canal88',
  },
  {
    id: 'games',
    chip: 'the game',
    match: ['game', 'games', 'play', 'rescue', 'παιχνιδι'],
    answer:
      'Gorb Rescue. It is not finished. When it is, you get to go into the building and bring them out yourself, and the family you can play as is the one you minted. Collect them now.',
    opens: 'game',
  },
  {
    id: 'chart',
    chip: 'the chart',
    match: ['chart', 'price', 'dexscreener', 'dex', 'τιμη'],
    answer: HAS_TOKEN
      ? 'The chart opens on the desktop. I am not going to tell you what it is going to do, because I do not know and neither does anyone else.'
      : 'There is no chart, because there is no token yet.',
    opens: 'chart',
  },
  {
    id: 'socials',
    chip: 'socials',
    match: ['twitter', 'x', 'social', 'socials', 'tiktok', 'follow'],
    answer: 'X and TikTok. That is where the family turns up first.',
    link: { label: 'X / Twitter ↗', href: CONFIG.x },
  },
  {
    id: 'safe',
    chip: 'is it safe',
    match: ['safe', 'safety', 'scam', 'rug', 'risk', 'legit'],
    answer: HAS_TOKEN
      ? 'The NFT mint is on devnet, so it spends test money and cannot cost you anything. The token is a memecoin and can go to zero like any other. Never send anyone your seed phrase, and only use the contract address from this window.'
      : 'The NFT mint is on devnet, so it spends test money and cannot cost you anything. There is no token yet, so nobody can sell you one. Never send anyone your seed phrase, and treat any $GORB address circulating right now as a scam.',
    opens: 'safety',
  },
]

const GREETING =
  'Ribbit. Wrong species. I moved in here because they took my family and sold them with burgers, and I am still counting. Ask me something, or press one of these.'

interface Msg { from: 'gorb' | 'you'; text: string; topic?: Topic }

function route(q: string): Topic | null {
  const s = q.toLowerCase().trim()
  if (!s) return null
  let best: Topic | null = null
  let bestLen = 0
  for (const t of TOPICS) {
    for (const m of t.match) {
      if (s.includes(m) && m.length > bestLen) { best = t; bestLen = m.length }
    }
  }
  return best
}

export default function GorbHelper() {
  const wm = useWM()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'gorb', text: GREETING }])
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, open])

  const ask = (question: string, topic?: Topic) => {
    const hit = topic ?? route(question)
    setMsgs((m) => [
      ...m,
      { from: 'you', text: question },
      hit
        ? { from: 'gorb', text: hit.answer, topic: hit }
        : {
            from: 'gorb',
            text: 'I do not know that one. Try the contract, buying, the NFTs, the story, the gallery, Canal 88, the game, the chart, socials, or whether it is safe.',
          },
    ])
    if (hit?.opens) wm.launch(hit.opens)
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const q = draft.trim()
    if (!q) return
    setDraft('')
    ask(q)
  }

  const copyCa = (value: string) => {
    navigator.clipboard?.writeText(value).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500) },
      () => {},
    )
  }

  if (!open) {
    return (
      <button style={fab} onClick={() => setOpen(true)} aria-label="Ask Gorb" title="Ask Gorb">
        <img src={AVATAR} alt="" style={fabImg} />
      </button>
    )
  }

  return (
    <div style={panel} role="dialog" aria-label="Ask Gorb">
      <div style={bar}>
        <img src={AVATAR} alt="" style={barAvatar} />
        <b style={{ fontSize: 12 }}>Gorb</b>
        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: .85 }}>still counting</span>
        <button style={barClose} onClick={() => setOpen(false)} aria-label="Close">×</button>
      </div>

      <div style={feed} ref={feedRef}>
        {msgs.map((m, i) =>
          m.from === 'you' ? (
            <div key={i} style={youRow}><span style={youBubble}>{m.text}</span></div>
          ) : (
            <div key={i} style={gorbRow}>
              <span style={gorbBubble}>
                {m.text}
                {m.topic?.copy && (
                  <span style={caBox}>
                    <code style={caText}>{m.topic.copy}</code>
                    <button style={caBtn} onClick={() => copyCa(m.topic!.copy!)}>
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </span>
                )}
                {m.topic?.link && (
                  <a
                    href={m.topic.link.href}
                    target="_blank"
                    rel="noreferrer"
                    style={linkBtn}
                  >
                    {m.topic.link.label}
                  </a>
                )}
              </span>
            </div>
          ),
        )}
      </div>

      <div style={chips}>
        {TOPICS.map((t) => (
          <button key={t.id} style={chip} onClick={() => ask(t.chip, t)}>{t.chip}</button>
        ))}
      </div>

      <form style={inputRow} onSubmit={send}>
        <input
          style={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="ask me something..."
          aria-label="Ask Gorb a question"
        />
        <button style={sendBtn} type="submit" aria-label="Send">▶</button>
      </form>
    </div>
  )
}

/* ---------------------------------------------------------------- styles */

const fab: React.CSSProperties = {
  position: 'fixed',
  right: 18,
  bottom: 52,
  zIndex: 9000,
  width: 62,
  height: 62,
  borderRadius: '50%',
  padding: 0,
  cursor: 'pointer',
  border: '3px solid #fff',
  background: '#A52AF4',
  boxShadow: '0 6px 18px rgba(0,0,0,.45)',
  overflow: 'hidden',
}

const fabImg: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const panel: React.CSSProperties = {
  position: 'fixed',
  right: 18,
  bottom: 52,
  zIndex: 9000,
  width: 'min(340px, calc(100vw - 36px))',
  maxHeight: 'min(560px, calc(100vh - 90px))',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid #2a1440',
  background: '#ece9d8',
  boxShadow: '0 12px 34px rgba(0,0,0,.5)',
  fontFamily: 'Tahoma, system-ui, sans-serif',
}

const bar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  background: 'linear-gradient(180deg, #A52AF4, #5f199a)',
  color: '#fff',
}

const barAvatar: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  objectFit: 'cover',
  border: '1px solid rgba(255,255,255,.7)',
}

const barClose: React.CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'rgba(0,0,0,.28)',
  color: '#fff',
  width: 20,
  height: 18,
  borderRadius: 3,
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
}

const feed: React.CSSProperties = {
  flex: 1,
  minHeight: 90,
  overflowY: 'auto',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  background: '#ece9d8',
}

const gorbRow: React.CSSProperties = { display: 'flex', justifyContent: 'flex-start' }
const youRow: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end' }

const gorbBubble: React.CSSProperties = {
  maxWidth: '92%',
  background: '#fffde7',
  border: '1px solid #d7cfae',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 12.5,
  lineHeight: 1.55,
  color: '#3a2a12',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const youBubble: React.CSSProperties = {
  maxWidth: '85%',
  background: '#e3f2e1',
  border: '1px solid #b6d2b2',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 12.5,
  color: '#24401f',
}

const caBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: '#fff',
  border: '1px solid #cbb3f0',
  borderRadius: 5,
  padding: '5px 6px',
}

const caText: React.CSSProperties = {
  fontFamily: 'ui-monospace, Consolas, monospace',
  fontSize: 10.5,
  wordBreak: 'break-all',
  color: '#4b2170',
  flex: 1,
}

const caBtn: React.CSSProperties = {
  flex: 'none',
  fontSize: 10.5,
  padding: '3px 8px',
  borderRadius: 4,
  border: '1px solid #7a95c2',
  background: 'linear-gradient(#fff, #dfe8f6)',
  cursor: 'pointer',
}

const linkBtn: React.CSSProperties = {
  alignSelf: 'flex-start',
  fontSize: 11.5,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #7a95c2',
  background: 'linear-gradient(#fff, #dfe8f6)',
  color: '#24406e',
  textDecoration: 'none',
}

const chips: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 5,
  padding: '8px 10px',
  borderTop: '1px solid #b6c4dd',
  background: '#f4f2e6',
}

const chip: React.CSSProperties = {
  fontSize: 11,
  padding: '4px 9px',
  borderRadius: 999,
  border: '1px solid #b9c6dd',
  background: '#fff',
  color: '#35507d',
  cursor: 'pointer',
}

const inputRow: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  padding: 8,
  borderTop: '1px solid #b6c4dd',
  background: '#ece9d8',
}

const input: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 12,
  padding: '6px 8px',
  borderRadius: 4,
  border: '1px solid #9bb0cf',
  background: '#fff',
}

const sendBtn: React.CSSProperties = {
  flex: 'none',
  width: 34,
  borderRadius: 4,
  border: '1px solid #7a95c2',
  background: 'linear-gradient(#fff, #dfe8f6)',
  cursor: 'pointer',
}
