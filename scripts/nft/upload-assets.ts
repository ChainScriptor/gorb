import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import { createGenericFile, createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PRODUCTS } from '../../src/data/apps'
import { RPC_URL, SYMBOL, KEYPAIR_PATH, METADATA_STAGING_DIR } from './config'

const keypairFile = fileURLToPath(KEYPAIR_PATH)
if (!existsSync(keypairFile)) {
  console.error('No authority keypair found. Run generate-keypair first.')
  process.exit(1)
}

const secret = Uint8Array.from(JSON.parse(readFileSync(keypairFile, 'utf8')))
const umi = createUmi(RPC_URL).use(irysUploader())
const eddsaKeypair = umi.eddsa.createKeypairFromSecretKey(secret)
const signer = createSignerFromKeypair(umi, eddsaKeypair)
umi.use(signerIdentity(signer))

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url))
const stagingDir = fileURLToPath(METADATA_STAGING_DIR)
mkdirSync(stagingDir, { recursive: true })

const contentTypeFor = (path: string) =>
  path.endsWith('.webp') ? 'image/webp' : path.endsWith('.png') ? 'image/png' : 'image/jpeg'

const outputFile = join(stagingDir, 'uris.json')

// Public devnet RPC is congested enough that Irys's per-upload auto-fund
// transaction regularly misses its blockhash confirmation window.
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
  const uris: Record<string, { imageUri: string; metadataUri: string }> = existsSync(outputFile)
    ? JSON.parse(readFileSync(outputFile, 'utf8'))
    : {}

  for (const p of PRODUCTS) {
    if (uris[p.id]) {
      console.log(`Skipping "${p.title}" — already uploaded.`)
      continue
    }

    const localPath = join(publicDir, p.img.replace(/^\//, ''))
    const bytes = readFileSync(localPath)
    const fileName = p.img.split('/').pop()!
    const genericFile = createGenericFile(bytes, fileName, { contentType: contentTypeFor(p.img) })

    console.log(`Uploading image for "${p.title}"...`)
    const [imageUri] = await withRetry(`image upload for "${p.title}"`, () => umi.uploader.upload([genericFile]))

    const metadata = {
      name: p.title,
      symbol: SYMBOL,
      description: p.blurb,
      image: imageUri,
      attributes: [{ trait_type: 'Tag', value: p.tag || 'Gorb' }],
      properties: {
        files: [{ uri: imageUri, type: contentTypeFor(p.img) }],
        category: 'image',
      },
    }

    console.log(`Uploading metadata for "${p.title}"...`)
    const metadataUri = await withRetry(`metadata upload for "${p.title}"`, () => umi.uploader.uploadJson(metadata))

    uris[p.id] = { imageUri, metadataUri }
    writeFileSync(outputFile, JSON.stringify(uris, null, 2))
    console.log(`  -> ${metadataUri}`)
  }

  console.log(`\nDone. Wrote ${Object.keys(uris).length} metadata URIs to scripts/nft/metadata/uris.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
