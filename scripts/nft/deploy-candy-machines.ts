import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createSignerFromKeypair, signerIdentity, generateSigner, publicKey, sol, some } from '@metaplex-foundation/umi'
import { createCollection } from '@metaplex-foundation/mpl-core'
import { mplCandyMachine, create, addConfigLines } from '@metaplex-foundation/mpl-core-candy-machine'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { PRODUCTS } from '../../src/data/apps'
import {
  RPC_URL,
  EDITIONS_PER_DESIGN,
  PRICE_SOL,
  COLLECTION_NAME,
  COLLECTION_DESCRIPTION,
  KEYPAIR_PATH,
  MANIFEST_PATH,
  METADATA_STAGING_DIR,
} from './config'

const keypairFile = fileURLToPath(KEYPAIR_PATH)
if (!existsSync(keypairFile)) {
  console.error('No authority keypair found. Run generate-keypair first.')
  process.exit(1)
}

const urisFile = join(fileURLToPath(METADATA_STAGING_DIR), 'uris.json')
if (!existsSync(urisFile)) {
  console.error('No uploaded metadata found. Run upload-assets first.')
  process.exit(1)
}

const uris: Record<string, { imageUri: string; metadataUri: string }> = JSON.parse(readFileSync(urisFile, 'utf8'))

const secret = Uint8Array.from(JSON.parse(readFileSync(keypairFile, 'utf8')))
const umi = createUmi(RPC_URL).use(mplCandyMachine())
const eddsaKeypair = umi.eddsa.createKeypairFromSecretKey(secret)
const authority = createSignerFromKeypair(umi, eddsaKeypair)
umi.use(signerIdentity(authority))

const CHUNK_SIZE = 8
const manifestFile = fileURLToPath(MANIFEST_PATH)

// Public devnet RPC regularly misses blockhash confirmation windows under load.
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

type Manifest = {
  collection: string
  treasury: string
  products: Record<string, { candyMachine: string; priceSol: number }>
}

async function main() {
  console.log('Authority / treasury:', authority.publicKey)

  const existing: Manifest | null = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : null

  // 1. Shared collection for all 18 candy machines (reused across reruns).
  let collectionAddress: string
  if (existing?.collection) {
    collectionAddress = existing.collection
    console.log('\nReusing existing shared collection:', collectionAddress)
  } else {
    const collectionSigner = generateSigner(umi)
    console.log('\nCreating shared collection...')
    await withRetry('collection creation', () =>
      createCollection(umi, {
        collection: collectionSigner,
        name: COLLECTION_NAME,
        uri: `data:application/json,${encodeURIComponent(
          JSON.stringify({ name: COLLECTION_NAME, description: COLLECTION_DESCRIPTION }),
        )}`,
      }).sendAndConfirm(umi),
    )
    collectionAddress = collectionSigner.publicKey
    console.log('Collection:', collectionAddress)
  }

  const manifest: Manifest = {
    collection: collectionAddress,
    treasury: authority.publicKey,
    products: existing?.products ?? {},
  }
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2))

  // 2. One candy machine per plushie design.
  for (const p of PRODUCTS) {
    const asset = uris[p.id]
    if (!asset) {
      console.warn(`Skipping "${p.title}" — no uploaded metadata found for id "${p.id}".`)
      continue
    }
    if (manifest.products[p.id]) {
      console.log(`Skipping "${p.title}" — candy machine already deployed.`)
      continue
    }

    console.log(`\nCreating candy machine for "${p.title}"...`)
    const candyMachineSigner = generateSigner(umi)

    const createBuilder = await create(umi, {
      candyMachine: candyMachineSigner,
      collection: publicKey(collectionAddress),
      collectionUpdateAuthority: authority,
      itemsAvailable: EDITIONS_PER_DESIGN,
      isMutable: true,
      configLineSettings: some({
        prefixName: '',
        nameLength: 32,
        prefixUri: '',
        uriLength: 200,
        isSequential: true,
      }),
      guards: {
        solPayment: some({ lamports: sol(PRICE_SOL), destination: authority.publicKey }),
      },
    })
    await withRetry(`candy machine creation for "${p.title}"`, () => createBuilder.sendAndConfirm(umi))
    await new Promise((r) => setTimeout(r, 600))

    console.log(`  Candy machine: ${candyMachineSigner.publicKey}`)
    console.log(`  Adding ${EDITIONS_PER_DESIGN} identical config lines (${p.title})...`)

    const lines = Array.from({ length: EDITIONS_PER_DESIGN }, () => ({ name: p.title, uri: asset.metadataUri }))
    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
      const chunk = lines.slice(i, i + CHUNK_SIZE)
      await withRetry(`config lines ${i}-${i + chunk.length - 1} for "${p.title}"`, () =>
        addConfigLines(umi, {
          candyMachine: candyMachineSigner.publicKey,
          index: i,
          configLines: chunk,
        }).sendAndConfirm(umi),
      )
      process.stdout.write(`    lines ${i}-${i + chunk.length - 1} added\r`)
      await new Promise((r) => setTimeout(r, 600)) // stay under the public RPC's rate limit
    }
    console.log(`    all ${EDITIONS_PER_DESIGN} lines added.`)

    manifest.products[p.id] = {
      candyMachine: candyMachineSigner.publicKey,
      priceSol: PRICE_SOL,
    }

    writeFileSync(fileURLToPath(MANIFEST_PATH), JSON.stringify(manifest, null, 2))
  }

  console.log(`\nDone. Manifest written to src/data/nftManifest.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
