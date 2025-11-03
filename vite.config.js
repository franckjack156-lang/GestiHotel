import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'GestiHôtel',
        short_name: 'GestiHôtel',
        description: 'Application de gestion d\'interventions hôtelières',
        theme_color: '#4f46e5',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
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
      '@config': path.resolve(__dirname, './src/config'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  
  // ✅ CRITIQUE: Exclusion complète de Firebase de l'optimisation
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
      // ✅ NE PAS inclure Firebase ici
    ],
    exclude: [
      // ✅ EXCLURE TOUS les packages Firebase
      'firebase',
      'firebase/app',
      'firebase/auth', 
      'firebase/firestore',
      'firebase/storage',
      'firebase/functions',
      'firebase/analytics',
      'firebase/messaging',
      'firebase/performance',
      '@firebase/app',
      '@firebase/auth',
      '@firebase/firestore',
      '@firebase/storage',
      '@firebase/functions',
      '@firebase/analytics',
      '@firebase/messaging',
      '@firebase/performance',
      '@firebase/util',
      '@firebase/component'
    ],
    esbuildOptions: {
      target: 'esnext',
      supported: { 'top-level-await': true }
    }
  },
  
  build: {
    target: 'esnext',
    minify: 'terser',
    
    // ✅ CommonJS pour Firebase
    commonjsOptions: {
      include: [/firebase/, /node_modules/],
      transformMixedEsModules: true
    },
    
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 1
      },
      mangle: { safari10: true },
      format: { comments: false }
    },
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            
            // ✅ Firebase: UN SEUL CHUNK pour éviter les problèmes
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase-vendor';
            }
            
            // UI
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('framer-motion')) return 'animations';
            if (id.includes('recharts')) return 'charts';
            
            // Export
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'pdf-export';
            }
            if (id.includes('xlsx')) return 'excel-export';
            
            // QR
            if (id.includes('qrcode') || id.includes('jsqr')) {
              return 'qr-code';
            }
            
            // Date
            if (id.includes('date-fns')) return 'date-utils';
            
            return 'vendor';
          }
          
          // Application chunks
          if (id.includes('/components/Interventions/')) {
            if (id.includes('InterventionsView')) return 'page-interventions';
            if (id.includes('InterventionDetail')) return 'intervention-detail';
            return 'interventions-components';
          }
          
          if (id.includes('/components/Dashboard/')) {
            if (id.includes('AdvancedAnalytics')) return 'advanced-analytics';
            return 'dashboard';
          }
          if (id.includes('/components/Analytics/')) return 'analytics';
          if (id.includes('/components/Admin/')) return 'admin';
          if (id.includes('/components/Users/')) return 'users';
          if (id.includes('/components/Planning/') || id.includes('Calendar')) return 'planning';
          if (id.includes('/components/Settings/')) return 'settings';
          if (id.includes('/components/Chat/')) return 'chat';
          if (id.includes('/components/Templates/')) return 'templates';
          if (id.includes('/components/Rooms/')) return 'rooms';
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|ttf|otf/.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    chunkSizeWarningLimit: 1200, // Augmenté car Firebase sera dans un gros chunk
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true
  },
  
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    hmr: { overlay: true },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
    target: 'esnext'
  },
  
  css: {
    devSourcemap: true
  }
});