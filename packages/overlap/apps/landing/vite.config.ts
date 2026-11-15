// Test settings for the landing page (`vp test`; the root vite.config.ts lists this package in
// `test.projects`). Astro does not read this file: the site is built from astro.config.ts.
import { defineConfig } from 'vite-plus'

export default defineConfig({
  // The `@/` alias from tsconfig.json `paths`.
  resolve: { tsconfigPaths: true },
  test: {
    // Unit tests sit next to the module they test. Never under src/pages/: Astro would route them.
    include: ['src/**/*.test.ts'],
  },
})
