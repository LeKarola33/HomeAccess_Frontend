/**
 * HomeAccess - Configuración de Vite
 * =====================================
 * Configura el bundler con React, alias de rutas y proxy al backend.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    // Alias para importaciones más limpias
    // Ej: import Button from '@/components/Button' en lugar de '../../../components/Button'
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 5173,
    // Proxy: redirige llamadas a /api hacia el backend local
    // Evita problemas de CORS en desarrollo
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
