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

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

interface MintResult { mint: string; sig: string }

export default function NftMint() {
  const wallet = useWallet()
  const [minting, setMinting] = useState<string | null>(null)
  const [minted, setMinted] = useState<Record<string, MintResult>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const umi = useMemo(() => {
    const u = createUmi(RPC_URL).use(mplCandyMachine())
    if (wallet.publicKey) u.use(walletAdapterIdentity(wallet))
    return u
  }, [wallet])

  const deployed = manifest.collection && manifest.treasury

  const mint = async (productId: string) => {
    const entry = (manifest.products as Record<string, { candyMachine: string; priceSol: number }>)[productId]
    if (!entry || !wallet.publicKey) return

    setMinting(productId)
    setErrors((e) => ({ ...e, [productId]: '' }))
    try {
      const asset = generateSigner(umi)
      const { signature } = await transactionBuilder()
        .add(
          mintV1(umi, {
            candyMachine: publicKey(entry.candyMachine),
            asset,
            collection: publicKey(manifest.collection),
            mintArgs: {
              solPayment: some({ destination: publicKey(manifest.treasury) }),
            },
          }),
        )
        .sendAndConfirm(umi)

      const sig = base58.deserialize(signature)[0]
      setMinted((m) => ({ ...m, [productId]: { mint: asset.publicKey, sig } }))

      if (SB_CONFIGURED) {
        sbInsert(
          'gorb_nft_mints',
          {
            who: whoAmI(),
            wallet: wallet.publicKey.toBase58(),
            product_id: productId,
            mint_address: asset.publicKey,
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #b6c4dd', background: '#ece9d8' }}>
        <WalletMultiButton style={{ height: 32, fontSize: 13 }} />
        <span style={{ fontSize: 12, color: '#54607a' }}>
          Set Phantom to <b>Devnet</b> in its network settings. This mints test NFTs only — no real money.
        </span>
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
                  Minted! Mint: {result.mint.slice(0, 6)}…{result.mint.slice(-4)}
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
    </div>
  )
}
