import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@game': resolve(__dirname, 'src/game'),
      '@scenes': resolve(__dirname, 'src/scenes'),
      '@data': resolve(__dirname, 'src/data'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@t': resolve(__dirname, 'src/types'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
})
