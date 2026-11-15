// Test settings for the pre-selection app (`vp test`; the root vite.config.ts lists this package
// in `test.projects`). Astro does not read this file: the app is built from astro.config.mjs.
import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    // Unit tests sit next to the module they test. Never under src/pages/: Astro would route them.
    include: ['src/**/*.test.ts'],
  },
})
