import { Keypair } from '@solana/web3.js'
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { KEYPAIR_PATH } from './config'

const keypairFile = fileURLToPath(KEYPAIR_PATH)
const keysDir = dirname(keypairFile)

if (existsSync(keypairFile)) {
  const secret = Uint8Array.from(JSON.parse(readFileSync(keypairFile, 'utf8')))
  const kp = Keypair.fromSecretKey(secret)
  console.log('Authority keypair already exists:')
  console.log(kp.publicKey.toBase58())
  process.exit(0)
}

mkdirSync(keysDir, { recursive: true })
const kp = Keypair.generate()
writeFileSync(keypairFile, JSON.stringify(Array.from(kp.secretKey)))

console.log('Generated devnet authority/treasury keypair.')
console.log('Public key:', kp.publicKey.toBase58())
console.log('Secret key saved to:', keypairFile, '(gitignored — do not commit)')
console.log('')
console.log('Fund it with devnet SOL before running upload-assets / deploy-candy-machines:')
console.log(`  https://faucet.solana.com/?address=${kp.publicKey.toBase58()}&network=devnet`)
