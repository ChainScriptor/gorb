import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createSignerFromKeypair, signerIdentity, publicKey, sol, some } from '@metaplex-foundation/umi'
import { mplCandyMachine, updateCandyGuard, findCandyGuardPda } from '@metaplex-foundation/mpl-core-candy-machine'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PRODUCTS } from '../../src/data/apps'
import { RPC_URL, KEYPAIR_PATH, MANIFEST_PATH } from './config'

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
const destination = publicKey(manifest.paymentDestination || manifest.treasury)

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
  console.log('Payment destination for the "paid" group:', destination)
  // Candy guard merges the default guard set into every group, so anything left
  // in `default` would also apply to the free group and make it non-free. The
  // default set stays empty and both paths are explicit groups instead.
  console.log('Writing empty default + groups ["paid", "free"]...\n')

  for (const p of PRODUCTS) {
    const entry = manifest.products[p.id]
    if (!entry) continue

    const candyMachine = publicKey(entry.candyMachine)
    const candyGuard = findCandyGuardPda(umi, { base: candyMachine })

    console.log(`Updating guard for "${p.title}"...`)
    await withRetry(`guard update for "${p.title}"`, () =>
      updateCandyGuard(umi, {
        candyGuard,
        guards: {},
        groups: [
          {
            label: 'paid',
            guards: {
              solPayment: some({ lamports: sol(entry.priceSol), destination }),
            },
          },
          {
            label: 'free',
            guards: {
              mintLimit: some({ id: 1, limit: 1 }),
            },
          },
        ],
      }).sendAndConfirm(umi),
    )
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log('\nDone. Group "paid" charges SOL, group "free" is free (1 per wallet per design).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
