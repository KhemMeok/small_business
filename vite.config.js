import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import Components from 'unplugin-vue-components/vite';
// import VueElementLoading from "vue-element-loading";

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueDevTools(),
    Components({
      resolvers: [PrimeVueResolver()]
    }),
    // VueElementLoading,
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server:
  {
    host: true,
    proxy: {
      '/api': {
        target: 'https://10.235.119.7:8002',
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // IMPORTANT: This allows requests to a backend with a self-signed cert
      },
      '/encrypt': {
        target: 'http://10.235.119.7:8001',
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // IMPORTANT: This allows requests to a backend with a self-signed cert
      },
      '/decrypt': {
        target: 'http://10.235.119.7:8001',
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // IMPORTANT: This allows requests to a backend with a self-signed cert
      }
    },

  },
  build: {
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'axios'],
        },
      },
    },
  },
})
