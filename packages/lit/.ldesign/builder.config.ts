/**
 * @word-viewer/lit 构建配置
 */

export default {
  name: '@word-viewer/lit',
  entry: 'src/index.ts',

  output: {
    dir: 'dist',
    formats: ['esm', 'cjs'],
  },

  external: [
    'lit',
    '@word-viewer/core',
    'docx-preview',
    'mammoth',
    'docx',
    'jszip',
  ],

  // Lit 插件
  plugins: [
    'lit', // @ldesign/builder 自动识别并使用 Lit 插件
  ],

  typescript: {
    declaration: true,
    declarationDir: 'dist',
  },
};



