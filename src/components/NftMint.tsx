import { useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { mplCandyMachine, mintV1 } from '@metaplex-foundation/mpl-core-candy-machine'
import { generateSigner, publicKey, some, transactionBuilder, base58 } from '@metaplex-foundation/umi'
import { PRODUCTS } from '../data/apps'
import manifest from '../data/nftManifest.json'
import { sbInsert, whoAmI, SB_CONFIGURED } from '../data/supabase'
import MintCelebration from './MintCelebration'

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const FAUCET_URL = 'https://faucet.solana.com/'

interface MintResult { mint: string; sig: string; free: boolean }

export default function NftMint() {
  const wallet = useWallet()
  const [minting, setMinting] = useState<string | null>(null)
  const [minted, setMinted] = useState<Record<string, MintResult>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const [howToOpen, setHowToOpen] = useState(false)

  const umi = useMemo(() => {
    const u = createUmi(RPC_URL).use(mplCandyMachine())
    if (wallet.publicKey) u.use(walletAdapterIdentity(wallet))
    return u
  }, [wallet])

  const deployed = manifest.collection && manifest.treasury
  const payoutWallet = (manifest as { paymentDestination?: string }).paymentDestination || manifest.treasury

  const celebrationProduct = celebrating ? PRODUCTS.find((p) => p.id === celebrating) : undefined
  const celebrationResult = celebrating ? minted[celebrating] : undefined

  const mint = async (productId: string) => {
    const entry = (manifest.products as Record<string, { candyMachine: string; priceSol: number }>)[productId]
    if (!entry || !wallet.publicKey) return

    setMinting(productId)
    setErrors((e) => ({ ...e, [productId]: '' }))

    const attemptMint = (free: boolean) => {
      const asset = generateSigner(umi)
      return transactionBuilder()
        .add(
          mintV1(umi, {
            candyMachine: publicKey(entry.candyMachine),
            asset,
            collection: publicKey(manifest.collection),
            group: some(free ? 'free' : 'paid'),
            mintArgs: free
              ? { mintLimit: some({ id: 1 }) }
              : { solPayment: some({ destination: publicKey(payoutWallet) }) },
          }),
        )
        .sendAndConfirm(umi)
        .then(({ signature }) => ({ asset, signature }))
    }

    try {
      let free = false
      let result
      try {
        result = await attemptMint(false)
      } catch (paidErr) {
        free = true
        try {
          result = await attemptMint(true)
        } catch (freeErr) {
          const paidMsg = paidErr instanceof Error ? paidErr.message : String(paidErr)
          const freeMsg = freeErr instanceof Error ? freeErr.message : String(freeErr)
          throw new Error(`Paid mint failed: ${paidMsg} | Free mint failed: ${freeMsg}`)
        }
      }

      const sig = base58.deserialize(result.signature)[0]
      setMinted((m) => ({ ...m, [productId]: { mint: result.asset.publicKey, sig, free } }))
      setCelebrating(productId)

      if (SB_CONFIGURED) {
        sbInsert(
          'gorb_nft_mints',
          {
            who: whoAmI(),
            wallet: wallet.publicKey.toBase58(),
            product_id: productId,
            mint_address: result.asset.publicKey,
            tx_sig: sig,
          },
          'minimal',
        ).catch(() => {})
      }
    } catch (err) {
      setErrors((e) => ({ ...e, [productId]: err instanceof Error ? err.message : 'Mint failed' }))
    } finally {
      setMinting(null)
    }
  }

  return (
    <div className="shop" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ie__brandbar">
        <img src="/4444.png" alt="" />
        <b><small>Official</small>Gorb NFT Mint<span>Devnet</span></b>
        <em>Pick a design, mint it to your wallet ▸</em>
      </div>

      <div style={gameNote}>
        <span style={gameNoteIcon} aria-hidden="true">🎮</span>
        <span>
          <b>Keep these.</b> The ones you mint are the family you will be able to play as in
          <b> Gorb Rescue</b>. Every design you are missing is one you cannot bring out of the building.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #b6c4dd', background: '#ece9d8' }}>
        {/* sizing lives in gorb.css so it can beat the adapter's own line-height */}
        <WalletMultiButton />
        <span style={{ fontSize: 12, color: '#54607a' }}>
          Set Phantom to <b>Devnet</b> in its network settings. This mints test NFTs only — no real money.
          {' '}Not enough SOL? You still get one <b>free</b> mint per design.
        </span>
      </div>

      <div style={{ padding: '10px 16px', borderBottom: '1px solid #b6c4dd', background: '#fbfaf3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="xp-btn"
            style={{ textDecoration: 'none', fontSize: 12, padding: '4px 12px' }}
          >
            ◎ Get free devnet SOL ↗
          </a>
          <button
            className="xp-btn"
            style={{ fontSize: 12, padding: '4px 12px' }}
            onClick={() => setHowToOpen((v) => !v)}
            aria-expanded={howToOpen}
          >
            {howToOpen ? 'Hide steps ▴' : 'How does this work? ▾'}
          </button>
          {wallet.publicKey && (
            <button
              className="xp-btn"
              style={{ fontSize: 12, padding: '4px 12px' }}
              onClick={() => navigator.clipboard?.writeText(wallet.publicKey!.toBase58())}
            >
              Copy my wallet address
            </button>
          )}
        </div>

        {howToOpen && (
          <ol style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 12, color: '#54607a', lineHeight: 1.7 }}>
            <li>
              Install <b>Phantom</b> and switch it to devnet: Settings → Developer Settings →
              turn on <b>Testnet Mode</b>, then pick <b>Solana Devnet</b>.
            </li>
            <li>Click <b>Select Wallet</b> above and connect Phantom.</li>
            <li>Copy your wallet address with the button above.</li>
            <li>
              Open the <a href={FAUCET_URL} target="_blank" rel="noreferrer">Solana faucet</a>,
              paste the address, choose <b>devnet</b> and request SOL. You need roughly{' '}
              <b>0.06 SOL</b> to buy one, or about <b>0.005 SOL</b> for a free mint
              (that covers only the network fee and account rent).
            </li>
            <li>Come back here and hit <b>Mint</b>. Approve the transaction in Phantom.</li>
            <li>
              The NFT lands in Phantom under <b>Collectibles</b>. It can take a minute to show up
              while Phantom indexes it.
            </li>
          </ol>
        )}
      </div>

      {!deployed && (
        <div style={{ padding: 16, color: '#c62828', fontSize: 13 }}>
          No candy machines deployed yet — run <code>npm run nft:deploy</code> to populate src/data/nftManifest.json.
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {PRODUCTS.map((p) => {
          const entry = (manifest.products as Record<string, { candyMachine: string; priceSol: number }>)[p.id]
          const result = minted[p.id]
          const error = errors[p.id]
          return (
            <div key={p.id} style={{ border: '1px solid #c7d2e2', borderRadius: 12, background: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#f2f5fb', borderRadius: 8, aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={p.img} alt={p.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                     onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/4444.png' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <b style={{ fontSize: 16 }}>{p.title}</b>
                <span style={{ fontWeight: 700, color: '#7b2ff7' }}>{entry ? `${entry.priceSol} SOL` : '—'}</span>
              </div>
              {p.tag && <span style={{ alignSelf: 'flex-start', fontSize: 11, color: '#7b2ff7', border: '1px solid #cbb3f0', borderRadius: 999, padding: '1px 8px' }}>{p.tag}</span>}
              <p style={{ fontSize: 12, color: '#54607a', margin: 0, flex: 1 }}>{p.blurb}</p>

              {result ? (
                <div style={{ fontSize: 12, color: '#1c8a34' }}>
                  {result.free ? 'Minted free! ' : 'Minted! '}Mint: {result.mint.slice(0, 6)}…{result.mint.slice(-4)}
                  <br />
                  <a href={`https://solscan.io/tx/${result.sig}?cluster=devnet`} target="_blank" rel="noreferrer">View transaction ↗</a>
                </div>
              ) : (
                <button
                  className="xp-btn xp-btn--go"
                  disabled={!deployed || !entry || !wallet.connected || minting === p.id}
                  onClick={() => mint(p.id)}
                >
                  {!wallet.connected ? 'Connect wallet' : minting === p.id ? 'Minting…' : `Mint · ${entry?.priceSol ?? '?'} SOL`}
                </button>
              )}
              {error && <p style={{ fontSize: 11, color: '#c62828', margin: 0 }}>{error}</p>}
            </div>
          )
        })}
      </div>

      {celebrationProduct && celebrationResult && (
        <MintCelebration
          productTitle={celebrationProduct.title}
          nftImage={celebrationProduct.img}
          mintAddress={celebrationResult.mint}
          txSig={celebrationResult.sig}
          free={celebrationResult.free}
          onClose={() => setCelebrating(null)}
        />
      )}
    </div>
  )
}

/* The mint is the only place that explains why a design is worth having, so
   the Gorb Rescue tie-in lives here rather than in a blurb nobody reads. */
const gameNote: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 16px',
  borderBottom: '1px solid #cbb3f0',
  background: 'linear-gradient(180deg, #f3e9ff, #e9dbfb)',
  color: '#4b2170',
  fontSize: 12.5,
  lineHeight: 1.55,
}

const gameNoteIcon: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.2,
  flex: 'none',
}
