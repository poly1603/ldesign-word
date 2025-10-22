/**
 * Rollup 打包配置（优化版）
 * 支持代码分割、Tree-shaking、压缩优化
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import vue from 'rollup-plugin-vue';
import analyze from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';

const production = !process.env.ROLLUP_WATCH;
const analyze_bundle = process.env.ANALYZE === 'true';

// 通用插件配置
const commonPlugins = [
  resolve({
    browser: true,
    extensions: ['.js', '.ts', '.tsx', '.vue'],
  }),
  commonjs(),
  postcss({
    extract: false,
    modules: false,
    use: ['sass'],
    inject: true,
  }),
];

// 核心包配置（优化版）
const coreConfig = {
  input: {
    index: 'src/index.ts',
    // 代码分割：将模块分离
    'modules/parser': 'src/modules/parser.ts',
    'modules/viewer': 'src/modules/viewer.ts',
    'modules/editor': 'src/modules/editor.ts',
    'modules/exporter': 'src/modules/exporter.ts',
    'modules/table': 'src/modules/table.ts',
    'modules/comment': 'src/modules/comment.ts',
    'modules/revision': 'src/modules/revision.ts',
    'modules/collaboration': 'src/modules/collaboration.ts',
    'utils/logger': 'src/utils/logger.ts',
    'utils/memory': 'src/utils/memory.ts',
  },
  output: [
    {
      dir: 'dist',
      format: 'es',
      sourcemap: production,
      chunkFileNames: 'chunks/[name]-[hash].js',
      entryFileNames: '[name].js',
      // 保留模块结构以支持 tree-shaking
      preserveModules: false,
      // 代码分割策略
      manualChunks: {
        'vendor-docx': ['docx-preview', 'mammoth'],
        'vendor-utils': ['jszip'],
      },
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: production,
      exports: 'named',
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'WordViewer',
      sourcemap: production,
      globals: {
        'docx-preview': 'DocxPreview',
        'mammoth': 'mammoth',
        'jszip': 'JSZip',
      },
    },
  ],
  external: ['docx-preview', 'mammoth', 'docx', 'jszip', 'jspdf', 'html2canvas'],
  plugins: [
    ...commonPlugins,
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
      exclude: ['**/*.vue', 'src/components/**/*', '**/*.test.ts', '**/*.spec.ts'],
    }),
    production && terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      mangle: {
        properties: {
          regex: /^_/,
        },
      },
      format: {
        comments: false,
      },
    }),
    analyze_bundle && analyze({
      summaryOnly: true,
      limit: 10,
    }),
    analyze_bundle && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  
  // Tree-shaking 优化
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
};

// Vue 组件配置
const vueConfig = {
  input: 'src/vue.ts',
  output: [
    {
      file: 'dist/vue.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/vue.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/vue.umd.js',
      format: 'umd',
      name: 'WordViewerVue',
      sourcemap: true,
      globals: {
        vue: 'Vue',
      },
    },
  ],
  external: ['vue', 'docx-preview', 'mammoth', 'docx', 'jszip'],
  plugins: [
    ...commonPlugins,
    vue({
      target: 'browser',
      preprocessStyles: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
    }),
    production && terser(),
  ].filter(Boolean),
};

// React 组件配置
const reactConfig = {
  input: 'src/react.ts',
  output: [
    {
      file: 'dist/react.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/react.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/react.umd.js',
      format: 'umd',
      name: 'WordViewerReact',
      sourcemap: true,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
  ],
  external: ['react', 'react-dom', 'docx-preview', 'mammoth', 'docx', 'jszip'],
  plugins: [
    ...commonPlugins,
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      exclude: 'node_modules/**',
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
    }),
    production && terser(),
  ].filter(Boolean),
};

// Lit Web Component 配置
const litConfig = {
  input: 'src/lit.ts',
  output: [
    {
      file: 'dist/lit.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/lit.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/lit.umd.js',
      format: 'umd',
      name: 'WordViewerLit',
      sourcemap: true,
      globals: {
        lit: 'Lit',
        'lit/decorators.js': 'LitDecorators',
      },
    },
  ],
  external: ['lit', 'lit/decorators.js', 'docx-preview', 'mammoth', 'docx', 'jszip'],
  plugins: [
    ...commonPlugins,
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
    }),
    production && terser(),
  ].filter(Boolean),
};

export default [coreConfig, vueConfig, reactConfig, litConfig];



