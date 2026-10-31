import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        id: '/',
        name: 'Disciplined Times',
        short_name: 'Disciplined',
        description: 'Plan hours for your goals per day, week or month, and log time in 30-minute taps.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Long-press the app icon (Android / desktop Chrome & Edge) to see these.
        shortcuts: [
          {
            name: 'Quick log 30 min',
            short_name: '+30 min',
            description: 'Pick a goal and add 30 minutes',
            url: '/?action=quick-log&minutes=30',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Today',
            short_name: 'Today',
            url: '/?tab=today',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'New goal',
            short_name: 'New goal',
            url: '/?action=new-goal',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
})
