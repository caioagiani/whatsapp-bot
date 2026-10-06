import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = `http://localhost:${process.env.API_PORT || 3000}`

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': target,
      '/ws': { target: target.replace('http', 'ws'), ws: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('emoji-picker-react')) return 'emoji'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
