import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@word-viewer/core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@word-viewer/vue': resolve(__dirname, '../packages/vue/src/index.ts')
    }
  },
  server: {
    port: 9999,
    host: true,
    open: true
  },
  optimizeDeps: {
    include: ['jszip']
  }
});
