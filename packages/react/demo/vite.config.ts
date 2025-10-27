import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@word-viewer/react': resolve(__dirname, '../src'),
      '@word-viewer/core': resolve(__dirname, '../../core/src'),
    },
  },
  server: {
    port: 3003,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
