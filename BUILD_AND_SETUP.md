# Word Viewer 构建和设置指南

## 📋 概览

Word Viewer 是一个功能强大的 Word 文档查看和编辑插件，支持 .doc 和 .docx 格式。本项目使用 monorepo 架构，包含多个框架适配版本。

## 🏗️ 项目结构

```
libraries/word/
├── .ldesign/                     # @ldesign/builder 配置
│   └── builder.config.ts         # 根构建配置
├── packages/                     # 核心包和框架适配器
│   ├── core/                     # 核心库
│   │   ├── .ldesign/
│   │   │   └── builder.config.ts
│   │   ├── src/
│   │   │   ├── core/            # 核心类和类型
│   │   │   ├── modules/         # 功能模块
│   │   │   ├── styles/          # 默认样式
│   │   │   └── utils/           # 工具函数
│   │   └── package.json
│   ├── vue/                      # Vue 3 适配器
│   │   ├── .ldesign/
│   │   └── src/
│   ├── react/                    # React 适配器
│   │   ├── .ldesign/
│   │   └── src/
│   └── lit/                      # Lit Web Components 适配器
│       ├── .ldesign/
│       └── src/
└── examples/                     # 演示项目
    └── vite-demo/               # Vite 演示应用
        ├── src/
        │   ├── demos/           # 各框架演示代码
        │   └── styles/          # 演示样式
        └── public/
            └── samples/         # 示例文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 在根目录安装所有依赖
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 2. 构建项目

#### 使用 @ldesign/builder 构建（推荐）

```bash
# 构建所有包
npm run build:ldesign

# 或单独构建某个包
cd packages/core
npm run build:ldesign
```

#### 使用传统 Rollup 构建

```bash
# 构建所有包
npm run build

# 构建特定包
npm run build:core
npm run build:vue
npm run build:react
npm run build:lit
```

### 3. 运行演示项目

```bash
# 启动 Vite 开发服务器
npm run dev:demo

# 或直接进入演示目录
cd examples/vite-demo
npm install
npm run dev
```

访问 http://localhost:3000 查看演示。

## 📦 包说明

### @word-viewer/core

核心功能库，提供：
- Word 文档解析和渲染
- 支持 .doc 和 .docx 格式
- 文档编辑功能
- 导出功能（PDF、HTML、DOCX）
- 搜索和导航

### @word-viewer/vue

Vue 3 组件封装：
```vue
<template>
  <WordViewer
    :file="file"
    :options="options"
    @loaded="handleLoaded"
    @error="handleError"
  />
</template>

<script setup>
import { WordViewer } from '@word-viewer/vue';
</script>
```

### @word-viewer/react

React 组件封装：
```tsx
import { WordViewer } from '@word-viewer/react';

function App() {
  return (
    <WordViewer
      file={file}
      options={options}
      onLoaded={handleLoaded}
      onError={handleError}
    />
  );
}
```

### @word-viewer/lit

Lit Web Components：
```html
<word-viewer
  .file="${file}"
  .options="${options}"
  @loaded="${handleLoaded}"
  @error="${handleError}"
></word-viewer>
```

## 🔧 构建配置

### @ldesign/builder 配置

每个包都有独立的 `.ldesign/builder.config.ts` 配置文件：

```typescript
// packages/core/.ldesign/builder.config.ts
export default defineConfig({
  name: '@word-viewer/core',
  entry: 'src/index.ts',
  output: {
    dir: 'dist',
    formats: ['esm', 'cjs', 'umd'],
    umd: {
      name: 'WordViewer',
    },
  },
  // ...其他配置
});
```

### 构建产物

每个包构建后会生成：
- `dist/esm/` - ES Module 格式
- `dist/cjs/` - CommonJS 格式
- `dist/umd/` - UMD 格式（仅 core 包）
- `dist/index.d.ts` - TypeScript 类型定义
- `dist/*.css` - 样式文件

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 监听模式
npm run test:watch

# 测试覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e
```

## 📝 开发指南

### 添加新功能

1. 在 `packages/core/src/modules/` 中创建新模块
2. 在核心类 `WordViewer` 中集成
3. 更新类型定义
4. 为各框架适配器添加支持
5. 添加测试用例
6. 更新文档

### 本地开发

```bash
# 监听模式构建
cd packages/core
npm run dev

# 在另一个终端运行演示
npm run dev:demo
```

### 代码规范

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format

# 类型检查
npm run type-check
```

## 📊 性能优化

- 使用动态导入减少初始包体积
- 文档渲染使用虚拟滚动（大文档）
- 图片懒加载
- Web Worker 处理大文件解析

## 🔍 故障排除

### 构建失败

1. 清理缓存：
```bash
npm run clean
rm -rf node_modules
npm install
```

2. 检查 TypeScript 配置
3. 确保所有依赖版本正确

### 渲染问题

1. 检查文档格式是否支持
2. 查看控制台错误信息
3. 尝试不同的渲染引擎（docx-preview 或 mammoth）

### 样式问题

1. 确保 CSS 文件被正确导入
2. 检查样式隔离配置
3. 使用开发者工具调试样式

## 📚 API 文档

详细 API 文档请参考：
- [Core API](./packages/core/README.md)
- [Vue API](./packages/vue/README.md)
- [React API](./packages/react/README.md)
- [Lit API](./packages/lit/README.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License


