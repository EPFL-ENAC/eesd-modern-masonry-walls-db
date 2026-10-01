import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // Same-origin in dev, like the ingress in the deployments: /api goes to the
    // backend with the prefix stripped.
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${Number(process.env.BACKEND_PORT) || 8000}`,
        rewrite: (path: string) => path.replace(/^\/api/, '')
      }
    }
  }
})
