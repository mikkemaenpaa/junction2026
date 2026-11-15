// @ts-check
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

// Server-rendered, unlike the static landing page: the API routes call Context.dev and LinkedIn
// with secret keys, so pages and endpoints run on a Node server.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  devToolbar: { enabled: false },
  // The landing page uses 4321.
  server: { port: 4322 },
  vite: {
    plugins: [tailwindcss()],
  },
})
