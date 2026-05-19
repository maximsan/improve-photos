import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      electron: resolve(__dirname, 'tests/shims/electron.ts'),
      '@electron-toolkit/utils': resolve(__dirname, 'tests/shims/electron-toolkit-utils.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/main/**', 'src/shared/**', 'src/renderer/src/**'],
      exclude: ['src/renderer/src/assets/**'],
      thresholds: {
        statements: 25,
        lines: 25,
        functions: 15,
        branches: 10
      }
    }
  }
})
