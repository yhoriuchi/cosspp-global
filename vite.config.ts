import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/zod')) return 'validation';
            if (id.includes('/d3-') || id.includes('/internmap')) return 'geography';
            return 'vendor';
          }
        },
      },
    },
  },
});
