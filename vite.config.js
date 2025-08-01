import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/Temp/',
  server: {
    proxy: {
      '/tuya': {
        target: 'https://openapi.tuyaeu.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/tuya/, ''),
      },
    },
  },
})
