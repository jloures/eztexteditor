import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          markdown: ['react-markdown', 'rehype-highlight', 'rehype-katex', 'remark-gfm', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
