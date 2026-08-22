import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createSignerFromKeypair, signerIdentity, publicKey, sol, some } from '@metaplex-foundation/umi'
import { mplCandyMachine, updateCandyGuard, findCandyGuardPda } from '@metaplex-foundation/mpl-core-candy-machine'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PRODUCTS } from '../../src/data/apps'
import { RPC_URL, PRICE_SOL, KEYPAIR_PATH, MANIFEST_PATH } from './config'

const NEW_DESTINATION = process.argv[2]
if (!NEW_DESTINATION) {
  console.error('Usage: tsx scripts/nft/update-payment-destination.ts <wallet-address>')
  process.exit(1)
}

const keypairFile = fileURLToPath(KEYPAIR_PATH)
const manifestFile = fileURLToPath(MANIFEST_PATH)
if (!existsSync(keypairFile) || !existsSync(manifestFile)) {
  console.error('Missing authority keypair or manifest. Run generate-keypair / deploy-candy-machines first.')
  process.exit(1)
}

type Manifest = {
  collection: string
  treasury: string
  paymentDestination?: string
  products: Record<string, { candyMachine: string; priceSol: number }>
}

const manifest: Manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
const secret = Uint8Array.from(JSON.parse(readFileSync(keypairFile, 'utf8')))
const umi = createUmi(RPC_URL).use(mplCandyMachine())
const eddsaKeypair = umi.eddsa.createKeypairFromSecretKey(secret)
const authority = createSignerFromKeypair(umi, eddsaKeypair)
umi.use(signerIdentity(authority))

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 6): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === attempts) throw err
      console.log(`  ${label} failed (attempt ${i}/${attempts}), retrying in 4s...`)
      await new Promise((r) => setTimeout(r, 4000))
    }
  }
  throw new Error('unreachable')
}

async function main() {
  console.log('New payment destination:', NEW_DESTINATION)
  const destination = publicKey(NEW_DESTINATION)

  for (const p of PRODUCTS) {
    const entry = manifest.products[p.id]
    if (!entry) continue

    const candyMachine = publicKey(entry.candyMachine)
    const candyGuard = findCandyGuardPda(umi, { base: candyMachine })

    console.log(`Updating guard destination for "${p.title}"...`)
    await withRetry(`guard update for "${p.title}"`, () =>
      updateCandyGuard(umi, {
        candyGuard,
        guards: {
          solPayment: some({ lamports: sol(entry.priceSol), destination }),
        },
        groups: [],
      }).sendAndConfirm(umi),
    )
    await new Promise((r) => setTimeout(r, 500))
  }

  manifest.paymentDestination = NEW_DESTINATION
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2))
  console.log('\nDone. All candy machines now pay out to', NEW_DESTINATION)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
