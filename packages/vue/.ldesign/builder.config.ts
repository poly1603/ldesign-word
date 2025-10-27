/**
 * @word-viewer/vue 构建配置
 */

export default {
  name: '@word-viewer/vue',
  entry: 'src/index.ts',

  output: {
    dir: 'dist',
    formats: ['esm', 'cjs'],
  },

  // 明确禁用 UMD
  umd: false,

  external: [
    'vue',
    '@word-viewer/core',
    'docx-preview',
    'mammoth',
    'docx',
    'jszip',
  ],

  // Vue 插件
  plugins: [
    'vue', // @ldesign/builder 自动识别并使用 Vue 插件
  ],

  typescript: {
    declaration: true,
    declarationDir: 'dist',
  },

  // 样式处理
  css: {
    // 提取 CSS
    extract: true,
    // 输出文件名
    filename: 'style.css',
  },
};



