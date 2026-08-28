import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/transactions': 'http://127.0.0.1:5000',
      '/summary': 'http://127.0.0.1:5000',
      '/settings': 'http://127.0.0.1:5000',
      '/recurring': 'http://127.0.0.1:5000',
      '/income': 'http://127.0.0.1:5000',
    },
  },
})
