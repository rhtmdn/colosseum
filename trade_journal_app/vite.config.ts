import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/colosseum/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
