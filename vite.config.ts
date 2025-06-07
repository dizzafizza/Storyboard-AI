import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  base: process.env.NODE_ENV === 'production' ? '/storyboard-ai/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          dnd: ['react-beautiful-dnd', 'react-dnd'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    }
  }
}) 