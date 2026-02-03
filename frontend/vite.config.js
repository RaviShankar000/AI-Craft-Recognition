import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-hot-toast', 'react-loading-skeleton'],
          
          // Feature-based chunks
          'admin': [
            './src/components/AdminAnalytics.jsx',
            './src/components/AdminDashboard.jsx',
          ],
          'marketplace': [
            './src/components/Marketplace.jsx',
            './src/components/Cart.jsx',
            './src/components/OrderHistory.jsx',
          ],
          'crafts': [
            './src/components/CraftPredictor.jsx',
            './src/components/CraftUpload.jsx',
          ],
          'chat': [
            './src/components/Chatbot.jsx',
          ],
        },
      },
    },
    // Chunk size warning threshold
    chunkSizeWarningLimit: 1000,
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
    // Source map configuration
    sourcemap: false, // Disable in production for smaller bundle
  },
  // Optimization options
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
