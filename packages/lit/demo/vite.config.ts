import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@word-viewer/lit': resolve(__dirname, '../src'),
      '@word-viewer/core': resolve(__dirname, '../../core/src'),
    },
  },
  server: {
    port: 3004,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
