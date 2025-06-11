import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // GitHub Pages deployment configuration
  base: process.env.NODE_ENV === 'production' ? '/Storyboard-AI/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Enhanced Safari compatibility with ES2019 target
    target: ['es2019', 'safari13'],
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          dnd: ['react-beautiful-dnd', 'react-dnd'],
          ui: ['lucide-react', 'framer-motion'],
          ai: ['openai'],
          pdf: ['jspdf', 'html2canvas']
        }
      }
    },
    // Ensure proper asset handling for GitHub Pages
    assetsDir: 'assets',
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        // Safari-friendly compression options
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    }
  },
  esbuild: {
    target: 'es2019'
  },
  // Enhanced asset handling for Safari
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
  // Optimize dependencies for Safari
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-beautiful-dnd',
      'framer-motion',
      'lucide-react'
    ],
    esbuildOptions: {
      target: 'es2019'
    }
  }
}) 