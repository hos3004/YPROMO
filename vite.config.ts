import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'apps/desktop/renderer'),
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'packages/shared/src'),
      '@render': path.resolve(__dirname, 'packages/render/src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-renderer'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
