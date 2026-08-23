import raw from './gorbos.json'

export const REMOTE = raw.REMOTE
export const asset = (p: string) => (p.startsWith('http') ? p : REMOTE + p)

export interface Meme { img: string; cap: string }
export interface Channel { ch: string; name: string; tag: string; file: string; poster: string; sec: number }

// The evidence gallery now uses the local Gorb images in /public.
export const MEMES: Meme[] = [
  { img: '/1.webp', cap: 'gorb_season' },
  { img: '/2.webp', cap: 'purple_lambo_nights' },
  { img: '/3.webp', cap: 'past_the_moon' },
  { img: '/4.webp', cap: 'king_of_value' },
  { img: '/5.webp', cap: '3am_fry_vision' },
  { img: '/6.webp', cap: 'blessed_soft_serve' },
  { img: '/content.webp', cap: 'generational_wealth' },
]

// Sub-folders inside the Evidence viewer. Filenames are numeric per folder,
// mixing .webp/.png as whatever was dropped into /public/<folder>.
export interface MemeFolder { id: string; label: string; items: Meme[] }

const MIAMI_FILES = ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp', '6.webp', '7.webp', '8.webp', '9.webp', '10.png']
const UNCLE_FILES = ['1.png', '2.png', '3.png', '4.png', '5.png']

export const MEME_FOLDERS: MemeFolder[] = [
  {
    id: 'miami',
    label: 'Miami',
    items: MIAMI_FILES.map((f, i) => ({ img: `/miami/${f}`, cap: `miami_${i + 1}` })),
  },
  {
    id: 'uncle',
    label: 'Uncle',
    items: UNCLE_FILES.map((f, i) => ({ img: `/uncle/${f}`, cap: `uncle_${i + 1}` })),
  },
]

export const CHANNELS = raw.CHANNELS as Channel[]

// Local Gorb images, reused as Canal 88 channel stills.
export const GORB_IMAGES = ['/1.webp', '/2.webp', '/3.webp', '/4.webp', '/5.webp', '/6.webp', '/content.webp']

// The tapes that actually exist in /public. The channel list above is much
// longer than this, so Canal 88 cycles these across it.
export const TAPES = ['/1.mp4', '/2.mp4']

// Gorb Shop catalogue. Product photos live in /public/shop.
export interface Product { id: string; title: string; price: number; img: string; tag?: string; blurb: string }
export const PRODUCTS: Product[] = [
  { id: 'gorb',       title: 'Gorb',           price: 24.99, img: '/shop/1.webp',  tag: 'The OG',   blurb: 'The original purple menace. Cap on, no notes.' },
  { id: 'gorb_dad',   title: 'Gorb Dad',       price: 19.99, img: '/shop/2.webp',  tag: 'Family',   blurb: 'Blue, calm, quietly holds the family together.' },
  { id: 'gorb_mom',   title: 'Gorb Mom',       price: 19.99, img: '/shop/3.webp',  tag: 'Family',   blurb: 'Pink, pearls, absolutely runs the household.' },
  { id: 'gorb_dog',   title: 'Gorb Dog',       price: 19.99, img: '/shop/4.webp',  tag: 'Pets',     blurb: 'Floppy ears, one M tag, endless zoomies.' },
  { id: 'gorb_uncle', title: 'Gorb Uncle',     price: 19.99, img: '/shop/5.webp',  tag: 'Family',   blurb: 'Green, floral shirt, one story too many.' },
  { id: 'gorb_grandpa', title: 'Gorb Grandpa', price: 19.99, img: '/shop/6.webp',  tag: 'Family',   blurb: 'Orange, glasses, bow tie, pure wisdom.' },
  { id: 'gorb_grandma', title: 'Gorb Grandma', price: 19.99, img: '/shop/7.webp',  tag: 'Family',   blurb: 'Silver curls and cat-eye glasses. Iconic.' },
  { id: 'gorb_baby',  title: 'Gorb Baby',      price: 14.99, img: '/shop/8.webp',  tag: 'Family',   blurb: 'Tiny, red, chaos in a diaper.' },
  { id: 'gorb_auntie', title: 'Gorb Auntie',   price: 19.99, img: '/shop/18.webp', tag: 'Family',   blurb: 'Pink bow, pearls, knows everyone gossip.' },
  { id: 'gorb_alien', title: 'Gorb Alien',     price: 19.99, img: '/shop/9.webp',  tag: 'Cosmic',   blurb: 'Three eyes, spacesuit, came for the fries.' },
  { id: 'gorb_slime', title: 'Gorb Slime',     price: 14.99, img: '/shop/10.webp', tag: 'Goo',      blurb: 'Drippy green goo with a big tongue.' },
  { id: 'gorb_shadow', title: 'Gorb Shadow',   price: 19.99, img: '/shop/11.webp', tag: 'Spooky',   blurb: 'Glowing eyes, pure static energy.' },
  { id: 'gorb_banana', title: 'Gorb Banana',   price: 14.99, img: '/shop/12.webp', tag: 'Snacks',   blurb: 'Half peeled, fully unhinged.' },
  { id: 'gorb_popcorn', title: 'Gorb Popcorn', price: 14.99, img: '/shop/13.webp', tag: 'Snacks',   blurb: 'A bucket that bites back.' },
  { id: 'gorb_pizza', title: 'Gorb Pizza',     price: 16.99, img: '/shop/14.webp', tag: 'Snacks',   blurb: 'Extra cheese, extra teeth.' },
  { id: 'gorb_rockstar', title: 'Gorb Rockstar', price: 16.99, img: '/shop/15.webp', tag: 'Squad',  blurb: 'Pink mohawk, flying V, lives to rock.' },
  { id: 'gorb_ninja', title: 'Gorb Ninja',     price: 16.99, img: '/shop/16.webp', tag: 'Squad',    blurb: 'Silent, deadly, still adorable.' },
  { id: 'gorb_superhero', title: 'Gorb Superhero', price: 16.99, img: '/shop/17.webp', tag: 'Squad', blurb: 'Not all heroes are normal.' },
]

export const CONFIG = {
  ...raw.CONFIG,
  buy: raw.CONFIG.ca ? `https://pump.fun/coin/${raw.CONFIG.ca}` : 'https://pump.fun',
  chart: raw.CONFIG.ca ? `https://dexscreener.com/solana/${raw.CONFIG.ca}` : 'https://dexscreener.com/solana',
  scan: raw.CONFIG.ca ? `https://solscan.io/token/${raw.CONFIG.ca}` : 'https://solscan.io',
}

export type AppId =
  | 'explorer' | 'canal88' | 'paint' | 'terminal' | 'chat' | 'gallery' | 'memes'
  | 'viewer' | 'tokenomics' | 'buy' | 'lore' | 'board' | 'chart' | 'contract'
  | 'safety' | 'bin' | 'nftmint' | 'game'

export interface AppDef {
  title: string
  icon: string
  w: number
  h: number
  status: string
  dialog?: boolean
  fullscreen?: boolean
}

// Titles/sizes/statuses mirror the original APP REGISTRY in main.js.
export const APPS: Record<AppId, AppDef> = {
  explorer:   { title: 'Gorb Archivo',            icon: 'ic-explorer',   w: 880, h: 580, status: 'Done — the pond' },
  canal88:    { title: 'Canal 88 Player',          icon: 'ic-canal88',    w: 660, h: 620, status: `${CHANNELS.length} tapes in the playlist` },
  paint:      { title: 'Gorb Paint',               icon: 'ic-paint',      w: 880, h: 640, status: 'Untitled - Gorb Paint' },
  terminal:   { title: 'Gorb Terminal',            icon: 'ic-terminal',   w: 720, h: 620, status: 'Live from Dexscreener' },
  chat:       { title: 'Gorb Messenger',           icon: 'ic-chat',       w: 520, h: 560, status: 'The Pond' },
  gallery:    { title: 'Gorb Gallery',             icon: 'ic-gallery',    w: 700, h: 520, status: 'Drawings from the pond' },
  memes:      { title: `Evidence — ${MEMES.length} objects`, icon: 'ic-memes', w: 640, h: 500, status: `${MEMES.length} objects` },
  viewer:     { title: 'Gorb Viewer',              icon: 'ic-viewer',     w: 720, h: 600, status: '' },
  tokenomics: { title: 'Tokenomics.xls',           icon: 'ic-tokenomics', w: 520, h: 470, status: 'Read only' },
  buy:        { title: 'HowToBuy.txt — Notepad',   icon: 'ic-buy',        w: 560, h: 520, status: '' },
  lore:       { title: 'Lore.hlp — Help',          icon: 'ic-lore',       w: 1040, h: 720, status: 'The origin file · 24 pages' },
  board:      { title: 'Leaderboard',              icon: 'ic-board',      w: 440, h: 560, status: 'This week' },
  chart:      { title: 'Live chart — Dexscreener', icon: 'ic-chart',      w: 1000, h: 690, status: 'Streaming from Dexscreener' },
  contract:   { title: 'Contract address',         icon: 'ic-contract',   w: 460, h: 300, status: '', dialog: true },
  safety:     { title: 'ReadMe.txt — Notepad',     icon: 'ic-safety',     w: 540, h: 480, status: '' },
  bin:        { title: 'Recycle Bin',              icon: 'ic-bin',        w: 480, h: 320, status: '3 objects' },
  nftmint:    { title: 'Gorb NFT Mint',             icon: '/4444.webp',    w: 860, h: 620, status: `${PRODUCTS.length} designs · devnet` },
  game:       { title: 'Gorb Rescue',               icon: '/game.png',       w: 720, h: 520, status: 'In development', fullscreen: true },
}

export interface DeskItem { app?: AppId; link?: keyof typeof CONFIG; label: string; icon?: string }

export const DESKTOP_ICONS: DeskItem[] = [
  { app: 'nftmint',    label: 'Gorb NFT Mint' },
  { app: 'game',       label: 'Gorb Rescue' },
  { app: 'explorer',   label: 'Gorb Archivo' },
  { app: 'canal88',    label: 'Canal 88' },
  { link: 'tiktok',    label: 'TikTok',        icon: 'ic-tiktok' },
  { app: 'paint',      label: 'Gorb Paint' },
  { app: 'terminal',   label: 'Terminal' },
  { app: 'chat',       label: 'Messenger' },
  { app: 'gallery',    label: 'Gallery' },
  { app: 'board',      label: 'Leaderboard' },
  { app: 'chart',      label: 'Live Chart' },
  { app: 'memes',      label: 'Evidence' },
  { link: 'depot',     label: 'Meme Depot',    icon: 'ic-depot' },
  { app: 'tokenomics', label: 'Tokenomics.xls' },
  { app: 'buy',        label: 'HowToBuy.txt' },
  { app: 'lore',       label: 'Lore.hlp' },
  { app: 'contract',   label: 'Contract' },
  { app: 'safety',     label: 'ReadMe.txt' },
  { app: 'bin',        label: 'Recycle Bin' },
]

export interface MenuItem { icon: string; label: string; sub?: string; app?: AppId; link?: string; action?: 'scanlines' }
export const LOGO = '/4444.png'

export const START_LEFT: MenuItem[] = [
  { icon: '/4444.webp',    label: 'Gorb NFT Mint', sub: 'Mint on Solana devnet', app: 'nftmint' },
  { icon: '/game.png',       label: 'Gorb Rescue', sub: 'The game — in development', app: 'game' },
  { icon: 'ic-explorer',   label: 'Gorb Archivo', sub: 'The whole story', app: 'explorer' },
  { icon: 'ic-canal88',    label: 'Canal 88 Player', sub: `${CHANNELS.length} tapes`, app: 'canal88' },
  { icon: 'ic-paint',      label: 'Gorb Paint', sub: 'Draw something', app: 'paint' },
  { icon: 'ic-gallery',    label: 'Gorb Gallery', sub: 'What others drew', app: 'gallery' },
  { icon: 'ic-memes',      label: 'Evidence', sub: `${MEMES.length} memes`, app: 'memes' },
  { icon: 'ic-depot',      label: 'Meme Depot', sub: 'The shared folder — opens off-site', link: CONFIG.depot },
  { icon: 'sep', label: '' },
  { icon: 'ic-tokenomics', label: 'Tokenomics.xls', app: 'tokenomics' },
  { icon: 'ic-buy',        label: 'HowToBuy.txt', app: 'buy' },
  { icon: 'ic-lore',       label: 'Lore.hlp', app: 'lore' },
  { icon: 'ic-safety',     label: 'ReadMe.txt', app: 'safety' },
]

export const START_RIGHT: MenuItem[] = [
  { icon: 'ic-contract', label: 'Contract address', app: 'contract' },
  { icon: LOGO,          label: 'Buy on pump.fun', link: CONFIG.buy },
  { icon: 'ic-chart',    label: 'Live chart', sub: 'Opens here', app: 'chart' },
  { icon: 'sep', label: '' },
  { icon: LOGO,          label: 'X / Twitter', link: CONFIG.x },
  { icon: LOGO,          label: 'X Community', link: CONFIG.community },
  { icon: LOGO,          label: 'TikTok', link: CONFIG.tiktok },
  { icon: 'sep', label: '' },
  { icon: 'ic-canal88',  label: 'Toggle scanlines', action: 'scanlines' },
  { icon: 'ic-bin',      label: 'Recycle Bin', app: 'bin' },
]
