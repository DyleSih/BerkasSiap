import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' membuat hasil build jalan di GitHub Pages dengan nama repo apa pun.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
