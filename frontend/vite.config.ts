import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/SSO_Check/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:10100', changeOrigin: true },
      '/uploads': { target: 'http://localhost:10100', changeOrigin: true },
    },
  },
})
