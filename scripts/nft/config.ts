export const RPC_URL = process.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Edition supply per plushie design. All 18 candy machines use the same count.
export const EDITIONS_PER_DESIGN = 100

// Devnet SOL price per mint. Same for every design for now.
export const PRICE_SOL = 0.05

export const SYMBOL = 'GORB'
export const COLLECTION_NAME = 'Gorb Collectibles'
export const COLLECTION_DESCRIPTION = 'Official digital collectibles for the Gorb plushie lineup.'

export const KEYPAIR_PATH = new URL('./.keys/authority.json', import.meta.url)
export const MANIFEST_PATH = new URL('../../src/data/nftManifest.json', import.meta.url)
export const METADATA_STAGING_DIR = new URL('./metadata/', import.meta.url)
