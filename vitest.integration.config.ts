import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/tests/integration.setup.ts'],
    include: ['src/**/*.integration.test.ts'],
    fileParallelism: false,
    silent: 'passed-only',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
