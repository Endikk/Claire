import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

/** Le jeu de données BDPM pèse environ 4 Mo : il doit tenir dans le cache hors connexion. */
const MAX_PRECACHE_BYTES = 8 * 1024 * 1024

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'robots.txt'],
      manifest: {
        name: "Claire : aide à l'analyse d'ordonnance",
        short_name: 'Claire',
        description: "Aide à l'analyse d'ordonnance en arrière-pharmacie. Rien ne quitte le téléphone.",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f6f2',
        theme_color: '#0a7a4f',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        maximumFileSizeToCacheInBytes: MAX_PRECACHE_BYTES,
        navigateFallbackDenylist: [/^\/data\//],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
