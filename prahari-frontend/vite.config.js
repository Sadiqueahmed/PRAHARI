import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Vite configuration for Prahari Frontend.
 * Integrates Tailwind CSS v4 via the official Vite plugin.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Read .env files from project root (parent dir) where VITE_MAPBOX_TOKEN lives
  envDir: '../',
  server: {
    port: 5173,
    // Proxy API requests to Spring Boot backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});
