import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'GestiHôtel',
        short_name: 'GestiHôtel',
        description: 'Application de gestion hôtelière',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },
      devOptions: { enabled: false, type: 'module' }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@config': path.resolve(__dirname, './src/config')
    }
  },
  
  // ✅ OPTIMISATION DES DÉPENDANCES
  optimizeDeps: {
    entries: ['./src/main.jsx'],
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
    esbuildOptions: {
      target: 'esnext'
    },
    force: false
  },
  
  // ✅ BUILD AVEC LAZY LOADING FONCTIONNEL
  build: {
    target: 'esnext',
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 1
      },
      format: {
        comments: false
      }
    },
    
    rollupOptions: {
      output: {
        // ✅ FONCTION manualChunks INTELLIGENTE
        manualChunks(id) {
          // 1. VENDORS (node_modules)
          if (id.includes('node_modules')) {
            // React TOUJOURS en premier
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            
            // Firebase - UN SEUL CHUNK (CRITIQUE)
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase';
            }
            
            // UI Libraries
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-animation';
            if (id.includes('recharts')) return 'vendor-charts';
            
            // Export libs
            if (id.includes('jspdf') || id.includes('xlsx')) {
              return 'vendor-export';
            }
            
            // Date utils
            if (id.includes('date-fns')) return 'vendor-date';
            
            // Autres vendors
            return 'vendor-other';
          }
          
          // 2. COMPOSANTS APPLICATIFS
          // Ne PAS regrouper les lazy-loaded components ici !
          // Laisser Vite créer automatiquement les chunks pour les dynamic imports
          
          // Contextes et hooks (chargés au démarrage)
          if (id.includes('/src/contexts/') || id.includes('/src/hooks/')) {
            return 'app-core';
          }
          
          // Services
          if (id.includes('/src/services/')) {
            return 'app-services';
          }
          
          // Utils
          if (id.includes('/src/utils/')) {
            return 'app-utils';
          }
          
          // ⚠️ NE PAS mettre de règle pour /src/components/
          // Vite va créer automatiquement des chunks pour chaque lazy import
        },
        
        // ✅ Nommage des chunks
        chunkFileNames: (chunkInfo) => {
          // Pour les chunks de vendors
          if (chunkInfo.name.startsWith('vendor-')) {
            return 'assets/[name]-[hash].js';
          }
          // Pour les chunks applicatifs
          if (chunkInfo.name.startsWith('app-')) {
            return 'assets/[name]-[hash].js';
          }
          // Pour les dynamic imports (lazy loading)
          // Format lisible pour debug
          return 'assets/[name]-[hash].js';
        },
        
        entryFileNames: 'assets/[name]-[hash].js',
        
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|ttf|otf/.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    
    // Paramètres
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    
    // ✅ CRITICAL: Assurer que les dynamic imports fonctionnent
    dynamicImportVarsOptions: {
      warnOnError: true
    }
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  
  preview: {
    port: 4173,
    host: true,
    open: true
  }
});