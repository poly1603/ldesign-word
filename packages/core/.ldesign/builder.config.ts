/**
 * @word-viewer/core 构建配置
 */

export default {
  name: '@word-viewer/core',
  entry: 'src/index.ts',

  output: {
    dir: 'dist',
    formats: ['esm', 'cjs', 'umd'],
    // UMD 格式的全局变量名
    umd: {
      name: 'WordViewer',
    },
  },

  external: [
    'docx-preview',
    'mammoth',
    'docx',
    'jszip',
    'jspdf',
    'html2canvas',
  ],

  typescript: {
    declaration: true,
    declarationDir: 'dist',
  },

  // CSS 处理
  css: {
    // 提取 CSS
    extract: true,
    // 输出文件名
    filename: 'word-viewer.css',
  },

  // 构建分析
  analyze: {
    enabled: process.env.ANALYZE === 'true',
    open: true,
    gzip: true,
    brotli: true,
  },

  // Rollup 高级选项
  rollupOptions: {
    output: {
      // 导出模式
      exports: 'named',
      // 保留模块结构
      preserveModules: false,
      // 文件命名
      entryFileNames: '[format]/[name].js',
      chunkFileNames: '[format]/chunks/[name].js',
    },
  },
};



