import { defineConfig } from 'vitest/config'

// Unit tests cover the pure data layer (src/lib, src/charts): no DOM, no Quasar.
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.spec.ts'] }
})
