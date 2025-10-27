# 📄 Word Viewer

[![npm version](https://img.shields.io/npm/v/@word-viewer/core.svg)](https://www.npmjs.com/package/@word-viewer/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)

功能强大的 Word 文档查看和编辑插件，支持在浏览器中查看和编辑 .doc 和 .docx 文件。

## ✨ 特性

- 📖 **文档查看** - 支持 .doc 和 .docx 格式的完整渲染
- ✏️ **编辑功能** - 文本编辑、格式调整、图片插入
- 🎨 **多框架支持** - Vue 3、React、Lit 和原生 JavaScript
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🚀 **高性能** - 动态加载、虚拟滚动、懒加载优化
- 📑 **导出功能** - 支持导出为 PDF、HTML、DOCX、TXT
- 🔍 **搜索导航** - 全文搜索、页面导航、缩放控制
- 🎯 **TypeScript** - 完整的类型定义和智能提示
- 📦 **模块化** - ESM、CJS、UMD 多格式支持
- 🛠️ **易于扩展** - 模块化架构，插件系统

## 📦 安装

### 核心库

```bash
npm install @word-viewer/core
```

### 框架适配器

```bash
# Vue 3
npm install @word-viewer/vue

# React
npm install @word-viewer/react

# Lit
npm install @word-viewer/lit
```

## 🚀 快速开始

### Vanilla JavaScript

```javascript
import { WordViewer } from '@word-viewer/core';
import '@word-viewer/core/dist/word-viewer.css';

// 创建查看器实例
const viewer = new WordViewer('#container', {
  renderEngine: 'docx-preview',
  editable: true,
  theme: 'light',
  initialZoom: 1.0
});

// 加载文档
await viewer.loadFile(file);
// 或从 URL 加载
await viewer.loadUrl('https://example.com/document.docx');

// 事件监听
viewer.on('loaded', (event) => {
  console.log('文档加载完成', event);
});

viewer.on('error', (error) => {
  console.error('文档加载失败', error);
});
```

### Vue 3

```vue
<template>
  <WordViewer
    :file="file"
    :options="options"
    @loaded="onLoaded"
    @error="onError"
    @page-change="onPageChange"
  />
</template>

<script setup>
import { WordViewer } from '@word-viewer/vue';
import '@word-viewer/vue/dist/style.css';

const file = ref(null);
const options = {
  renderEngine: 'auto',
  editable: false,
  theme: 'light'
};

const onLoaded = (event) => {
  console.log('文档加载完成', event);
};

const onError = (error) => {
  console.error('加载失败', error);
};

const onPageChange = (pageInfo) => {
  console.log('页面变化', pageInfo);
};
</script>
```

### React

```jsx
import { WordViewer } from '@word-viewer/react';
import '@word-viewer/react/dist/style.css';

function App() {
  const [file, setFile] = useState(null);

  const handleLoaded = (event) => {
    console.log('文档加载完成', event);
  };

  const handleError = (error) => {
    console.error('加载失败', error);
  };

  return (
    <WordViewer
      file={file}
      options={{
        renderEngine: 'auto',
        editable: true,
        theme: 'light'
      }}
      onLoaded={handleLoaded}
      onError={handleError}
    />
  );
}
```

### Lit

```html
<word-viewer
  .file="${file}"
  .options="${{
    renderEngine: 'auto',
    editable: true,
    theme: 'light'
  }}"
  @loaded="${handleLoaded}"
  @error="${handleError}"
></word-viewer>

<script type="module">
  import '@word-viewer/lit';
  import '@word-viewer/lit/dist/style.css';

  const handleLoaded = (event) => {
    console.log('文档加载完成', event.detail);
  };

  const handleError = (event) => {
    console.error('加载失败', event.detail);
  };
</script>
```

## 🔧 API

### 核心方法

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `loadFile(file)` | 加载文件 | File | Promise<void> |
| `loadUrl(url)` | 从 URL 加载 | string | Promise<void> |
| `loadBuffer(buffer)` | 加载 ArrayBuffer | ArrayBuffer | Promise<void> |
| `setZoom(level)` | 设置缩放 | number | void |
| `goToPage(page)` | 跳转页面 | number | void |
| `search(keyword)` | 搜索文本 | string | SearchResult[] |
| `exportToPDF()` | 导出 PDF | - | Promise<Blob> |
| `exportToHTML()` | 导出 HTML | - | string |
| `exportToDocx()` | 导出 DOCX | - | Promise<Blob> |
| `enableEdit()` | 启用编辑 | - | void |
| `disableEdit()` | 禁用编辑 | - | void |
| `destroy()` | 销毁实例 | - | void |

### 配置选项

```typescript
interface ViewerOptions {
  // 渲染引擎：'docx-preview' | 'mammoth' | 'auto'
  renderEngine?: string;
  
  // 是否可编辑
  editable?: boolean;
  
  // 初始缩放级别（0.5-2.0）
  initialZoom?: number;
  
  // 是否显示工具栏
  showToolbar?: boolean;
  
  // 主题：'light' | 'dark'
  theme?: string;
  
  // 容器元素
  container?: HTMLElement;
}
```

### 事件

| 事件 | 描述 | 回调参数 |
|------|------|----------|
| `loaded` | 文档加载完成 | { source: File \| string } |
| `error` | 加载失败 | { code: string, message: string } |
| `progress` | 加载进度 | { loaded: number, total: number } |
| `page-change` | 页面变化 | { current: number, total: number } |
| `zoom` | 缩放变化 | number |
| `edit-start` | 开始编辑 | - |
| `edit-end` | 结束编辑 | - |
| `changed` | 内容变化 | - |

## 🎨 主题定制

### CSS 变量

```css
.word-viewer-container {
  --wv-primary-color: #667eea;
  --wv-text-color: #333;
  --wv-bg-color: #ffffff;
  --wv-border-color: #e0e0e0;
  --wv-highlight-color: yellow;
}

/* 深色主题 */
.word-viewer-container[data-theme="dark"] {
  --wv-text-color: #ffffff;
  --wv-bg-color: #1a1a1a;
  --wv-border-color: #333;
}
```

## 🛠️ 构建和开发

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-org/word-viewer.git
cd word-viewer

# 安装依赖
npm install

# 开发模式
npm run dev

# 运行演示
npm run dev:demo
```

### 构建

```bash
# 使用 @ldesign/builder 构建所有包
npm run build:ldesign

# 或使用传统构建
npm run build
```

### 测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

## 📂 项目结构

```
word-viewer/
├── packages/
│   ├── core/          # 核心库
│   ├── vue/           # Vue 3 适配器
│   ├── react/         # React 适配器
│   └── lit/           # Lit 适配器
├── examples/
│   └── vite-demo/     # 演示项目
├── .ldesign/          # 构建配置
└── docs/              # 文档
```

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md)。

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [docx-preview](https://github.com/VolodymyrBaydalka/docxjs) - DOCX 渲染引擎
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) - Word 到 HTML 转换
- [docx](https://github.com/dolanmiu/docx) - DOCX 生成库
- [JSZip](https://github.com/Stuk/jszip) - ZIP 文件处理

## 📞 联系方式

- 问题反馈：[GitHub Issues](https://github.com/your-org/word-viewer/issues)
- 邮箱：support@example.com

---

Made with ❤️ by Your Team


