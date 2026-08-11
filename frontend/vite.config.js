import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const target = process.env.VITE_API_URL || 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/shop': {
          target: target,
          changeOrigin: true,
          secure: false
        },
        '/auth': {
          target: target,
          changeOrigin: true,
          secure: false
        },
        '/learn': {
          target: target,
          changeOrigin: true,
          secure: false
        },
        '/meesho': {
          target: target,
          changeOrigin: true,
          secure: false
        },
        '/health': {
          target: target,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
})
