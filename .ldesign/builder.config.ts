/**
 * @ldesign/builder 配置
 * Word Viewer Monorepo 构建配置
 */

export default {
  // Monorepo 根配置
  root: './',

  // 工作空间包
  workspaces: [
    'packages/core',
    'packages/vue',
    'packages/react',
    'packages/lit',
  ],

  // 全局外部依赖
  external: [
    'vue',
    'react',
    'react-dom',
    'lit',
    'docx-preview',
    'mammoth',
    'docx',
    'jszip',
  ],

  // 构建选项
  build: {
    // 输出目录
    outDir: 'dist',

    // 生成格式
    formats: ['esm', 'cjs', 'umd'],

    // TypeScript 声明文件
    dts: true,

    // 代码压缩
    minify: false, // 库模式不压缩，由使用者决定

    // Source Map
    sourcemap: true,

    // 清理输出目录
    clean: true,
  },

  // 优化选项
  optimization: {
    // Tree Shaking
    treeShaking: true,

    // 代码分割
    codeSplitting: false, // 库模式不分割

    // 并行构建
    parallel: true,
  },

  // 插件
  plugins: [],
};



