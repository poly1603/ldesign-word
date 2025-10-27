# Word Viewer 快速开始指南

## 🎯 3分钟快速开始

### 第一步：安装依赖

```bash
cd libraries/word
npm install
```

### 第二步：构建包

使用 @ldesign/builder 构建所有包：

```bash
# 在根目录构建所有包
npm run build

# 或单独构建某个包
cd packages/core
npm run build
```

### 第三步：运行演示

选择一个框架的演示项目运行：

```bash
# Core 演示 (原生 JavaScript)
cd packages/core/demo
npm install
npm run dev
# 打开 http://localhost:3001

# Vue 3 演示
cd packages/vue/demo
npm install
npm run dev
# 打开 http://localhost:3002

# React 演示
cd packages/react/demo
npm install
npm run dev
# 打开 http://localhost:3003

# Lit 演示
cd packages/lit/demo
npm install
npm run dev
# 打开 http://localhost:3004
```

---

## 📦 包说明

### 1. @word-viewer/core

**核心库**，提供所有基础功能。

```javascript
import { WordViewer } from '@word-viewer/core';

const viewer = new WordViewer('#container', {
  renderEngine: 'auto',
  editable: true,
});

await viewer.loadFile(file);
```

**演示端口**: 3001

---

### 2. @word-viewer/vue

**Vue 3 组件**。

```vue
<template>
  <WordViewer :file="file" :options="options" />
</template>

<script setup>
import { WordViewer } from '@word-viewer/vue';
</script>
```

**演示端口**: 3002

---

### 3. @word-viewer/react

**React 组件**。

```jsx
import { WordViewer } from '@word-viewer/react';

function App() {
  return <WordViewer file={file} options={options} />;
}
```

**演示端口**: 3003

---

### 4. @word-viewer/lit

**Lit Web Components**。

```html
<word-viewer .file="${file}" .options="${options}"></word-viewer>

<script type="module">
  import '@word-viewer/lit';
</script>
```

**演示端口**: 3004

---

## 🔨 开发命令

每个包都支持以下命令：

```bash
npm run build        # 构建包
npm run dev          # 开发模式
npm run clean        # 清理构建产物
npm run demo         # 运行演示项目
npm run demo:build   # 构建演示项目
npm run demo:preview # 预览构建的演示
```

---

## 📊 构建产物

构建后每个包的 `dist/` 目录结构：

```
dist/
├── esm/          # ES Module
├── cjs/          # CommonJS
├── umd/          # UMD (仅 core)
├── index.d.ts    # 类型定义
└── *.css         # 样式文件
```

---

## 🧪 快速测试

### 测试构建

```bash
# 构建 core 包
cd packages/core
npm run build

# 检查产物
ls dist/

# 应该看到:
# esm/ cjs/ umd/ index.d.ts word-viewer.css
```

### 测试演示

```bash
# 运行 Vue 演示
cd packages/vue/demo
npm install
npm run dev

# 打开浏览器访问 http://localhost:3002
# 上传一个 .docx 文件测试
```

---

## 🎨 功能特性

所有演示项目都包含以下功能展示：

- ✅ 文件上传和 URL 加载
- ✅ 文档缩放 (50%-200%)
- ✅ 页面导航
- ✅ 文本搜索
- ✅ 编辑模式
- ✅ 文档导出 (PDF/HTML/DOCX)
- ✅ 事件监听
- ✅ API 调用演示

---

## 🚨 常见问题

### Q: 构建失败怎么办？

```bash
# 清理并重新安装
npm run clean
rm -rf node_modules
npm install
npm run build
```

### Q: 演示项目无法启动？

```bash
# 确保先构建了包
cd packages/core
npm run build

# 然后启动演示
cd demo
npm install
npm run dev
```

### Q: 如何添加示例文档？

将 `.docx` 文件放到演示项目的 `public/samples/` 目录下。

---

## 📖 更多文档

- [完整配置说明](./FINAL_PACKAGE_CONFIGURATION.md)
- [构建和设置](./BUILD_AND_SETUP.md)
- [API 文档](./API.md)
- [README](./README_UPDATED.md)

---

## 💡 提示

1. **首次使用**：先运行 Core 演示了解基础功能
2. **框架选择**：根据项目技术栈选择对应的包
3. **查看源码**：演示项目的源码包含完整的使用示例
4. **修改配置**：可以在演示项目中实时测试不同配置

---

**开始使用吧！🚀**
