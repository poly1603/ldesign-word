import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  root: __dirname,
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@word-viewer/vue': resolve(__dirname, '../src'),
      '@word-viewer/core': resolve(__dirname, '../../core/src'),
    },
  },
  server: {
    port: 3002,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

