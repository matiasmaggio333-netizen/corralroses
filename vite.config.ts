import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "icons/favicon-196.png", "icons/apple-icon-180.png"],
      manifest: {
        name: "El Corral Roses",
        short_name: "El Corral",
        description: "Sistema de pedidos digital - El Corral Roses, Girona",
        lang: "es",
        theme_color: "#D09125",
        background_color: "#F7F5F2",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/manifest-icon-192.maskable.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/manifest-icon-512.maskable.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/manifest-icon-192.maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/manifest-icon-512.maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        shortcuts: [
          { name: "Pedidos del dia", short_name: "Admin", url: "/admin/pedidos", icons: [{ src: "/icons/manifest-icon-192.maskable.png", sizes: "192x192" }] },
          { name: "Cocina", short_name: "Cocina", url: "/cocina", icons: [{ src: "/icons/manifest-icon-192.maskable.png", sizes: "192x192" }] },
          { name: "Barra", short_name: "Barra", url: "/barra", icons: [{ src: "/icons/manifest-icon-192.maskable.png", sizes: "192x192" }] }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*\.(png|jpg|jpeg|webp|svg)$/,
            handler: "CacheFirst",
            options: { cacheName: "supabase-images", expiration: { maxEntries: 200, maxAgeSeconds: 2592000 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 30, maxAgeSeconds: 31536000 } }
          }
        ],
        navigateFallbackDenylist: [/^\/api/]
      },
      devOptions: { enabled: false }
    })
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})