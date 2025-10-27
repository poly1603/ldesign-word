/**
 * @word-viewer/react 构建配置
 */

export default {
  name: '@word-viewer/react',
  entry: 'src/index.ts',

  output: {
    dir: 'dist',
    formats: ['esm', 'cjs'],
  },

  external: [
    'react',
    'react-dom',
    '@word-viewer/core',
    'docx-preview',
    'mammoth',
    'docx',
    'jszip',
  ],

  // React 插件
  plugins: [
    'react', // @ldesign/builder 自动识别并使用 React 插件
  ],

  typescript: {
    declaration: true,
    declarationDir: 'dist',
  },
};



