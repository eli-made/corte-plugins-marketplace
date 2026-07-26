import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['plugins/*/src/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
  },
})
