import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get API target from environment variable or default to localhost
const apiTarget = process.env.VITE_API_URL || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    strictPort: true,  // Force port 5173
    open: false,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/static': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
