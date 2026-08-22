import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  // Solana/Metaplex (@solana/web3.js, umi) assume Node globals like
  // `global`/`Buffer` that the browser doesn't have. The plugin handles most
  // of it, but `global` also needs defining for Vite's dep pre-bundling step.
  plugins: [react(), nodePolyfills()],
  define: { global: 'globalThis' },
  optimizeDeps: {
    esbuildOptions: { define: { global: 'globalThis' } },
  },
  server: { port: 3000, host: true },
})
