/**
 * Vite 配置
 * 用于开发服务器和构建优化
 */

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  base: './',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@workers': path.resolve(__dirname, './src/workers'),
    },
  },

  server: {
    port: 5173,
    open: true,
    cors: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
    },

    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: {
          'vendor-docx': ['docx-preview', 'mammoth'],
          'vendor-utils': ['jszip'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
        },
        
        // 优化 chunk 文件名
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // 构建优化
    chunkSizeWarningLimit: 1000,
    
    // 压缩选项
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },

  optimizeDeps: {
    include: ['docx-preview', 'mammoth'],
    exclude: ['@word-viewer/core'],
  },

  // Worker 配置
  worker: {
    format: 'es',
    plugins: [],
  },
});

